import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Loader2, Search, BookOpen, Pencil,
  ChevronRight, Hash, Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CLASS_STATUS_CONFIG } from './classConstants';
import * as classesData from '@/data/classes';

const EMPTY_FORM = {
  name: '', section: '', room: '', subject_id: '', schedule_info: '',
  academic_year_id: '', cohort_id: '', capacity: '', roster_locked: false,
};

function ClassFormDialog({ open, onClose, initialData, schoolId, subjects, academicYears, cohorts }) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData;
  const [form, setForm] = useState(initialData
    ? {
        name: initialData.name || '',
        section: initialData.section || '',
        room: initialData.room || '',
        subject_id: initialData.subject_id || '',
        schedule_info: initialData.schedule_info || '',
        academic_year_id: initialData.academic_year_id || '',
        cohort_id: initialData.cohort_id || '',
        capacity: initialData.capacity?.toString() || '',
        roster_locked: initialData.roster_locked || false,
      }
    : EMPTY_FORM);

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        school_id: schoolId,
        status: initialData?.status || 'active',
        capacity: data.capacity ? parseInt(data.capacity) : null,
      };
      if (!payload.subject_id) delete payload.subject_id;
      if (!payload.academic_year_id) delete payload.academic_year_id;
      if (!payload.cohort_id) delete payload.cohort_id;
      if (!payload.capacity) delete payload.capacity;
      return isEdit
        ? classesData.update(initialData.id, payload)
        : classesData.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-classes', schoolId] });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{isEdit ? 'Edit Class Section' : 'Create Class Section'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); mutation.mutate(form); }} className="space-y-4 pt-1">
          <div>
            <Label className="text-xs font-semibold text-slate-600">Class Name *</Label>
            <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics HL – Group A" className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600">Section Code</Label>
              <Input value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="A, B, 1…" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">Room</Label>
              <Input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="101, Lab 3…" className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-slate-600">Subject</Label>
            <Select value={form.subject_id || '__none'} onValueChange={v => setForm({ ...form, subject_id: v === '__none' ? '' : v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="No subject" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No subject</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}{s.level && s.level !== 'na' ? ` (${s.level})` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600">Academic Year</Label>
              <Select value={form.academic_year_id || '__none'} onValueChange={v => setForm({ ...form, academic_year_id: v === '__none' ? '' : v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Any year</SelectItem>
                  {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">Cohort</Label>
              <Select value={form.cohort_id || '__none'} onValueChange={v => setForm({ ...form, cohort_id: v === '__none' ? '' : v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any cohort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Any cohort</SelectItem>
                  {cohorts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600">Capacity (optional)</Label>
              <Input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 30" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold text-slate-600">Schedule</Label>
              <Input value={form.schedule_info} onChange={e => setForm({ ...form, schedule_info: e.target.value })} placeholder="Mon/Wed 09:00–10:30" className="mt-1" />
            </div>
          </div>

          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-3 py-3">
            <div>
              <p className="text-xs font-semibold text-amber-800">Roster Lock</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Prevent manual edits when timetable sync is the source of truth</p>
            </div>
            <Switch checked={form.roster_locked} onCheckedChange={v => setForm({ ...form, roster_locked: v })} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
              {isEdit ? 'Save Changes' : 'Create Class'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ClassSectionTab({ schoolId, classes, subjects, academicYears, cohorts }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => classesData.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school-classes', schoolId] }),
  });

  const filtered = classes.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name?.toLowerCase().includes(q) || c.section?.toLowerCase().includes(q) || c.room?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const activeCount   = classes.filter(c => c.status === 'active').length;
  const archivedCount = classes.filter(c => c.status === 'archived').length;

  const getSubjectName = (id) => subjects.find(s => s.id === id)?.name || null;
  const getYearName    = (id) => academicYears.find(y => y.id === id)?.name || null;
  const getCohortName  = (id) => cohorts.find(c => c.id === id)?.name || null;

  return (
    <div className="space-y-4">
      {/* Summary pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'active',   label: 'Active',   count: activeCount,   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { key: 'archived', label: 'Archived', count: archivedCount, color: 'bg-slate-100 text-slate-500 border-slate-200' },
          { key: 'all',      label: 'All',      count: classes.length, color: 'bg-white text-slate-600 border-slate-200' },
        ].map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${color} ${statusFilter === key ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
          >
            {label} <span className="font-bold">{count}</span>
          </button>
        ))}

        <div className="ml-auto">
          <Button onClick={() => setCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Class Section
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search by name, section, room…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white h-9" />
      </div>

      {/* Class grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">No class sections found</p>
          {statusFilter === 'active' && (
            <Button onClick={() => setCreateOpen(true)} className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Create First Class
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => {
            const sc = CLASS_STATUS_CONFIG[c.status] || CLASS_STATUS_CONFIG.active;
            const subjectName = c.subject_id ? getSubjectName(c.subject_id) : null;
            const yearName    = c.academic_year_id ? getYearName(c.academic_year_id) : null;
            const cohortName  = c.cohort_id ? getCohortName(c.cohort_id) : null;
            const enrolled    = c.student_ids?.length || 0;
            const capacity    = c.capacity;
            const isFull      = capacity && enrolled >= capacity;

            return (
              <div key={c.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md ${c.status === 'archived' ? 'opacity-60' : ''} border-slate-200`}>
                <div className="px-5 pt-4 pb-3 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug flex-1">{c.name}</h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {c.roster_locked && <Lock className="w-3.5 h-3.5 text-amber-500" title="Roster locked" />}
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${sc.classes}`}>{sc.label}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {subjectName && (
                      <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full">{subjectName}</span>
                    )}
                    {c.section && (
                      <span className="text-[11px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1"><Hash className="w-2.5 h-2.5" />{c.section}</span>
                    )}
                    {yearName && (
                      <span className="text-[11px] bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full">{yearName}</span>
                    )}
                    {cohortName && (
                      <span className="text-[11px] bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full">{cohortName}</span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 rounded-lg py-2">
                      <p className="text-sm font-bold text-slate-900">{c.teacher_ids?.length || 0}</p>
                      <p className="text-[10px] text-slate-400">Staff</p>
                    </div>
                    <div className={`rounded-lg py-2 ${isFull ? 'bg-red-50' : 'bg-slate-50'}`}>
                      <p className={`text-sm font-bold ${isFull ? 'text-red-600' : 'text-slate-900'}`}>{enrolled}{capacity ? `/${capacity}` : ''}</p>
                      <p className="text-[10px] text-slate-400">Students</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg py-2">
                      <p className="text-sm font-bold text-slate-900">{c.subject_teacher_assignments?.length || 0}</p>
                      <p className="text-[10px] text-slate-400">Subjects</p>
                    </div>
                  </div>

                  {c.room && (
                    <p className="text-[11px] text-slate-400 mt-2">📍 {c.room}{c.schedule_info ? ` · ${c.schedule_info}` : ''}</p>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-1">
                     <Button variant="ghost" size="sm" onClick={() => setEditingClass(c)} className="h-7 px-2 text-xs text-slate-500 hover:text-slate-800 gap-1">
                       <Pencil className="w-3 h-3" /> Edit
                     </Button>
                   </div>
                  {c.status === 'active' && (
                    <Link
                      to={`/ClassWorkspace?class_id=${c.id}`}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ClassFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        schoolId={schoolId}
        subjects={subjects}
        academicYears={academicYears}
        cohorts={cohorts}
      />

      {editingClass && (
        <ClassFormDialog
          open
          onClose={() => setEditingClass(null)}
          initialData={editingClass}
          schoolId={schoolId}
          subjects={subjects}
          academicYears={academicYears}
          cohorts={cohorts}
        />
      )}
    </div>
  );
}