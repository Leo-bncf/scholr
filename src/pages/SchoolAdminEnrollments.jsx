import React, { useMemo, useState } from 'react';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { useUser } from '@/components/auth/UserContext';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Plus, BookOpen } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import { useEnrollmentsData } from '@/components/enrollments/useEnrollmentsData';
import CreateClassDialog from '@/components/enrollments/CreateClassDialog';
import AssignTeachersDialog from '@/components/enrollments/AssignTeachersDialog';
import EnrollStudentsDialog from '@/components/enrollments/EnrollStudentsDialog';
import ClassCard from '@/components/enrollments/ClassCard';

export default function SchoolAdminEnrollments() {
  const { user, school, schoolId } = useUser();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [expandedClassId, setExpandedClassId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [teachersDialog, setTeachersDialog] = useState(null); // { classItem, mode }
  const [studentsDialog, setStudentsDialog] = useState(null); // { classItem }

  const {
    classes,
    subjects,
    academicYears,
    teachers,
    students,
    isLoading,
    createClassMutation,
    updateClassMutation,
    deleteClassMutation,
  } = useEnrollmentsData(schoolId);

  const subjectsById = useMemo(
    () => Object.fromEntries(subjects.map((s) => [s.id, s])),
    [subjects]
  );
  const teachersByUserId = useMemo(
    () => Object.fromEntries(teachers.map((t) => [t.user_id, t])),
    [teachers]
  );
  const studentsByUserId = useMemo(
    () => Object.fromEntries(students.map((s) => [s.user_id, s])),
    [students]
  );

  const filteredClasses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((c) => c.name?.toLowerCase().includes(q));
  }, [classes, search]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreateClass = (data) => {
    createClassMutation.mutate(data, {
      onSuccess: (created) => {
        toast({ title: 'Class created', description: data.name });
        setCreateOpen(false);
        if (created?.id) setExpandedClassId(created.id);
      },
      onError: (err) =>
        toast({
          title: 'Could not create class',
          description: err?.message || 'Try again',
          variant: 'destructive',
        }),
    });
  };

  const handleAddSubjectAssignment = ({ subjectId, teacherIds }) => {
    const classItem = teachersDialog?.classItem;
    if (!classItem) return;
    const existing = classItem.subject_teacher_assignments || [];
    const next = [
      ...existing,
      { id: `assign_${Date.now()}`, subject_id: subjectId, teacher_ids: teacherIds },
    ];
    updateClassMutation.mutate(
      { classId: classItem.id, data: { subject_teacher_assignments: next } },
      {
        onSuccess: () => {
          toast({ title: 'Subject assigned' });
          setTeachersDialog(null);
        },
      }
    );
  };

  const handleAssignClassTeachers = ({ teacherIds }) => {
    const classItem = teachersDialog?.classItem;
    if (!classItem) return;
    const primary =
      teacherIds.includes(classItem.primary_teacher_id)
        ? classItem.primary_teacher_id
        : teacherIds[0] || null;
    updateClassMutation.mutate(
      {
        classId: classItem.id,
        data: {
          teacher_ids: teacherIds,
          primary_teacher_id: primary,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Teachers updated' });
          setTeachersDialog(null);
        },
      }
    );
  };

  const handleRemoveSubjectAssignment = (classId, assignmentId) => {
    const classItem = classes.find((c) => c.id === classId);
    if (!classItem) return;
    updateClassMutation.mutate({
      classId,
      data: {
        subject_teacher_assignments: (classItem.subject_teacher_assignments || []).filter(
          (a) => a.id !== assignmentId
        ),
      },
    });
  };

  const handleEnrolStudents = (studentIds) => {
    const classItem = studentsDialog?.classItem;
    if (!classItem) return;
    const merged = Array.from(
      new Set([...(classItem.student_ids || []), ...studentIds])
    );
    updateClassMutation.mutate(
      { classId: classItem.id, data: { student_ids: merged } },
      {
        onSuccess: () => {
          toast({ title: `${studentIds.length} student${studentIds.length === 1 ? '' : 's'} enrolled` });
          setStudentsDialog(null);
        },
      }
    );
  };

  const handleRemoveStudent = (classId, studentId) => {
    const classItem = classes.find((c) => c.id === classId);
    if (!classItem) return;
    updateClassMutation.mutate({
      classId,
      data: { student_ids: (classItem.student_ids || []).filter((id) => id !== studentId) },
    });
  };

  const handleDeleteClass = (classId) => {
    deleteClassMutation.mutate(classId, {
      onSuccess: () => toast({ title: 'Class deleted' }),
      onError: (err) =>
        toast({
          title: 'Could not delete class',
          description: err?.message || 'Try again',
          variant: 'destructive',
        }),
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <RoleGuard allowedRoles={['school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar
          links={SCHOOL_ADMIN_SIDEBAR_LINKS}
          role="school_admin"
          schoolName={school?.name}
          userName={user?.full_name}
          userId={user?.id}
          schoolId={schoolId}
        />

        <main className="md:ml-64 min-h-screen flex flex-col">
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  Enrollments & Curriculum
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Create classes, assign teachers, and enrol students
                </p>
              </div>
              <Button
                onClick={() => setCreateOpen(true)}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4" />
                New Class
              </Button>
            </div>
          </header>

          <div className="flex-1 p-6 space-y-4">
            <StatsBar
              classes={classes}
              teachers={teachers}
              students={students}
            />

            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search classes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : filteredClasses.length === 0 ? (
              <EmptyState
                hasSearch={!!search}
                hasAnyClasses={classes.length > 0}
                onCreate={() => setCreateOpen(true)}
              />
            ) : (
              <div className="space-y-3">
                {filteredClasses.map((classItem) => (
                  <ClassCard
                    key={classItem.id}
                    classItem={classItem}
                    expanded={expandedClassId === classItem.id}
                    onToggleExpand={(open) => setExpandedClassId(open ? classItem.id : null)}
                    subjectsById={subjectsById}
                    teachersByUserId={teachersByUserId}
                    studentsByUserId={studentsByUserId}
                    onAssignSubject={(c) => setTeachersDialog({ classItem: c, mode: 'subject' })}
                    onAssignClassTeachers={(c) => setTeachersDialog({ classItem: c, mode: 'general' })}
                    onEnrolStudents={(c) => setStudentsDialog({ classItem: c })}
                    onRemoveSubjectAssignment={handleRemoveSubjectAssignment}
                    onRemoveStudent={handleRemoveStudent}
                    onDeleteClass={handleDeleteClass}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Dialogs */}
        <CreateClassDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          subjects={subjects}
          academicYears={academicYears}
          onCreate={handleCreateClass}
          isCreating={createClassMutation.isPending}
        />

        <AssignTeachersDialog
          open={!!teachersDialog}
          onOpenChange={(v) => !v && setTeachersDialog(null)}
          mode={teachersDialog?.mode || 'subject'}
          classItem={teachersDialog?.classItem}
          teachers={teachers}
          subjects={subjects}
          onSave={
            teachersDialog?.mode === 'general'
              ? handleAssignClassTeachers
              : handleAddSubjectAssignment
          }
          isSaving={updateClassMutation.isPending}
        />

        <EnrollStudentsDialog
          open={!!studentsDialog}
          onOpenChange={(v) => !v && setStudentsDialog(null)}
          classItem={studentsDialog?.classItem}
          students={students}
          onSave={handleEnrolStudents}
          isSaving={updateClassMutation.isPending}
        />
      </div>
    </RoleGuard>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Small inline sub-components
// ────────────────────────────────────────────────────────────────────────────

function StatsBar({ classes, teachers, students }) {
  const items = [
    { label: 'Classes', value: classes.length },
    { label: 'Teachers', value: teachers.length },
    { label: 'Students', value: students.length },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((i) => (
        <div key={i.label} className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-xs text-slate-500 font-medium">{i.label}</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{i.value}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch, hasAnyClasses, onCreate }) {
  if (hasSearch && hasAnyClasses) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
        <p className="text-sm text-slate-500">No classes match your search</p>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
      <div className="w-12 h-12 rounded-full bg-indigo-50 mx-auto flex items-center justify-center mb-3">
        <BookOpen className="w-5 h-5 text-indigo-600" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">No classes yet</h3>
      <p className="text-xs text-slate-500 mt-1 mb-4">
        Create your first class to start assigning teachers and students.
      </p>
      <Button onClick={onCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
        <Plus className="w-4 h-4" />
        Create your first class
      </Button>
    </div>
  );
}