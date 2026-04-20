import React, { useState } from 'react';
import { format } from 'date-fns';
import DemoShell from '@/components/demo-sandbox/DemoShell';
import AppStyleCard from '@/components/demo-sandbox/AppStyleCard';
import ChildSwitcher from '@/components/demo-sandbox/parent/ChildSwitcher';
import ParentDeadlinesList from '@/components/demo-sandbox/parent/ParentDeadlinesList';
import ParentFeedbackList from '@/components/demo-sandbox/parent/ParentFeedbackList';
import ParentSubjectSummary from '@/components/demo-sandbox/parent/ParentSubjectSummary';
import {
  PARENT, ANNOUNCEMENTS, ATTENDANCE,
  getGradesForStudent, getAssignmentsForStudent, getSubmission,
  getFeedbackForStudent,
} from '@/components/demo-sandbox/mockSchoolData';
import {
  Heart, CalendarDays, MessageSquare, BarChart3, Megaphone,
  CheckCircle2, BookOpen, Star, Sparkles,
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

export default function DemoParent() {
  const [selectedChild, setSelectedChild] = useState(PARENT.children[0]);

  const grades = getGradesForStudent(selectedChild.id);
  const pending = getAssignmentsForStudent(selectedChild.id).filter((a) => {
    const s = getSubmission(selectedChild.id, a.id);
    return !s || (s.status !== 'submitted' && s.status !== 'graded');
  });
  const feedbackCount = getFeedbackForStudent(selectedChild.id).length;
  const avg = grades.length
    ? (grades.reduce((s, g) => s + g.current, 0) / grades.length).toFixed(1)
    : '—';

  return (
    <DemoShell roleKey="parent">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">
          Welcome, {PARENT.name.split(' ')[0]}
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} · {PARENT.children.length} {PARENT.children.length === 1 ? 'child' : 'children'} at {selectedChild.grade.startsWith('DP') ? 'Meridian International' : 'school'}
        </p>
      </div>

      <div data-tour="parent-switcher">
        <ChildSwitcher
          children={PARENT.children}
          selectedId={selectedChild.id}
          onSelect={setSelectedChild}
        />
      </div>

      {/* Key promise banner — sets the whole tone */}
      <div className="mb-6 rounded-md border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-4 md:p-5 flex items-center gap-4">
        <div className="h-11 w-11 rounded-md bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">Everything about {selectedChild.name.split(' ')[0]}, in one place</p>
          <p className="text-sm md:text-base font-semibold text-slate-900">
            No more chasing emails or fragmented updates.
          </p>
        </div>
      </div>

      {/* At-a-glance stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Average grade" value={avg} icon={Star} color="violet" />
        <StatCard label="Due soon" value={pending.length} icon={CalendarDays} color="amber" />
        <StatCard label="Attendance" value={`${ATTENDANCE.present}%`} icon={CheckCircle2} color="emerald" />
        <StatCard label="Teacher notes" value={feedbackCount} icon={MessageSquare} color="indigo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div data-tour="parent-deadlines">
            <AppStyleCard
              title="Upcoming deadlines"
              icon={CalendarDays}
              action={<span className="text-xs font-medium text-slate-500">{pending.length} pending</span>}
            >
              <ParentDeadlinesList studentId={selectedChild.id} limit={5} />
            </AppStyleCard>
          </div>

          <div data-tour="parent-feedback">
            <AppStyleCard title="Recent feedback from teachers" icon={MessageSquare}>
              <ParentFeedbackList studentId={selectedChild.id} limit={3} />
            </AppStyleCard>
          </div>
        </div>

        <div className="space-y-6">
          <AppStyleCard title="Performance by subject" icon={BarChart3}>
            <ParentSubjectSummary studentId={selectedChild.id} />
          </AppStyleCard>

          <AppStyleCard title="Attendance this term" icon={Heart}>
            <div className="p-4 md:p-5 grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-md bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-600">{ATTENDANCE.present}%</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 mt-1">Present</p>
              </div>
              <div className="p-3 rounded-md bg-amber-50">
                <p className="text-2xl font-bold text-amber-600">{ATTENDANCE.late}%</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mt-1">Late</p>
              </div>
              <div className="p-3 rounded-md bg-rose-50">
                <p className="text-2xl font-bold text-rose-600">{ATTENDANCE.absent}%</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-700 mt-1">Absent</p>
              </div>
            </div>
          </AppStyleCard>

          <AppStyleCard title="School notices" icon={Megaphone}>
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
    </DemoShell>
  );
}