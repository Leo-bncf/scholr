// The platform-wide switches, one slice per console tab.
//
// These used to fill the console's Settings page, which is now about the
// signed-in account. Each slice lives on the tab it belongs to — trial length
// with Schools, feature switches with Adoption, integrations with Automation,
// alerts with Email — and saves only its own fields.
//
// Be honest about what they do: nothing in the school-facing app reads these
// values yet, so each section says so instead of promising an effect.
import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sec, Skel, Field, useToast } from '@/components/console/kit';
import { useConfig, when } from '@/components/console/useConsoleData';
import { DEFAULT_PLATFORM_CONFIG } from '@/lib/platformConfigDefaults';
import * as admin from '@/data/admin';

const FEATURES = [
  { key: 'advanced_analytics', label: 'Analytics', off: 'Dashboards and forecasting.' },
  { key: 'messaging', label: 'Messaging', off: 'Messages and announcements.' },
  { key: 'attendance', label: 'Attendance', off: 'Taking registers.' },
  { key: 'behavior_tracking', label: 'Behaviour', off: 'Behaviour records and interventions.' },
  { key: 'report_builder', label: 'Reports', off: 'Building and publishing reports.' },
];
const INTEGRATIONS = [
  { key: 'google_drive_enabled', label: 'Google Drive', off: 'Drive-connected workflows.' },
  { key: 'stripe_billing_enabled', label: 'Stripe billing', off: 'Checkout and the billing portal.' },
];
const ALERTS = [
  { key: 'billing_alerts', label: 'Billing alerts', off: 'Warning when a school stops paying.' },
  { key: 'onboarding_alerts', label: 'Onboarding alerts', off: 'Warning when a school stalls in setup.' },
  { key: 'security_alerts', label: 'Security alerts', off: 'Warning on account locks or odd activity.' },
  { key: 'weekly_digest', label: 'Weekly digest', off: 'A weekly platform summary.' },
];

const NOT_ENFORCED = 'Recorded for the platform. The school app does not read this switch yet, so changing it changes nothing for schools today.';

const SLICES = {
  defaults: {
    title: 'New schools start with',
    meta: 'platform defaults',
    fields: ['default_trial_days', 'allow_school_brand_overrides'],
  },
  features: {
    title: 'Features, for every school',
    meta: 'platform-wide switches',
    group: 'global_feature_flags', items: FEATURES, column: 'Feature',
  },
  integrations: {
    title: 'Integrations',
    meta: 'platform-wide switches',
    group: 'integration_settings', items: INTEGRATIONS, column: 'Integration',
  },
  alerts: {
    title: 'What we get told about',
    meta: 'platform alerts',
    fields: ['default_notification_email'],
    group: 'notifications', items: ALERTS, column: 'Alert',
  },
};

/** Fill in anything the stored row lacks from the defaults, so a missing flag reads as on. */
function withDefaults(config) {
  const d = DEFAULT_PLATFORM_CONFIG;
  return {
    ...d,
    ...(config || {}),
    notifications: { ...d.notifications, ...(config?.notifications || {}) },
    integration_settings: { ...d.integration_settings, ...(config?.integration_settings || {}) },
    global_feature_flags: { ...d.global_feature_flags, ...(config?.global_feature_flags || {}) },
  };
}

export default function PlatformConfigSection({ kind }) {
  const slice = SLICES[kind];
  const configQ = useConfig();
  const qc = useQueryClient();
  const toast = useToast();
  const merged = useMemo(() => withDefaults(configQ.data), [configQ.data]);
  const [form, setForm] = useState(merged);
  useEffect(() => setForm(merged), [merged]);

  const save = useMutation({
    mutationFn: async () => {
      const patch = {};
      for (const f of slice.fields || []) patch[f] = f === 'default_trial_days' ? Number(form[f]) || 0 : form[f];
      if (slice.group) patch[slice.group] = form[slice.group];
      // No row yet: create it from the defaults plus this slice, rather than
      // making someone find a separate "create" step first.
      const row = configQ.data?.id
        ? await admin.updatePlatformConfig(configQ.data.id, patch)
        : await admin.createPlatformConfig({ ...DEFAULT_PLATFORM_CONFIG, ...patch });
      await admin.recordAuditLog({
        action: `platform_config.${kind}_updated_from_console`,
        entity_type: 'platform_config',
        entity_id: row?.id,
        level: 'warning',
      }).catch(() => {});
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['console', 'config'] });
      toast('Saved');
    },
    onError: (e) => toast(e?.message || 'Could not save', 'bad'),
  });

  if (configQ.isLoading) return <Sec title={slice.title}><Skel /></Sec>;
  if (configQ.error) {
    return (
      <Sec title={slice.title}>
        <p className="cons__empty">Couldn't read platform settings: {String(configQ.error.message || configQ.error)}</p>
      </Sec>
    );
  }

  const dirty = JSON.stringify(pick(form, slice)) !== JSON.stringify(pick(merged, slice));

  return (
    <Sec
      title={slice.title}
      meta={configQ.data?.updated_at ? `${slice.meta} · last changed ${when(configQ.data.updated_at)}` : slice.meta}
      action={
        <button type="button" className="cons__b cons__b--go" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      }
    >
      {kind === 'defaults' && (
        <div className="cons__bar">
          <Field label="Trial length (days)">
            <input type="number" min="0" step="1" value={form.default_trial_days}
              onChange={(e) => setForm((f) => ({ ...f, default_trial_days: e.target.value }))} />
          </Field>
          <Field label="Schools may change their branding">
            <select value={form.allow_school_brand_overrides ? 'yes' : 'no'}
              onChange={(e) => setForm((f) => ({ ...f, allow_school_brand_overrides: e.target.value === 'yes' }))}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>
      )}

      {kind === 'alerts' && (
        <div className="cons__bar">
          <Field label="Send platform alerts to">
            <input type="email" value={form.default_notification_email || ''} placeholder="support@scholr.pro"
              onChange={(e) => setForm((f) => ({ ...f, default_notification_email: e.target.value }))} />
          </Field>
        </div>
      )}

      {slice.group && (
        <div className="cons__scroll">
          <table className="cons__t">
            <thead><tr><th>{slice.column}</th><th>On</th><th>Covers</th></tr></thead>
            <tbody>
              {slice.items.map((it) => (
                <tr key={it.key}>
                  <td className="name">{it.label}</td>
                  <td>
                    <input type="checkbox" checked={!!form[slice.group]?.[it.key]} aria-label={it.label}
                      onChange={(e) => setForm((f) => ({ ...f, [slice.group]: { ...f[slice.group], [it.key]: e.target.checked } }))} />
                  </td>
                  <td className="muted">{it.off}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="cons__note">
        {kind === 'alerts'
          ? 'Delivery needs production SMTP, which is not configured yet — nothing is sent today whatever is ticked here.'
          : NOT_ENFORCED}
      </p>
    </Sec>
  );
}

function pick(form, slice) {
  const out = {};
  for (const f of slice.fields || []) out[f] = form[f];
  if (slice.group) out[slice.group] = form[slice.group];
  return out;
}
