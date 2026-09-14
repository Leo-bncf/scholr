import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Pencil, Trash2, BookMarked, Lock, CalendarCheck, ChevronDown, ChevronUp } from 'lucide-react';
import * as academics from '@/data/academics';

const EMPTY_TERM = {
  name: '', start_date: '', end_date: '', is_current: false,
  grade_lock_date: '', teacher_comment_open: '', teacher_comment_close: '',
};

function TermCard({ term, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const hasReporting = term.grade_lock_date || term.teacher_comment_open || term.teacher_comment_close;

  return (
    <div className={`bg-white border rounded-lg shadow-sm overflow-hidden ${term.is_current ? 'scholr-accent-rule ring-1 scholr-accent-rule' : 'scholr-rule'}`}>
      <div className="flex items-center gap-3 p-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${term.is_current ? 'scholr-accent-sf' : 'scholr-sunk'}`}>
          <BookMarked className={`w-4 h-4 ${term.is_current ? 'text-white' : 'scholr-faint'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold scholr-ink">{term.name}</p>
            {term.is_current && <span className="text-xs font-bold scholr-accent scholr-accent-sf border scholr-accent-rule px-2 py-0.5 rounded-full">Current</span>}
            {hasReporting && (
              <span className="inline-flex items-center gap-1 text-xs scholr-muted scholr-sunk border scholr-rule px-2 py-0.5 rounded-full">
                <Lock className="w-2.5 h-2.5" /> Reporting configured
              </span>
            )}
          </div>
          <p className="text-xs scholr-muted mt-0.5">{fmt(term.start_date)} — {fmt(term.end_date)}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasReporting && (
            <Button variant="ghost" size="sm" onClick={() => setExpanded(e => !e)} className="h-7 w-7 p-0 scholr-faint hover:scholr-body">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onEdit(term)} className="h-7 w-7 p-0 scholr-faint hover:scholr-body">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(term)} className="h-7 w-7 p-0 scholr-faint hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {expanded && hasReporting && (
        <div className="px-4 pb-4 pt-1 border-t scholr-rule-soft grid grid-cols-1 sm:grid-cols-3 gap-3">
          {term.grade_lock_date && (
            <div className="bg-red-50 border border-red-200 rounded-md p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Lock className="w-3 h-3 text-red-500" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-red-600">Grade Lock</p>
              </div>
              <p className="text-xs font-semibold scholr-ink">{fmt(term.grade_lock_date)}</p>
            </div>
          )}
          {term.teacher_comment_open && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarCheck className="w-3 h-3 text-blue-500" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-600">Comments Open</p>
              </div>
              <p className="text-xs font-semibold scholr-ink">{fmt(term.teacher_comment_open)}</p>
            </div>
          )}
          {term.teacher_comment_close && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <CalendarCheck className="w-3 h-3 text-amber-500" />
                <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Comments Close</p>
              </div>
              <p className="text-xs font-semibold scholr-ink">{fmt(term.teacher_comment_close)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TermsTab({ schoolId }) {
  const qc = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_TERM);
  const [selectedYearId, setSelectedYearId] = useState(null);

  const { data: years = [], isLoading: yearsLoading } = useQuery({
    queryKey: ['academic-years', schoolId],
    queryFn: () => academics.whereAcademicYears({ school_id: schoolId }),
    enabled: !!schoolId,
    onSuccess: (data) => { if (data.length && !selectedYearId) setSelectedYearId(data.find(y => y.is_current)?.id || data[0]?.id); },
  });

  // set default selectedYearId when years load
  React.useEffect(() => {
    if (years.length && !selectedYearId) {
      setSelectedYearId(years.find(y => y.is_current)?.id || years[0]?.id);
    }
  }, [years]);

  const { data: terms = [], isLoading: termsLoading } = useQuery({
    queryKey: ['terms', schoolId, selectedYearId],
    queryFn: () => academics.whereTerms({ school_id: schoolId, academic_year_id: selectedYearId }),
    enabled: !!schoolId && !!selectedYearId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['terms', schoolId, selectedYearId] });

  const createMutation = useMutation({
    mutationFn: (d) => academics.createTerm({ ...d, school_id: schoolId, academic_year_id: selectedYearId }),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => academics.updateTerm(id, data),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => academics.removeTerm(id),
    onSuccess: invalidate,
  });

  const openCreate = () => { setForm(EMPTY_TERM); setEditing(null); setShowDialog(true); };
  const openEdit = (t) => {
    setForm({ name: t.name, start_date: t.start_date || '', end_date: t.end_date || '', is_current: t.is_current || false, grade_lock_date: t.grade_lock_date || '', teacher_comment_open: t.teacher_comment_open || '', teacher_comment_close: t.teacher_comment_close || '' });
    setEditing(t);
    setShowDialog(true);
  };
  const closeDialog = () => { setShowDialog(false); setEditing(null); };

  const handleDelete = (t) => {
    if (!window.confirm(`Delete term "${t.name}"?`)) return;
    deleteMutation.mutate(t.id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
    if (editing) updateMutation.mutate({ id: editing.id, data: clean });
    else createMutation.mutate(clean);
  };

  if (yearsLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin scholr-faint" /></div>;

  if (years.length === 0) return (
    <div className="bg-white border border-dashed scholr-rule rounded-lg p-12 text-center">
      <BookMarked className="w-10 h-10 scholr-faint mx-auto mb-3" />
      <p className="text-sm font-semibold scholr-muted">No academic years configured</p>
      <p className="text-xs scholr-faint mt-1">Create an academic year first, then come back to add terms.</p>
    </div>
  );

  const selectedYearName = years.find(y => y.id === selectedYearId)?.name || '';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold scholr-ink">Terms & Reporting Periods</h2>
          <p className="text-xs scholr-muted mt-0.5">Configure terms with grade-lock dates and teacher comment windows to enforce reporting deadlines.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedYearId || ''} onValueChange={setSelectedYearId}>
            <SelectTrigger className="w-40 h-8 text-xs bg-white"><SelectValue placeholder="Select year" /></SelectTrigger>
            <SelectContent>
              {years.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openCreate} className="scholr-accent-sf hover:scholr-accent-sf h-8 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Term
          </Button>
        </div>
      </div>

      {termsLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin scholr-faint" /></div>
      ) : terms.length === 0 ? (
        <div className="bg-white border border-dashed scholr-rule rounded-lg p-10 text-center">
          <BookMarked className="w-8 h-8 scholr-faint mx-auto mb-2" />
          <p className="text-sm scholr-muted">No terms in {selectedYearName} yet</p>
          <Button onClick={openCreate} className="mt-3 scholr-accent-sf hover:scholr-accent-sf h-8 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add First Term
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {terms.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || '')).map(t => (
            <TermCard key={t.id} term={t} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Term' : 'New Term'} — {selectedYearName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Term Name *</Label>
              <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Term 1, Fall Semester, Q1" className="mt-1" />
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

            <div className="border-t pt-4">
              <p className="text-xs font-bold uppercase tracking-wider scholr-muted mb-3 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Reporting Deadlines (optional)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs scholr-muted">Grade Lock Date</Label>
                  <Input type="date" value={form.grade_lock_date} onChange={e => setForm({ ...form, grade_lock_date: e.target.value })} className="mt-1" />
                  <p className="text-[10px] scholr-faint mt-0.5">Grades frozen after this date</p>
                </div>
                <div>
                  <Label className="text-xs scholr-muted">Comments Open</Label>
                  <Input type="date" value={form.teacher_comment_open} onChange={e => setForm({ ...form, teacher_comment_open: e.target.value })} className="mt-1" />
                  <p className="text-[10px] scholr-faint mt-0.5">Teachers can write from this date</p>
                </div>
                <div>
                  <Label className="text-xs scholr-muted">Comments Close</Label>
                  <Input type="date" value={form.teacher_comment_close} onChange={e => setForm({ ...form, teacher_comment_close: e.target.value })} className="mt-1" />
                  <p className="text-[10px] scholr-faint mt-0.5">Comment window closes</p>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_current} onChange={e => setForm({ ...form, is_current: e.target.checked })} className="rounded" />
              <span className="text-sm scholr-body">Mark as current term</span>
            </label>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 scholr-accent-sf hover:scholr-accent-sf">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editing ? 'Save Changes' : 'Create Term'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}