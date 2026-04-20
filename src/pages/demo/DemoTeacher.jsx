import React from 'react';
import DemoShell from '@/components/demo-sandbox/DemoShell';
import DemoConclusion from '@/components/demo-sandbox/DemoConclusion';
import DemoSectionCard from '@/components/demo-sandbox/DemoSectionCard';
import TeacherReviewQueue from '@/components/demo-sandbox/teacher/TeacherReviewQueue';
import TeacherClassCard from '@/components/demo-sandbox/teacher/TeacherClassCard';
import {
  TEACHER, TEACHER_CLASSES, TIMETABLE_TODAY, ANNOUNCEMENTS,
  getPendingGradingForTeacher,
} from '@/components/demo-sandbox/mockSchoolData';
import { Users, FileText, TrendingUp } from 'lucide-react';

export default function DemoTeacher() {
  const totalPending = getPendingGradingForTeacher(TEACHER.id).length;
  const totalStudents = TEACHER_CLASSES.reduce((s, c) => s + c.students, 0);
  const avgValues = TEACHER_CLASSES.map((c) => c.avgGrade).filter((v) => typeof v === 'number');
  const avgClass = avgValues.length
    ? (avgValues.reduce((s, v) => s + v, 0) / avgValues.length).toFixed(1)
    : '—';

  return (
    <DemoShell roleKey="teacher">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Good morning, Dr. {TEACHER.name.split(' ').pop()}</h1>
        <p className="text-sm text-slate-500 mt-1">{TEACHER.department} · {TEACHER_CLASSES.length} active classes</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Students', value: totalStudents, icon: Users, color: 'text-sky-600 bg-sky-50' },
          { label: 'Pending grading', value: totalPending, icon: FileText, color: 'text-amber-600 bg-amber-50' },
          { label: 'Avg class grade', value: avgClass, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div data-tour="teacher-queue">
            <TeacherReviewQueue teacherId={TEACHER.id} />
          </div>

          <div data-tour="teacher-classes">
            <DemoSectionCard title="Class overview" action={<span className="text-xs font-medium text-slate-500">Tap a class to open</span>}>
              <div className="space-y-3">
                {TEACHER_CLASSES.map((c) => (
                  <TeacherClassCard key={c.id} classId={c.id} avgGrade={c.avgGrade} />
                ))}
              </div>
            </DemoSectionCard>
          </div>
        </div>

        <div className="space-y-6">
          <div data-tour="teacher-schedule">
          <DemoSectionCard title="Today's schedule">
            <div className="space-y-2">
              {TIMETABLE_TODAY.slice(0, 4).map((p, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <div className="text-[10px] font-bold text-slate-500 w-20 pt-0.5 flex-shrink-0">{p.time.split(' – ')[0]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.subject}</p>
                    <p className="text-xs text-slate-500">{p.room}</p>
                  </div>
                </div>
              ))}
            </div>
          </DemoSectionCard>
          </div>

          <DemoSectionCard title="Staff notices">
            <div className="space-y-3">
              {ANNOUNCEMENTS.map((n) => (
                <div key={n.id}>
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.from} · {n.when}</p>
                </div>
              ))}
            </div>
          </DemoSectionCard>
        </div>
      </div>

      <DemoConclusion />
    </DemoShell>
  );
}