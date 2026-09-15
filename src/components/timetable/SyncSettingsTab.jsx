import { Group, Row } from '@/components/app/AppShell';
import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import { OVERRIDE_POLICY_CONFIG } from './useTimetableData';
import * as timetableSettingsData from '@/data/timetableSettings';

const DEFAULT_FIELD_MAPPING = {
  teacher_id_field: 'teacher_code',
  room_id_field: 'room_code',
  class_id_field: 'class_code',
  period_id_field: 'period_code',
  day_field: 'day',
  start_time_field: 'start_time',
  end_time_field: 'end_time',
};

export default function SyncSettingsTab({ schoolId, settings }) {
  const queryClient = useQueryClient();
  const isNew = !settings;

  const [form, setForm] = useState({
    external_system_name: '',
    external_system_url: '',
    external_school_id: '',
    sync_enabled: false,
    override_policy: 'allow_local_edits',
    sync_frequency: 'manual',
    use_rotating_cycle: false,
    cycle_days_raw: '',
    show_room_to_students: true,
    show_teacher_to_students: true,
    link_attendance_to_schedule: true,
    field_mapping: { ...DEFAULT_FIELD_MAPPING },
  });

  useEffect(() => {
    if (settings) {
      setForm({
        external_system_name: settings.external_system_name || '',
        external_system_url: settings.external_system_url || '',
        external_school_id: settings.external_school_id || '',
        sync_enabled: settings.sync_enabled || false,
        override_policy: settings.override_policy || 'allow_local_edits',
        sync_frequency: settings.sync_frequency || 'manual',
        use_rotating_cycle: settings.use_rotating_cycle || false,
        cycle_days_raw: (settings.cycle_days || []).join(', '),
        show_room_to_students: settings.show_room_to_students !== false,
        show_teacher_to_students: settings.show_teacher_to_students !== false,
        link_attendance_to_schedule: settings.link_attendance_to_schedule !== false,
        field_mapping: { ...DEFAULT_FIELD_MAPPING, ...(settings.field_mapping || {}) },
      });
    }
  }, [settings?.id]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        school_id: schoolId,
        cycle_days: data.cycle_days_raw ? data.cycle_days_raw.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      delete payload.cycle_days_raw;
      return isNew
        ? timetableSettingsData.create(payload)
        : timetableSettingsData.update(settings.id, payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timetable-settings', schoolId] }),
  });


  const SectionCard = ({ title, description, children }) => (
    <Group title={title}>
      {description && (
        <p style={{ margin: 0, padding: '.6rem .9rem 0', fontSize: '.82rem', color: 'var(--muted)' }}>
          {description}
        </p>
      )}
      <div className="px-4 py-3 space-y-4">{children}</div>
    </Group>
  );

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Connection */}
      <SectionCard title="External System Connection" description="Configure which external timetable generator this school connects to.">
        <div className="app-group">
          <Row label="Sync is on" detail="Lets the external system push timetable data into Scholr.">
            <Switch
              checked={form.sync_enabled}
              onCheckedChange={v => setForm({ ...form, sync_enabled: v })}
              aria-label="Enable sync"
            />
          </Row>
        </div>
        <div>
          <Label className="text-xs font-semibold scholr-muted">System Name</Label>
          <Input value={form.external_system_name} onChange={e => setForm({ ...form, external_system_name: e.target.value })} placeholder="e.g. Untis, iSAMS, Firefly, SchoolBase" className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-semibold scholr-muted">System URL / Endpoint</Label>
          <Input value={form.external_system_url} onChange={e => setForm({ ...form, external_system_url: e.target.value })} placeholder="https://your-system.school.com/api/timetable" className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-semibold scholr-muted">School Identifier (in external system)</Label>
          <p className="text-[11px] scholr-faint mb-1">The unique key the external system uses to identify this school. Critical for multi-tenant isolation.</p>
          <Input value={form.external_school_id} onChange={e => setForm({ ...form, external_school_id: e.target.value })} placeholder="e.g. SCH-042 or my-school-slug" className="mt-1 h-9 text-sm font-mono" />
        </div>
        <div>
          <Label className="text-xs font-semibold scholr-muted">Sync Frequency</Label>
          <Select value={form.sync_frequency} onValueChange={v => setForm({ ...form, sync_frequency: v })}>
            <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">Manual only</SelectItem>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      {/* Override policy */}
      <SectionCard title="Manual Override Policy" description="Determines whether local staff can edit timetable data or if the external system is the sole source of truth.">
        <div className="space-y-2">
          {/* Three radio buttons dressed as cards, with a padlock emoji each.
              A radio group is the control this is, and it comes with keyboard
              behaviour and grouping a screen reader can announce. */}
          {Object.entries(OVERRIDE_POLICY_CONFIG).map(([key, cfg]) => (
            <label
              key={key}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '.7rem',
                padding: '.7rem .8rem', borderRadius: '8px', cursor: 'pointer',
                border: `1px solid ${form.override_policy === key ? 'var(--brand)' : 'var(--rule)'}`,
                background: form.override_policy === key ? 'var(--brand-sf)' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="override-policy"
                value={key}
                checked={form.override_policy === key}
                onChange={() => setForm({ ...form, override_policy: key })}
                className="scholr-focus"
                style={{ marginTop: '.2rem' }}
              />
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: '.9rem', color: 'var(--ink)' }}>{cfg.label}</span>
                <span style={{ display: 'block', marginTop: '.1rem', fontSize: '.8rem', color: 'var(--muted)' }}>{cfg.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </SectionCard>

      {/* Field mapping */}
      <SectionCard title="Field Mapping Rules" description="Map external system field names to internal platform field names.">
        <p className="text-[11px] scholr-muted -mt-2">Enter the field/column name that the external system uses for each internal concept.</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'teacher_id_field',  label: 'Teacher ID field' },
            { key: 'room_id_field',     label: 'Room ID field' },
            { key: 'class_id_field',    label: 'Class ID field' },
            { key: 'period_id_field',   label: 'Period ID field' },
            { key: 'day_field',         label: 'Day field' },
            { key: 'start_time_field',  label: 'Start time field' },
            { key: 'end_time_field',    label: 'End time field' },
          ].map(({ key, label }) => (
            <div key={key}>
              <Label className="text-[11px] font-medium scholr-muted">{label}</Label>
              <Input
                value={form.field_mapping[key] || ''}
                onChange={e => setForm({ ...form, field_mapping: { ...form.field_mapping, [key]: e.target.value } })}
                className="mt-1 h-8 text-xs font-mono"
                placeholder={DEFAULT_FIELD_MAPPING[key]}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Rotating cycle */}
      <SectionCard title="Cycle Day Configuration" description="Configure if your school uses a rotating schedule (A/B days, numbered cycles, etc.).">
        <div className="flex items-center justify-between scholr-sunk rounded-lg p-3 border scholr-rule">
          <div>
            <p className="text-xs font-semibold scholr-body">Use Rotating Cycle</p>
            <p className="text-[11px] scholr-faint mt-0.5">Enable A/B days, numbered cycles, or other rotation patterns</p>
          </div>
          <Switch checked={form.use_rotating_cycle} onCheckedChange={v => setForm({ ...form, use_rotating_cycle: v })} />
        </div>
        {form.use_rotating_cycle && (
          <div>
            <Label className="text-xs font-semibold scholr-muted">Cycle Day Labels (comma-separated)</Label>
            <Input value={form.cycle_days_raw} onChange={e => setForm({ ...form, cycle_days_raw: e.target.value })} placeholder="A, B  or  1, 2, 3, 4, 5, 6" className="mt-1 h-9 text-sm" />
            <p className="text-[11px] scholr-faint mt-1">These labels are displayed on schedule views and used to filter entries by cycle day.</p>
          </div>
        )}
      </SectionCard>

      {/* Display preferences */}
      <SectionCard title="Display Preferences" description="Control what schedule information is visible to different user roles.">
        {[
          { key: 'show_room_to_students', label: 'Show room information to students' },
          { key: 'show_teacher_to_students', label: 'Show teacher names to students' },
          { key: 'link_attendance_to_schedule', label: 'Link attendance records to schedule sessions' },
        ].map(opt => (
          <div key={opt.key} className="flex items-center justify-between py-1">
            <Label className="text-sm scholr-body cursor-pointer">{opt.label}</Label>
            <Switch checked={form[opt.key]} onCheckedChange={v => setForm({ ...form, [opt.key]: v })} />
          </div>
        ))}
      </SectionCard>

      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="pub-btn pub-btn-primary gap-2"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saveMutation.isPending ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
      {saveMutation.isSuccess && (
        <p className="text-xs text-emerald-600 text-right">✓ Settings saved successfully</p>
      )}
    </div>
  );
}