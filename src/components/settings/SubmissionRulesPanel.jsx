import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Presentation, Table, Upload, Link } from 'lucide-react';

const FORMAT_META = {
  file_upload:   { label: 'File Upload',     icon: Upload,       color: 'scholr-sunk scholr-body scholr-rule' },
  link:          { label: 'Link Submission',  icon: Link,         color: 'scholr-accent-sf scholr-accent scholr-accent-rule' },
  /* A Doc, a Slides and a Sheet are three file types, not three states, so
     blue, amber and green were saying nothing. The icon distinguishes them. */
  google_doc:    { label: 'Google Doc',    icon: FileText,     color: 'scholr-sunk scholr-body' },
  google_slides: { label: 'Google Slides', icon: Presentation, color: 'scholr-sunk scholr-body' },
  google_sheet:  { label: 'Google Sheet',  icon: Table,        color: 'scholr-sunk scholr-body' },
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
        <h3 className="text-sm font-semibold scholr-ink mb-1">Allowed Submission Formats</h3>
        <p className="text-xs scholr-muted mb-3">Teachers can only assign formats from this list. Uncheck to disable school-wide.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.entries(FORMAT_META).map(([key, meta]) => {
            const Icon = meta.icon;
            const allowed = (form.allowed_formats || []).includes(key);
            return (
              <button
                key={key}
                onClick={() => toggleFormat(key)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-colors text-left ${allowed ? 'scholr-accent-rule scholr-accent-sf' : 'scholr-rule bg-white opacity-50 hover:opacity-70'}`}
              >
                <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${allowed ? 'scholr-accent' : 'scholr-faint'}`} />
                <span className={`text-xs font-medium ${allowed ? 'scholr-accent' : 'scholr-muted'}`}>{meta.label}</span>
                {allowed && <div className="ml-auto w-3 h-3 scholr-accent-sf rounded-full flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Default primary format */}
      <div>
        <Label className="text-sm font-semibold scholr-ink">Default Primary Format</Label>
        <p className="text-xs scholr-muted mb-2">Pre-selected when teachers create a new assignment. They can still change it.</p>
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
      <div className="flex items-center justify-between p-3 scholr-sunk rounded-lg border scholr-rule">
        <div>
          <p className="text-sm font-semibold scholr-ink">Allow teacher format override</p>
          <p className="text-xs scholr-muted mt-0.5">Teachers can change the primary format per assignment. Disable to enforce a single format school-wide.</p>
        </div>
        <Switch
          checked={form.allow_teacher_format_override !== false}
          onCheckedChange={v => onChange({ allow_teacher_format_override: v })}
        />
      </div>

      {/* Late submissions */}
      <div className="border-t scholr-rule-soft pt-5">
        <h3 className="text-sm font-semibold scholr-ink mb-1">Late Submission Policy</h3>
        <p className="text-xs scholr-muted mb-3">School-wide default applied to all new assignments. Teachers can override if permitted.</p>

        <div className="space-y-3">
          <div>
            <Label className="text-xs font-semibold scholr-muted">Default behavior for late submissions</Label>
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
                <Label className="text-xs font-semibold scholr-muted">Penalty (%)</Label>
                <Input
                  type="number" min="0" max="100"
                  value={form.late_penalty_percent || 0}
                  onChange={e => onChange({ late_penalty_percent: parseFloat(e.target.value) || 0 })}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold scholr-muted">Grace window (hours)</Label>
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
              <Label className="text-xs font-semibold scholr-muted">Grace window (hours after deadline)</Label>
              <p className="text-[11px] scholr-faint mb-1">0 = strictly blocked at due date</p>
              <Input
                type="number" min="0"
                value={form.late_window_hours || 0}
                onChange={e => onChange({ late_window_hours: parseFloat(e.target.value) || 0 })}
                className="mt-1 h-9 text-sm max-w-[120px]"
              />
            </div>
          )}

          <div className="flex items-center justify-between p-3 scholr-sunk rounded-lg border scholr-rule">
            <div>
              <p className="text-sm font-semibold scholr-ink">Allow teacher to override late policy</p>
              <p className="text-xs scholr-muted mt-0.5">Teachers can change allow_late per assignment.</p>
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