import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Upload, X, FileText } from 'lucide-react';
import SubmissionFormatSelector from './SubmissionFormatSelector';
import AssessmentBuilderDialog from '@/components/assessment/AssessmentBuilderDialog';
import { useSubmissionPolicy } from '@/hooks/useSubmissionPolicy';

export default function CreateAssignment({ classData, userId, onClose, trigger }) {
  const queryClient = useQueryClient();
  const { policy } = useSubmissionPolicy(classData?.school_id);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'homework',
    due_date: '',
    due_time: '',
    max_score: 100,
    allow_late: policy.late_submission_default !== 'blocked',
    status: 'draft',
    primary_submission_format: policy.default_primary_format || null,
    allow_alternative_formats: false,
    alternative_formats: [],
    curriculum_topic_ids: [],
  });
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [assessmentOpen, setAssessmentOpen] = useState(false);

  const { data: curriculumTopics = [] } = useQuery({
    queryKey: ['assignment-curriculum-topics', classData.school_id],
    queryFn: () => base44.entities.CurriculumTopic.filter({ school_id: classData.school_id, status: 'active' }),
    enabled: !!classData?.school_id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assignment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-assignments'] });
      setOpen(false);
      if (onClose) onClose();
      setForm({
        title: '',
        description: '',
        type: 'homework',
        due_date: '',
        due_time: '',
        max_score: 100,
        allow_late: true,
        status: 'draft',
        primary_submission_format: null,
        allow_alternative_formats: false,
        alternative_formats: [],
        curriculum_topic_ids: [],
      });
      setAttachments([]);
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachments([...attachments, { name: file.name, url: file_url }]);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handleCreate = (status) => {
    const dueDateTime = form.due_date && form.due_time 
      ? `${form.due_date}T${form.due_time}:00`
      : form.due_date;

    createMutation.mutate({
      ...form,
      due_date: dueDateTime,
      school_id: classData.school_id,
      class_id: classData.id,
      teacher_id: userId,
      status,
      attachments: attachments.map(a => a.url),
      publish_date: status === 'published' ? new Date().toISOString() : null,
    });
  };

  return (
    <>
      <div className="flex gap-3">
        {trigger ? (
          <div onClick={() => setOpen(true)}>{trigger}</div>
        ) : (
          <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Create Assignment
          </Button>
        )}
        <Button variant="outline" onClick={() => setAssessmentOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Assessment
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <Label className="text-sm font-semibold">Assignment Title *</Label>
              <Input
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Chapter 5 Problem Set"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Type</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homework">Homework</SelectItem>
                  <SelectItem value="essay">Essay</SelectItem>
                  <SelectItem value="lab_report">Lab Report</SelectItem>
                  <SelectItem value="presentation">Presentation</SelectItem>
                  <SelectItem value="exam">Exam</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-semibold">Instructions</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Provide clear instructions for students..."
                rows={6}
                className="mt-1.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Due Date *</Label>
                <Input
                  type="date"
                  required
                  value={form.due_date}
                  onChange={e => setForm({ ...form, due_date: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Due Time</Label>
                <Input
                  type="time"
                  value={form.due_time}
                  onChange={e => setForm({ ...form, due_time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Points</Label>
              <Input
                type="number"
                value={form.max_score}
                onChange={e => setForm({ ...form, max_score: Number(e.target.value) })}
                className="mt-1.5 w-32"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">Curriculum Topics</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-3 bg-slate-50">
                {curriculumTopics.length === 0 ? (
                  <p className="text-sm text-slate-500">No curriculum topics yet.</p>
                ) : (
                  curriculumTopics.map((topic) => (
                    <label key={topic.id} className="flex items-center gap-3 text-sm text-slate-700">
                      <Checkbox
                        checked={form.curriculum_topic_ids.includes(topic.id)}
                        onCheckedChange={(checked) => setForm({
                          ...form,
                          curriculum_topic_ids: checked
                            ? [...form.curriculum_topic_ids, topic.id]
                            : form.curriculum_topic_ids.filter((id) => id !== topic.id)
                        })}
                      />
                      <span>{topic.title}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <h3 className="text-base font-semibold text-slate-900 mb-4">Submission Settings</h3>
              <SubmissionFormatSelector
                primaryFormat={form.primary_submission_format}
                allowAlternatives={form.allow_alternative_formats}
                alternativeFormats={form.alternative_formats}
                onChange={(settings) => setForm({ 
                  ...form, 
                  primary_submission_format: settings.primaryFormat,
                  allow_alternative_formats: settings.allowAlternatives,
                  alternative_formats: settings.alternativeFormats,
                })}
              />
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">Attachments</Label>
              <div className="space-y-2">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm flex-1 truncate">{att.name}</span>
                    <button onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                      <X className="w-4 h-4 text-slate-400 hover:text-red-600" />
                    </button>
                  </div>
                ))}
                <label className="flex items-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">
                    {uploading ? 'Uploading...' : 'Add file'}
                  </span>
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t">
              {policy.allow_teacher_late_override !== false ? (
                <>
                  <input
                    type="checkbox"
                    id="allow_late"
                    checked={form.allow_late}
                    onChange={e => setForm({ ...form, allow_late: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="allow_late" className="text-sm cursor-pointer">Allow late submissions</Label>
                  {policy.late_submission_default === 'penalised' && form.allow_late && (
                    <span className="text-xs text-amber-600 ml-2">({policy.late_penalty_percent}% penalty applies)</span>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Late submissions: <strong>{policy.late_submission_default}</strong></span>
                  <span className="text-slate-400">(school policy — override not permitted)</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleCreate('draft')}
                disabled={!form.title || !form.due_date || createMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save as Draft
              </Button>
              <Button
                onClick={() => handleCreate('published')}
                disabled={!form.title || !form.due_date || createMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Publish Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AssessmentBuilderDialog open={assessmentOpen} onOpenChange={setAssessmentOpen} classData={classData} userId={userId} />
    </>
  );
}