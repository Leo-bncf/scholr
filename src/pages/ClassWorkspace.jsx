import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUser } from '@/components/auth/UserContext';
import { Loader2, BookOpen } from 'lucide-react';
import TeacherClassWorkspace from '@/components/class/workspace/TeacherClassWorkspace';
import AdminClassWorkspace from '@/components/class/workspace/AdminClassWorkspace';
import StudentClassWorkspace from '@/components/class/workspace/StudentClassWorkspace';

/**
 * Thin router. Loads the class, determines the viewer's role in the context
 * of this class, and hands off to the role-specific workspace component.
 */
export default function ClassWorkspace() {
  const { user, schoolId, membership } = useUser();
  const urlParams = new URLSearchParams(window.location.search);
  const classId = urlParams.get('class_id');
  const initialTab = urlParams.get('tab');

  const { data: classData, isLoading: loadingClass } = useQuery({
    queryKey: ['class-details', classId],
    queryFn: () => base44.entities.Class.filter({ id: classId, school_id: schoolId }).then(res => res[0]),
    enabled: !!classId && !!schoolId,
  });

  if (!classId) {
    return <EmptyState message="No class selected" />;
  }

  if (loadingClass) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!classData) {
    return <EmptyState message="Class not found" />;
  }

  const role = membership?.role;
  const isAdmin = role === 'school_admin' || role === 'ib_coordinator' || role === 'super_admin';
  const isAssignedTeacher = classData.teacher_ids?.includes(user.id);
  const isStudent = classData.student_ids?.includes(user.id);

  if (!isAdmin && !isAssignedTeacher && !isStudent) {
    return <EmptyState message="You don't have access to this class" />;
  }

  // Admins get the admin workspace; otherwise teacher → student.
  if (isAdmin) {
    return <AdminClassWorkspace classData={classData} user={user} initialTab={initialTab} />;
  }
  if (isAssignedTeacher) {
    return <TeacherClassWorkspace classData={classData} user={user} initialTab={initialTab} />;
  }
  return <StudentClassWorkspace classData={classData} user={user} initialTab={initialTab} />;
}

function EmptyState({ message }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">{message}</p>
      </div>
    </div>
  );
}