import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, X } from 'lucide-react';
import * as gradebookData from '@/data/gradebook';

export default function CreateRubricGradeItem({ classData, onClose, trigger }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    visible_to_student: false,
    visible_to_parent: false,
  });
  const [criteria, setCriteria] = useState([
    { id: 'c1', name: '', description: '', max_score: 10 }
  ]);

  const createMutation = useMutation({
    mutationFn: (data) => gradebookData.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-grade-items'] });
      setOpen(false);
      if (onClose) onClose();
      setForm({
        title: '',
        description: '',
        visible_to_student: false,
        visible_to_parent: false,
      });
      setCriteria([{ id: 'c1', name: '', description: '', max_score: 10 }]);
    },
  });

  const addCriterion = () => {
    setCriteria([...criteria, { 
      id: `c${criteria.length + 1}`, 
      name: '', 
      description: '', 
      max_score: 10 
    }]);
  };

  const removeCriterion = (id) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter(c => c.id !== id));
    }
  };

  const updateCriterion = (id, field, value) => {
    setCriteria(criteria.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const handleCreate = () => {
    const totalMaxScore = criteria.reduce((sum, c) => sum + Number(c.max_score), 0);
    
    const gradeData = {
      school_id: classData.school_id,
      class_id: classData.id,
      title: form.title,
      description: form.description,
      grading_type: 'rubric',
      rubric_criteria: criteria,
      max_score: totalMaxScore,
      is_template: true,
      visible_to_student: form.visible_to_student,
      visible_to_parent: form.visible_to_parent,
      status: 'draft',
    };
    
    createMutation.mutate(gradeData);
  };

  const isValid = form.title && criteria.every(c => c.name && c.max_score > 0);

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
          <Plus className="w-4 h-4 mr-2" /> Rubric Grade Item
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Rubric-Based Grade Item</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              Create a grade item with multiple criteria for detailed IB-style assessment
            </p>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label className="text-sm font-semibold">Grade Item Title *</Label>
              <Input
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Internal Assessment - Criterion A-D"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description of this assessment..."
                rows={2}
                className="mt-1.5"
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm font-semibold">Assessment Criteria</Label>
                <Button onClick={addCriterion} size="sm" variant="outline">
                  <Plus className="w-3 h-3 mr-1" /> Add Criterion
                </Button>
              </div>

              <div className="space-y-4">
                {criteria.map((criterion, idx) => (
                  <div key={criterion.id} className="bg-slate-50 rounded-lg p-4 relative">
                    <div className="absolute top-3 right-3">
                      {criteria.length > 1 && (
                        <button
                          onClick={() => removeCriterion(criterion.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="pr-8">
                        <Label className="text-xs font-semibold text-slate-600">
                          Criterion {String.fromCharCode(65 + idx)} Name *
                        </Label>
                        <Input
                          value={criterion.name}
                          onChange={e => updateCriterion(criterion.id, 'name', e.target.value)}
                          placeholder="e.g. Research & Analysis"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-slate-600">Description</Label>
                        <Textarea
                          value={criterion.description}
                          onChange={e => updateCriterion(criterion.id, 'description', e.target.value)}
                          placeholder="What does this criterion assess?"
                          rows={2}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-slate-600">Max Score *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={criterion.max_score}
                          onChange={e => updateCriterion(criterion.id, 'max_score', Number(e.target.value))}
                          className="mt-1 w-24"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-indigo-900">
                  Total Max Score: {criteria.reduce((sum, c) => sum + Number(c.max_score), 0)} points
                </p>
              </div>
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
                disabled={!isValid || createMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Rubric Grade Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}