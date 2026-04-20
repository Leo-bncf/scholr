import React from 'react';
import DemoShell from '@/components/demo-sandbox/DemoShell';
import DemoSectionCard from '@/components/demo-sandbox/DemoSectionCard';
import { STUDENT, GRADES, UPCOMING_ASSIGNMENTS, TIMETABLE_TODAY, ANNOUNCEMENTS, ATTENDANCE } from '@/components/demo-sandbox/mockSchoolData';
import { TrendingUp, TrendingDown, Minus, Clock, BookOpen, Bell, CheckCircle2 } from 'lucide-react';

const trendIcon = (t) => {
  if (t === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (t === 'down') return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
};

const statusStyle = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-100 text-amber-700',
  submitted: 'bg-emerald-100 text-emerald-700',
};

export default function DemoStudent() {
  return (
    <DemoShell roleKey="student">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Good afternoon, {STUDENT.name.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500 mt-1">{STUDENT.grade} · Advisor: {STUDENT.advisor}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DemoSectionCard title="Upcoming assignments" action={<span className="text-xs font-medium text-slate-500">{UPCOMING_ASSIGNMENTS.length} due soon</span>}>
            <div className="space-y-3">
              {UPCOMING_ASSIGNMENTS.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{a.title}</p>
                      <p className="text-xs text-slate-500">{a.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${statusStyle[a.status]}`}>
                      {a.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {a.dueIn}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </DemoSectionCard>

          <DemoSectionCard title="My grades" action={<span className="text-xs font-medium text-slate-500">Term 2</span>}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {GRADES.map((g) => (
                <div key={g.subject} className="p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-800 truncate pr-2">{g.subject}</p>
                    {trendIcon(g.trend)}
                  </div>
                  <div className="flex items-baseline gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Current</p>
                      <p className="text-2xl font-bold text-slate-900">{g.current}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Predicted</p>
                      <p className="text-2xl font-bold text-sky-600">{g.predicted}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DemoSectionCard>
        </div>

        <div className="space-y-6">
          <DemoSectionCard title="Today's schedule">
            <div className="space-y-2">
              {TIMETABLE_TODAY.map((p, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-500 w-20 pt-0.5 flex-shrink-0">{p.time.split(' – ')[0]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.subject}</p>
                    <p className="text-xs text-slate-500">{p.room} · {p.teacher}</p>
                  </div>
                </div>
              ))}
            </div>
          </DemoSectionCard>

          <DemoSectionCard title="Attendance">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-xl bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-600">{ATTENDANCE.present}%</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 mt-1">Present</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50">
                <p className="text-2xl font-bold text-amber-600">{ATTENDANCE.late}%</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mt-1">Late</p>
              </div>
              <div className="p-3 rounded-xl bg-rose-50">
                <p className="text-2xl font-bold text-rose-600">{ATTENDANCE.absent}%</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-700 mt-1">Absent</p>
              </div>
            </div>
          </DemoSectionCard>

          <DemoSectionCard title="Announcements" action={<Bell className="w-4 h-4 text-slate-400" />}>
            <div className="space-y-3">
              {ANNOUNCEMENTS.map((n) => (
                <div key={n.id} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.from} · {n.when}</p>
                  </div>
                </div>
              ))}
            </div>
          </DemoSectionCard>
        </div>
      </div>
    </DemoShell>
  );
}