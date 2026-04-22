import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUser } from '@/components/auth/UserContext';
import {
  Loader2, Users, GraduationCap, Search, Mail, UserPlus, X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import EnrollStudentsDialog from '@/components/enrollments/EnrollStudentsDialog';
import AssignTeachersDialog from '@/components/enrollments/AssignTeachersDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const statusColors = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inactive: 'bg-slate-50 text-slate-600 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function ClassPeople({ classData }) {
  const { user, membership } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null); // { kind: 'student'|'teacher', userId, name }

  // Who can edit the roster: school admins, IB coordinators, or the class's primary teacher
  const role = membership?.role;
  const isAdmin = role === 'school_admin' || role === 'ib_coordinator' || role === 'super_admin';
  const isPrimaryTeacher = classData.primary_teacher_id === user?.id;
  const canEdit =
    !classData.roster_locked &&
    classData.status !== 'archived' &&
    (isAdmin || isPrimaryTeacher);

  const { data: memberships = {}, isLoading } = useQuery({
    queryKey: ['class-people', classData.id, classData.teacher_ids, classData.student_ids],
    queryFn: async () => {
      const [allMembers, cohorts] = await Promise.all([
        base44.entities.SchoolMembership.filter({ school_id: classData.school_id }),
        base44.entities.Cohort.filter({ school_id: classData.school_id, status: 'active' }),
      ]);

      const cohortMap = {};
      cohorts.forEach(c => {
        (c.student_ids || []).forEach(sid => {
          if (!cohortMap[sid]) cohortMap[sid] = [];
          cohortMap[sid].push(c.name);
        });
      });

      const teachers = allMembers.filter(m => classData.teacher_ids?.includes(m.user_id));
      const students = allMembers
        .filter(m => classData.student_ids?.includes(m.user_id))
        .map(m => ({ ...m, cohorts: cohortMap[m.user_id] || [] }));

      const availableStudents = allMembers.filter(m =>
        m.role === 'student' && m.status !== 'inactive'
      );
      const availableTeachers = allMembers.filter(m =>
        ['teacher', 'school_admin', 'ib_coordinator'].includes(m.role) && m.status !== 'inactive'
      );

      return { teachers, students, availableStudents, availableTeachers };
    },
  });

  const updateClass = useMutation({
    mutationFn: (patch) => base44.entities.Class.update(classData.id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-people'] });
      queryClient.invalidateQueries({ queryKey: ['class-details'] });
    },
    onError: (err) => {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    },
  });

  const handleEnrollStudents = (userIds) => {
    const merged = Array.from(new Set([...(classData.student_ids || []), ...userIds]));
    updateClass.mutate({ student_ids: merged }, {
      onSuccess: () => {
        toast({ title: `Enrolled ${userIds.length} student${userIds.length !== 1 ? 's' : ''}` });
        setEnrollOpen(false);
      },
    });
  };

  const handleAssignTeachers = ({ teacherIds }) => {
    const next = {
      teacher_ids: teacherIds,
      primary_teacher_id:
        teacherIds.includes(classData.primary_teacher_id)
          ? classData.primary_teacher_id
          : (teacherIds[0] || null),
    };
    updateClass.mutate(next, {
      onSuccess: () => {
        toast({ title: 'Teachers updated' });
        setAssignOpen(false);
      },
    });
  };

  const handleRemove = () => {
    if (!removeTarget) return;
    if (removeTarget.kind === 'student') {
      const next = (classData.student_ids || []).filter(id => id !== removeTarget.userId);
      updateClass.mutate({ student_ids: next }, {
        onSuccess: () => {
          toast({ title: `Removed ${removeTarget.name}` });
          setRemoveTarget(null);
        },
      });
    } else {
      const nextTeachers = (classData.teacher_ids || []).filter(id => id !== removeTarget.userId);
      const patch = { teacher_ids: nextTeachers };
      if (classData.primary_teacher_id === removeTarget.userId) {
        patch.primary_teacher_id = nextTeachers[0] || null;
      }
      updateClass.mutate(patch, {
        onSuccess: () => {
          toast({ title: `Removed ${removeTarget.name}` });
          setRemoveTarget(null);
        },
      });
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>;
  }

  const { teachers = [], students = [], availableStudents = [], availableTeachers = [] } = memberships;

  const filteredStudents = students.filter(s =>
    !search || s.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    s.grade_level?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Teachers */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-900">Teachers</h2>
            <Badge variant="secondary" className="ml-1">{teachers.length}</Badge>
          </div>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setAssignOpen(true)}
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              Manage teachers
            </Button>
          )}
        </div>
        {teachers.length === 0 ? (
          <p className="text-slate-400 text-sm">No teachers assigned</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {teachers.map(t => (
              <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 group">
                <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-base flex-shrink-0">
                  {t.user_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-slate-900 truncate">{t.user_name || 'Unknown'}</p>
                    {classData.primary_teacher_id === t.user_id && (
                      <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px]">Primary</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3" />{t.user_email}
                  </p>
                  {t.department && <p className="text-xs text-slate-400 mt-0.5">{t.department}</p>}
                </div>
                {canEdit && (
                  <button
                    onClick={() => setRemoveTarget({ kind: 'teacher', userId: t.user_id, name: t.user_name || 'this teacher' })}
                    className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-600 p-1"
                    title="Remove from class"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Students */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-bold text-slate-900">Students</h2>
            <Badge variant="secondary" className="ml-1">{students.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search students..." className="pl-9 h-8 text-sm" />
            </div>
            {canEdit && (
              <Button
                size="sm"
                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setEnrollOpen(true)}
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                Add students
              </Button>
            )}
          </div>
        </div>

        {classData.roster_locked && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
            Roster is locked — managed by the timetable sync.
          </p>
        )}

        {filteredStudents.length === 0 ? (
          <p className="text-slate-400 text-sm">{students.length === 0 ? 'No students enrolled' : 'No students match your search'}</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Year / Level</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Cohort</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Contact</th>
                  {canEdit && <th className="px-4 py-3 w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm flex-shrink-0">
                          {s.user_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{s.user_name || s.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{s.grade_level || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.cohorts.length > 0
                          ? s.cohorts.map((c, i) => <Badge key={i} variant="secondary" className="text-xs font-normal">{c}</Badge>)
                          : <span className="text-sm text-slate-400">—</span>
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`border text-xs capitalize ${statusColors[s.status] || statusColors.active}`}>
                        {s.status || 'active'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      <a href={`mailto:${s.user_email}`} className="flex items-center gap-1 hover:text-indigo-600 truncate max-w-[180px]">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{s.user_email}</span>
                      </a>
                    </td>
                    {canEdit && (
                      <td className="px-2 py-3">
                        <button
                          onClick={() => setRemoveTarget({ kind: 'student', userId: s.user_id, name: s.user_name || 'this student' })}
                          className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-600 p-1"
                          title="Remove from class"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EnrollStudentsDialog
        open={enrollOpen}
        onOpenChange={setEnrollOpen}
        classItem={classData}
        students={availableStudents}
        onSave={handleEnrollStudents}
        isSaving={updateClass.isPending}
      />

      <AssignTeachersDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        mode="general"
        classItem={classData}
        teachers={availableTeachers}
        onSave={handleAssignTeachers}
        isSaving={updateClass.isPending}
      />

      <ConfirmDialog
        open={!!removeTarget}
        title={`Remove ${removeTarget?.name}?`}
        description={`They will no longer be part of this class. You can re-add them any time.`}
        confirmLabel="Remove"
        isDestructive
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}