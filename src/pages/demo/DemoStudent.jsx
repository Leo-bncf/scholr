import React from 'react';
import DemoShell from '@/components/demo-sandbox/DemoShell';
import DemoSectionCard from '@/components/demo-sandbox/DemoSectionCard';
import {
  STUDENT, GRADES, UPCOMING_ASSIGNMENTS, TIMETABLE_TODAY, ANNOUNCEMENTS, ATTENDANCE,
  getFeedbackForStudent, getTeacher, SUBMISSIONS,
} from '@/components/demo-sandbox/mockSchoolData';
import { TrendingUp, TrendingDown, Minus, Clock, BookOpen, Bell, CheckCircle2, MessageSquare, FileText, Beaker, PenTool } from 'lucide-react';

const trendIcon = (t) => {
  if (t === 'up') return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
  if (t === 'down') return <TrendingDown className="w-3.5 h-3.5 text-rose-500" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
};

const statusStyle = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-amber-100 text-amber-700',
  submitted: 'bg-emerald-100 text-emerald-700',
  late: 'bg-rose-100 text-rose-700',
  graded: 'bg-sky-100 text-sky-700',
};

const typeMeta = {
  internal_assessment: { label: 'IA', icon: Beaker, color: 'bg-violet-100 text-violet-700' },
  extended_essay:      { label: 'EE', icon: PenTool, color: 'bg-rose-100 text-rose-700' },
  essay:               { label: 'Essay', icon: FileText, color: 'bg-sky-100 text-sky-700' },
  homework:            { label: 'HW', icon: BookOpen, color: 'bg-slate-100 text-slate-700' },
  lab_report:          { label: 'Lab', icon: Beaker, color: 'bg-emerald-100 text-emerald-700' },
};

export default function DemoStudent() {
  const feedback = getFeedbackForStudent(STUDENT.id).map((f) => ({
    ...f,
    teacher: getTeacher(f.teacherId),
    submission: SUBMISSIONS.find((s) => s.id === f.submissionId),
  }));

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
              {UPCOMING_ASSIGNMENTS.map((a) => {
                const meta = typeMeta[a.type] || typeMeta.homework;
                const MetaIcon = meta.icon;
                return (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-10 w-10 rounded-lg ${meta.color} flex items-center justify-center flex-shrink-0`}>
                        <MetaIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 truncate">{a.title}</p>
                          <span className={`text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${meta.color}`}>{meta.label}</span>
                        </div>
                        <p className="text-xs text-slate-500">{a.subject}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${statusStyle[a.status] || statusStyle.not_started}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {a.dueIn}
                      </span>
                    </div>
                  </div>
                );
              })}
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

          {feedback.length > 0 && (
            <DemoSectionCard title="Recent teacher feedback" action={<MessageSquare className="w-4 h-4 text-slate-400" />}>
              <div className="space-y-3">
                {feedback.map((f) => (
                  <div key={f.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-slate-900">{f.teacher?.name}</p>
                      <span className="text-[10px] text-slate-400">{f.createdAt}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{f.body}</p>
                  </div>
                ))}
              </div>
            </DemoSectionCard>
          )}
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