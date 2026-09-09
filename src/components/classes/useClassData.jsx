import { useQuery } from '@tanstack/react-query';
import * as classesData from '@/data/classes';
import * as academics from '@/data/academics';
import * as membershipsData from '@/data/memberships';

export function useClassData(schoolId) {
  const classes = useQuery({
    queryKey: ['school-classes', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const subjects = useQuery({
    queryKey: ['school-subjects', schoolId],
    queryFn: () => academics.whereSubjects({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const memberships = useQuery({
    queryKey: ['school-memberships', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const academicYears = useQuery({
    queryKey: ['academic-years', schoolId],
    queryFn: () => academics.whereAcademicYears({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const cohorts = useQuery({
    queryKey: ['cohorts', schoolId],
    queryFn: () => academics.whereCohorts({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  return {
    classes: classes.data ?? [],
    subjects: subjects.data ?? [],
    memberships: memberships.data ?? [],
    academicYears: academicYears.data ?? [],
    cohorts: cohorts.data ?? [],
    isLoading: classes.isLoading,
  };
}