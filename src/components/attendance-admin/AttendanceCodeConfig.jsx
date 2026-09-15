import { Group, Row } from '@/components/app/AppShell';
import { Field } from '@/components/app/Field';
import StatusChip from '@/components/app/StatusChip';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Save } from 'lucide-react';
import * as attendancePoliciesData from '@/data/attendancePolicies';

/* A school picks how each of its codes looks, so this is user data, not
   decoration — but the six choices were fixed tailwind hues that ignored the
   theme and gave a school six ways to say "this is bad". They map onto the
   reserved palette now, named by what the colour means rather than by the
   pigment, and they follow light and dark like everything else.
   `value` keeps the old keys so existing saved policies still resolve. */
const COLOR_OPTIONS = [
  { value: 'emerald', label: 'Fine',    tone: 'good' },
  { value: 'red',     label: 'Problem', tone: 'crit' },
  { value: 'amber',   label: 'Watch',   tone: 'warn' },
  { value: 'slate',   label: 'Neutral', tone: 'mute' },
];
/* Six choices became four. Two of the six — blue and violet — meant the same
   thing as each other and the same thing as grey once they were drawn from a
   palette rather than from pigment, so a school was picking between three
   identical swatches. Saved policies still name them, and they resolve here. */
const LEGACY = { blue: 'slate', violet: 'slate' };
const toneOf = (color) => (COLOR_OPTIONS.find(c => c.value === (LEGACY[color] || color)) || COLOR_OPTIONS[3]).tone;
const SWATCH = { good: 'var(--good)', crit: 'var(--crit)', warn: 'var(--warn)', mute: 'var(--muted)' };

const DEFAULT_CODES = [
  { id: 'c1', key: 'present', label: 'Present', color: 'emerald', counts_as_absent: false, requires_note: false, is_default: true, active: true },
  { id: 'c2', key: 'absent',  label: 'Absent',  color: 'red',     counts_as_absent: true,  requires_note: false, is_default: false, active: true },
  { id: 'c3', key: 'late',    label: 'Late',    color: 'amber',   counts_as_absent: false, requires_note: false, is_default: false, active: true },
  { id: 'c4', key: 'excused', label: 'Excused', color: 'blue',    counts_as_absent: false, requires_note: true,  is_default: false, active: true },
];

const DEFAULT_REASONS = [
  { id: 'r1', label: 'Medical / Illness',        applies_to: ['absent','excused'], active: true },
  { id: 'r2', label: 'Family Emergency',          applies_to: ['absent','excused'], active: true },
  { id: 'r3', label: 'Approved School Activity',  applies_to: ['excused'],          active: true },
  { id: 'r4', label: 'Travel',                    applies_to: ['absent','excused'], active: true },
  { id: 'r5', label: 'Transportation Issue',       applies_to: ['late'],             active: true },
  { id: 'r6', label: 'Other',                     applies_to: ['absent','late','excused'], active: true },
];

function genId() { return Math.random().toString(36).slice(2, 9); }

export default function AttendanceCodeConfig({ schoolId }) {
  const queryClient = useQueryClient();

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['attendance-policy', schoolId],
    queryFn: () => attendancePoliciesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const policy = policies[0] || null;

  const [codes, setCodes] = useState(null);
  const [reasons, setReasons] = useState(null);
  const [requireReason, setRequireReason] = useState(false);
  const [requireCorrection, setRequireCorrection] = useState(true);
  const [chronicThreshold, setChronicThreshold] = useState(20);
  const [latenessThreshold, setLatenessThreshold] = useState(3);

  useEffect(() => {
    if (policy) {
      setCodes(policy.codes?.length ? policy.codes : DEFAULT_CODES);
      setReasons(policy.reason_categories?.length ? policy.reason_categories : DEFAULT_REASONS);
      setRequireReason(policy.require_reason_for_absence ?? false);
      setRequireCorrection(policy.require_correction_reason ?? true);
      setChronicThreshold(policy.chronic_absence_threshold_percent ?? 20);
      setLatenessThreshold(policy.frequent_lateness_threshold ?? 3);
    } else if (!isLoading) {
      setCodes(DEFAULT_CODES);
      setReasons(DEFAULT_REASONS);
    }
  }, [policy, isLoading]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (policy) {
        return attendancePoliciesData.update(policy.id, data);
      }
      return attendancePoliciesData.create({ school_id: schoolId, ...data });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-policy', schoolId] }),
  });

  const handleSave = () => {
    saveMutation.mutate({
      codes,
      reason_categories: reasons,
      require_reason_for_absence: requireReason,
      require_correction_reason: requireCorrection,
      chronic_absence_threshold_percent: chronicThreshold,
      frequent_lateness_threshold: latenessThreshold,
    });
  };

  const addCode = () => {
    setCodes([...codes, { id: genId(), key: '', label: '', color: 'slate', counts_as_absent: false, requires_note: false, is_default: false, active: true }]);
  };

  const updateCode = (id, field, value) => {
    setCodes(codes.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCode = (id) => {
    setCodes(codes.filter(c => c.id !== id));
  };

  const addReason = () => {
    setReasons([...reasons, { id: genId(), label: '', applies_to: ['absent'], active: true }]);
  };

  const updateReason = (id, field, value) => {
    setReasons(reasons.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeReason = (id) => {
    setReasons(reasons.filter(r => r.id !== id));
  };

  const toggleReasonCode = (reasonId, codeKey) => {
    setReasons(reasons.map(r => {
      if (r.id !== reasonId) return r;
      const applies = r.applies_to || [];
      return {
        ...r,
        applies_to: applies.includes(codeKey) ? applies.filter(k => k !== codeKey) : [...applies, codeKey]
      };
    }));
  };

  if (isLoading || codes === null) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin scholr-accent" /></div>;
  }

  return (
    <div className="space-y-4">
      <Group
        title="Attendance codes"
        action={
          <Button variant="outline" size="sm" onClick={addCode}>
            <Plus className="w-4 h-4 mr-1" /> Add code
          </Button>
        }
      >
        <p style={{ margin: 0, padding: '.6rem .9rem 0', fontSize: '.82rem', color: 'var(--muted)' }}>
          The only statuses a teacher can pick when taking a register.
        </p>
        {codes.map(code => (
          <div key={code.id} style={{ padding: '.8rem .9rem', borderTop: '1px solid var(--rule-soft)', display: 'grid', gap: '.7rem', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', alignItems: 'end' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <Field label="Key" htmlFor={`code-key-${code.id}`}>
                <Input id={`code-key-${code.id}`} value={code.key} onChange={e => updateCode(code.id, 'key', e.target.value)} placeholder="present" className="text-sm h-8" />
              </Field>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <Field label="Shown to staff as" htmlFor={`code-label-${code.id}`}>
                <Input id={`code-label-${code.id}`} value={code.label} onChange={e => updateCode(code.id, 'label', e.target.value)} placeholder="Present" className="text-sm h-8" />
              </Field>
            </div>
            <div style={{ gridColumn: 'span 3' }}>
              <Field label="Reads as">
                <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap' }}>
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => updateCode(code.id, 'color', c.value)}
                      className="scholr-focus"
                      aria-label={c.label}
                      aria-pressed={(LEGACY[code.color] || code.color) === c.value}
                      title={c.label}
                      style={{
                        width: '1.15rem', height: '1.15rem', borderRadius: '999px', cursor: 'pointer',
                        background: SWATCH[c.tone],
                        border: `2px solid ${(LEGACY[code.color] || code.color) === c.value ? 'var(--ink)' : 'transparent'}`,
                      }}
                    />
                  ))}
                </div>
              </Field>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '.3rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.78rem', color: 'var(--muted)' }}>
                <Switch checked={code.counts_as_absent} onCheckedChange={v => updateCode(code.id, 'counts_as_absent', v)} className="scale-75" />
                Counts as absent
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.78rem', color: 'var(--muted)' }}>
                <Switch checked={code.requires_note} onCheckedChange={v => updateCode(code.id, 'requires_note', v)} className="scale-75" />
                Needs a note
              </label>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '.5rem' }}>
              <StatusChip tone={toneOf(code.color)}>{code.label || 'Preview'}</StatusChip>
              <Switch checked={code.active} onCheckedChange={v => updateCode(code.id, 'active', v)} className="scale-75" aria-label={`${code.label} in use`} />
              <button
                type="button"
                onClick={() => removeCode(code.id)}
                className="scholr-focus"
                aria-label={`Remove ${code.label || 'code'}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', padding: 0 }}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </Group>

      <Group
        title="Reasons"
        action={
          <Button variant="outline" size="sm" onClick={addReason}>
            <Plus className="w-4 h-4 mr-1" /> Add reason
          </Button>
        }
      >
        <p style={{ margin: 0, padding: '.6rem .9rem 0', fontSize: '.82rem', color: 'var(--muted)' }}>
          The standard explanations staff choose from when someone is not present.
        </p>
        {reasons.map(reason => (
          <div key={reason.id} style={{ padding: '.7rem .9rem', borderTop: '1px solid var(--rule-soft)', display: 'flex', gap: '.7rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Input
              value={reason.label}
              onChange={e => updateReason(reason.id, 'label', e.target.value)}
              placeholder="Reason"
              aria-label="Reason"
              className="text-sm h-8"
              style={{ width: '14rem' }}
            />
            <span className="scholr-label" style={{ margin: 0 }}>Applies to</span>
            <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', flex: 1 }}>
              {codes.filter(c => c.active && c.key !== 'present').map(code => {
                const on = (reason.applies_to || []).includes(code.key);
                return (
                  <button
                    key={code.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleReasonCode(reason.id, code.key)}
                    className="scholr-focus"
                    style={{
                      fontSize: '.78rem', padding: '.15rem .5rem', borderRadius: '999px', cursor: 'pointer',
                      border: `1px solid ${on ? 'var(--brand)' : 'var(--rule)'}`,
                      background: on ? 'var(--brand-sf)' : 'transparent',
                      color: on ? 'var(--brand)' : 'var(--faint)',
                    }}
                  >
                    {code.label}
                  </button>
                );
              })}
            </div>
            <Switch checked={reason.active} onCheckedChange={v => updateReason(reason.id, 'active', v)} className="scale-75" aria-label={`${reason.label} in use`} />
            <button
              type="button"
              onClick={() => removeReason(reason.id)}
              className="scholr-focus"
              aria-label={`Remove ${reason.label || 'reason'}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--faint)', padding: 0 }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </Group>

      <Group title="Rules">
        <Row
          label="Ask for a reason when someone is not present"
          detail="Teachers pick from the list above when marking absent, late or excused."
        >
          <Switch checked={requireReason} onCheckedChange={setRequireReason} aria-label="Require a reason for non-present" />
        </Row>
        <Row
          label="Ask for a reason when a record is corrected"
          detail="Admins must say why before changing a register after the fact."
        >
          <Switch checked={requireCorrection} onCheckedChange={setRequireCorrection} aria-label="Require a reason for corrections" />
        </Row>
        <Row
          label="Flag chronic absence at"
          detail="A student is flagged once this share of their days is an absence."
        >
          <Input
            type="number" min={1} max={100} value={chronicThreshold}
            onChange={e => setChronicThreshold(Number(e.target.value))}
            aria-label="Chronic absence threshold, percent"
            className="w-20 h-8 text-sm"
          />
          <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>%</span>
        </Row>
        <Row
          label="Flag frequent lateness at"
          detail="A student is flagged once they pass this many late marks in the period."
        >
          <Input
            type="number" min={1} value={latenessThreshold}
            onChange={e => setLatenessThreshold(Number(e.target.value))}
            aria-label="Frequent lateness threshold, days"
            className="w-20 h-8 text-sm"
          />
          <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>times</span>
        </Row>
      </Group>

      <div className="flex justify-end items-center gap-3">
        {saveMutation.isSuccess && (
          <span style={{ fontSize: '.85rem', color: 'var(--good)' }}>Saved.</span>
        )}
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="pub-btn pub-btn-primary">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save
        </Button>
      </div>
    </div>
  );
}
