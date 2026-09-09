import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isAfter, addDays } from 'date-fns';
import { Clock, BarChart3, CalendarX, CheckCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as classesData from '@/data/classes';
import * as assignmentsData from '@/data/assignments';
import * as gradebookData from '@/data/gradebook';
import * as attendanceData from '@/data/attendance';
import * as messagesData from '@/data/messages';

function SectionHeader({ icon: Icon, title, color }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-${color}-50 rounded-t-md`}>
      <Icon className={`w-4 h-4 text-${color}-600`} />
      <h3 className={`text-sm font-bold uppercase tracking-wide text-${color}-900`}>{title}</h3>
    </div>
  );
}

function EmptyRow({ text }) {
  return <p className="px-4 py-6 text-xs text-slate-400 text-center">{text}</p>;
}

export default function ParentDashboardHome({ schoolId, studentId, parentUserId }) {
  const queryClient = useQueryClient();
  const now = new Date();

  // Fetch child's classes
  const { data: classes = [] } = useQuery({
    queryKey: ['parent-child-classes', schoolId, studentId],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => c.student_ids?.includes(studentId));
    },
    enabled: !!schoolId && !!studentId,
  });

  const classIds = classes.map(c => c.id);

  // Upcoming deadlines
  const { data: assignments = [] } = useQuery({
    queryKey: ['parent-child-assignments', schoolId, studentId],
    queryFn: async () => {
      const all = await assignmentsData.where({ school_id: schoolId, status: 'published' });
      return all
        .filter(a => classIds.includes(a.class_id) && a.due_date && isAfter(new Date(a.due_date), now))
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    },
    enabled: !!schoolId && classIds.length > 0,
  });

  // Recent grades (released to parent)
  const { data: grades = [] } = useQuery({
    queryKey: ['parent-child-grades', schoolId, studentId],
    queryFn: async () => {
      const all = await gradebookData.whereGradeItems({
        school_id: schoolId,
        student_id: studentId,
        visible_to_parent: true,
        status: 'published',
      });
      return all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
    },
    enabled: !!schoolId && !!studentId,
  });

  // Recent attendance issues
  const { data: attendance = [] } = useQuery({
    queryKey: ['parent-child-attendance-issues', schoolId, studentId],
    queryFn: async () => {
      const cutoff = format(addDays(now, -30), 'yyyy-MM-dd');
      const all = await attendanceData.whereRecords({ school_id: schoolId, student_id: studentId });
      return all
        .filter(a => a.status !== 'present' && a.date >= cutoff)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6);
    },
    enabled: !!schoolId && !!studentId,
  });

  // Messages for this parent
  const { data: messages = [] } = useQuery({
    queryKey: ['parent-messages', schoolId, parentUserId],
    queryFn: async () => {
      const all = await messagesData.where({ school_id: schoolId });
      return all
        .filter(m => m.recipient_ids?.includes(parentUserId))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 8);
    },
    enabled: !!schoolId && !!parentUserId,
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (msg) => {
      const readBy = Array.from(new Set([...(msg.read_by || []), parentUserId]));
      return messagesData.update(msg.id, { read_by: readBy });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-messages', schoolId, parentUserId] });
    },
  });

  const unreadMessages = messages.filter(m => !m.read_by?.includes(parentUserId));
  const readMessages = messages.filter(m => m.read_by?.includes(parentUserId));

  const urgencyColor = (dueDate) => {
    const diff = (new Date(dueDate) - now) / (1000 * 60 * 60 * 24);
    if (diff <= 2) return 'bg-red-100 text-red-700';
    if (diff <= 7) return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  };

  const ibGradeColor = (g) => g >= 6 ? 'text-emerald-600' : g >= 4 ? 'text-amber-600' : 'text-red-600';

  const attendanceStatusColor = { absent: 'bg-red-100 text-red-700', late: 'bg-amber-100 text-amber-700', excused: 'bg-blue-100 text-blue-700' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

      {/* Upcoming Deadlines */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm">
        <SectionHeader icon={Clock} title="Upcoming Deadlines" color="amber" />
        {assignments.length === 0
          ? <EmptyRow text="No upcoming deadlines" />
          : <div className="divide-y divide-slate-50">
              {assignments.slice(0, 6).map(a => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{a.type?.replace(/_/g, ' ')}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${urgencyColor(a.due_date)}`}>
                    {format(new Date(a.due_date), 'MMM d')}
                  </span>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Recent Grade Releases */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm">
        <SectionHeader icon={BarChart3} title="Recent Grade Releases" color="emerald" />
        {grades.length === 0
          ? <EmptyRow text="No grades released yet" />
          : <div className="divide-y divide-slate-50">
              {grades.map(g => (
                <div key={g.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{g.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {g.score != null && g.max_score ? `${g.score} / ${g.max_score}` : ''}
                      {g.created_at ? ` · ${format(new Date(g.created_at), 'MMM d')}` : ''}
                    </p>
                  </div>
                  {g.ib_grade != null && (
                    <span className={`text-lg font-bold flex-shrink-0 ${ibGradeColor(g.ib_grade)}`}>{g.ib_grade}</span>
                  )}
                  {g.percentage != null && g.ib_grade == null && (
                    <span className="text-sm font-semibold text-slate-700 flex-shrink-0">{g.percentage}%</span>
                  )}
                </div>
              ))}
            </div>
        }
      </div>

      {/* Attendance Notifications */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm">
        <SectionHeader icon={CalendarX} title="Attendance Notifications" color="rose" />
        {attendance.length === 0
          ? <EmptyRow text="No attendance issues in the last 30 days" />
          : <div className="divide-y divide-slate-50">
              {attendance.map(a => (
                <div key={a.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{format(new Date(a.date), 'EEEE, MMM d')}</p>
                    {a.note && <p className="text-xs text-slate-400 mt-0.5 truncate">{a.note}</p>}
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize flex-shrink-0 ${attendanceStatusColor[a.status] || 'bg-slate-100 text-slate-600'}`}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Messages — Acknowledge */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm">
        <SectionHeader icon={Bell} title={`Messages ${unreadMessages.length > 0 ? `(${unreadMessages.length} unread)` : ''}`} color="indigo" />
        {messages.length === 0
          ? <EmptyRow text="No messages" />
          : <div className="divide-y divide-slate-50 max-h-80 overflow-y-auto">
              {unreadMessages.map(msg => (
                <div key={msg.id} className="px-4 py-3 bg-indigo-50/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{msg.subject}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{msg.sender_name} · {format(new Date(msg.created_at), 'MMM d')}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs flex-shrink-0 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      onClick={() => acknowledgeMutation.mutate(msg)}
                      disabled={acknowledgeMutation.isPending}
                    >
                      <CheckCircle className="w-3 h-3 mr-1" /> Acknowledge
                    </Button>
                  </div>
                </div>
              ))}
              {readMessages.map(msg => (
                <div key={msg.id} className="px-4 py-3 opacity-60">
                  <p className="text-sm text-slate-600 truncate">{msg.subject}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{msg.sender_name} · {format(new Date(msg.created_at), 'MMM d')}</p>
                </div>
              ))}
            </div>
        }
      </div>

    </div>
  );
}