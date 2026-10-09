// Settings — the handful of switches that apply to every school at once.
//
// A toggle here changes the product for every tenant, so each row says what
// turning it off actually takes away, and nothing saves until you press Save.
import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Head, Sec, Figs, Skel, Field, useToast } from '@/components/console/kit';
import { useConfig, useHeadline, when } from '@/components/console/useConsoleData';
import * as admin from '@/data/admin';
import { DEFAULT_PLATFORM_CONFIG } from '@/lib/platformConfigDefaults';

const FEATURES = [
  { key: 'advanced_analytics', label: 'Analytics', off: 'Schools lose their dashboards and forecasting.' },
  { key: 'messaging', label: 'Messaging', off: 'Nobody can send a message or an announcement.' },
  { key: 'attendance', label: 'Attendance', off: 'Registers cannot be taken.' },
  { key: 'behavior_tracking', label: 'Behaviour', off: 'Behaviour records and interventions disappear.' },
  { key: 'report_builder', label: 'Reports', off: 'Report building and publishing stop.' },
];

const INTEGRATIONS = [
  { key: 'google_drive_enabled', label: 'Google Drive', off: 'Drive-connected workflows stop working.' },
  { key: 'stripe_billing_enabled', label: 'Stripe billing', off: 'Checkout and the billing portal stop.' },
];

const NOTIFICATIONS = [
  { key: 'billing_alerts', label: 'Billing alerts', off: 'No warning when a school stops paying.' },
  { key: 'onboarding_alerts', label: 'Onboarding alerts', off: 'No warning when a school stalls in setup.' },
  { key: 'security_alerts', label: 'Security alerts', off: 'No warning on account locks or odd activity.' },
  { key: 'weekly_digest', label: 'Weekly digest', off: 'No weekly platform summary.' },
];

function Switches({ title, items, values, onChange }) {
  return (
    <div className="cons__scroll">
      <table className="cons__t">
        <thead>
          <tr><th>{title}</th><th>On</th><th>What switching it off does</th></tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.key}>
              <td className="name">{it.label}</td>
              <td>
                <input type="checkbox" checked={!!values?.[it.key]}
                  onChange={(e) => onChange(it.key, e.target.checked)}
                  aria-label={it.label} />
              </td>
              <td className="muted">{it.off}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Settings() {
  const configQ = useConfig();
  const h = useHeadline();
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (!configQ.data) return;
    setForm({
      default_trial_days: configQ.data.default_trial_days ?? 30,
      default_notification_email: configQ.data.default_notification_email ?? '',
      allow_school_brand_overrides: configQ.data.allow_school_brand_overrides ?? true,
      global_feature_flags: configQ.data.global_feature_flags || {},
      integration_settings: configQ.data.integration_settings || {},
      notifications: configQ.data.notifications || {},
    });
  }, [configQ.data]);

  const save = useMutation({
    mutationFn: async (patch) => {
      if (!configQ.data?.id) throw new Error('There is no platform_config row to update.');
      const next = await admin.updatePlatformConfig(configQ.data.id, patch);
      await admin.recordAuditLog({
        action: 'platform_config.updated_from_console',
        entity_type: 'platform_config',
        entity_id: configQ.data.id,
        level: 'warning',
      }).catch(() => {});
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['console', 'config'] });
      toast('Saved for every school');
    },
    onError: (e) => toast(e?.message || 'Could not save', 'bad'),
  });

  const setNested = (group, key, value) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));

  const featuresOff = form
    ? FEATURES.filter((f) => !form.global_feature_flags?.[f.key]).length : 0;

  // Order matters. This used to check `!form` first, and `form` is only ever
  // set from a loaded row — so with no platform_config row, or a failed read,
  // the page showed its skeleton forever and the two messages below were
  // unreachable.
  // The live database had no platform_config row, so this page had nothing to
  // edit and no way to make one. Creating it from the shared defaults keeps
  // behaviour exactly as it was — every feature on — and makes it editable.
  const create = useMutation({
    mutationFn: async () => {
      const row = await admin.createPlatformConfig(DEFAULT_PLATFORM_CONFIG);
      await admin.recordAuditLog({
        action: 'platform_config.created_from_console',
        entity_type: 'platform_config',
        entity_id: row?.id,
        level: 'warning',
      }).catch(() => {});
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['console', 'config'] });
      toast('Platform settings created');
    },
    onError: (e) => toast(e?.message || 'Could not create settings', 'bad'),
  });

  if (configQ.isLoading) {
    return <Head title="Settings"><Sec><Skel /></Sec></Head>;
  }

  if (configQ.error) {
    return (
      <Head title="Settings">
        <Sec>
          <p className="cons__empty">
            Settings couldn't be read: {String(configQ.error.message || configQ.error)}
          </p>
        </Sec>
      </Head>
    );
  }

  if (!configQ.data) {
    return (
      <Head title="Settings">
        <Sec>
          <p className="cons__empty">
            Platform settings haven't been created on this database yet, so everything runs on
            its built-in defaults: every feature on, {DEFAULT_PLATFORM_CONFIG.default_trial_days}-day
            trials, school branding allowed. Create them to make these switches editable —
            creating changes nothing for schools.
          </p>
          <button type="button" className="cons__b cons__b--go" disabled={create.isPending} onClick={() => create.mutate()}>
            {create.isPending ? 'Creating…' : 'Create platform settings'}
          </button>
        </Sec>
      </Head>
    );
  }

  if (!form) {
    return <Head title="Settings"><Sec><Skel /></Sec></Head>;
  }

  return (
    <Head title="Settings">
      <Sec meta={`last changed ${when(configQ.data.updated_at)}`}
        action={
          <button type="button" className="cons__b cons__b--go"
            disabled={save.isPending}
            onClick={() => save.mutate({
              default_trial_days: Number(form.default_trial_days) || 30,
              default_notification_email: form.default_notification_email || null,
              allow_school_brand_overrides: form.allow_school_brand_overrides,
              global_feature_flags: form.global_feature_flags,
              integration_settings: form.integration_settings,
              notifications: form.notifications,
            })}>
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        }>
        <Figs items={[
          { label: 'Applies to', value: h.loading ? '—' : h.schools.length, sub: 'schools, all at once' },
          { label: 'Features off', value: featuresOff,
            sub: 'switched off platform-wide', state: featuresOff ? 'warn' : undefined },
          { label: 'Trial length', value: form.default_trial_days, unit: 'days',
            sub: 'for a new school' },
          { label: 'Config row', value: 'present', sub: 'platform_config' },
        ]} />
      </Sec>

      <Sec title="Defaults" meta="what a brand-new school starts with">
        <div className="cons__bar">
          <Field label="Trial length (days)">
            <input type="number" min="0" step="1" value={form.default_trial_days}
              onChange={(e) => setForm((f) => ({ ...f, default_trial_days: e.target.value }))} />
          </Field>
          <Field label="Notification email">
            <input type="email" value={form.default_notification_email}
              placeholder="support@scholr.pro"
              onChange={(e) => setForm((f) => ({ ...f, default_notification_email: e.target.value }))} />
          </Field>
          <Field label="Schools may override branding">
            <select value={form.allow_school_brand_overrides ? 'yes' : 'no'}
              onChange={(e) => setForm((f) => ({
                ...f, allow_school_brand_overrides: e.target.value === 'yes',
              }))}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
        </div>
      </Sec>

      <Sec title="Features" meta="off here means off for every school">
        <Switches title="Feature" items={FEATURES} values={form.global_feature_flags}
          onChange={(k, v) => setNested('global_feature_flags', k, v)} />
      </Sec>

      <Sec title="Integrations">
        <Switches title="Integration" items={INTEGRATIONS} values={form.integration_settings}
          onChange={(k, v) => setNested('integration_settings', k, v)} />
      </Sec>

      <Sec title="What we get told about">
        <Switches title="Alert" items={NOTIFICATIONS} values={form.notifications}
          onChange={(k, v) => setNested('notifications', k, v)} />
        <p className="cons__note">
          These switches record a preference. Delivery needs production SMTP, which is not
          configured yet — nothing is sent today whatever is ticked here.
        </p>
      </Sec>
    </Head>
  );
}
