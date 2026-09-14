import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import GradebookView from '@/components/gradebook/GradebookView';
import RoleGuard from '@/components/auth/RoleGuard';
import * as classesData from '@/data/classes';
import * as assignmentsData from '@/data/assignments';

export default function ClassGradebook() {
  const { user, schoolId } = useUser();
  const urlParams = new URLSearchParams(window.location.search);
  const classId = urlParams.get('class_id');

  const { data: classData, isLoading: loadingClass } = useQuery({
    queryKey: ['class-for-gradebook', classId],
    queryFn: async () => {
      const results = await classesData.where({ id: classId, school_id: schoolId });
      return results[0];
    },
    enabled: !!classId && !!schoolId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments-for-gradebook', classId],
    queryFn: () => assignmentsData.where({ 
      school_id: schoolId, 
      class_id: classId 
    }),
    enabled: !!classId && !!schoolId,
  });

  if (loadingClass) {
    return (
      <div className="min-h-screen scholr-sunk flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin scholr-accent" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen scholr-sunk flex items-center justify-center">
        <p className="scholr-muted">Class not found</p>
      </div>
    );
  }

  const isTeacher = classData.teacher_ids?.includes(user.id);

  if (!isTeacher) {
    return (
      <div className="min-h-screen scholr-sunk flex items-center justify-center">
        <p className="scholr-muted">You don't have access to this gradebook</p>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['teacher', 'school_admin', 'ib_coordinator', 'super_admin', 'admin']}>
      <div className="min-h-screen scholr-sunk">
        <div className="bg-white border-b scholr-rule">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <a href={createPageUrl('ClassWorkspace') + `?class_id=${classId}&tab=grades`}>
              <Button variant="ghost" size="sm" className="mb-3">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Class
              </Button>
            </a>
            <h1 className="text-2xl font-bold scholr-ink">{classData.name} - Gradebook</h1>
            <p className="text-sm scholr-muted mt-1">
              {classData.section ? `Section ${classData.section}` : ''} 
              {classData.room ? ` · Room ${classData.room}` : ''}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          <GradebookView classData={classData} assignments={assignments} />
        </div>
      </div>
    </RoleGuard>
  );
}