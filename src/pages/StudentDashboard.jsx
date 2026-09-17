import React from 'react';
import { useQuery } from '@tanstack/react-query';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import AppShell, { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import TodaySchedule from '@/components/timetable/TodaySchedule';
import { useUser } from '@/components/auth/UserContext';
import { Loader2 } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { createPageUrl } from '@/utils';
import { getStudentSidebarLinks } from '@/components/app/studentSidebarLinks';
import * as classesData from '@/data/classes';
import * as assignmentsData from '@/data/assignments';
import * as gradebookData from '@/data/gradebook';

export default function StudentDashboard() {
  const { user, school, schoolId, curriculum, effectiveUserId } = useUser();
  const userId = effectiveUserId || user?.id;
  const studentLinks = getStudentSidebarLinks(curriculum);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['student-classes', schoolId, userId],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => c.student_ids?.includes(userId));
    },
    enabled: !!schoolId && !!userId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['student-assignments', schoolId, userId],
    queryFn: () => assignmentsData.listPublishedForClasses(classes.map(c => c.id)),
    enabled: !!schoolId && classes.length > 0,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['student-grades', schoolId, userId],
    queryFn: () => gradebookData.whereGradeItems({ school_id: schoolId, student_id: userId, visible_to_student: true }),
    enabled: !!schoolId && !!userId,
  });

  const upcoming = assignments
    .filter(a => a.due_date && new Date(a.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const average = grades.length > 0
    ? (grades.reduce((s, g) => s + (g.ib_grade || 0), 0) / grades.length).toFixed(1)
    : '—';

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
                <StatCard label="Classes" value={classes.length} />
                <StatCard label="Due soon" value={upcoming.length} hint="not yet past their date" />
                <StatCard label="Grades" value={grades.length} hint="released to you" />
                <StatCard label="Average" value={average} hint={grades.length ? 'IB points' : 'nothing to average yet'} />
              </StatRow>

              <Group title="Today">
                <div style={{ padding: '.35rem .9rem .8rem' }}>
                  <TodaySchedule schoolId={schoolId} userId={user?.id} userRole="student" />
                </div>
              </Group>

              <Group title="Coming up">
                {upcoming.length === 0 ? (
                  <GroupEmpty>Nothing due. Anything your teachers set will show up here.</GroupEmpty>
                ) : (
                  upcoming.slice(0, 6).map(a => {
                    const days = differenceInCalendarDays(new Date(a.due_date), new Date());
                    return (
                      <Row
                        key={a.id}
                        label={a.title}
                        detail={a.type?.replace('_', ' ')}
                        // "in 2 days" answers the question the date only
                        // implies; the date stays for the diary.
                        value={`${days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`} · ${format(new Date(a.due_date), 'd MMM')}`}
                      />
                    );
                  })
                )}
              </Group>

              <Group title="My classes">
                {classes.length === 0 ? (
                  <GroupEmpty>You're not enrolled in any classes yet.</GroupEmpty>
                ) : (
                  classes.map(c => (
                    <Row
                      key={c.id}
                      label={c.name}
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
