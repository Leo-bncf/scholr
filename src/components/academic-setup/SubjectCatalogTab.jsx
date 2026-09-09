import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Pencil, Trash2, Library, Search } from 'lucide-react';
import { getCurriculumConfig } from '@/lib/curriculumConfig';
import * as academics from '@/data/academics';
import * as classesData from '@/data/classes';

const IB_GROUPS = [
  { value: 'group1_language_literature',  label: 'Group 1 – Language & Literature',   short: 'G1' },
  { value: 'group2_language_acquisition', label: 'Group 2 – Language Acquisition',    short: 'G2' },
  { value: 'group3_individuals_societies',label: 'Group 3 – Individuals & Societies', short: 'G3' },
  { value: 'group4_sciences',             label: 'Group 4 – Sciences',                short: 'G4' },
  { value: 'group5_mathematics',          label: 'Group 5 – Mathematics',             short: 'G5' },
  { value: 'group6_arts',                 label: 'Group 6 – Arts',                    short: 'G6' },
  { value: 'core_tok',                    label: 'Core – Theory of Knowledge',        short: 'TOK' },
  { value: 'core_ee',                     label: 'Core – Extended Essay',             short: 'EE' },
  { value: 'core_cas',                    label: 'Core – CAS',                        short: 'CAS' },
];

const IB_GROUP_MAP = Object.fromEntries(IB_GROUPS.map(g => [g.value, g]));

const LEVEL_STYLES = {
  HL:   'bg-rose-50 text-rose-700 border-rose-200',
  SL:   'bg-blue-50 text-blue-700 border-blue-200',
  AS:   'bg-sky-50 text-sky-700 border-sky-200',
  A2:   'bg-indigo-50 text-indigo-700 border-indigo-200',
  'A Level': 'bg-violet-50 text-violet-700 border-violet-200',
  Core: 'bg-slate-50 text-slate-600 border-slate-200',
  Extended: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Standard: 'bg-blue-50 text-blue-700 border-blue-200',
  Honors: 'bg-amber-50 text-amber-700 border-amber-200',
  AP:   'bg-rose-50 text-rose-700 border-rose-200',
  core: 'bg-amber-50 text-amber-700 border-amber-200',
  na:   'bg-slate-50 text-slate-500 border-slate-200',
};

const GRADING_TYPES = [
  { value: 'ib_1_7',   label: 'IB 1–7 Scale' },
  { value: 'letter',   label: 'Letter Grade (A*–U)' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'rubric',   label: 'Rubric-based' },
  { value: 'pass_fail', label: 'Pass / Fail' },
  { value: 'descriptive', label: 'Descriptive (PYP)' },
];

const EMPTY = { name: '', code: '', level: 'na', ib_group: '', department: '', default_grading_type: '', status: 'active' };

const IB_QUICK_ADD = [
  { name: 'English A: Language & Literature', code: 'ENG_A', level: 'HL', ib_group: 'group1_language_literature' },
  { name: 'Mathematics: Analysis & Approaches', code: 'MATH_AA', level: 'HL', ib_group: 'group5_mathematics' },
  { name: 'Mathematics: Applications & Interpretation', code: 'MATH_AI', level: 'SL', ib_group: 'group5_mathematics' },
  { name: 'Physics', code: 'PHYS', level: 'HL', ib_group: 'group4_sciences' },
  { name: 'Chemistry', code: 'CHEM', level: 'HL', ib_group: 'group4_sciences' },
  { name: 'Biology', code: 'BIO', level: 'HL', ib_group: 'group4_sciences' },
  { name: 'History', code: 'HIST', level: 'HL', ib_group: 'group3_individuals_societies' },
  { name: 'Economics', code: 'ECON', level: 'HL', ib_group: 'group3_individuals_societies' },
  { name: 'Theory of Knowledge', code: 'TOK', level: 'core', ib_group: 'core_tok' },
  { name: 'Extended Essay', code: 'EE', level: 'core', ib_group: 'core_ee' },
  { name: 'CAS', code: 'CAS', level: 'core', ib_group: 'core_cas' },
];

export default function SubjectCatalogTab({ schoolId, curriculum = 'ib_dp' }) {
  const qc = useQueryClient();
  const currConfig = getCurriculumConfig(curriculum);
  const hasSubjectGroups = currConfig.features?.subjectGroups && currConfig.subjectGroups?.length > 0;
  const hasSubjectLevels = currConfig.features?.subjectLevels && currConfig.subjectLevels?.length > 0;
  const isIBDP = curriculum === 'ib_dp';
  // Build group list from curriculum config (fall back to IB groups for ib_dp)
  const currGroups = hasSubjectGroups
    ? currConfig.subjectGroups.map(v => ({ value: v, label: currConfig.subjectGroupLabels[v] || v, short: v.slice(0, 4).toUpperCase() }))
    : [];
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['school-subjects', schoolId],
    queryFn: () => academics.whereSubjects({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['school-classes-catalog', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['school-subjects', schoolId] });

  const createMutation = useMutation({
    mutationFn: (d) => academics.createSubject({ ...d, school_id: schoolId }),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => academics.updateSubject(id, data),
    onSuccess: () => { invalidate(); closeDialog(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => academics.removeSubject(id),
    onSuccess: invalidate,
  });

  const bulkAddMutation = useMutation({
    mutationFn: async (items) => {
      for (const item of items) {
        await academics.createSubject({ ...item, school_id: schoolId, status: 'active' });
      }
    },
    onSuccess: () => { invalidate(); setShowQuickAdd(false); },
  });

  const openCreate = () => { setForm(EMPTY); setEditing(null); setShowDialog(true); };
  const openEdit = (s) => {
    setForm({ name: s.name, code: s.code || '', level: s.level || 'na', ib_group: s.ib_group || '', department: s.department || '', default_grading_type: s.default_grading_type || '', status: s.status || 'active' });
    setEditing(s);
    setShowDialog(true);
  };
  const closeDialog = () => { setShowDialog(false); setEditing(null); };

  const handleDelete = (s) => {
    if (!window.confirm(`Delete subject "${s.name}"?`)) return;
    deleteMutation.mutate(s.id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
    if (editing) updateMutation.mutate({ id: editing.id, data: clean });
    else createMutation.mutate(clean);
  };

  const getClassCount = (id) => classes.filter(c => c.subject_id === id || (c.subject_teacher_assignments || []).some(a => a.subject_id === id)).length;

  const filtered = subjects.filter(s => {
    const matchSearch = (s.name || '').toLowerCase().includes(search.toLowerCase()) || (s.code || '').toLowerCase().includes(search.toLowerCase()) || (s.department || '').toLowerCase().includes(search.toLowerCase());
    const matchGroup = groupFilter === 'all' || s.ib_group === groupFilter;
    const matchLevel = levelFilter === 'all' || s.level === levelFilter;
    return matchSearch && matchGroup && matchLevel;
  });

  // Group by subject group for display (using curriculum-appropriate groups)
  const displayGroups = hasSubjectGroups ? currGroups : (isIBDP ? IB_GROUPS : []);
  const grouped = displayGroups.map(g => ({ ...g, items: filtered.filter(s => s.ib_group === g.value) })).filter(g => g.items.length > 0);
  const noGroup = filtered.filter(s => !s.ib_group || !displayGroups.some(g => g.value === s.ib_group));

  const notYetAdded = isIBDP ? IB_QUICK_ADD.filter(q => !subjects.some(s => s.code === q.code)) : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Subject Catalogue</h2>
          <p className="text-xs text-slate-500 mt-0.5">Define subjects with level variants, group classifications, departments, and default grading settings for {currConfig.shortLabel}.</p>
        </div>
        <div className="flex items-center gap-2">
          {notYetAdded.length > 0 && (
            <Button variant="outline" onClick={() => setShowQuickAdd(true)} className="h-8 text-xs gap-1.5">
              <Library className="w-3.5 h-3.5" /> Quick Add IB Subjects
            </Button>
          )}
          <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Subject
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects…" className="pl-9 bg-white h-8 text-xs w-48" />
        </div>
        {hasSubjectGroups && (
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-48 h-8 text-xs bg-white"><SelectValue placeholder="All Groups" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {currGroups.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {hasSubjectLevels && (
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-36 h-8 text-xs bg-white"><SelectValue placeholder="All Levels" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {currConfig.subjectLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              <SelectItem value="na">N/A</SelectItem>
            </SelectContent>
          </Select>
        )}
        <span className="text-xs text-slate-400">{filtered.length} of {subjects.length} subjects</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : subjects.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-12 text-center">
          <Library className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">No subjects yet</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">Add subjects individually{isIBDP ? ' or use Quick Add to import common IB subjects at once' : ''}.</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {isIBDP && <Button variant="outline" onClick={() => setShowQuickAdd(true)} className="h-8 text-xs gap-1.5"><Library className="w-3.5 h-3.5" /> Quick Add IB</Button>}
            <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs gap-1.5"><Plus className="w-3.5 h-3.5" /> Custom Subject</Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-8">No subjects match your filters.</p>
      ) : (
        <div className="space-y-5">
          {grouped.map(group => (
            <div key={group.value}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-mono">{group.short}</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{group.label}</h3>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full">
                  <tbody className="divide-y divide-slate-50">
                    {group.items.map(s => (
                      <SubjectRow key={s.id} subject={s} classCount={getClassCount(s.id)} onEdit={openEdit} onDelete={handleDelete} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {noGroup.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Uncategorised</h3>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <table className="w-full">
                  <tbody className="divide-y divide-slate-50">
                    {noGroup.map(s => (
                      <SubjectRow key={s.id} subject={s} classCount={getClassCount(s.id)} onEdit={openEdit} onDelete={handleDelete} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={(o) => { if (!o) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Edit Subject' : 'New Subject'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-semibold">Subject Name *</Label>
              <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics: Analysis & Approaches" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Code</Label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. MATH" className="mt-1 font-mono" />
              </div>
              {hasSubjectLevels && (
                <div>
                  <Label className="text-xs font-semibold">Level</Label>
                  <Select value={form.level || 'na'} onValueChange={v => setForm({ ...form, level: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currConfig.subjectLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {hasSubjectGroups && (
              <div>
                <Label className="text-xs font-semibold">Subject Group</Label>
                <Select value={form.ib_group || 'none'} onValueChange={v => setForm({ ...form, ib_group: v === 'none' ? '' : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select group…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Not applicable</SelectItem>
                    {currGroups.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Department Tag</Label>
                <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Sciences, Humanities" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Default Grading</Label>
                <Select value={form.default_grading_type || 'none'} onValueChange={v => setForm({ ...form, default_grading_type: v === 'none' ? '' : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    {GRADING_TYPES.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editing ? 'Save Changes' : 'Create Subject'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Add IB Subjects Dialog */}
      <Dialog open={showQuickAdd} onOpenChange={(o) => { if (!o) setShowQuickAdd(false); }}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Quick Add Common IB Subjects</DialogTitle></DialogHeader>
          <p className="text-xs text-slate-500 mt-1">Select subjects to add to your catalogue. Already-added subjects are greyed out.</p>
          <div className="overflow-y-auto flex-1 mt-3 space-y-1.5">
            {IB_QUICK_ADD.map(q => {
              const exists = subjects.some(s => s.code === q.code);
              return (
                <div key={q.code} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${exists ? 'bg-slate-50 border-slate-200 opacity-50' : 'bg-white border-slate-200'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900">{q.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-mono text-slate-400">{q.code}</span>
                      <Badge className={`text-[10px] border ${LEVEL_STYLES[q.level]}`}>{q.level}</Badge>
                      {q.ib_group && <span className="text-[10px] text-slate-400">{IB_GROUP_MAP[q.ib_group]?.short}</span>}
                    </div>
                  </div>
                  {exists ? <span className="text-xs text-slate-400">Added</span> : null}
                </div>
              );
            })}
          </div>
          <div className="pt-3 border-t flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowQuickAdd(false)}>Cancel</Button>
            <Button
              disabled={bulkAddMutation.isPending || notYetAdded.length === 0}
              onClick={() => bulkAddMutation.mutate(notYetAdded)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {bulkAddMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Add {notYetAdded.length} Subjects
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubjectRow({ subject, classCount, onEdit, onDelete }) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-900">{subject.name}</span>
          {subject.code && <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{subject.code}</span>}
          {subject.department && <span className="text-xs text-slate-400 italic">{subject.department}</span>}
        </div>
        {subject.default_grading_type && (
          <span className="text-[10px] text-slate-400 mt-0.5 block">Grading: {subject.default_grading_type.replace(/_/g, ' ')}</span>
        )}
      </td>
      <td className="px-4 py-3 w-16">
        <Badge className={`text-[11px] border ${LEVEL_STYLES[subject.level] || LEVEL_STYLES.na}`}>{subject.level?.toUpperCase() || '—'}</Badge>
      </td>
      <td className="px-4 py-3 hidden md:table-cell w-20 text-xs text-slate-400">
        {classCount > 0 ? `${classCount} class${classCount > 1 ? 'es' : ''}` : '—'}
      </td>
      <td className="px-4 py-3 w-20 text-right">
        <div className="flex items-center justify-end gap-0.5">
          <Button variant="ghost" size="sm" onClick={() => onEdit(subject)} className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600">
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(subject)} className="h-7 w-7 p-0 text-slate-400 hover:text-red-600">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}