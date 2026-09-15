import { Group, Row } from '@/components/app/AppShell';
import { Field } from '@/components/app/Field';
import StatusChip from '@/components/app/StatusChip';
import Notice from '@/components/app/Notice';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import * as behaviorPoliciesData from '@/data/behaviorPolicies';

/* Seven fixed hues became four meanings.
 *
 * A school setting up its behaviour policy was choosing between emerald, blue,
 * amber, red, violet, rose and slate — seven pigments, of which red and rose
 * were indistinguishable and blue, violet and slate all meant "no judgement".
 * The four here say what the colour is for, and they are drawn from the
 * reserved palette, so they follow the theme. Saved policies still name the
 * old values and resolve through LEGACY. */
const COLOR_OPTIONS = [
  { value: 'emerald', label: 'Good',    tone: 'good' },
  { value: 'amber',   label: 'Watch',   tone: 'warn' },
  { value: 'red',     label: 'Serious', tone: 'crit' },
  { value: 'slate',   label: 'Neutral', tone: 'mute' },
];
const LEGACY = { blue: 'slate', violet: 'slate', rose: 'red' };
const canonical = (v) => LEGACY[v] || v;
const toneOf = (v) => (COLOR_OPTIONS.find(c => c.value === canonical(v)) || COLOR_OPTIONS[3]).tone;
const SWATCH = { good: 'var(--good)', warn: 'var(--warn)', crit: 'var(--crit)', mute: 'var(--muted)' };

const DEFAULT_TYPES = [
  { id: 't1', key: 'commendation',    label: 'Commendation',      color: 'emerald', default_visible_to_student: true,  default_visible_to_parent: true,  staff_only: false, requires_action: false, active: true },
  { id: 't2', key: 'warning',         label: 'Verbal Warning',    color: 'amber',   default_visible_to_student: false, default_visible_to_parent: false, staff_only: false, requires_action: false, active: true },
  { id: 't3', key: 'detention',       label: 'Detention',         color: 'red',     default_visible_to_student: true,  default_visible_to_parent: true,  staff_only: false, requires_action: true,  active: true },
  { id: 't4', key: 'academic_concern',label: 'Academic Concern',  color: 'violet',  default_visible_to_student: false, default_visible_to_parent: false, staff_only: false, requires_action: true,  active: true },
  { id: 't5', key: 'pastoral_note',   label: 'Pastoral Note',     color: 'slate',   default_visible_to_student: false, default_visible_to_parent: false, staff_only: true,  requires_action: false, active: true },
  { id: 't6', key: 'safeguarding',    label: 'Safeguarding',      color: 'rose',    default_visible_to_student: false, default_visible_to_parent: false, staff_only: true,  requires_action: true,  active: true },
];

const DEFAULT_SEVERITIES = [
  { id: 's1', key: 'low',      label: 'Low',      color: 'blue',   requires_pastoral_review: false, notify_admin: false, active: true },
  { id: 's2', key: 'medium',   label: 'Medium',   color: 'amber',  requires_pastoral_review: false, notify_admin: false, active: true },
  { id: 's3', key: 'high',     label: 'High',     color: 'red',    requires_pastoral_review: true,  notify_admin: false, active: true },
  { id: 's4', key: 'critical', label: 'Critical', color: 'rose',   requires_pastoral_review: true,  notify_admin: true,  active: true },
];

function genId() { return Math.random().toString(36).slice(2, 9); }

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
      {COLOR_OPTIONS.map(c => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          className="scholr-focus"
          aria-label={c.label}
          aria-pressed={canonical(value) === c.value}
          title={c.label}
          style={{
            width: '1.15rem', height: '1.15rem', borderRadius: '999px', cursor: 'pointer',
            background: SWATCH[c.tone],
            border: `2px solid ${canonical(value) === c.value ? 'var(--ink)' : 'transparent'}`,
          }}
        />
      ))}
    </div>
  );
}

export default function BehaviorPolicyConfig({ schoolId }) {
  const queryClient = useQueryClient();
  const [types, setTypes] = useState(null);
  const [severities, setSeverities] = useState(null);
  const [allowTeacherOverride, setAllowTeacherOverride] = useState(true);
  const [followUpTracking, setFollowUpTracking] = useState(true);

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['behavior-policy', schoolId],
    queryFn: () => behaviorPoliciesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });
  const policy = policies[0] || null;

  useEffect(() => {
    if (policy) {
      setTypes(policy.incident_types?.length ? policy.incident_types : DEFAULT_TYPES);
      setSeverities(policy.severity_levels?.length ? policy.severity_levels : DEFAULT_SEVERITIES);
      setAllowTeacherOverride(policy.allow_teacher_visibility_override ?? true);
      setFollowUpTracking(policy.follow_up_tracking_enabled ?? true);
    } else if (!isLoading) {
      setTypes(DEFAULT_TYPES);
      setSeverities(DEFAULT_SEVERITIES);
    }
  }, [policy, isLoading]);

  const saveMutation = useMutation({
    mutationFn: (data) => policy
      ? behaviorPoliciesData.update(policy.id, data)
      : behaviorPoliciesData.create({ school_id: schoolId, ...data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['behavior-policy', schoolId] }),
  });

  const handleSave = () => saveMutation.mutate({
    incident_types: types,
    severity_levels: severities,
    allow_teacher_visibility_override: allowTeacherOverride,
    follow_up_tracking_enabled: followUpTracking,
  });

  const updateType = (id, field, val) => setTypes(types.map(t => t.id === id ? { ...t, [field]: val } : t));
  const removeType = (id) => setTypes(types.filter(t => t.id !== id));
  const addType = () => setTypes([...types, { id: genId(), key: '', label: '', color: 'slate', default_visible_to_student: false, default_visible_to_parent: false, staff_only: false, requires_action: false, active: true }]);

  const updateSev = (id, field, val) => setSeverities(severities.map(s => s.id === id ? { ...s, [field]: val } : s));
  const removeSev = (id) => setSeverities(severities.filter(s => s.id !== id));
  const addSev = () => setSeverities([...severities, { id: genId(), key: '', label: '', color: 'slate', requires_pastoral_review: false, notify_admin: false, active: true }]);

  if (isLoading || types === null) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin scholr-accent" /></div>;

  return (
    <div className="space-y-4">
      <Group
        title="Incident types"
        action={<Button variant="outline" size="sm" onClick={addType}><Plus className="w-4 h-4 mr-1" /> Add type</Button>}
      >
        <p style={{ margin: 0, padding: '.6rem .9rem 0', fontSize: '.82rem', color: 'var(--muted)' }}>
          What staff can record, and who sees it by default.
        </p>
        {types.map(t => (
          <div key={t.id} style={{ padding: '.8rem .9rem', borderTop: '1px solid var(--rule-soft)' }}>
            <div style={{ display: 'grid', gap: '.7rem', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', alignItems: 'end' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Field label="Key" htmlFor={`bt-key-${t.id}`}>
                  <Input id={`bt-key-${t.id}`} value={t.key} onChange={e => updateType(t.id, 'key', e.target.value)} placeholder="warning" className="h-8 text-sm" />
                </Field>
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <Field label="Shown to staff as" htmlFor={`bt-label-${t.id}`}>
                  <Input id={`bt-label-${t.id}`} value={t.label} onChange={e => updateType(t.id, 'label', e.target.value)} placeholder="Verbal warning" className="h-8 text-sm" />
                </Field>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <Field label="Reads as">
                  <ColorPicker value={t.color} onChange={v => updateType(t.id, 'color', v)} />
                </Field>
              </div>
              <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.45rem', fontSize: '.78rem', color: 'var(--muted)' }}>
                  <Switch checked={t.default_visible_to_student} onCheckedChange={v => updateType(t.id, 'default_visible_to_student', v)} className="scale-75" />
                  Student sees it
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.45rem', fontSize: '.78rem', color: 'var(--muted)' }}>
                  <Switch checked={t.default_visible_to_parent} onCheckedChange={v => updateType(t.id, 'default_visible_to_parent', v)} className="scale-75" />
                  Parent sees it
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.45rem', fontSize: '.78rem', color: 'var(--muted)' }}>
                  <Switch checked={t.staff_only} onCheckedChange={v => updateType(t.id, 'staff_only', v)} className="scale-75" />
                  Staff only
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.45rem', fontSize: '.78rem', color: 'var(--muted)' }}>
                  <Switch checked={t.requires_action} onCheckedChange={v => updateType(t.id, 'requires_action', v)} className="scale-75" />
                  Needs an action recorded
                </label>
              </div>
              <div style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.45rem' }}>
                <StatusChip tone={toneOf(t.color)}>{t.label || 'Preview'}</StatusChip>
                <Switch checked={t.active} onCheckedChange={v => updateType(t.id, 'active', v)} className="scale-75" aria-label={`${t.label} in use`} />
                <button
                  type="button"
                  onClick={() => removeType(t.id)}
                  className="scholr-focus"
                  aria-label={`Remove ${t.label || 'type'}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', padding: 0 }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {t.staff_only && (
              <div style={{ marginTop: '.6rem' }}>
                <Notice tone="crit">
                  Staff only. Student and parent visibility cannot be switched on for records of this type,
                  whatever the two toggles above say.
                </Notice>
              </div>
            )}
          </div>
        ))}
      </Group>

      <Group
        title="Severity levels"
        action={<Button variant="outline" size="sm" onClick={addSev}><Plus className="w-4 h-4 mr-1" /> Add level</Button>}
      >
        <p style={{ margin: 0, padding: '.6rem .9rem 0', fontSize: '.82rem', color: 'var(--muted)' }}>
          How serious a record is, and what that triggers.
        </p>
        {severities.map(sv => (
          <div key={sv.id} style={{ padding: '.8rem .9rem', borderTop: '1px solid var(--rule-soft)', display: 'grid', gap: '.7rem', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', alignItems: 'end' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Key" htmlFor={`bs-key-${sv.id}`}>
                <Input id={`bs-key-${sv.id}`} value={sv.key} onChange={e => updateSev(sv.id, 'key', e.target.value)} placeholder="high" className="h-8 text-sm" />
              </Field>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <Field label="Shown to staff as" htmlFor={`bs-label-${sv.id}`}>
                <Input id={`bs-label-${sv.id}`} value={sv.label} onChange={e => updateSev(sv.id, 'label', e.target.value)} placeholder="High" className="h-8 text-sm" />
              </Field>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Reads as">
                <ColorPicker value={sv.color} onChange={v => updateSev(sv.id, 'color', v)} />
              </Field>
            </div>
            <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.45rem', fontSize: '.78rem', color: 'var(--muted)' }}>
                <Switch checked={sv.requires_pastoral_review} onCheckedChange={v => updateSev(sv.id, 'requires_pastoral_review', v)} className="scale-75" />
                Pastoral must review it
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.45rem', fontSize: '.78rem', color: 'var(--muted)' }}>
                <Switch checked={sv.notify_admin} onCheckedChange={v => updateSev(sv.id, 'notify_admin', v)} className="scale-75" />
                Tell an admin
              </label>
            </div>
            <div style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.45rem' }}>
              <StatusChip tone={toneOf(sv.color)}>{sv.label || 'Preview'}</StatusChip>
              <Switch checked={sv.active} onCheckedChange={v => updateSev(sv.id, 'active', v)} className="scale-75" aria-label={`${sv.label} in use`} />
              <button
                type="button"
                onClick={() => removeSev(sv.id)}
                className="scholr-focus"
                aria-label={`Remove ${sv.label || 'level'}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', padding: 0 }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </Group>

      <Group title="Rules">
        <Row
          label="Let teachers change who sees a record"
          detail="With this off, only the defaults above apply. Admins and pastoral staff can always override."
        >
          <Switch checked={allowTeacherOverride} onCheckedChange={setAllowTeacherOverride} aria-label="Allow teachers to override visibility" />
        </Row>
        <Row
          label="Track follow-ups"
          detail="Records that need an action stay open until someone closes them, and show up in Pastoral."
        >
          <Switch checked={followUpTracking} onCheckedChange={setFollowUpTracking} aria-label="Enable follow-up tracking" />
        </Row>
      </Group>

      <div className="flex justify-end items-center gap-3">
        {saveMutation.isSuccess && <span style={{ fontSize: '.85rem', color: 'var(--good)' }}>Saved.</span>}
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="pub-btn pub-btn-primary">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save
        </Button>
      </div>
    </div>
  );
}
