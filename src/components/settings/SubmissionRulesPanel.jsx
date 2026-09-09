import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Presentation, Table, Upload, Link } from 'lucide-react';

const FORMAT_META = {
  file_upload:   { label: 'File Upload',     icon: Upload,       color: 'bg-slate-100 text-slate-700 border-slate-200' },
  link:          { label: 'Link Submission',  icon: Link,         color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  google_doc:    { label: 'Google Doc',       icon: FileText,     color: 'bg-blue-50 text-blue-700 border-blue-200' },
  google_slides: { label: 'Google Slides',    icon: Presentation, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  google_sheet:  { label: 'Google Sheet',     icon: Table,        color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

export default function SubmissionRulesPanel({ form, onChange }) {
  const toggleFormat = (fmt) => {
    const current = form.allowed_formats || [];
    const updated = current.includes(fmt)
      ? current.filter(f => f !== fmt)
      : [...current, fmt];
    onChange({ allowed_formats: updated });
    // If removing the default format, clear it
    if (fmt === form.default_primary_format && !updated.includes(fmt)) {
      onChange({ allowed_formats: updated, default_primary_format: null });
    }
  };

  return (
    <div className="space-y-6">
      {/* Allowed formats */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Allowed Submission Formats</h3>
        <p className="text-xs text-slate-500 mb-3">Teachers can only assign formats from this list. Uncheck to disable school-wide.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(FORMAT_META).map(([key, meta]) => {
            const Icon = meta.icon;
            const allowed = (form.allowed_formats || []).includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleFormat(key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-left ${allowed ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white opacity-50 hover:opacity-70'}`}
              >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${allowed ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className={`text-xs font-medium ${allowed ? 'text-indigo-800' : 'text-slate-500'}`}>{meta.label}</span>
                {allowed && <div className="ml-auto w-3 h-3 bg-indigo-600 rounded-full flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Default primary format */}
      <div>
        <Label className="text-sm font-semibold text-slate-900">Default Primary Format</Label>
        <p className="text-xs text-slate-500 mb-2">Pre-selected when teachers create a new assignment. They can still change it.</p>
        <Select
          value={form.default_primary_format || '__none'}
          onValueChange={v => onChange({ default_primary_format: v === '__none' ? null : v })}
        >
          <SelectTrigger className="mt-1 h-9 text-sm max-w-xs"><SelectValue placeholder="No default" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">No default (teacher chooses)</SelectItem>
            {(form.allowed_formats || []).map(f => (
              <SelectItem key={f} value={f}>{FORMAT_META[f]?.label || f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Teacher format override */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <p className="text-sm font-semibold text-slate-800">Allow teacher format override</p>
          <p className="text-xs text-slate-500 mt-0.5">Teachers can change the primary format per assignment. Disable to enforce a single format school-wide.</p>
        </div>
        <Switch
          checked={form.allow_teacher_format_override !== false}
          onCheckedChange={v => onChange({ allow_teacher_format_override: v })}
        />
      </div>

      {/* Late submissions */}
      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Late Submission Policy</h3>
        <p className="text-xs text-slate-500 mb-3">School-wide default applied to all new assignments. Teachers can override if permitted.</p>

        <div className="space-y-3">
          <div>
            <Label className="text-xs font-semibold text-slate-600">Default behavior for late submissions</Label>
            <Select
              value={form.late_submission_default || 'allowed'}
              onValueChange={v => onChange({ late_submission_default: v })}
            >
              <SelectTrigger className="mt-1 h-9 text-sm max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="allowed">Allowed (accepted without penalty)</SelectItem>
                <SelectItem value="penalised">Allowed with grade penalty</SelectItem>
                <SelectItem value="blocked">Blocked (not accepted after due date)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.late_submission_default === 'penalised' && (
            <div className="grid grid-cols-2 gap-3 max-w-xs">
              <div>
                <Label className="text-xs font-semibold text-slate-600">Penalty (%)</Label>
                <Input
                  type="number" min="0" max="100"
                  value={form.late_penalty_percent || 0}
                  onChange={e => onChange({ late_penalty_percent: parseFloat(e.target.value) || 0 })}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-slate-600">Grace window (hours)</Label>
                <Input
                  type="number" min="0"
                  value={form.late_window_hours || 0}
                  onChange={e => onChange({ late_window_hours: parseFloat(e.target.value) || 0 })}
                  className="mt-1 h-9 text-sm"
                />
              </div>
            </div>
          )}

          {form.late_submission_default === 'blocked' && (
            <div>
              <Label className="text-xs font-semibold text-slate-600">Grace window (hours after deadline)</Label>
              <p className="text-[11px] text-slate-400 mb-1">0 = strictly blocked at due date</p>
              <Input
                type="number" min="0"
                value={form.late_window_hours || 0}
                onChange={e => onChange({ late_window_hours: parseFloat(e.target.value) || 0 })}
                className="mt-1 h-9 text-sm max-w-[120px]"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-800">Allow teacher to override late policy</p>
              <p className="text-xs text-slate-500 mt-0.5">Teachers can change allow_late per assignment.</p>
            </div>
            <Switch
              checked={form.allow_teacher_late_override !== false}
              onCheckedChange={v => onChange({ allow_teacher_late_override: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}