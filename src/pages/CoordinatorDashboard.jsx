import React from 'react';
import { useQuery } from '@tanstack/react-query';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import AppShell, { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import { useUser } from '@/components/auth/UserContext';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getCoordinatorSidebarLinks } from '@/components/app/coordinatorSidebarLinks';
import { useCurriculum } from '@/hooks/useCurriculum';
import AssignmentCompletionChart from '@/components/coordinator/AssignmentCompletionChart';
import * as membershipsData from '@/data/memberships';
import * as classesData from '@/data/classes';
import * as academics from '@/data/academics';
import * as assignmentsData from '@/data/assignments';
import * as submissionsData from '@/data/submissions';

export default function CoordinatorDashboard() {
  const { user, school, schoolId } = useUser();
  const { curriculum, config, coordinatorLabel, shortLabel } = useCurriculum();
  const sidebarLinks = getCoordinatorSidebarLinks(curriculum, config);

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['school-memberships-coord', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });
  const { data: classes = [] } = useQuery({
    queryKey: ['school-classes-coord', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });
  const { data: subjects = [] } = useQuery({
    queryKey: ['school-subjects-coord', schoolId],
    queryFn: () => academics.whereSubjects({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });
  const { data: assignments = [] } = useQuery({
    queryKey: ['school-assignments-coord', schoolId],
    queryFn: () => assignmentsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });
  const { data: submissions = [] } = useQuery({
    queryKey: ['school-submissions-coord', schoolId],
    queryFn: () => submissionsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const students = memberships.filter(m => m.role === 'student');
  const teachers = memberships.filter(m => m.role === 'teacher');

  const completion = classes
    .map((cls) => {
      const classAssignments = assignments.filter(a => a.class_id === cls.id);
      const expected = classAssignments.length * (cls.student_ids || []).length;
      const submitted = submissions.filter(
        s => s.class_id === cls.id && ['submitted', 'graded', 'returned', 'resubmitted', 'late'].includes(s.status),
      ).length;
      return { name: cls.name, completionRate: expected > 0 ? Math.round((submitted / expected) * 100) : 0 };
    })
    .filter(i => i.completionRate > 0)
    .slice(0, 6);

  const cohorts = Object.entries(
    students.reduce((acc, s) => {
      const level = s.grade_level || 'Unassigned';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <RoleGuard allowedRoles={['ib_coordinator', 'school_admin', 'super_admin', 'admin']}>
      <AppSidebar links={sidebarLinks} role="ib_coordinator" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
      <div className="app-offset">
        <AppShell eyebrow={`${shortLabel} · ${format(new Date(), 'd MMMM yyyy')}`} title={coordinatorLabel}>
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl) 0' }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
            </div>
          ) : (
            <>
              <StatRow>
                <StatCard label="Students" value={students.length} />
                <StatCard label="Teachers" value={teachers.length} />
                <StatCard label="Classes" value={classes.length} hint="active" />
                <StatCard label="Subjects" value={subjects.length} />
              </StatRow>

              <Group title="Cohorts">
                {cohorts.length === 0 ? (
                  <GroupEmpty>No students enrolled yet.</GroupEmpty>
                ) : (
                  cohorts.map(([level, count]) => <Row key={level} label={level} value={count} />)
                )}
              </Group>

              <AssignmentCompletionChart data={completion} />

              <Group title="Subjects">
                {subjects.length === 0 ? (
                  <GroupEmpty>No subjects configured for this programme yet.</GroupEmpty>
                ) : (
                  subjects.slice(0, 10).map(s => (
                    <Row key={s.id} label={s.name} detail={s.ib_group?.replace(/_/g, ' ') || ''}>
                      {/* HL/SL is an attribute, not a health status, so it
                          wears the neutral chip — the reserved colours stay
                          for good/warn/crit. */}
                      {s.level && s.level !== 'na' ? <StatusChip>{s.level}</StatusChip> : null}
                    </Row>
                  ))
                )}
              </Group>
            </>
          )}
        </AppShell>
      </div>
    </RoleGuard>
  );
}
