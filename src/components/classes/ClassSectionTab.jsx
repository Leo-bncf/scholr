import { Group, Row } from '@/components/app/AppShell';
import { SearchField } from '@/components/app/Field';
import DataTable from '@/components/app/DataTable';
import StatusChip from '@/components/app/StatusChip';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Loader2, Pencil,
  ChevronRight
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
            <Label className="text-xs font-semibold scholr-muted">Class Name *</Label>
            <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics HL – Group A" className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold scholr-muted">Section Code</Label>
              <Input value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} placeholder="A, B, 1…" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold scholr-muted">Room</Label>
              <Input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="101, Lab 3…" className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold scholr-muted">Subject</Label>
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
              <Label className="text-xs font-semibold scholr-muted">Academic Year</Label>
              <Select value={form.academic_year_id || '__none'} onValueChange={v => setForm({ ...form, academic_year_id: v === '__none' ? '' : v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Any year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Any year</SelectItem>
                  {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold scholr-muted">Cohort</Label>
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
              <Label className="text-xs font-semibold scholr-muted">Capacity (optional)</Label>
              <Input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="e.g. 30" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold scholr-muted">Schedule</Label>
              <Input value={form.schedule_info} onChange={e => setForm({ ...form, schedule_info: e.target.value })} placeholder="Mon/Wed 09:00–10:30" className="mt-1" />
            </div>
          </div>

          <div className="app-group">
            <Row
              label="Lock the roster"
              detail="Stops anyone editing enrolment by hand, for when the timetable sync owns it."
            >
              <Switch
                checked={form.roster_locked}
                onCheckedChange={v => setForm({ ...form, roster_locked: v })}
                aria-label="Lock the roster"
              />
            </Row>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending} className="flex-1 pub-btn pub-btn-primary">
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
      {/* The counts are the filter. Three pills in three tints said the same
          thing as a status dropdown would have, twice. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexWrap: 'wrap' }}>
        {[
          { key: 'active', label: 'Active', count: activeCount },
          { key: 'archived', label: 'Archived', count: archivedCount },
          { key: 'all', label: 'All', count: classes.length },
        ].map(({ key, label, count }) => {
          const on = statusFilter === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => setStatusFilter(key)}
              className="scholr-focus"
              style={{
                display: 'inline-flex', alignItems: 'baseline', gap: '.4rem',
                padding: '.3rem .6rem', borderRadius: '6px', fontSize: '.82rem', cursor: 'pointer',
                border: `1px solid ${on ? 'var(--brand)' : 'var(--rule)'}`,
                background: on ? 'var(--brand-sf)' : 'var(--surface)',
                color: on ? 'var(--brand)' : 'var(--body)',
              }}
            >
              {label}
              <span className="scholr-num" style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>{count}</span>
            </button>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <SearchField label="Search classes" value={search} onChange={setSearch} placeholder="Name, section, room…" />
          <Button onClick={() => setCreateOpen(true)} className="pub-btn pub-btn-primary h-9 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New section
          </Button>
        </div>
      </div>

      {/* A grid of cards became a table. Twelve classes as twelve cards is a
          lot of scrolling to answer "which one is full" — a question that is
          one glance down a column. */}
      <Group title="Class sections" action={<span className="scholr-label">{filtered.length} shown</span>}>
        <DataTable
          columns={[
            {
              key: 'name',
              header: 'Class',
              render: (c) => (
                <>
                  <span style={{ display: 'block', color: 'var(--ink)' }}>{c.name}</span>
                  <span style={{ display: 'block', fontSize: '.76rem', color: 'var(--muted)' }}>
                    {[
                      c.subject_id && getSubjectName(c.subject_id),
                      c.section && `Section ${c.section}`,
                      c.academic_year_id && getYearName(c.academic_year_id),
                      c.cohort_id && getCohortName(c.cohort_id),
                    ].filter(Boolean).join(' · ') || '—'}
                  </span>
                </>
              ),
            },
            {
              key: 'where',
              header: 'Where',
              render: (c) => [c.room, c.schedule_info].filter(Boolean).join(' · ') || '—',
            },
            { key: 'staff', header: 'Staff', num: true, render: (c) => c.teacher_ids?.length || 0 },
            {
              key: 'students',
              header: 'Students',
              num: true,
              render: (c) => {
                const enrolled = c.student_ids?.length || 0;
                const full = c.capacity && enrolled >= c.capacity;
                return (
                  <span style={{ color: full ? 'var(--crit)' : undefined }}>
                    {enrolled}{c.capacity ? ` / ${c.capacity}` : ''}
                  </span>
                );
              },
            },
            {
              key: 'status',
              header: '',
              render: (c) => {
                const sc = CLASS_STATUS_CONFIG[c.status] || CLASS_STATUS_CONFIG.active;
                return (
                  <span style={{ display: 'inline-flex', gap: '.35rem', alignItems: 'center' }}>
                    {c.roster_locked && <StatusChip tone="mute">Roster locked</StatusChip>}
                    {sc.tone && <StatusChip tone={sc.tone}>{sc.label}</StatusChip>}
                  </span>
                );
              },
            },
            {
              key: 'actions',
              header: '',
              render: (c) => (
                <span style={{ display: 'inline-flex', gap: '.5rem', alignItems: 'center' }}>
                  <Button variant="ghost" size="sm" onClick={() => setEditingClass(c)} className="h-7 px-2 text-xs gap-1">
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                  {c.status === 'active' && (
                    <Link
                      to={`/ClassWorkspace?class_id=${c.id}`}
                      className="scholr-focus"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '.2rem', fontSize: '.82rem', color: 'var(--brand)', textDecoration: 'none' }}
                    >
                      Open <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </span>
              ),
            },
          ]}
          rows={filtered}
          rowKey={(c) => c.id}
          empty={
            statusFilter === 'active' && classes.length === 0
              ? 'No classes yet. Create the first one to start enrolling students.'
              : 'No class sections match this filter.'
          }
        />
      </Group>

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