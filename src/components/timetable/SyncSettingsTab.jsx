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

  const policyConfig = OVERRIDE_POLICY_CONFIG[form.override_policy];

  const SectionCard = ({ title, description, children }) => (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Connection */}
      <SectionCard title="External System Connection" description="Configure which external timetable generator this school connects to.">
        <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-700">Enable Sync Integration</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Allow data to flow from external system into this platform</p>
          </div>
          <Switch checked={form.sync_enabled} onCheckedChange={v => setForm({ ...form, sync_enabled: v })} />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">System Name</Label>
          <Input value={form.external_system_name} onChange={e => setForm({ ...form, external_system_name: e.target.value })} placeholder="e.g. Untis, iSAMS, Firefly, SchoolBase" className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">System URL / Endpoint</Label>
          <Input value={form.external_system_url} onChange={e => setForm({ ...form, external_system_url: e.target.value })} placeholder="https://your-system.school.com/api/timetable" className="mt-1 h-9 text-sm" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">School Identifier (in external system)</Label>
          <p className="text-[11px] text-slate-400 mb-1">The unique key the external system uses to identify this school. Critical for multi-tenant isolation.</p>
          <Input value={form.external_school_id} onChange={e => setForm({ ...form, external_school_id: e.target.value })} placeholder="e.g. SCH-042 or my-school-slug" className="mt-1 h-9 text-sm font-mono" />
        </div>
        <div>
          <Label className="text-xs font-semibold text-slate-600">Sync Frequency</Label>
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
          {Object.entries(OVERRIDE_POLICY_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setForm({ ...form, override_policy: key })}
              className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${form.override_policy === key ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <span className="text-lg mt-0.5">{cfg.icon}</span>
              <div>
                <p className={`text-sm font-semibold ${form.override_policy === key ? 'text-indigo-800' : 'text-slate-800'}`}>{cfg.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {key === 'read_only' && 'All timetable fields are locked. Admins cannot edit any schedule data locally. Sync is the only way to update.'}
                  {key === 'allow_local_edits' && 'Admins can edit certain fields locally. Synced fields are clearly marked. A subsequent sync may overwrite local changes.'}
                  {key === 'local_override' && 'Local changes take precedence over incoming sync data. The external system is informational only.'}
                </p>
              </div>
              {form.override_policy === key && (
                <div className="ml-auto flex-shrink-0 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </button>
          ))}
        </div>
        <div className={`rounded-lg px-3 py-2.5 border text-xs ${policyConfig.color}`}>
          <strong>Active policy:</strong> {policyConfig.label}
        </div>
      </SectionCard>

      {/* Field mapping */}
      <SectionCard title="Field Mapping Rules" description="Map external system field names to internal platform field names.">
        <p className="text-[11px] text-slate-500 -mt-2">Enter the field/column name that the external system uses for each internal concept.</p>
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
              <Label className="text-[11px] font-medium text-slate-500">{label}</Label>
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
        <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3 border border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-700">Use Rotating Cycle</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Enable A/B days, numbered cycles, or other rotation patterns</p>
          </div>
          <Switch checked={form.use_rotating_cycle} onCheckedChange={v => setForm({ ...form, use_rotating_cycle: v })} />
        </div>
        {form.use_rotating_cycle && (
          <div>
            <Label className="text-xs font-semibold text-slate-600">Cycle Day Labels (comma-separated)</Label>
            <Input value={form.cycle_days_raw} onChange={e => setForm({ ...form, cycle_days_raw: e.target.value })} placeholder="A, B  or  1, 2, 3, 4, 5, 6" className="mt-1 h-9 text-sm" />
            <p className="text-[11px] text-slate-400 mt-1">These labels are displayed on schedule views and used to filter entries by cycle day.</p>
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
            <Label className="text-sm text-slate-700 cursor-pointer">{opt.label}</Label>
            <Switch checked={form[opt.key]} onCheckedChange={v => setForm({ ...form, [opt.key]: v })} />
          </div>
        ))}
      </SectionCard>

      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
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