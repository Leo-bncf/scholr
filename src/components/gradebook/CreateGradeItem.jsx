import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import { useGradebookPolicy } from '@/hooks/useGradebookPolicy';
import * as gradebookData from '@/data/gradebook';

export default function CreateGradeItem({ classData, assignments = [], onClose, trigger }) {
  const queryClient = useQueryClient();
  const { policy } = useGradebookPolicy(classData?.school_id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'assessment',
    assignment_id: '',
    max_score: 100,
    description: '',
    visible_to_student: policy.default_visible_to_student ?? false,
    visible_to_parent: policy.default_visible_to_parent ?? false,
    grading_method: 'points',
  });

  const createMutation = useMutation({
    mutationFn: (data) => gradebookData.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-grade-items'] });
      queryClient.invalidateQueries({ queryKey: ['class-grades'] });
      setOpen(false);
      if (onClose) onClose();
      setForm({
        title: '',
        type: 'assessment',
        assignment_id: '',
        max_score: 100,
        description: '',
        visible_to_student: false,
        visible_to_parent: false,
        grading_method: 'points',
      });
    },
  });

  const handleCreate = () => {
    const gradeData = {
      ...form,
      school_id: classData.school_id,
      class_id: classData.id,
      assignment_id: form.assignment_id || null,
      status: 'draft',
    };
    createMutation.mutate(gradeData);
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> New Grade Item
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Grade Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <Label className="text-sm font-semibold">Grade Item Title *</Label>
              <Input
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Midterm Exam, Lab Report 3"
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="exam">Exam</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="homework">Homework</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="participation">Participation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Grading Method</Label>
                <Select value={form.grading_method} onValueChange={v => setForm({ ...form, grading_method: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points (0-100)</SelectItem>
                    <SelectItem value="ib_scale">IB Scale (1-7)</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Linked Assignment (Optional)</Label>
              <Select value={form.assignment_id} onValueChange={v => setForm({ ...form, assignment_id: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>None</SelectItem>
                  {assignments.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-semibold">Max Score</Label>
              <Input
                type="number"
                value={form.max_score}
                onChange={e => setForm({ ...form, max_score: Number(e.target.value) })}
                className="mt-1.5 w-32"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Optional notes about this grade item..."
                rows={3}
                className="mt-1.5"
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-semibold">Visibility</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="visible_student"
                  checked={form.visible_to_student}
                  onChange={e => setForm({ ...form, visible_to_student: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="visible_student" className="text-sm cursor-pointer">
                  Visible to students
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="visible_parent"
                  checked={form.visible_to_parent}
                  onChange={e => setForm({ ...form, visible_to_parent: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="visible_parent" className="text-sm cursor-pointer">
                  Visible to parents
                </Label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreate}
                disabled={!form.title || createMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Grade Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}