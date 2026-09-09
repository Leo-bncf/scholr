import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';


import { Loader2, Plus, Grid3x3, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import RubricBuilder from './RubricBuilder';
import * as gradebookData from '@/data/gradebook';

/**
 * Teacher workflow for creating and managing grade items
 * Supports both simple and rubric-based grading
 */
export default function TeacherGradeItemWorkflow({
  open,
  onClose,
  schoolId,
  classId,
  className,
  gradeItemType = 'simple', // 'simple' or 'rubric'
  existingGradeItem = null
}) {
  const queryClient = useQueryClient();
  const [gradeType, setGradeType] = useState(gradeItemType);
  const [title, setTitle] = useState(existingGradeItem?.title || '');
  const [maxScore, setMaxScore] = useState(existingGradeItem?.max_score || 100);
  const [comment, setComment] = useState(existingGradeItem?.comment || '');
  const [visibleToStudent, setVisibleToStudent] = useState(existingGradeItem?.visible_to_student ?? true);
  const [visibleToParent, setVisibleToParent] = useState(existingGradeItem?.visible_to_parent ?? true);
  const [rubricBuilderOpen, setRubricBuilderOpen] = useState(false);
  const [rubric, setRubric] = useState(existingGradeItem?.rubric_criteria ? {
    criteria: existingGradeItem.rubric_criteria,
    max_score: existingGradeItem.max_score
  } : null);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (existingGradeItem) {
        return gradebookData.update(existingGradeItem.id, data);
      }
      return gradebookData.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-grades', classId] });
      onClose();
    }
  });

  const handleSaveRubric = (rubricData) => {
    setRubric(rubricData);
    setMaxScore(rubricData.max_score);
    setRubricBuilderOpen(false);
  };

  const handleSave = () => {
    const data = {
      school_id: schoolId,
      class_id: classId,
      title,
      max_score: parseInt(maxScore),
      comment,
      visible_to_student: visibleToStudent,
      visible_to_parent: visibleToParent,
      grading_type: gradeType,
      status: 'draft'
    };

    if (gradeType === 'rubric' && rubric) {
      data.rubric_criteria = rubric.criteria;
      data.is_template = true; // This is a template for rubric grading
    }

    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingGradeItem ? 'Edit' : 'Create'} Grade Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800 ml-3 text-sm">
              <p className="font-semibold">IB-Aligned Grading</p>
              <p className="mt-1">Choose between simple point-based grading or detailed rubric-based assessment.</p>
            </AlertDescription>
          </Alert>

          {/* Grade Item Type */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Grading Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGradeType('simple')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  gradeType === 'simple'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-semibold text-sm text-slate-900">Simple Score</p>
                <p className="text-xs text-slate-600 mt-1">Single point-based grade</p>
              </button>
              <button
                onClick={() => setGradeType('rubric')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  gradeType === 'rubric'
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Grid3x3 className="w-4 h-4 mb-2" />
                <p className="font-semibold text-sm text-slate-900">Rubric-Based</p>
                <p className="text-xs text-slate-600 mt-1">Multiple criteria with feedback</p>
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold">Title</Label>
              <Input
                placeholder="e.g., Essay Assessment, Lab Report"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Max Score / Points</Label>
              <Input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Teacher Comment / Instructions</Label>
              <Textarea
                placeholder="Notes visible to students when grades are published"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
          </div>

          {/* Rubric Setup */}
          {gradeType === 'rubric' && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Rubric Criteria</Label>
              {rubric ? (
                <div className="border rounded-lg p-4 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-900 mb-3">
                    {rubric.criteria.length} Criteria Created
                  </p>
                  <div className="space-y-2">
                    {rubric.criteria.map(c => (
                      <div key={c.id} className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {c.max_score} pts
                        </Badge>
                        <span className="text-sm text-slate-700">{c.name}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRubricBuilderOpen(true)}
                    className="mt-3 w-full"
                  >
                    Edit Rubric
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setRubricBuilderOpen(true)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Rubric
                </Button>
              )}
            </div>
          )}

          {/* Visibility */}
          <div className="space-y-3 border-t pt-4">
            <Label className="text-sm font-semibold">Visibility</Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleToStudent}
                  onChange={(e) => setVisibleToStudent(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">Visible to Student</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleToParent}
                  onChange={(e) => setVisibleToParent(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">Visible to Parent</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!title || mutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {existingGradeItem ? 'Update' : 'Create'} Grade Item
          </Button>
        </DialogFooter>
      </DialogContent>

      <RubricBuilder
        open={rubricBuilderOpen}
        onClose={() => setRubricBuilderOpen(false)}
        onSave={handleSaveRubric}
        initialRubric={rubric}
      />
    </Dialog>
  );
}