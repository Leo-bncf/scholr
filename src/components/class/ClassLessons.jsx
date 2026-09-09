import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as storage from '@/data/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, CalendarDays, Clock, CheckCircle2, Circle, Link2, FileText, X, Upload, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import * as lessonPlansData from '@/data/lessonPlans';

function LessonFormDialog({ open, onClose, classData, userId, lesson = null }) {
  const queryClient = useQueryClient();
  const isEdit = !!lesson;

  const [form, setForm] = useState({
    title: lesson?.title || '',
    date: lesson?.date || '',
    duration_minutes: lesson?.duration_minutes || 60,
    objectives: lesson?.objectives || '',
    notes: lesson?.notes || '',
    topics: lesson?.topics || [],
    resources: lesson?.resources || [],
    status: lesson?.status || 'planned',
  });
  const [topicInput, setTopicInput] = useState('');
  const [resourceForm, setResourceForm] = useState({ name: '', url: '', type: 'link' });
  const [uploading, setUploading] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? lessonPlansData.update(lesson.id, data)
      : lessonPlansData.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-lessons', classData.id] });
      onClose();
    },
  });

  const addTopic = () => {
    if (topicInput.trim()) {
      setForm({ ...form, topics: [...form.topics, topicInput.trim()] });
      setTopicInput('');
    }
  };

  const removeTopic = (i) => setForm({ ...form, topics: form.topics.filter((_, idx) => idx !== i) });

  const addResource = () => {
    if (resourceForm.name && resourceForm.url) {
      setForm({
        ...form,
        resources: [...form.resources, { ...resourceForm, id: `res-${Date.now()}` }],
      });
      setResourceForm({ name: '', url: '', type: 'link' });
    }
  };

  const removeResource = (id) => setForm({ ...form, resources: form.resources.filter(r => r.id !== id) });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const uploaded = await storage.upload(file, { schoolId: classData?.school_id, prefix: 'lessons' });
      const file_url = uploaded.url;
    setForm({
      ...form,
      resources: [...form.resources, { id: `res-${Date.now()}`, name: file.name, type: 'file', url: file_url }],
    });
    setUploading(false);
  };

  const handleSave = () => {
    mutation.mutate({
      ...form,
      school_id: classData.school_id,
      class_id: classData.id,
      teacher_id: userId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Lesson' : 'Plan New Lesson'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div>
            <Label className="text-sm font-semibold">Lesson Title *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Introduction to Photosynthesis" className="mt-1.5" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold">Date *</Label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Duration (minutes)</Label>
              <Input type="number" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: Number(e.target.value) })} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">Learning Objectives</Label>
            <Textarea value={form.objectives} onChange={e => setForm({ ...form, objectives: e.target.value })}
              placeholder="What will students learn in this lesson?" rows={3} className="mt-1.5" />
          </div>

          <div>
            <Label className="text-sm font-semibold">Topics Covered</Label>
            <div className="flex gap-2 mt-1.5">
              <Input value={topicInput} onChange={e => setTopicInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTopic())}
                placeholder="Type a topic and press Enter" />
              <Button type="button" variant="outline" onClick={addTopic}>Add</Button>
            </div>
            {form.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.topics.map((t, i) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1 pr-1">
                    {t}
                    <button onClick={() => removeTopic(i)} className="ml-1 hover:text-red-600"><X className="w-3 h-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-semibold">Resources</Label>
            <div className="space-y-2 mt-1.5">
              {form.resources.map(r => (
                <div key={r.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  {r.type === 'file' ? <FileText className="w-4 h-4 text-slate-400" /> : <Link2 className="w-4 h-4 text-slate-400" />}
                  <span className="text-sm flex-1 truncate">{r.name}</span>
                  <a href={r.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4 text-slate-400 hover:text-indigo-600" /></a>
                  <button onClick={() => removeResource(r.id)}><X className="w-4 h-4 text-slate-400 hover:text-red-600" /></button>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-2">
                <Input value={resourceForm.name} onChange={e => setResourceForm({ ...resourceForm, name: e.target.value })}
                  placeholder="Resource name" />
                <Input value={resourceForm.url} onChange={e => setResourceForm({ ...resourceForm, url: e.target.value })}
                  placeholder="URL (https://...)" />
                <Button type="button" variant="outline" onClick={addResource}>Add Link</Button>
              </div>
              <label className="flex items-center gap-2 p-2.5 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-300 cursor-pointer text-sm text-slate-500">
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload file'}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">Teacher Notes</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Private notes, reminders, preparation checklist..." rows={3} className="mt-1.5" />
          </div>

          <div className="flex items-center gap-3 pt-2 border-t">
            <Label className="text-sm font-semibold">Mark as</Label>
            <div className="flex gap-2">
              {['planned', 'completed'].map(s => (
                <button key={s} onClick={() => setForm({ ...form, status: s })}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${form.status === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title || !form.date || mutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {isEdit ? 'Save Changes' : 'Save Lesson'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ClassLessons({ classData, isTeacher, userId }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['class-lessons', classData.id],
    queryFn: () => lessonPlansData.where({ class_id: classData.id, school_id: classData.school_id }, { order: 'date', ascending: true }),
  });

  const toggleStatus = useMutation({
    mutationFn: (lesson) => lessonPlansData.update(lesson.id, {
      status: lesson.status === 'completed' ? 'planned' : 'completed',
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['class-lessons', classData.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => lessonPlansData.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['class-lessons', classData.id] }),
  });

  const handleEdit = (lesson) => { setEditingLesson(lesson); setDialogOpen(true); };
  const handleClose = () => { setDialogOpen(false); setEditingLesson(null); };

  const completed = lessons.filter(l => l.status === 'completed').length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Lesson Planner</h2>
          {lessons.length > 0 && (
            <p className="text-sm text-slate-500 mt-0.5">{completed} of {lessons.length} lessons completed</p>
          )}
        </div>
        {isTeacher && (
          <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Plan Lesson
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-600">No lessons planned yet</p>
          {isTeacher && <p className="text-sm mt-1">Start planning your lessons for this class</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map(lesson => (
            <div key={lesson.id} className={`bg-white rounded-xl border p-5 transition-all ${lesson.status === 'completed' ? 'border-slate-100 opacity-80' : 'border-slate-200 hover:shadow-md'}`}>
              <div className="flex items-start gap-4">
                {isTeacher && (
                  <button onClick={() => toggleStatus.mutate(lesson)} className="mt-0.5 flex-shrink-0">
                    {lesson.status === 'completed'
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      : <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-400" />}
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-slate-900 ${lesson.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                        {lesson.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {lesson.date ? format(new Date(lesson.date), 'EEE, MMM d, yyyy') : 'No date'}
                        </span>
                        {lesson.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {lesson.duration_minutes} min
                          </span>
                        )}
                      </div>
                    </div>
                    {isTeacher && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(lesson)} className="text-slate-500 hover:text-slate-900 text-xs">Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(lesson.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</Button>
                      </div>
                    )}
                  </div>

                  {lesson.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {lesson.topics.map((t, i) => (
                        <Badge key={i} variant="secondary" className="text-xs font-normal">{t}</Badge>
                      ))}
                    </div>
                  )}

                  {lesson.objectives && (
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{lesson.objectives}</p>
                  )}

                  {lesson.resources?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {lesson.resources.map(r => (
                        <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors">
                          {r.type === 'file' ? <FileText className="w-3 h-3" /> : <Link2 className="w-3 h-3" />}
                          {r.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isTeacher && (
        <LessonFormDialog
          open={dialogOpen}
          onClose={handleClose}
          classData={classData}
          userId={userId}
          lesson={editingLesson}
        />
      )}
    </div>
  );
}