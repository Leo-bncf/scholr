import React from 'react';
import { Link, useParams } from 'react-router-dom';
import DemoShell from '@/components/demo-sandbox/DemoShell';
import DemoSectionCard from '@/components/demo-sandbox/DemoSectionCard';
import {
  getClass, getSubject, getTeacher, getStudent,
  getAssignmentsForClass, getSubmission,
} from '@/components/demo-sandbox/mockSchoolData';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, AlertCircle, CircleDashed } from 'lucide-react';

const statusVisual = {
  submitted:   { label: 'Submitted',   icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
  graded:      { label: 'Graded',      icon: CheckCircle2, color: 'text-sky-600 bg-sky-50' },
  in_progress: { label: 'In progress', icon: Clock,        color: 'text-amber-600 bg-amber-50' },
  late:        { label: 'Late',        icon: AlertCircle,  color: 'text-rose-600 bg-rose-50' },
  not_started: { label: 'Not started', icon: CircleDashed, color: 'text-slate-500 bg-slate-100' },
};

export default function DemoTeacherClass() {
  const { classId } = useParams();
  const cls = getClass(classId);

  if (!cls) {
    return (
      <DemoShell roleKey="teacher">
        <p className="text-sm text-slate-500">Class not found.</p>
        <Link to="/demo/teacher" className="text-sm font-semibold text-emerald-700 hover:underline">← Back to dashboard</Link>
      </DemoShell>
    );
  }

  const subject = getSubject(cls.subjectId);
  const teacher = getTeacher(cls.teacherId);
  const assignments = getAssignmentsForClass(cls.id);
  const students = cls.studentIds.map(getStudent).filter(Boolean);

  return (
    <DemoShell roleKey="teacher">
      <Link to="/demo/teacher" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">{subject?.level} · {subject?.group}</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">{cls.name}</h1>
        <p className="text-sm text-slate-500 mt-1">{teacher?.name} · {cls.room} · {students.length} students</p>
      </div>

      <DemoSectionCard
        title="Submission status across students"
        action={<span className="text-xs text-slate-500">{assignments.length} assignments</span>}
      >
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wide text-slate-500 border-b border-slate-100">
                <th className="text-left py-3 px-5">Student</th>
                {assignments.map((a) => (
                  <th key={a.id} className="text-left py-3 px-3 min-w-[160px]">
                    <span className="block font-semibold text-slate-700 normal-case tracking-normal text-xs truncate max-w-[160px]">{a.title}</span>
                    <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Due {a.dueIn}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((stu) => (
                <tr key={stu.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold">
                        {stu.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{stu.name}</p>
                        <p className="text-[10px] text-slate-500">{stu.grade}</p>
                      </div>
                    </div>
                  </td>
                  {assignments.map((a) => {
                    const sub = getSubmission(stu.id, a.id);
                    const status = sub?.status || 'not_started';
                    const v = statusVisual[status];
                    const canReview = sub && (status === 'submitted' || status === 'late' || status === 'graded');
                    const cell = (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full ${v.color}`}>
                        <v.icon className="w-3 h-3" />
                        {v.label}
                      </span>
                    );
                    return (
                      <td key={a.id} className="py-3 px-3">
                        {canReview ? (
                          <Link
                            to={`/demo/teacher/review/${sub.id}`}
                            className="inline-flex items-center gap-1.5 group"
                          >
                            {cell}
                            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition" />
                          </Link>
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DemoSectionCard>
    </DemoShell>
  );
}