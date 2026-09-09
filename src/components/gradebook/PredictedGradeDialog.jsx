import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, TrendingUp, Lock, AlertTriangle } from 'lucide-react';
import { useGradebookPolicy } from '@/hooks/useGradebookPolicy';
import { useUser } from '@/components/auth/UserContext';
import * as gradebookData from '@/data/gradebook';

export default function PredictedGradeDialog({ classData, student, existingPrediction, open, onClose }) {
  const queryClient = useQueryClient();
  const { membership } = useUser();
  const { policy, canEditPredictedGrade } = useGradebookPolicy(classData?.school_id);
  const userRole = membership?.role || 'teacher';
  const canEdit = canEditPredictedGrade(userRole);
  const [form, setForm] = useState({
    predicted_ib_grade: existingPrediction?.predicted_ib_grade || '',
    confidence_level: existingPrediction?.confidence_level || 'medium',
    rationale: existingPrediction?.rationale || '',
    visible_to_student: existingPrediction?.visible_to_student ?? false,
    visible_to_parent: existingPrediction?.visible_to_parent ?? false,
  });

  useEffect(() => {
    if (existingPrediction) {
      setForm({
        predicted_ib_grade: existingPrediction.predicted_ib_grade,
        confidence_level: existingPrediction.confidence_level || 'medium',
        rationale: existingPrediction.rationale || '',
        visible_to_student: existingPrediction.visible_to_student ?? false,
        visible_to_parent: existingPrediction.visible_to_parent ?? false,
      });
    }
  }, [existingPrediction]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      if (existingPrediction) {
        return gradebookData.updatePredicted(existingPrediction.id, data);
      }
      return gradebookData.createPredicted(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['predicted-grades'] });
      onClose();
    },
  });

  const handleSave = () => {
    const data = {
      ...form,
      school_id: classData.school_id,
      student_id: student.user_id,
      student_name: student.user_name || student.user_email,
      class_id: classData.id,
      class_name: classData.name,
      entry_date: new Date().toISOString().split('T')[0],
    };

    saveMutation.mutate(data);
  };

  const confidenceColors = {
    low: 'bg-amber-50 text-amber-700 border-amber-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    high: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Predicted IB Grade
            </div>
          </DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            {student.user_name || student.user_email} - {classData.name}
          </p>
        </DialogHeader>

        <div className="space-y-5">
          {!policy.predicted_grades_enabled && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-600">Predicted grades are currently disabled by school policy.</p>
            </div>
          )}
          {policy.predicted_grades_locked && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-600" />
              <p className="text-xs text-red-700">Predicted grade collection has been locked by the IB Coordinator. No further entries or edits are allowed.</p>
            </div>
          )}
          {!canEdit && policy.predicted_grades_enabled && !policy.predicted_grades_locked && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-xs text-amber-700">Your role is not permitted to enter predicted grades for this school.</p>
            </div>
          )}
          {canEdit && !policy.predicted_grades_locked && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-indigo-900 mb-2">
                Enter your predicted IB grade for this student based on current performance and trajectory.
              </p>
            </div>
          )}

          <div className={`grid grid-cols-2 gap-4 ${!canEdit || policy.predicted_grades_locked ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <Label className="text-sm font-semibold">Predicted IB Grade (1-7) *</Label>
              <Input
                type="number"
                min="1"
                max="7"
                value={form.predicted_ib_grade}
                onChange={e => setForm({ ...form, predicted_ib_grade: Number(e.target.value) })}
                placeholder="1-7"
                className="mt-1.5 text-2xl font-bold text-center"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Confidence Level</Label>
              <Select 
                value={form.confidence_level} 
                onValueChange={v => setForm({ ...form, confidence_level: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full bg-amber-500`}></span>
                      Low Confidence
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full bg-blue-500`}></span>
                      Medium Confidence
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full bg-emerald-500`}></span>
                      High Confidence
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">Rationale {policy.predicted_grades_require_rationale ? '*' : '(optional)'}</Label>
            <Textarea
              disabled={!canEdit || policy.predicted_grades_locked}
              value={form.rationale}
              onChange={e => setForm({ ...form, rationale: e.target.value })}
              placeholder="Explain the basis for this predicted grade (recent assessments, progress trajectory, work quality, etc.)"
              rows={4}
              className="mt-1.5"
            />
            <p className="text-xs text-slate-500 mt-1">
              This rationale will be visible to the IB coordinator and helps track prediction accuracy.
            </p>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <Label className="text-sm font-semibold">Visibility</Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pred_visible_student"
                checked={form.visible_to_student}
                onChange={e => setForm({ ...form, visible_to_student: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="pred_visible_student" className="text-sm cursor-pointer">
                Share with student
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pred_visible_parent"
                checked={form.visible_to_parent}
                onChange={e => setForm({ ...form, visible_to_parent: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="pred_visible_parent" className="text-sm cursor-pointer">
                Share with parent
              </Label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.predicted_ib_grade || (policy.predicted_grades_require_rationale && !form.rationale) || saveMutation.isPending || !canEdit || policy.predicted_grades_locked}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {existingPrediction ? 'Update' : 'Save'} Predicted Grade
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}