import React from 'react';
import { useQuery } from '@tanstack/react-query';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import AppShell, { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import TodaySchedule from '@/components/timetable/TodaySchedule';
import DiplomaProgress from '@/components/student/DiplomaProgress';
import UpcomingDeadlines from '@/components/student/UpcomingDeadlines';
import { useUser } from '@/components/auth/UserContext';
import { useCurriculum } from '@/hooks/useCurriculum';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import { getStudentSidebarLinks } from '@/components/app/studentSidebarLinks';
import * as classesData from '@/data/classes';
import * as assignmentsData from '@/data/assignments';
import * as gradebookData from '@/data/gradebook';

export default function StudentDashboard() {
  const { user, school, schoolId, curriculum, effectiveUserId } = useUser();
  const { isIBDP } = useCurriculum();
  const userId = effectiveUserId || user?.id;
  const studentLinks = getStudentSidebarLinks(curriculum);

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['student-classes', schoolId, userId],
    queryFn: () => classesData.listForStudent(schoolId, userId),
    enabled: !!schoolId && !!userId,
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['student-assignments', schoolId, userId],
    queryFn: () => {
      const classIds = classes.map(c => c.id);
      if (classIds.length === 0) return Promise.resolve([]);
      return assignmentsData.listPublishedForClasses(classIds);
    },
    enabled: !!schoolId && classes.length > 0,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['student-grades', schoolId, userId],
    queryFn: () => gradebookData.listForStudent(schoolId, userId),
    enabled: !!schoolId && !!userId,
  });

  const { data: predictedGrades = [] } = useQuery({
    queryKey: ['student-predicted-grades', schoolId, userId],
    queryFn: () => gradebookData.listPredicted(schoolId, { studentId: userId }),
    enabled: !!schoolId && !!userId && isIBDP,
  });

  const upcoming = assignments
    .filter(a => a.due_date && new Date(a.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const average = grades.length > 0
    ? (grades.reduce((s, g) => s + (g.ib_grade || 0), 0) / grades.length).toFixed(1)
    : '—';

  const isLoading = classesLoading || assignmentsLoading;

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <AppSidebar links={studentLinks} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
      <div className="app-offset">
        <AppShell
          eyebrow={format(new Date(), 'EEEE d MMMM')}
          title={user?.full_name?.split(' ')[0] ? `Hello, ${user.full_name.split(' ')[0]}` : 'Today'}
        >
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl) 0' }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
            </div>
          ) : (
            <>
              <StatRow>
                <StatCard label="Enrolled Classes" value={classes.length} />
                <StatCard label="Due Soon" value={upcoming.length} hint="next fortnight" />
                <StatCard label="Released Grades" value={grades.length} />
                <StatCard label="Average" value={average} hint={grades.length ? 'IB points' : 'awaiting grades'} />
              </StatRow>

              {/* IB Diploma Requirements & Passing Rules */}
              {isIBDP && (
                <DiplomaProgress
                  classes={classes}
                  grades={grades}
                  predictedGrades={predictedGrades}
                  tokGrade="B"
                  eeGrade="B"
                  casFulfilled={true}
                />
              )}

              {/* Today's Schedule */}
              <Group title="Today">
                <div style={{ padding: '.35rem .9rem .8rem' }}>
                  <TodaySchedule schoolId={schoolId} userId={user?.id} userRole="student" />
                </div>
              </Group>

              {/* Upcoming Deadlines */}
              <UpcomingDeadlines assignments={assignments} />

              {/* My Classes */}
              <Group title="My Classes">
                {classes.length === 0 ? (
                  <GroupEmpty>You're not enrolled in any classes yet.</GroupEmpty>
                ) : (
                  classes.map(c => (
                    <Row
                      key={c.id}
                      label={c.name}
                      detail={c.subject?.name}
                      value={c.room ? `Room ${c.room}` : ''}
                      href={createPageUrl('ClassWorkspace') + `?class_id=${c.id}`}
                    />
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
