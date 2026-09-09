import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search, Users, UserPlus, UserMinus, Loader2, Lock, ChevronDown,
  BookOpen, Check, Filter
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import * as classesData from '@/data/classes';

function EnrollDialog({ classObj, onClose, schoolId, memberships }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');

  const students = memberships.filter(m => m.role === 'student' && m.status === 'active');
  const enrolledIds = classObj.student_ids || [];
  const notEnrolled = students.filter(s => !enrolledIds.includes(s.user_id));

  const grades = [...new Set(students.map(s => s.grade_level).filter(Boolean))].sort();

  const filtered = notEnrolled.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || (s.user_name || '').toLowerCase().includes(q) || (s.user_email || '').toLowerCase().includes(q);
    const matchGrade  = gradeFilter === 'all' || s.grade_level === gradeFilter;
    return matchSearch && matchGrade;
  });

  const [selected, setSelected] = useState([]);

  const enrollMutation = useMutation({
    mutationFn: (ids) => classesData.update(classObj.id, {
      student_ids: [...new Set([...enrolledIds, ...ids])],
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-classes', schoolId] });
      onClose();
    },
  });

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(prev => prev.length === filtered.length ? [] : filtered.map(s => s.user_id));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">Enrol Students — {classObj.name}</DialogTitle>
        </DialogHeader>

        {classObj.roster_locked ? (
          <Alert className="border-amber-200 bg-amber-50">
            <Lock className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-xs text-amber-700">
              Roster is locked (timetable sync active). Manual enrolment is disabled.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="flex gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
              </div>
              {grades.length > 0 && (
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <Filter className="w-3 h-3 mr-1 text-slate-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All grades</SelectItem>
                    {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-slate-500">{filtered.length} students available</span>
              {filtered.length > 0 && (
                <button onClick={toggleAll} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  {selected.length === filtered.length ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  {notEnrolled.length === 0 ? 'All students are already enrolled' : 'No students match your filter'}
                </div>
              ) : filtered.map(s => {
                const isSelected = selected.includes(s.user_id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.user_id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      {(s.user_name || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{s.user_name || s.user_email}</p>
                      <p className="text-[11px] text-slate-400">{s.grade_level || '—'}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={selected.length === 0 || enrollMutation.isPending}
                onClick={() => enrollMutation.mutate(selected)}
              >
                {enrollMutation.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <>Enrol {selected.length > 0 && `(${selected.length})`}</>}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function StudentEnrollmentTab({ schoolId, classes, memberships }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedClass, setExpandedClass] = useState(null);
  const [enrollingClass, setEnrollingClass] = useState(null);

  const updateMutation = useMutation({
    mutationFn: ({ classId, data }) => classesData.update(classId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school-classes', schoolId] }),
  });

  const activeClasses = classes.filter(c => c.status === 'active');
  const filtered = activeClasses.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q);
  });

  const getMember = (id) => memberships.find(m => m.user_id === id);

  const removeStudent = (classId, studentId, currentIds) => {
    if (!window.confirm('Remove this student from the class?')) return;
    updateMutation.mutate({
      classId,
      data: { student_ids: currentIds.filter(id => id !== studentId) },
    });
  };

  const totalEnrolled = activeClasses.reduce((sum, c) => sum + (c.student_ids?.length || 0), 0);
  const unfilledClasses = activeClasses.filter(c =>
    c.capacity && (c.student_ids?.length || 0) < c.capacity
  ).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-slate-900">{activeClasses.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Active Classes</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-slate-900">{totalEnrolled}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total Enrolments</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
          <p className="text-xl font-bold text-slate-900">{unfilledClasses}</p>
          <p className="text-xs text-slate-400 mt-0.5">Under Capacity</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input placeholder="Search classes…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-white h-9" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No active classes found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const enrolledIds = c.student_ids || [];
            const isExpanded  = expandedClass === c.id;
            const capacity    = c.capacity;
            const isFull      = capacity && enrolledIds.length >= capacity;
            const isLocked    = c.roster_locked;

            return (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={open => setExpandedClass(open ? c.id : null)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 text-sm">{c.name}</h3>
                            {isLocked && <Lock className="w-3.5 h-3.5 text-amber-500" title="Roster locked" />}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            <span className={isFull ? 'text-red-600 font-medium' : ''}>
                              {enrolledIds.length}{capacity ? `/${capacity}` : ''} student{enrolledIds.length !== 1 ? 's' : ''}
                            </span>
                            {isFull && ' · Full'}
                            {isLocked && ' · Roster locked'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!isLocked && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={e => { e.stopPropagation(); setEnrollingClass(c); }}
                            disabled={isFull}
                          >
                            <UserPlus className="w-3 h-3" />
                            {isFull ? 'Full' : 'Enrol'}
                          </Button>
                        )}
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="border-t border-slate-100">
                    {enrolledIds.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No students enrolled yet</p>
                        {!isLocked && (
                          <Button variant="outline" size="sm" className="mt-3 text-xs gap-1" onClick={() => setEnrollingClass(c)}>
                            <UserPlus className="w-3 h-3" /> Enrol Students
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {enrolledIds.map(sid => {
                          const m = getMember(sid);
                          return (
                            <div key={sid} className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                                  {(m?.user_name || '?')[0]?.toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{m?.user_name || 'Unknown'}</p>
                                  <p className="text-[11px] text-slate-400">{m?.grade_level || m?.user_email || '—'}</p>
                                </div>
                              </div>
                              {!isLocked && (
                                <button
                                  onClick={() => removeStudent(c.id, sid, enrolledIds)}
                                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                  title="Remove from class"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </div>
            );
          })}
        </div>
      )}

      {enrollingClass && (
        <EnrollDialog
          classObj={enrollingClass}
          onClose={() => setEnrollingClass(null)}
          schoolId={schoolId}
          memberships={memberships}
        />
      )}
    </div>
  );
}