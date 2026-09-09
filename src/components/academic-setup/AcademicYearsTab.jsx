import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Loader2, Pencil, Trash2, Circle, CalendarDays, Star } from 'lucide-react';
import * as academics from '@/data/academics';

const EMPTY = { name: '', start_date: '', end_date: '', is_current: false, status: 'planning' };

function YearCard({ year, onEdit, onDelete, onSetCurrent, isSettingCurrent }) {
  const statusColors = {
    active:   'bg-emerald-50 border-emerald-200 text-emerald-700',
    archived: 'bg-slate-100 border-slate-200 text-slate-500',
    planning: 'bg-blue-50 border-blue-200 text-blue-700',
  };
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm flex items-center gap-4 ${year.is_current ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${year.is_current ? 'bg-indigo-600' : 'bg-slate-100'}`}>
        <CalendarDays className={`w-5 h-5 ${year.is_current ? 'text-white' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-slate-900">{year.name}</p>
          {year.is_current && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3" /> Current
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[year.status] || statusColors.planning}`}>
            {year.status}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{fmt(year.start_date)} — {fmt(year.end_date)}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {!year.is_current && (
          <Button
            variant="ghost" size="sm"
            disabled={isSettingCurrent}
            onClick={() => onSetCurrent(year)}
            className="h-7 px-2 text-xs text-slate-500 hover:text-indigo-600"
            title="Set as current year"
          >
            <Circle className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onEdit(year)} className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(year)} className="h-7 w-7 p-0 text-slate-400 hover:text-red-600">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function AcademicYearsTab({ schoolId }) {
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: years = [], isLoading } = useQuery({
    queryKey: ['academic-years', schoolId],
    queryFn: () => academics.whereAcademicYears({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['academic-years', schoolId] });

  const createMutation = useMutation({
    mutationFn: (d) => academics.createAcademicYear({ ...d, school_id: schoolId }),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => academics.updateAcademicYear(id, data),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => academics.removeAcademicYear(id),
    onSuccess: invalidate,
  });

  const setCurrentMutation = useMutation({
    mutationFn: async (year) => {
      await Promise.all(
        years.filter(y => y.is_current && y.id !== year.id)
          .map(y => academics.updateAcademicYear(y.id, { is_current: false, status: y.status === 'active' ? 'archived' : y.status }))
      );
      await academics.updateAcademicYear(year.id, { is_current: true, status: 'active' });
    },
    onSuccess: invalidate,
  });

  const openCreate = () => { setForm(EMPTY); setEditing(null); setShowDialog(true); };
  const openEdit = (y) => { setForm({ name: y.name, start_date: y.start_date || '', end_date: y.end_date || '', is_current: y.is_current || false, status: y.status || 'planning' }); setEditing(y); setShowDialog(true); };
  const closeDialog = () => { setShowDialog(false); setEditing(null); };

  const handleDelete = (y) => {
    if (!window.confirm(`Delete academic year "${y.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(y.id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing.id, data: form });
    else createMutation.mutate(form);
  };

  const sorted = [...years].sort((a, b) => (b.is_current ? 1 : 0) - (a.is_current ? 1 : 0));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Academic Years</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define the school's academic calendar. Mark one year as "Current" to drive term and reporting logic.</p>
        </div>
        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Year
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : years.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-12 text-center">
          <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No academic years yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Create your first academic year to start configuring terms and reporting cycles.</p>
          <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Create First Year
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(y => (
            <YearCard
              key={y.id}
              year={y}
              onEdit={openEdit}
              onDelete={handleDelete}
              onSetCurrent={(y) => setCurrentMutation.mutate(y)}
              isSettingCurrent={setCurrentMutation.isPending}
            />
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Academic Year' : 'New Academic Year'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Name *</Label>
              <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. 2025-2026" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Start Date *</Label>
                <Input required type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">End Date *</Label>
                <Input required type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Status</Label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_current} onChange={e => setForm({ ...form, is_current: e.target.checked })} className="rounded" />
              <span className="text-sm text-slate-700">Set as current academic year</span>
            </label>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editing ? 'Save Changes' : 'Create Year'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}