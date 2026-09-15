import StatusChip from '@/components/app/StatusChip';
import React from 'react';
import Notice from '@/components/app/Notice';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';

export default function AcademicIntegrityPanel({ form, onChange }) {
  return (
    <div className="space-y-6">
      <Notice tone="info">
        These tools help enforce academic integrity consistently. Each setting applies school-wide to all assignments and submissions.
      </Notice>

      {/* Plagiarism flags */}
      <div className="app-group p-4 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold scholr-ink">Plagiarism Concern Flags</p>
                <p className="text-xs scholr-muted mt-0.5">Teachers can flag a submission with a plagiarism concern. Flagged submissions are visible to school admins for review.</p>
              </div>
              <Switch
                checked={form.plagiarism_flag_enabled === true}
                onCheckedChange={v => onChange({ plagiarism_flag_enabled: v })}
              />
            </div>
            {form.plagiarism_flag_enabled && (
              <p style={{ margin: '.6rem 0 0', fontSize: '.78rem', color: 'var(--muted)' }}>
                Teachers can flag submissions. Admins see a consolidated view of all flagged submissions.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Resubmission limit */}
      <div className="app-group p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold scholr-ink">Resubmission Limit</p>
              <p className="text-xs scholr-muted mt-0.5">Maximum number of times a student can resubmit after an assignment is returned. Set to 0 for unlimited.</p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="0"
                max="20"
                value={form.resubmission_limit || 0}
                onChange={e => onChange({ resubmission_limit: parseInt(e.target.value) || 0 })}
                className="h-9 text-sm w-24"
              />
              <span className="text-xs scholr-muted">
                {form.resubmission_limit === 0 ? 'Unlimited resubmissions' : `Max ${form.resubmission_limit} resubmission${form.resubmission_limit !== 1 ? 's' : ''} per assignment`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Submission history visibility */}
      <div className="app-group p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg scholr-accent-sf flex items-center justify-center flex-shrink-0 mt-0.5">
            <Eye className="w-4 h-4 scholr-accent" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-sm font-semibold scholr-ink">Submission History Visibility</p>
              <p className="text-xs scholr-muted mt-0.5">Control who can see the full submission history including all previous versions and resubmissions.</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 px-3 scholr-sunk rounded-lg">
                <div>
                  <p className="text-xs font-semibold scholr-body">Students see their own history</p>
                  <p className="text-[11px] scholr-faint">Students can view timestamps and previous draft/submission versions</p>
                </div>
                <Switch
                  checked={form.show_submission_history_to_student !== false}
                  onCheckedChange={v => onChange({ show_submission_history_to_student: v })}
                />
              </div>
              <div className="flex items-center justify-between py-2 px-3 scholr-sunk rounded-lg">
                <div>
                  <p className="text-xs font-semibold scholr-body">Teachers see full history</p>
                  <p className="text-[11px] scholr-faint">Teachers can see all submission events, resubmissions, and timestamps per student</p>
                </div>
                <Switch
                  checked={form.show_submission_history_to_teacher !== false}
                  onCheckedChange={v => onChange({ show_submission_history_to_teacher: v })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acknowledgement */}
      <div className="app-group p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold scholr-ink">Academic Integrity Acknowledgement</p>
                <p className="text-xs scholr-muted mt-0.5">Require students to confirm their work is original before submitting.</p>
              </div>
              <Switch
                checked={form.require_submission_acknowledgement === true}
                onCheckedChange={v => onChange({ require_submission_acknowledgement: v })}
              />
            </div>
            {form.require_submission_acknowledgement && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold scholr-muted">Acknowledgement text (shown to students)</Label>
                <Textarea
                  value={form.acknowledgement_text || ''}
                  onChange={e => onChange({ acknowledgement_text: e.target.value })}
                  placeholder="I confirm this is my own original work and I have not plagiarised any content."
                  rows={3}
                  className="text-sm"
                />
                <div style={{ padding: '.6rem .7rem', borderLeft: '2px solid var(--rule)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--good)' }}>Preview (student will see):</p>
                  <div className="flex items-start gap-2">
                    <input type="checkbox" className="mt-0.5" defaultChecked readOnly />
                    <p className="text-xs italic" style={{ color: 'var(--good)' }}>
                      {form.acknowledgement_text || 'I confirm this is my own original work and I have not plagiarised any content.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary badge */}
      <div className="scholr-sunk rounded-xl border scholr-rule p-3">
        <p className="text-xs font-semibold scholr-muted mb-2">Active integrity controls:</p>
        <div className="flex flex-wrap gap-1.5">
          {form.plagiarism_flag_enabled && <StatusChip tone="mute">Plagiarism flags</StatusChip>}
          {form.resubmission_limit > 0 && <StatusChip tone="mute">Resubmissions capped at {form.resubmission_limit}</StatusChip>}
          {form.show_submission_history_to_teacher !== false && <Badge className="text-[10px] scholr-accent-sf scholr-accent scholr-accent-rule border">Teacher history view</Badge>}
          {form.show_submission_history_to_student !== false && <Badge className="text-[10px] scholr-sunk scholr-muted scholr-rule border">Student history view</Badge>}
          {form.require_submission_acknowledgement && <StatusChip tone="mute">Integrity statement</StatusChip>}
          {!form.plagiarism_flag_enabled && !form.require_submission_acknowledgement && form.resubmission_limit === 0 && (
            <span className="text-xs scholr-faint italic">No active integrity controls</span>
          )}
        </div>
      </div>
    </div>
  );
}