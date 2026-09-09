import { useQuery } from '@tanstack/react-query';
import * as academics from '@/data/academics';
import * as classesData from '@/data/classes';
import * as membershipsData from '@/data/memberships';

export function useOnboardingStatus(schoolId) {
  return useQuery({
    queryKey: ['onboarding-status', schoolId],
    queryFn: async () => {
      const [academicYears, terms, subjects, classes, memberships] = await Promise.all([
        academics.whereAcademicYears({ school_id: schoolId }),
        academics.whereTerms({ school_id: schoolId }),
        academics.whereSubjects({ school_id: schoolId }),
        classesData.where({ school_id: schoolId, status: 'active' }),
        membershipsData.where({ school_id: schoolId, status: 'active' }),
      ]);

      const teachers = memberships.filter(m => ['teacher', 'ib_coordinator'].includes(m.role));
      const students = memberships.filter(m => m.role === 'student');
      const classesWithTeachers = classes.filter(c =>
        (c.teacher_ids && c.teacher_ids.length > 0) ||
        (c.subject_teacher_assignments && c.subject_teacher_assignments.some(a => a.teacher_ids?.length > 0))
      );

      const steps = [
        {
          id: 'academic_year',
          label: 'Academic Year',
          description: 'Set up at least one academic year',
          detail: academicYears.length > 0
            ? `${academicYears.length} year${academicYears.length > 1 ? 's' : ''} configured`
            : 'No academic years yet',
          completed: academicYears.length > 0,
          icon: 'calendar',
          page: 'SchoolAdminAcademicSetup',
          tab: 'years',
        },
        {
          id: 'terms',
          label: 'Terms / Reporting Periods',
          description: 'Define terms within your academic year',
          detail: terms.length > 0
            ? `${terms.length} term${terms.length > 1 ? 's' : ''} defined`
            : 'No terms yet',
          completed: terms.length > 0,
          icon: 'clock',
          page: 'SchoolAdminAcademicSetup',
          tab: 'terms',
        },
        {
          id: 'subjects',
          label: 'Subject Catalogue',
          description: 'Add the subjects your school teaches',
          detail: subjects.length > 0
            ? `${subjects.length} subject${subjects.length > 1 ? 's' : ''} added`
            : 'No subjects yet',
          completed: subjects.length > 0,
          icon: 'book',
          page: 'SchoolAdminAcademicSetup',
          tab: 'subjects',
        },
        {
          id: 'classes',
          label: 'First Classes',
          description: 'Create your initial class groups',
          detail: classes.length > 0
            ? `${classes.length} class${classes.length > 1 ? 'es' : ''} created`
            : 'No classes yet',
          completed: classes.length > 0,
          icon: 'layers',
          page: 'SchoolAdminClasses',
        },
        {
          id: 'teachers',
          label: 'Assign Teachers',
          description: 'Assign teachers to at least one class',
          detail: classesWithTeachers.length > 0
            ? `${classesWithTeachers.length} class${classesWithTeachers.length > 1 ? 'es' : ''} have teachers`
            : 'No classes have teachers assigned',
          completed: classesWithTeachers.length > 0,
          icon: 'user-check',
          page: 'SchoolAdminClasses',
        },
        {
          id: 'invite_staff',
          label: 'Invite Teachers & Staff',
          description: 'Invite at least one teacher to the platform',
          detail: teachers.length > 0
            ? `${teachers.length} staff member${teachers.length > 1 ? 's' : ''} invited`
            : 'No staff invited yet',
          completed: teachers.length > 0,
          icon: 'mail',
          page: 'SchoolAdminUsers',
        },
        {
          id: 'invite_students',
          label: 'Enrol Students',
          description: 'Add your first student accounts',
          detail: students.length > 0
            ? `${students.length} student${students.length > 1 ? 's' : ''} enrolled`
            : 'No students yet',
          completed: students.length > 0,
          icon: 'graduation-cap',
          page: 'SchoolAdminUsers',
        },
      ];

      const completedCount = steps.filter(s => s.completed).length;
      const totalCount = steps.length;
      const progressPct = Math.round((completedCount / totalCount) * 100);
      const isComplete = completedCount === totalCount;
      const nextIncomplete = steps.find(s => !s.completed);

      return { steps, completedCount, totalCount, progressPct, isComplete, nextIncomplete };
    },
    enabled: !!schoolId,
    staleTime: 60 * 1000,
  });
}