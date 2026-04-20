import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import DemoShell from '@/components/demo-sandbox/DemoShell';
import DemoConclusion from '@/components/demo-sandbox/DemoConclusion';
import AppStyleCard from '@/components/demo-sandbox/AppStyleCard';
import UpcomingDeadlinesTimeline from '@/components/demo-sandbox/student/UpcomingDeadlinesTimeline';
import SubjectProgressList from '@/components/demo-sandbox/student/SubjectProgressList';
import RecentFeedbackList from '@/components/demo-sandbox/student/RecentFeedbackList';
import { Badge } from '@/components/ui/badge';
import {
  STUDENT, TIMETABLE_TODAY, ATTENDANCE, ANNOUNCEMENTS,
  getAssignmentsForStudent, getSubmission, getGradesForStudent,
} from '@/components/demo-sandbox/mockSchoolData';
import {
  BookOpen, ClipboardCheck, Star, BarChart3,
  CalendarDays, MessageSquare, Clock, Megaphone, Target,
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }) {
  const colors = {
    indigo:  'bg-indigo-50 text-indigo-600',
    amber:   'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet:  'bg-violet-50 text-violet-600',
  };
  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-md flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function DemoStudent() {
  const assignments = getAssignmentsForStudent(STUDENT.id);
  const pending = assignments.filter((a) => {
    const s = getSubmission(STUDENT.id, a.id);
    return !s || (s.status !== 'submitted' && s.status !== 'graded');
  });
  const grades = getGradesForStudent(STUDENT.id);
  const avg = grades.length
    ? (grades.reduce((s, g) => s + g.current, 0) / grades.length).toFixed(1)
    : '—';

  // The single most urgent item — answers "what do I need to do next?"
  const nextUp = pending[0];

  return (
    <DemoShell roleKey="student">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">
          Welcome back, {STUDENT.name.split(' ')[0]}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} · {STUDENT.grade} · Advisor {STUDENT.advisor}
        </p>
      </div>

      {/* "What's next?" hero banner */}
      {nextUp && (
        <Link
          data-tour="student-next-up"
          to={`/demo/student/assignment/${nextUp.id}`}
          className="group block mb-6 rounded-md border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="p-4 md:p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-md bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">Up next</p>
              <p className="text-sm md:text-base font-semibold text-slate-900 truncate">
                {nextUp.title}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Due {nextUp.dueIn.toLowerCase()} · {nextUp.dueLabel}
              </p>
            </div>
            <Badge className="bg-indigo-600 text-white border-0 text-xs flex-shrink-0 hidden sm:inline-flex">
              Open →
            </Badge>
          </div>
        </Link>
      )}

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="My classes" value={grades.length} icon={BookOpen} color="indigo" />
        <StatCard label="Assignments due" value={pending.length} icon={ClipboardCheck} color="amber" />
        <StatCard label="Attendance" value={`${ATTENDANCE.present}%`} icon={BarChart3} color="emerald" />
        <StatCard label="Average grade" value={avg} icon={Star} color="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div data-tour="student-deadlines">
            <AppStyleCard
              title="Upcoming deadlines"
              icon={CalendarDays}
              action={<span className="text-xs font-medium text-slate-500">{pending.length} pending</span>}
            >
              <UpcomingDeadlinesTimeline studentId={STUDENT.id} limit={6} />
            </AppStyleCard>
          </div>

          <div data-tour="student-feedback">
            <AppStyleCard title="Recent feedback" icon={MessageSquare}>
              <RecentFeedbackList studentId={STUDENT.id} limit={3} />
            </AppStyleCard>
          </div>
        </div>

        <div className="space-y-6">
          <AppStyleCard title="Today's schedule" icon={Clock}>
            <div className="divide-y divide-slate-50">
              {TIMETABLE_TODAY.map((p, i) => (
                <div key={i} className="px-4 md:px-6 py-3 flex items-start gap-3">
                  <div className="text-[10px] font-bold text-slate-500 w-16 pt-0.5 flex-shrink-0">
                    {p.time.split(' – ')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.subject}</p>
                    <p className="text-[11px] text-slate-500 truncate">{p.room} · {p.teacher}</p>
                  </div>
                </div>
              ))}
            </div>
          </AppStyleCard>

          <div data-tour="student-progress">
            <AppStyleCard title="Progress by subject" icon={BarChart3}>
              <SubjectProgressList studentId={STUDENT.id} />
            </AppStyleCard>
          </div>

          <AppStyleCard title="Announcements" icon={Megaphone}>
            <div className="divide-y divide-slate-50">
              {ANNOUNCEMENTS.map((n) => (
                <div key={n.id} className="px-4 md:px-6 py-3">
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{n.from} · {n.when}</p>
                </div>
              ))}
            </div>
          </AppStyleCard>
        </div>
      </div>

      <DemoConclusion />
    </DemoShell>
  );
}