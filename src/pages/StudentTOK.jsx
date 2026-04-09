import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { STUDENT_SIDEBAR_LINKS } from '@/components/app/studentSidebarLinks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, BookOpen, ClipboardCheck, BarChart3, 
  MessageSquare, Star, Loader2, FileText, Clock, Upload
} from 'lucide-react';
import { format } from 'date-fns';

const sidebarLinks = [
  { label: 'Dashboard', page: 'StudentDashboard', icon: LayoutDashboard },
  { label: 'Academic', page: 'StudentAcademicDashboard', icon: BarChart3 },
  { label: 'IB Core', page: 'StudentIBCore', icon: Star },
  { label: 'Messages', page: 'StudentCommunication', icon: MessageSquare },
];

const taskTypeLabels = {
  exhibition_planning: 'Exhibition Planning',
  exhibition_draft: 'Exhibition Draft',
  exhibition_final: 'Exhibition Final',
  essay_planning: 'Essay Planning',
  essay_draft: 'Essay Draft',
  essay_final: 'Essay Final',
  presentation: 'Presentation',
  reflection: 'Reflection',
  reading: 'Reading',
  other: 'Other'
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  submitted: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-purple-100 text-purple-700',
  graded: 'bg-green-100 text-green-700'
};

export default function StudentTOK() {
  const { user, school, schoolId } = useUser();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['student-tok', schoolId, user?.id],
    queryFn: async () => {
      const studentTasks = await base44.entities.TOKTask.filter({ school_id: schoolId, student_id: user.id });
      const classWideTasks = await base44.entities.TOKTask.filter({ school_id: schoolId, is_class_wide: true });
      return [...studentTasks, ...classWideTasks];
    },
    enabled: !!schoolId && !!user?.id,
  });

  const upcomingTasks = tasks.filter(t => t.status === 'pending' && t.due_date && new Date(t.due_date) > new Date()).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const completedTasks = tasks.filter(t => t.status === 'graded' || t.status === 'reviewed');

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={STUDENT_SIDEBAR_LINKS} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        
        <main className="ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">IB Core: Theory of Knowledge</h1>
              <p className="text-slate-600">Track your TOK assignments, reflections, and projects</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <p className="text-sm text-slate-500 mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-slate-900">{tasks.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <p className="text-sm text-slate-500 mb-1">Pending</p>
                <p className="text-3xl font-bold text-amber-600">{tasks.filter(t => t.status === 'pending').length}</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <p className="text-sm text-slate-500 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">{completedTasks.length}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Upcoming Tasks</h2>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : upcomingTasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No upcoming tasks</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingTasks.map(task => (
                      <div key={task.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-slate-900">{task.title}</h3>
                          <Badge variant="outline" className="capitalize">{taskTypeLabels[task.task_type]}</Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                          </span>
                          <Button size="sm" variant="outline">
                            <Upload className="w-3 h-3 mr-1" />
                            Submit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">All Tasks</h2>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No TOK tasks yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {tasks.map(task => (
                      <div key={task.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-slate-900 text-sm">{task.title}</h3>
                          <Badge className={statusColors[task.status]} size="sm">{task.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="capitalize">{taskTypeLabels[task.task_type]}</span>
                          {task.due_date && (
                            <span>{format(new Date(task.due_date), 'MMM d')}</span>
                          )}
                        </div>
                        {task.teacher_feedback && task.status === 'reviewed' && (
                          <div className="mt-2 bg-slate-50 rounded p-2">
                            <p className="text-xs text-slate-600">{task.teacher_feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}