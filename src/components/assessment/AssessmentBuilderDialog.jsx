import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import QuestionBuilder from './QuestionBuilder';

const createQuestion = () => ({ id: crypto.randomUUID(), type: 'multiple_choice', prompt: '', options: ['', ''], correct_answer: '', points: 1 });

export default function AssessmentBuilderDialog({ open, onOpenChange, classData, userId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', description: '', type: 'quiz', duration_minutes: 30, status: 'draft', questions: [createQuestion()] });

  const maxScore = useMemo(() => form.questions.reduce((sum, item) => sum + (Number(item.points) || 0), 0), [form.questions]);

  const createMutation = useMutation({
    mutationFn: async (status) => {
      const assignment = await base44.entities.Assignment.create({
        school_id: classData.school_id,
        class_id: classData.id,
        teacher_id: userId,
        title: form.title,
        description: form.description,
        type: form.type,
        due_date: new Date().toISOString(),
        max_score: maxScore,
        status,
        publish_date: status === 'published' ? new Date().toISOString() : null,
        primary_submission_format: 'file_upload',
      });

      await base44.entities.Assessment.create({
        school_id: classData.school_id,
        class_id: classData.id,
        assignment_id: assignment.id,
        title: form.title,
        description: form.description,
        type: form.type,
        duration_minutes: Number(form.duration_minutes) || 30,
        status,
        max_score: maxScore,
        questions: form.questions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['class-grade-items'] });
      onOpenChange(false);
      setForm({ title: '', description: '', type: 'quiz', duration_minutes: 30, status: 'draft', questions: [createQuestion()] });
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Assessment</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Timer (minutes)</Label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) || 0 })} className="mt-1" />
              <p className="text-xs text-slate-500 mt-2">Total score: {maxScore}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Questions</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setForm({ ...form, questions: [...form.questions, createQuestion()] })}>
                <Plus className="w-4 h-4 mr-1" /> Add question
              </Button>
            </div>
            {form.questions.map((question, index) => (
              <QuestionBuilder
                key={question.id}
                question={question}
                onChange={(updated) => setForm({ ...form, questions: form.questions.map((item, i) => i === index ? updated : item) })}
                onDelete={() => setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) })}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => createMutation.mutate('draft')}>Save draft</Button>
            <Button className="flex-1" onClick={() => createMutation.mutate('published')} disabled={!form.title || !form.questions.length}>Publish assessment</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}