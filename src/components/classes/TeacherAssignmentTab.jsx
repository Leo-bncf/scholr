import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Users, Pencil, Crown, Loader2, Lock, BookOpen
} from 'lucide-react';
import { CO_TEACHER_PERMS } from './classConstants';
import * as classesData from '@/data/classes';

function TeacherAssignDialog({ classObj, onClose, schoolId, memberships }) {
  const queryClient = useQueryClient();
  const teachers = memberships.filter(m =>
    ['teacher', 'ib_coordinator', 'school_admin'].includes(m.role) && m.status === 'active'
  );

  const currentTeacherIds = classObj.teacher_ids || [];
  const primaryTeacherId  = classObj.primary_teacher_id || currentTeacherIds[0];

  const [primaryId, setPrimaryId] = useState(primaryTeacherId || '__none');
  const [coTeacherIds, setCoTeacherIds] = useState(
    currentTeacherIds.filter(id => id !== primaryTeacherId)
  );
  const [coPermissions, setCoPermissions] = useState(classObj.co_teacher_permissions || {});

  const mutation = useMutation({
    mutationFn: (data) => classesData.update(classObj.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-classes', schoolId] });
      onClose();
    },
  });

  const toggleCoTeacher = (userId) => {
    setCoTeacherIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const togglePerm = (userId, perm) => {
    setCoPermissions(prev => {
      const current = prev[userId] || [];
      return {
        ...prev,
        [userId]: current.includes(perm)
          ? current.filter(p => p !== perm)
          : [...current, perm],
      };
    });
  };

  const handleSave = () => {
    const pid = primaryId === '__none' ? null : primaryId;
    const allTeacherIds = [...new Set([pid, ...coTeacherIds].filter(Boolean))];
    mutation.mutate({
      teacher_ids: allTeacherIds,
      primary_teacher_id: pid,
      co_teacher_permissions: coPermissions,
    });
  };

  const getMemberName = (id) => memberships.find(m => m.user_id === id)?.user_name || id;
  const getMemberRole = (id) => memberships.find(m => m.user_id === id)?.role || '';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Assign Staff — {classObj.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-2">

          {/* Primary teacher */}
          <div>
            <Label className="text-xs font-semibold text-slate-600">Primary Teacher (Class Owner)</Label>
            <p className="text-[11px] text-slate-400 mb-2">Responsible for grades, reports, and class management.</p>
            <Select value={primaryId} onValueChange={setPrimaryId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select primary teacher…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">No primary teacher</SelectItem>
                {teachers.map(t => (
                  <SelectItem key={t.user_id || t.id} value={t.user_id || t.id}>
                    {t.user_name || t.user_email} ({t.role.replace('_', ' ')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Co-teachers */}
          <div>
            <Label className="text-xs font-semibold text-slate-600">Co-Teachers</Label>
            <p className="text-[11px] text-slate-400 mb-2">Select co-teachers and configure their permissions.</p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {teachers
                .filter(t => (t.user_id || t.id) !== (primaryId === '__none' ? null : primaryId))
                .map(t => {
                  const tid = t.user_id || t.id;
                  const isAssigned = coTeacherIds.includes(tid);
                  const perms = coPermissions[tid] || [];
                  return (
                    <div key={t.id} className={`border rounded-lg transition-colors ${isAssigned ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white'}`}>
                      <button
                        onClick={() => toggleCoTeacher(tid)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAssigned ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {(t.user_name || '?')[0]?.toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{t.user_name || t.user_email}</p>
                          <p className="text-[11px] text-slate-500">{t.department ? `${t.department} · ` : ''}{t.role.replace('_', ' ')}</p>
                        </div>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${isAssigned ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                          {isAssigned && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                      </button>

                      {isAssigned && (
                        <div className="px-3 pb-2.5 flex gap-1.5 flex-wrap">
                          {CO_TEACHER_PERMS.map(p => (
                            <button
                              key={p.value}
                              onClick={() => togglePerm(tid, p.value)}
                              className={`text-[11px] px-2 py-1 rounded border transition-colors ${
                                perms.includes(p.value)
                                  ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={mutation.isPending}
              onClick={handleSave}
            >
              {mutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
              Save Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TeacherAssignmentTab({ schoolId, classes, memberships }) {
  const [search, setSearch] = useState('');
  const [assigningClass, setAssigningClass] = useState(null);

  const activeClasses = classes.filter(c => c.status === 'active');

  const filtered = activeClasses.filter(c => {
    const q = search.toLowerCase();
    return !q || c.name?.toLowerCase().includes(q);
  });

  const getMember = (id) => memberships.find(m => m.user_id === id);

  const getUnstaffedCount = () => activeClasses.filter(c =>
    !c.teacher_ids || c.teacher_ids.length === 0
  ).length;

  const unstaffed = getUnstaffedCount();

  return (
    <div className="space-y-4">
      {unstaffed > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <Users className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700">
            <strong>{unstaffed} class{unstaffed !== 1 ? 'es' : ''}</strong> have no staff assigned yet.
          </p>
        </div>
      )}

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
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
          {filtered.map(c => {
            const primaryId     = c.primary_teacher_id || c.teacher_ids?.[0];
            const primary       = primaryId ? getMember(primaryId) : null;
            const coTeacherIds  = (c.teacher_ids || []).filter(id => id !== primaryId);
            const hasStaff      = (c.teacher_ids || []).length > 0;

            return (
              <div key={c.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{c.name}</h3>
                    {c.section && <span className="text-[11px] text-slate-400">§ {c.section}</span>}
                    {c.roster_locked && <Lock className="w-3 h-3 text-amber-500" />}
                  </div>

                  {hasStaff ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {primary && (
                        <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full px-2.5 py-1">
                          <Crown className="w-3 h-3 text-violet-500" />
                          <span className="text-xs font-medium text-violet-700">{primary.user_name || primary.user_email}</span>
                        </div>
                      )}
                      {coTeacherIds.map(id => {
                        const m = getMember(id);
                        if (!m) return null;
                        const perms = c.co_teacher_permissions?.[id] || [];
                        return (
                          <div key={id} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
                            <span className="text-xs text-slate-600">{m.user_name || m.user_email}</span>
                            {perms.length > 0 && (
                              <span className="text-[10px] text-slate-400">{perms.length} perm{perms.length !== 1 ? 's' : ''}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 font-medium">⚠ No staff assigned</p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => setAssigningClass(c)}
                >
                  <Pencil className="w-3 h-3" /> Manage Staff
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {assigningClass && (
        <TeacherAssignDialog
          classObj={assigningClass}
          onClose={() => setAssigningClass(null)}
          schoolId={schoolId}
          memberships={memberships}
        />
      )}
    </div>
  );
}