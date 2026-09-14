import React from 'react';
import { useQuery } from '@tanstack/react-query';
import * as classesData from '@/data/classes';
import * as assignmentsData from '@/data/assignments';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import AppShell, { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import TodaySchedule from '@/components/timetable/TodaySchedule';
import { useUser } from '@/components/auth/UserContext';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getAppSidebarLinks } from '@/components/app/sidebarLinks';

export default function TeacherDashboard() {
  const { user, school, schoolId, effectiveUserId } = useUser();
  const userId = effectiveUserId || user?.id;

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['teacher-classes', schoolId, userId],
    // Was: fetch every active class in the school, then filter in the browser
    // on teacher_ids. Now the array containment runs in Postgres.
    queryFn: () => classesData.listForTeacher(schoolId, userId),
    enabled: !!schoolId && !!userId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['teacher-assignments', schoolId, userId],
    queryFn: () => assignmentsData.listForTeacher(schoolId, userId),
    enabled: !!schoolId && !!userId,
  });

  const pendingAssignments = assignments.filter(a => a.status === 'published');
  const totalStudents = classes.reduce((sum, c) => sum + (c.student_ids?.length || 0), 0);
  const firstName = user?.full_name?.split(' ')[0];

  return (
    <RoleGuard allowedRoles={['teacher', 'school_admin', 'super_admin', 'admin']}>
      <AppSidebar
        links={getAppSidebarLinks('teacher')}
        role="teacher"
        schoolName={school?.name}
        userName={user?.full_name}
        userId={user?.id}
        schoolId={schoolId}
      />
      <div className="md:pl-[15.5rem]">
        <AppShell
          eyebrow={format(new Date(), 'EEEE d MMMM')}
          title={firstName ? `Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${firstName}` : 'Today'}
        >
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl) 0' }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
            </div>
          ) : (
            <>
              <StatRow>
                <StatCard label="Classes" value={classes.length} />
                <StatCard label="Students" value={totalStudents} hint="across those classes" />
                <StatCard label="Live assignments" value={pendingAssignments.length} />
                <StatCard label="To grade" value={0} />
              </StatRow>

              <Group title="Today">
                <div style={{ padding: '.35rem .9rem .8rem' }}>
                  <TodaySchedule schoolId={schoolId} userId={user?.id} userRole="teacher" />
                </div>
              </Group>

              <Group title="Recent assignments">
                {assignments.length === 0 ? (
                  <GroupEmpty>Nothing set yet — assignments you create appear here.</GroupEmpty>
                ) : (
                  assignments.slice(0, 6).map(a => (
                    <Row
                      key={a.id}
                      label={a.title}
                      detail={a.type?.replace('_', ' ')}
                      value={a.due_date ? `due ${format(new Date(a.due_date), 'd MMM')}` : 'no due date'}
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
