import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as academics from '@/data/academics';
import * as membershipsData from '@/data/memberships';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Pencil, Trash2, UsersRound, Check } from 'lucide-react';

const COHORT_TYPES = [
  { value: 'dp1',          label: 'DP1 — Diploma Year 1',   color: '#4f46e5' },
  { value: 'dp2',          label: 'DP2 — Diploma Year 2',   color: '#7c3aed' },
  { value: 'myp',          label: 'MYP Cohort',             color: '#0891b2' },
  { value: 'advisory',     label: 'Advisory / Tutor Group', color: '#059669' },
  { value: 'hl_sl_group',  label: 'HL/SL Grouping',        color: '#d97706' },
  { value: 'intervention', label: 'Intervention Group',     color: '#dc2626' },
  { value: 'custom',       label: 'Custom Group',           color: '#64748b' },
];

const TYPE_META = Object.fromEntries(COHORT_TYPES.map(t => [t.value, t]));

const PRESET_COLORS = ['#4f46e5', '#7c3aed', '#0891b2', '#059669', '#d97706', '#dc2626', '#db2777', '#64748b'];

const EMPTY = { name: '', type: 'custom', description: '', color: '#4f46e5', academic_year_id: '' };

function CohortCard({ cohort, memberCount, onEdit, onDelete, onManageStudents }) {
  const meta = TYPE_META[cohort.type] || TYPE_META.custom;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm"
        style={{ backgroundColor: cohort.color || meta.color }}>
        {cohort.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-900 truncate">{cohort.name}</p>
          <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{meta.label}</span>
        </div>
        {cohort.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{cohort.description}</p>}
        <p className="text-xs text-slate-400 mt-0.5">{memberCount} student{memberCount !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => onManageStudents(cohort)} className="h-7 px-2 text-xs text-slate-500 hover:text-indigo-600 gap-1">
          <UsersRound className="w-3.5 h-3.5" /> Students
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEdit(cohort)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(cohort)} className="h-7 w-7 p-0 text-slate-400 hover:text-red-600">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function CohortsTab({ schoolId }) {
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [studentDialog, setStudentDialog] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: cohorts = [], isLoading: cohortsLoading } = useQuery({
    queryKey: ['cohorts', schoolId],
    queryFn: () => academics.listCohorts(schoolId, { status: null }),
    enabled: !!schoolId,
  });

  const { data: years = [] } = useQuery({
    queryKey: ['academic-years', schoolId],
    queryFn: () => academics.listAcademicYears(schoolId),
    enabled: !!schoolId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['school-students', schoolId],
    queryFn: () => membershipsData.listStudents(schoolId),
    enabled: !!schoolId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['cohorts', schoolId] });

  const createMutation = useMutation({
    mutationFn: (d) => academics.createCohort({ ...d, school_id: schoolId, student_ids: [] }),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => academics.updateCohort(id, data),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => academics.removeCohort(id),
    onSuccess: invalidate,
  });

  const toggleStudentMutation = useMutation({
    mutationFn: ({ cohort, userId }) => {
      const current = cohort.student_ids || [];
      const updated = current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId];
      return academics.updateCohort(cohort.id, { student_ids: updated });
    },
    onSuccess: () => {
      invalidate();
      const updated = qc.getQueryData(['cohorts', schoolId]);
      if (updated && studentDialog) {
        const refreshed = updated.find(c => c.id === studentDialog.id);
        if (refreshed) setStudentDialog(refreshed);
      }
    },
  });

  // Refresh student dialog after toggle
  React.useEffect(() => {
    if (studentDialog) {
      const fresh = cohorts.find(c => c.id === studentDialog.id);
      if (fresh) setStudentDialog(fresh);
    }
  }, [cohorts]);

  const openCreate = () => {
    const defaultYear = years.find(y => y.is_current)?.id || years[0]?.id || '';
    setForm({ ...EMPTY, academic_year_id: defaultYear });
    setEditing(null);
    setShowDialog(true);
  };
  const openEdit = (c) => {
    setForm({ name: c.name, type: c.type, description: c.description || '', color: c.color || '#4f46e5', academic_year_id: c.academic_year_id || '' });
    setEditing(c);
    setShowDialog(true);
  };
  const closeDialog = () => { setShowDialog(false); setEditing(null); };

  const handleDelete = (c) => {
    if (!window.confirm(`Delete cohort "${c.name}"?`)) return;
    deleteMutation.mutate(c.id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const filtered = typeFilter === 'all' ? cohorts : cohorts.filter(c => c.type === typeFilter);
  const grouped = COHORT_TYPES.map(t => ({ ...t, items: filtered.filter(c => c.type === t.value) })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Cohorts & Groups</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define student groupings for targeted assignments, analytics, and reporting views.</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Group
        </Button>
      </div>

      {/* Type filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setTypeFilter('all')} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${typeFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          All ({cohorts.length})
        </button>
        {COHORT_TYPES.map(t => {
          const count = cohorts.filter(c => c.type === t.value).length;
          if (count === 0) return null;
          return (
            <button key={t.value} onClick={() => setTypeFilter(t.value)} className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${typeFilter === t.value ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {t.label.split('—')[0].trim()} ({count})
            </button>
          );
        })}
      </div>

      {cohortsLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : cohorts.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-12 text-center">
          <UsersRound className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No cohorts or groups yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Create DP1/DP2 year groups, advisory groups, HL/SL sets, and more.</p>
          <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs gap-1.5"><Plus className="w-3.5 h-3.5" /> Create First Group</Button>
        </div>
      ) : grouped.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No groups of this type.</p>
      ) : (
        <div className="space-y-5">
          {grouped.map(group => (
            <div key={group.value}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{group.label}</h3>
              <div className="space-y-2">
                {group.items.map(c => (
                  <CohortCard
                    key={c.id}
                    cohort={c}
                    memberCount={(c.student_ids || []).length}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onManageStudents={setStudentDialog}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit Group' : 'New Cohort / Group'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Name *</Label>
              <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. DP1 2025-26, Group A" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Type *</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{COHORT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {years.length > 0 && (
              <div>
                <Label className="text-xs font-semibold">Academic Year</Label>
                <Select value={form.academic_year_id || 'none'} onValueChange={v => setForm({ ...form, academic_year_id: v === 'none' ? '' : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select year…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not linked</SelectItem>
                    {years.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description…" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Color</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{ backgroundColor: c, borderColor: form.color === c ? '#1e293b' : 'transparent' }} />
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editing ? 'Save Changes' : 'Create Group'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Students Dialog */}
      {studentDialog && (
        <Dialog open onOpenChange={() => setStudentDialog(null)}>
          <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Students — {studentDialog.name}</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-slate-500 mt-1">Click a student to add or remove from this group.</p>
            <div className="overflow-y-auto flex-1 mt-3 space-y-1.5">
              {students.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No students found. Add students via Users first.</p>
              ) : students.map(s => {
                const enrolled = (studentDialog.student_ids || []).includes(s.user_id);
                return (
                  <button key={s.id} onClick={() => toggleStudentMutation.mutate({ cohort: studentDialog, userId: s.user_id })}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all text-left ${enrolled ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${enrolled ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {s.user_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{s.user_name || s.user_email}</p>
                      <p className="text-xs text-slate-500 truncate">{s.grade_level || s.user_email}</p>
                    </div>
                    {enrolled && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="pt-3 border-t mt-2">
              <Button onClick={() => setStudentDialog(null)} className="w-full bg-indigo-600 hover:bg-indigo-700">Done</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}