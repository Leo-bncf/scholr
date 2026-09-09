import React from 'react';
import { useQuery } from '@tanstack/react-query';
import GradebookView from '@/components/gradebook/GradebookView';
import StudentGradesView from '@/components/gradebook/StudentGradesView';
import * as assignmentsData from '@/data/assignments';

export default function ClassGrades({ classData, isTeacher, isStudent, userId }) {
  const { data: assignments = [] } = useQuery({
    queryKey: ['class-assignments-for-grades', classData.id],
    queryFn: () => assignmentsData.where({ 
      school_id: classData.school_id, 
      class_id: classData.id 
    }),
    enabled: isTeacher,
  });

  if (isTeacher) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <GradebookView classData={classData} assignments={assignments} />
      </div>
    );
  }

  if (isStudent) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <StudentGradesView classData={classData} studentId={userId} />
      </div>
    );
  }

  return null;
}