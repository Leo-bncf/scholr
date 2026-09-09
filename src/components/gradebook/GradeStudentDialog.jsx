import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Lock } from 'lucide-react';
import { logAudit, AuditActions, AuditLevels } from '@/components/utils/auditLogger';
import { useGradebookPolicy } from '@/hooks/useGradebookPolicy';
import { useUser } from '@/components/auth/UserContext';
import { getCurriculumConfig } from '@/lib/curriculumConfig';
import * as gradebookData from '@/data/gradebook';

export default function GradeStudentDialog({ gradeItem, student, existingGrade, open, onClose }) {
  const queryClient = useQueryClient();
  const { membership, curriculum } = useUser();
  const { policy } = useGradebookPolicy(gradeItem?.school_id);
  const currConfig = getCurriculumConfig(curriculum);
  const gradeScale = currConfig.gradeScale;
  const showIBGrade = currConfig.features?.ibGradeScale;
  const isLetterScale = gradeScale.type === 'letter';
  const isDescriptiveScale = gradeScale.type === 'descriptive';
  const [justification, setJustification] = useState('');
  const [form, setForm] = useState({
    score: existingGrade?.score || '',
    percentage: existingGrade?.percentage || '',
    ib_grade: existingGrade?.ib_grade || '',
    comment: existingGrade?.comment || '',
    status: existingGrade?.status || 'draft',
  });

  useEffect(() => {
    if (existingGrade) {
      setForm({
        score: existingGrade.score || '',
        percentage: existingGrade.percentage || '',
        ib_grade: existingGrade.ib_grade || '',
        comment: existingGrade.comment || '',
        status: existingGrade.status || 'draft',
      });
    }
  }, [existingGrade]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      let result;
      if (existingGrade) {
        result = await gradebookData.update(existingGrade.id, data);
        await logAudit({
          action: AuditActions.GRADE_UPDATED,
          entityType: 'GradeItem',
          entityId: existingGrade.id,
          details: `Updated grade for ${student.user_name || student.user_email} in ${gradeItem.title}`,
          level: AuditLevels.INFO,
          schoolId: gradeItem.school_id,
        });
      } else {
        result = await gradebookData.create(data);
        await logAudit({
          action: AuditActions.GRADE_CREATED,
          entityType: 'GradeItem',
          entityId: result.id,
          details: `Created grade for ${student.user_name || student.user_email} in ${gradeItem.title}`,
          level: AuditLevels.INFO,
          schoolId: gradeItem.school_id,
        });
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-grades'] });
      queryClient.invalidateQueries({ queryKey: ['student-grades'] });
      onClose();
    },
  });

  // Determine if grade is effectively locked
  const isLocked = (() => {
    if (!policy.lock_grades_after_deadline) return false;
    const now = new Date();
    for (const win of policy.reporting_windows || []) {
      if (win.locked) return true;
      if (win.locks_at && now > new Date(win.locks_at)) return true;
    }
    return false;
  })();

  const canOverrideLock = policy.admin_can_override_lock && ['school_admin','super_admin','admin'].includes(membership?.role);
  const effectiveLocked = isLocked && !canOverrideLock;
  const needsJustification = isLocked && canOverrideLock && policy.require_justification_for_locked_edit && existingGrade;

  const handleSave = () => {
    if (needsJustification && justification.trim().length < (policy.justification_min_chars || 20)) return;
    const gradeData = {
      ...form,
      school_id: gradeItem.school_id,
      class_id: gradeItem.class_id,
      student_id: student.user_id,
      student_name: student.user_name || student.user_email,
      title: gradeItem.title,
      max_score: gradeItem.max_score,
      assignment_id: gradeItem.assignment_id,
      visible_to_student: gradeItem.visible_to_student,
      visible_to_parent: gradeItem.visible_to_parent,
      term_id: gradeItem.term_id,
    };

    // Calculate percentage if score provided
    if (form.score && gradeItem.max_score) {
      gradeData.percentage = ((form.score / gradeItem.max_score) * 100).toFixed(1);
    }

    saveMutation.mutate(gradeData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Grade: {student.user_name || student.user_email}</DialogTitle>
          <p className="text-sm text-slate-500">{gradeItem.title}</p>
        </DialogHeader>

        {effectiveLocked && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-xs text-red-700">Grades are locked for the current reporting period. Contact a school admin to make changes.</p>
          </div>
        )}

        {policy.feedback_only_mode && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">⚠ Feedback-only mode is active. Scores will be saved but hidden from students and parents.</p>
          </div>
        )}

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold">Score</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  type="number"
                  value={form.score}
                  onChange={e => setForm({ ...form, score: e.target.value ? Number(e.target.value) : '' })}
                  placeholder="0"
                  className="flex-1"
                />
                <span className="text-sm text-slate-500">/ {gradeItem.max_score}</span>
              </div>
            </div>
            {showIBGrade && (
              <div>
                <Label className="text-sm font-semibold">{gradeScale.displayLabel} Grade</Label>
                <Input
                  type="number"
                  min={gradeScale.min}
                  max={gradeScale.max}
                  value={form.ib_grade}
                  onChange={e => setForm({ ...form, ib_grade: e.target.value ? Number(e.target.value) : '' })}
                  placeholder={`${gradeScale.min}–${gradeScale.max}`}
                  className="mt-1.5"
                />
              </div>
            )}
            {isLetterScale && (
              <div>
                <Label className="text-sm font-semibold">Grade ({gradeScale.displayLabel})</Label>
                <Select value={form.ib_grade || ''} onValueChange={v => setForm({ ...form, ib_grade: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select grade…" /></SelectTrigger>
                  <SelectContent>
                    {gradeScale.values.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {isDescriptiveScale && (
              <div>
                <Label className="text-sm font-semibold">Achievement Level</Label>
                <Select value={form.ib_grade || ''} onValueChange={v => setForm({ ...form, ib_grade: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select level…" /></SelectTrigger>
                  <SelectContent>
                    {gradeScale.values.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-semibold">Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="excused">Excused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold">Feedback</Label>
            <Textarea
              value={form.comment}
              onChange={e => setForm({ ...form, comment: e.target.value })}
              placeholder="Add feedback for the student..."
              rows={4}
              className="mt-1.5"
            />
          </div>

          {needsJustification && (
            <div>
              <Label className="text-sm font-semibold text-amber-700">Justification for locked grade edit *</Label>
              <Textarea
                value={justification}
                onChange={e => setJustification(e.target.value)}
                placeholder={`Explain reason for editing after deadline (min ${policy.justification_min_chars} characters)…`}
                rows={2}
                className="mt-1.5 border-amber-300"
              />
              {justification.trim().length < (policy.justification_min_chars || 20) && justification.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">{justification.trim().length}/{policy.justification_min_chars} characters minimum</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || effectiveLocked || (needsJustification && justification.trim().length < (policy.justification_min_chars || 20))}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Grade
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}