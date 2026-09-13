import React from 'react';
import { useQuery } from '@tanstack/react-query';
import * as classesData from '@/data/classes';
import * as assignmentsData from '@/data/assignments';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import { Panel, PanelRow, PanelEmpty } from '@/components/app/Panel';
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

  return (
    <RoleGuard allowedRoles={['teacher', 'school_admin', 'super_admin', 'admin']}>
      <div className="cobalt-page min-h-screen">
        <AppSidebar links={getAppSidebarLinks('teacher')} role="teacher" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <header className="mb-6 md:mb-8">
              <p className="cobalt-label m-0">{format(new Date(), 'EEEE d MMMM yyyy')}</p>
              <h1 className="cobalt-h1 m-0 mt-1.5 text-2xl md:text-3xl">
                Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.full_name?.split(' ')[0] || 'Teacher'}
              </h1>
            </header>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--cobalt)' }} />
              </div>
            ) : (
              <div className="flex flex-col gap-5 md:gap-6">
                <StatRow>
                  <StatCard label="My classes" value={classes.length} />
                  <StatCard label="Students" value={totalStudents} hint="across those classes" />
                  <StatCard label="Live assignments" value={pendingAssignments.length} />
                  <StatCard label="To grade" value={0} />
                </StatRow>

                {/* The dark beat: what's on right now. A teacher opens this page
                    between periods, so the timetable outranks everything else. */}
                <Panel title="Today" dark>
                  <TodaySchedule schoolId={schoolId} userId={user?.id} userRole="teacher" />
                </Panel>

                <Panel title="Recent assignments">
                  {assignments.length === 0 ? (
                    <PanelEmpty>Nothing set yet — assignments you create appear here.</PanelEmpty>
                  ) : (
                    <div className="max-h-96 overflow-y-auto">
                      {assignments.slice(0, 6).map(a => (
                        <PanelRow
                          key={a.id}
                          name={a.title}
                          detail={a.type?.replace('_', ' ')}
                          value={a.due_date ? `due ${format(new Date(a.due_date), 'd MMM')}` : 'no due date'}
                        />
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
