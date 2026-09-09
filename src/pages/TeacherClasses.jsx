import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { useUser } from '@/components/auth/UserContext';
import { LayoutDashboard, BookOpen, MessageSquare, Loader2, Users } from 'lucide-react';
import { createPageUrl } from '@/utils';
import * as classesData from '@/data/classes';

const sidebarLinks = [
  { label: 'Dashboard', page: 'TeacherDashboard', icon: LayoutDashboard },
  { label: 'My Classes', page: 'TeacherClasses', icon: BookOpen },
  { label: 'Messages', page: 'Messages', icon: MessageSquare },
];

export default function TeacherClasses() {
  const { user, school, schoolId } = useUser();
  const [statusFilter, setStatusFilter] = useState('active');

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['teacher-classes', schoolId, user?.id],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId });
      return all.filter(c => c.teacher_ids?.includes(user.id));
    },
    enabled: !!schoolId && !!user?.id,
  });

  const filteredClasses = classes.filter(c => statusFilter === 'all' || c.status === statusFilter);
  const activeCount = classes.filter(c => c.status === 'active').length;
  const archivedCount = classes.filter(c => c.status === 'archived').length;
  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-blue-500'];

  return (
    <RoleGuard allowedRoles={['teacher', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={sidebarLinks} role="teacher" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">My Classes</h1>
              <p className="text-sm text-slate-500 mt-1">Classes you're teaching</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
            ) : classes.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 p-16 text-center">
                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No classes assigned yet</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  {[
                    { key: 'active', label: 'Active', count: activeCount, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { key: 'archived', label: 'Archived', count: archivedCount, color: 'bg-slate-100 text-slate-500 border-slate-200' },
                    { key: 'all', label: 'All', count: classes.length, color: 'bg-white text-slate-600 border-slate-200' },
                  ].map(({ key, label, count, color }) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${color} ${statusFilter === key ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
                    >
                      {label} <span className="font-bold">{count}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredClasses.map((c, i) => (
                  <a key={c.id} href={createPageUrl('ClassWorkspace') + `?class_id=${c.id}`}>
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <div className={`h-2 ${colors[i % colors.length]}`} />
                      <div className="p-6">
                        <h3 className="font-bold text-slate-900 text-lg">{c.name}</h3>
                        <p className="text-sm text-slate-400 mt-1">{c.section ? `Section ${c.section}` : ''} {c.room ? `· Room ${c.room}` : ''}</p>
                        <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                          <Users className="w-4 h-4" />
                          <span>{c.student_ids?.length || 0} students</span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              </>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}