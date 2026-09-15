import { Group, GroupEmpty } from '@/components/app/AppShell';
import { SearchField } from '@/components/app/Field';
import React, { useState } from 'react';
import Notice from '@/components/app/Notice';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Users, UserPlus, UserMinus, Loader2, Lock, ChevronDown, Check, Filter
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
          <Notice tone="warn">
            Roster is locked (timetable sync active). Manual enrolment is disabled.
          </Notice>
        ) : (
          <>
            <div className="flex gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 scholr-faint" />
                <Input placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
              </div>
              {grades.length > 0 && (
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <Filter className="w-3 h-3 mr-1 scholr-faint" />
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
              <span className="text-xs scholr-muted">{filtered.length} students available</span>
              {filtered.length > 0 && (
                <button onClick={toggleAll} className="text-xs scholr-accent hover:scholr-accent font-medium">
                  {selected.length === filtered.length ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
              {filtered.length === 0 ? (
                <div className="py-8 text-center scholr-faint text-sm">
                  {notEnrolled.length === 0 ? 'All students are already enrolled' : 'No students match your filter'}
                </div>
              ) : filtered.map(s => {
                const isSelected = selected.includes(s.user_id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.user_id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${isSelected ? 'scholr-accent-sf scholr-accent-rule' : 'bg-white scholr-rule hover:scholr-rule'}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isSelected ? 'pub-btn pub-btn-primary' : 'scholr-sunk scholr-muted'}`}>
                      {(s.user_name || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium scholr-ink truncate">{s.user_name || s.user_email}</p>
                      <p className="text-[11px] scholr-faint">{s.grade_level || '—'}</p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 scholr-accent flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t scholr-rule-soft flex gap-2">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button
                className="flex-1 pub-btn pub-btn-primary"
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
        <div className="app-group p-3 text-center shadow-sm">
          <p className="text-xl font-bold scholr-ink">{activeClasses.length}</p>
          <p className="text-xs scholr-faint mt-0.5">Active Classes</p>
        </div>
        <div className="app-group p-3 text-center shadow-sm">
          <p className="text-xl font-bold scholr-ink">{totalEnrolled}</p>
          <p className="text-xs scholr-faint mt-0.5">Total Enrolments</p>
        </div>
        <div className="app-group p-3 text-center shadow-sm">
          <p className="text-xl font-bold scholr-ink">{unfilledClasses}</p>
          <p className="text-xs scholr-faint mt-0.5">Under Capacity</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <SearchField label="Search classes" value={search} onChange={setSearch} placeholder="Search classes…" />
      </div>

      {filtered.length === 0 ? (
        <Group>
          <GroupEmpty>No active classes match this search.</GroupEmpty>
        </Group>
      ) : (
        <div className="space-y-2">
          {filtered.map(c => {
            const enrolledIds = c.student_ids || [];
            const isExpanded  = expandedClass === c.id;
            const capacity    = c.capacity;
            const isFull      = capacity && enrolledIds.length >= capacity;
            const isLocked    = c.roster_locked;

            return (
              <div key={c.id} className="app-group overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={open => setExpandedClass(open ? c.id : null)}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full px-5 py-4 flex items-center justify-between hover:scholr-sunk transition-colors text-left">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold scholr-ink text-sm">{c.name}</h3>
                            {isLocked && <Lock className="w-3.5 h-3.5 text-amber-500" title="Roster locked" />}
                          </div>
                          <p className="text-xs scholr-faint mt-0.5">
                            <span style={isFull ? { color: 'var(--crit)' } : undefined}>
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
                        <ChevronDown className={`w-4 h-4 scholr-faint transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="border-t scholr-rule-soft">
                    {enrolledIds.length === 0 ? (
                      <div className="px-5 py-6 text-center">
                        <Users className="w-8 h-8 scholr-faint mx-auto mb-2" />
                        <p className="text-xs scholr-faint">No students enrolled yet</p>
                        {!isLocked && (
                          <Button variant="outline" size="sm" className="mt-3 text-xs gap-1" onClick={() => setEnrollingClass(c)}>
                            <UserPlus className="w-3 h-3" /> Enrol Students
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y scholr-divide">
                        {enrolledIds.map(sid => {
                          const m = getMember(sid);
                          return (
                            <div key={sid} className="px-5 py-2.5 flex items-center justify-between hover:scholr-sunk transition-colors">
                              <div className="flex items-center gap-2.5">
                                <div>
                                  <p className="text-sm font-medium scholr-ink">{m?.user_name || 'Unknown'}</p>
                                  <p className="text-[11px] scholr-faint">{m?.grade_level || m?.user_email || '—'}</p>
                                </div>
                              </div>
                              {!isLocked && (
                                <button
                                  onClick={() => removeStudent(c.id, sid, enrolledIds)}
                                  className="scholr-faint hover:text-red-500 transition-colors p-1"
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