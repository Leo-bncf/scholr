import React from 'react';
import { useQuery } from '@tanstack/react-query';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import StatCard from '@/components/app/StatCard';
import TodaySchedule from '@/components/timetable/TodaySchedule';
import { useUser } from '@/components/auth/UserContext';
import { BookOpen, ClipboardCheck, BarChart3, Star, Loader2, Clock
} from 'lucide-react';
import { format } from 'date-fns';
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

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={studentLinks} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 md:mb-8">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}</h1>
              <p className="text-xs md:text-sm text-slate-500 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard label="My Classes" value={classes.length} icon={BookOpen} color="indigo" />
                  <StatCard label="Assignments Due" value={upcomingAssignments.length} icon={ClipboardCheck} color="amber" />
                  <StatCard label="Grades" value={grades.length} icon={BarChart3} color="emerald" />
                  <StatCard label="Average" value={grades.length > 0 ? (grades.reduce((s, g) => s + (g.ib_grade || 0), 0) / grades.length).toFixed(1) : '—'} icon={Star} color="violet" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-white rounded-md border border-slate-200 shadow-sm">
                    <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 bg-slate-50 rounded-t-md">
                      <h2 className="font-bold text-sm md:text-base text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                        <Clock className="w-4 md:w-5 h-4 md:h-5 text-blue-600 flex-shrink-0" />
                        <span>Today's Schedule</span>
                      </h2>
                    </div>
                    <div className="p-4 md:p-6">
                      <TodaySchedule schoolId={schoolId} userId={user?.id} userRole="student" />
                    </div>
                  </div>

                  <div className="bg-white rounded-md border border-slate-200 shadow-sm">
                    <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 bg-slate-50 rounded-t-md">
                      <h2 className="font-bold text-sm md:text-base text-slate-900 uppercase tracking-wide">Upcoming Assignments</h2>
                    </div>
                    {upcomingAssignments.length === 0 ? (
                      <div className="p-6 md:p-12 text-center text-slate-400 text-xs md:text-sm">No upcoming assignments</div>
                    ) : (
                      <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                        {upcomingAssignments.slice(0, 6).map(a => (
                          <div key={a.id} className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-900 text-xs md:text-sm truncate">{a.title}</p>
                              <p className="text-xs text-slate-400 capitalize truncate">{a.type?.replace('_', ' ')}</p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400" />
                              <span className="text-xs text-slate-500">{format(new Date(a.due_date), 'MMM d')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-md border border-slate-200 shadow-sm lg:col-span-2">
                    <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-200 bg-slate-50 rounded-t-md">
                      <h2 className="font-bold text-sm md:text-base text-slate-900 uppercase tracking-wide">My Classes</h2>
                    </div>
                    {classes.length === 0 ? (
                      <div className="p-6 md:p-12 text-center text-slate-400 text-xs md:text-sm">No classes enrolled</div>
                    ) : (
                      <div className="divide-y divide-slate-50">
                        {classes.map(c => (
                          <a key={c.id} href={createPageUrl('ClassWorkspace') + `?class_id=${c.id}`}>
                            <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 text-xs md:text-sm truncate">{c.name}</p>
                                <p className="text-xs text-slate-400 truncate">{c.room ? `Room ${c.room}` : ''}</p>
                              </div>
                            </div>
                          </a>
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