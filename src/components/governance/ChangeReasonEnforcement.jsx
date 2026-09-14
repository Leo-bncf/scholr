import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle, Save, Loader2, Info } from 'lucide-react';

const REASON_RULES = [
  {
    key: 'grade_edit_after_lock',
    label: 'Grade edit after grade lock',
    description: 'Require justification when a grade is modified after the reporting window lock date.',
    level: 'critical',
  },
  {
    key: 'predicted_grade_edit',
    label: 'Predicted grade modification',
    description: 'Require a rationale whenever a teacher changes a previously submitted predicted IB grade.',
    level: 'warning',
  },
  {
    key: 'attendance_correction',
    label: 'Attendance record correction',
    description: 'Require a reason when any attendance record is changed after initial submission.',
    level: 'warning',
  },
  {
    key: 'behavior_record_delete',
    label: 'Behaviour record deletion',
    description: 'Require justification before a behaviour or pastoral record can be deleted.',
    level: 'critical',
  },
  {
    key: 'role_change',
    label: 'User role change',
    description: "Require a documented reason when a user's school role is changed.",
    level: 'warning',
  },
  {
    key: 'parent_student_link_change',
    label: 'Parent–student link modification',
    description: 'Require a reason when a parent–student relationship is created or removed.',
    level: 'warning',
  },
  {
    key: 'class_structure_change',
    label: 'Class structure change',
    description: 'Require reason when teachers are reassigned or student rosters are changed outside of timetable sync.',
    level: 'info',
  },
  {
    key: 'grade_visibility_override',
    label: 'Grade visibility override',
    description: "Require reason when a grade's visibility is changed from the school default.",
    level: 'info',
  },
];

const LEVEL_COLORS = {
  critical: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info: 'scholr-rule scholr-sunk',
};
const LEVEL_BADGE = {
  critical: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'scholr-sunk scholr-muted',
};

export default function ChangeReasonEnforcement({ policy, onChange, onSave, saving }) {
  const rules = policy?.reason_enforcement || {};

  const toggle = (key, value) => {
    onChange({ reason_enforcement: { ...rules, [key]: value } });
  };

  const activeCount = REASON_RULES.filter(r => rules[r.key]).length;

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex gap-2 text-sm text-blue-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>When enabled, the platform will intercept the relevant edit actions and require the acting user to provide a written reason before proceeding. Reasons are stored in the audit log and visible to administrators.</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold scholr-body">{activeCount} of {REASON_RULES.length} rules active</p>
          <p className="text-xs scholr-faint">Reason requirements apply to all staff within this school</p>
        </div>
        <Button onClick={onSave} disabled={saving} size="sm" className="scholr-accent-sf hover:scholr-accent-sf gap-1.5">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save Rules
        </Button>
      </div>

      <div className="space-y-3">
        {REASON_RULES.map(rule => (
          <div key={rule.key} className={`rounded-xl border p-4 ${rules[rule.key] ? LEVEL_COLORS[rule.level] : 'scholr-rule bg-white'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold scholr-ink text-sm">{rule.label}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${LEVEL_BADGE[rule.level]}`}>{rule.level}</span>
                </div>
                <p className="text-xs scholr-muted">{rule.description}</p>
              </div>
              <Switch
                checked={!!rules[rule.key]}
                onCheckedChange={v => toggle(rule.key, v)}
                className="shrink-0 mt-0.5"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Reusable Change Reason Modal ─────────────────────────────────────────────

export function ChangeReasonModal({ open, onClose, onConfirm, title, description, actionLabel = 'Confirm' }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim() || reason.trim().length < 10) {
      setError('Please provide a reason of at least 10 characters.');
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError('');
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-amber-100 rounded-full p-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <DialogTitle className="text-base">{title || 'Reason Required'}</DialogTitle>
          </div>
          <DialogDescription className="scholr-muted text-sm">{description || 'This action requires a documented reason for the audit trail.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div>
            <Label className="text-xs font-semibold scholr-muted mb-1.5 block">Reason for change *</Label>
            <Textarea
              rows={3}
              placeholder="Describe why this change is being made…"
              value={reason}
              onChange={e => { setReason(e.target.value); setError(''); }}
              className="text-sm"
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
          <p className="text-xs scholr-faint">This reason will be stored in the school audit log and is visible to school administrators.</p>
          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
            <Button size="sm" onClick={handleConfirm} className="scholr-accent-sf hover:scholr-accent-sf">{actionLabel}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}