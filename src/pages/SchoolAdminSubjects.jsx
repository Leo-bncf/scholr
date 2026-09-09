import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { useUser } from '@/components/auth/UserContext';
import {
  LayoutDashboard, Users, BookOpen, Calendar, Clock, GraduationCap,
  Settings, FileText, Plus, Loader2, Search, CreditCard, Pencil, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as academics from '@/data/academics';
import * as classesData from '@/data/classes';

const sidebarLinks = [
  { label: 'Dashboard', page: 'SchoolAdminDashboard', icon: LayoutDashboard },
  { label: 'Users', page: 'SchoolAdminUsers', icon: Users },
  { label: 'Classes', page: 'SchoolAdminClasses', icon: BookOpen },
  { label: 'Enrollments', page: 'SchoolAdminEnrollments', icon: Users },
  { label: 'Academic Setup', page: 'SchoolAdminAcademicSetup', icon: GraduationCap },
  { label: 'Attendance', page: 'SchoolAdminAttendance', icon: Calendar },
  { label: 'Timetable', page: 'SchoolAdminTimetable', icon: Clock },
  { label: 'Reports', page: 'SchoolAdminReports', icon: FileText },
  { label: 'Billing', page: 'SchoolAdminBilling', icon: CreditCard },
  { label: 'Settings', page: 'SchoolAdminSettings', icon: Settings },
];

const IB_GROUPS = [
  { value: 'group1_language_literature', label: 'Group 1 – Language & Literature' },
  { value: 'group2_language_acquisition', label: 'Group 2 – Language Acquisition' },
  { value: 'group3_individuals_societies', label: 'Group 3 – Individuals & Societies' },
  { value: 'group4_sciences', label: 'Group 4 – Sciences' },
  { value: 'group5_mathematics', label: 'Group 5 – Mathematics' },
  { value: 'group6_arts', label: 'Group 6 – Arts' },
  { value: 'core_tok', label: 'Core – Theory of Knowledge' },
  { value: 'core_ee', label: 'Core – Extended Essay' },
  { value: 'core_cas', label: 'Core – CAS' },
];

const LEVEL_COLORS = {
  HL: 'bg-rose-50 text-rose-700 border-rose-200',
  SL: 'bg-blue-50 text-blue-700 border-blue-200',
  core: 'bg-amber-50 text-amber-700 border-amber-200',
  na: 'bg-slate-50 text-slate-500 border-slate-200',
};

const EMPTY_FORM = { name: '', code: '', level: 'na', ib_group: '' };

export default function SchoolAdminSubjects() {
  const { user, school, schoolId } = useUser();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ['school-subjects', schoolId],
    queryFn: () => academics.whereSubjects({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['school-classes-subjects', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => academics.createSubject({ ...data, school_id: schoolId }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['school-subjects'] }); setShowCreate(false); setForm(EMPTY_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => academics.updateSubject(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['school-subjects'] }); setEditingSubject(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => academics.removeSubject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school-subjects'] }),
  });

  const filtered = subjects.filter(s => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.code?.toLowerCase().includes(search.toLowerCase());
    const matchGroup = groupFilter === 'all' || s.ib_group === groupFilter;
    return matchSearch && matchGroup;
  });

  const openEdit = (s) => {
    setForm({ name: s.name, code: s.code || '', level: s.level || 'na', ib_group: s.ib_group || '' });
    setEditingSubject(s);
  };

  const handleDelete = (s) => {
    if (!window.confirm(`Delete subject "${s.name}"?`)) return;
    deleteMutation.mutate(s.id);
  };

  const getClassCount = (subjectId) => classes.filter(c => c.subject_id === subjectId).length;

  return (
    <RoleGuard allowedRoles={['school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={sidebarLinks} role="school_admin" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />

        <main className="md:ml-64 min-h-screen flex flex-col">
          <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            <div>
              <h1 className="text-base font-semibold text-slate-900">Subject Catalogue</h1>
              <p className="text-xs text-slate-400 mt-0.5">{subjects.length} subjects configured</p>
            </div>
            <Button onClick={() => { setForm(EMPTY_FORM); setShowCreate(true); }} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Subject
            </Button>
          </div>

          <div className="p-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Search subjects…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white w-56" />
              </div>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-52 bg-white"><SelectValue placeholder="All IB Groups" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All IB Groups</SelectItem>
                  {IB_GROUPS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
                <GraduationCap className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">No subjects yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Code</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Level</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">IB Group</th>
                      <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Classes</th>
                      <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="text-sm font-medium text-slate-900">{s.name}</span>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{s.code || '—'}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className={`text-[11px] border ${LEVEL_COLORS[s.level] || LEVEL_COLORS.na}`}>{s.level?.toUpperCase() || '—'}</Badge>
                        </td>
                        <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-500">
                          {IB_GROUPS.find(g => g.value === s.ib_group)?.label || '—'}
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className="text-xs font-semibold text-slate-700">{getClassCount(s.id)}</span>
                          <span className="text-xs text-slate-400 ml-1">classes</span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(s)} className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(s)} className="h-7 w-7 p-0 text-slate-400 hover:text-red-600">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* Create / Edit Dialog */}
        <Dialog open={showCreate || !!editingSubject} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditingSubject(null); } }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSubject ? 'Edit Subject' : 'Create Subject'}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={e => {
                e.preventDefault();
                editingSubject ? updateMutation.mutate({ id: editingSubject.id, data: form }) : createMutation.mutate(form);
              }}
              className="space-y-4 pt-2"
            >
              <div>
                <Label className="text-xs font-semibold">Subject Name *</Label>
                <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics Analysis & Approaches" className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Subject Code</Label>
                  <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="MATH_AA" className="mt-1 font-mono" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Level</Label>
                  <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HL">Higher Level (HL)</SelectItem>
                      <SelectItem value="SL">Standard Level (SL)</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="na">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">IB Group</Label>
                <Select value={form.ib_group || 'none'} onValueChange={v => setForm({ ...form, ib_group: v === 'none' ? '' : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select IB group…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None / Not applicable</SelectItem>
                    {IB_GROUPS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowCreate(false); setEditingSubject(null); }}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  );
}