import React from 'react';
import { useQuery } from '@tanstack/react-query';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import { Panel, PanelRow, PanelRowLink, PanelEmpty } from '@/components/app/Panel';
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
    queryFn: async () => {
      const classIds = classes.map(c => c.id);
      if (classIds.length === 0) return [];
      const all = await assignmentsData.where({ school_id: schoolId, status: 'published' });
      return all.filter(a => classIds.includes(a.class_id));
    },
    enabled: !!schoolId && classes.length > 0,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['student-grades', schoolId, userId],
    queryFn: () => gradebookData.whereGradeItems({ school_id: schoolId, student_id: userId, visible_to_student: true }),
    enabled: !!schoolId && !!userId,
  });

  const upcomingAssignments = assignments.filter(a => a.due_date && new Date(a.due_date) > new Date()).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const average = grades.length > 0
    ? (grades.reduce((s, g) => s + (g.ib_grade || 0), 0) / grades.length).toFixed(1)
    : '—';

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <div className="scholr-page min-h-screen">
        <AppSidebar links={studentLinks} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <header className="mb-6 md:mb-8">
              <p className="scholr-label m-0">{format(new Date(), 'EEEE d MMMM yyyy')}</p>
              <h1 className="scholr-h1 m-0 mt-1.5 text-2xl md:text-3xl">
                Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}
              </h1>
            </header>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand)' }} />
              </div>
            ) : (
              <div className="flex flex-col gap-5 md:gap-6">
                <StatRow>
                  <StatCard label="My classes" value={classes.length} />
                  <StatCard label="Due soon" value={upcomingAssignments.length} hint="not yet past their date" />
                  <StatCard label="Grades" value={grades.length} hint="published to you" />
                  <StatCard label="Average" value={average} hint={grades.length ? 'IB points' : 'nothing to average yet'} />
                </StatRow>

                <Panel title="Today" dark>
                  <TodaySchedule schoolId={schoolId} userId={user?.id} userRole="student" />
                </Panel>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                  <Panel title="Coming up">
                    {upcomingAssignments.length === 0 ? (
                      <PanelEmpty>Nothing due. Anything your teachers set will show up here.</PanelEmpty>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {upcomingAssignments.slice(0, 6).map(a => {
                          const days = differenceInCalendarDays(new Date(a.due_date), new Date());
                          return (
                            <PanelRow
                              key={a.id}
                              name={a.title}
                              detail={a.type?.replace('_', ' ')}
                              // "in 2 days" answers the question the date only
                              // implies, and the date stays for the diary.
                              value={`${days <= 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`} · ${format(new Date(a.due_date), 'd MMM')}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </Panel>

                  <Panel title="My classes">
                    {classes.length === 0 ? (
                      <PanelEmpty>You're not enrolled in any classes yet.</PanelEmpty>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {classes.map(c => (
                          <PanelRowLink
                            key={c.id}
                            as="a"
                            href={createPageUrl('ClassWorkspace') + `?class_id=${c.id}`}
                          >
                            <PanelRow name={c.name} value={c.room ? `Room ${c.room}` : ''} />
                          </PanelRowLink>
                        ))}
                      </div>
                    )}
                  </Panel>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
