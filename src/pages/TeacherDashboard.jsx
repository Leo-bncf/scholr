import React from 'react';
import { useQuery } from '@tanstack/react-query';
import * as classesData from '@/data/classes';
import * as assignmentsData from '@/data/assignments';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import StatCard from '@/components/app/StatCard';
import TodaySchedule from '@/components/timetable/TodaySchedule';
import { useUser } from '@/components/auth/UserContext';
import { Loader2, Clock, AlertCircle, BookOpen, Users, ClipboardCheck } from 'lucide-react';
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
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={getAppSidebarLinks('teacher')} role="teacher" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 md:mb-8">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.full_name?.split(' ')[0] || 'Teacher'}</h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard label="My Classes" value={classes.length} icon={BookOpen} color="indigo" />
                  <StatCard label="Total Students" value={totalStudents} icon={Users} color="emerald" />
                  <StatCard label="Active Assignments" value={pendingAssignments.length} icon={ClipboardCheck} color="amber" />
                  <StatCard label="To Grade" value={0} icon={AlertCircle} color="rose" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white rounded-md border border-slate-200 shadow-sm">
                    <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 bg-slate-50 rounded-t-md">
                      <h2 className="font-bold text-sm md:text-base text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                        <Clock className="w-4 md:w-5 h-4 md:h-5 text-blue-600 flex-shrink-0" />
                        <span>Today's Teaching Schedule</span>
                      </h2>
                    </div>
                    <div className="p-4 md:p-6">
                      <TodaySchedule schoolId={schoolId} userId={user?.id} userRole="teacher" />
                    </div>
                  </div>

                  <div className="bg-white rounded-md border border-slate-200 shadow-sm">
                    <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 bg-slate-50 rounded-t-md">
                      <h2 className="font-bold text-sm md:text-base text-slate-900 uppercase tracking-wide">Recent Assignments</h2>
                    </div>
                    {assignments.length === 0 ? (
                      <div className="p-6 md:p-12 text-center text-slate-400 text-xs md:text-sm">No assignments yet</div>
                    ) : (
                      <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                        {assignments.slice(0, 6).map(a => (
                          <div key={a.id} className="px-4 md:px-6 py-3 md:py-4">
                            <p className="font-medium text-slate-900 text-xs md:text-sm truncate">{a.title}</p>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              {a.type?.replace('_', ' ')} · Due {a.due_date ? format(new Date(a.due_date), 'MMM d') : 'TBD'}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}