import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as classesData from '@/data/classes';
import * as academics from '@/data/academics';
import * as membershipsData from '@/data/memberships';

/**
 * Shared data + mutations for the Enrollments page.
 * Keeps entity I/O out of the UI components so each view stays focused.
 */
export function useEnrollmentsData(schoolId) {
  const queryClient = useQueryClient();

  const classesQuery = useQuery({
    queryKey: ['enroll-classes', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId }, { order: 'created_at', ascending: false }),
    enabled: !!schoolId,
  });

  const subjectsQuery = useQuery({
    queryKey: ['enroll-subjects', schoolId],
    queryFn: () => academics.whereSubjects({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const membershipsQuery = useQuery({
    queryKey: ['enroll-members', schoolId],
    queryFn: () =>
      membershipsData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const academicYearsQuery = useQuery({
    queryKey: ['enroll-years', schoolId],
    queryFn: () => academics.whereAcademicYears({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['enroll-classes', schoolId] });
  };

  const createClassMutation = useMutation({
    mutationFn: (data) => classesData.create({ ...data, school_id: schoolId }),
    onSuccess: invalidate,
  });

  const updateClassMutation = useMutation({
    mutationFn: ({ classId, data }) => classesData.update(classId, data),
    onSuccess: invalidate,
  });

  const deleteClassMutation = useMutation({
    mutationFn: (classId) => classesData.remove(classId),
    onSuccess: invalidate,
  });

  // Dedupe memberships by user_id so roster pickers never show duplicates or
  // blank rows. Missing user_name falls back to email.
  const dedupeByUser = (rows) => {
    const seen = new Map();
    for (const m of rows) {
      if (!m.user_id) continue;
      if (!seen.has(m.user_id)) {
        seen.set(m.user_id, {
          ...m,
          user_name: m.user_name || m.user_email || 'Unnamed user',
        });
      }
    }
    return Array.from(seen.values());
  };

  const memberships = membershipsQuery.data || [];
  const teachers = dedupeByUser(
    memberships.filter((m) => ['teacher', 'ib_coordinator', 'school_admin'].includes(m.role))
  );
  const students = dedupeByUser(memberships.filter((m) => m.role === 'student'));

  return {
    classes: classesQuery.data || [],
    subjects: subjectsQuery.data || [],
    academicYears: academicYearsQuery.data || [],
    memberships,
    teachers,
    students,
    isLoading: classesQuery.isLoading,
    createClassMutation,
    updateClassMutation,
    deleteClassMutation,
  };
}