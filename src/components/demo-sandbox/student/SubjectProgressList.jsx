import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  getGradesForStudent, getClassesForStudent, getAssignmentsForClass, getSubmission,
} from '@/components/demo-sandbox/mockSchoolData';
import {
  useDemoStore, getEffectiveSubmissionStatus, getEffectiveGradesForStudent,
} from '@/components/demo-sandbox/useDemoStore';

const trendIcon = (trend) => {
  if (trend === 'up')   return <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />;
  if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-rose-600" />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
};

// % of this subject's assignments the student has submitted or completed
const computeCompletion = (studentId, classId) => {
  const assignments = getAssignmentsForClass(classId);
  if (assignments.length === 0) return 100;
  const done = assignments.filter((a) => {
    const s = getSubmission(studentId, a.id);
    const status = getEffectiveSubmissionStatus(s);
    return status === 'submitted' || status === 'graded' || status === 'late';
  }).length;
  return Math.round((done / assignments.length) * 100);
};

export default function SubjectProgressList({ studentId }) {
  useDemoStore();
  const grades = getEffectiveGradesForStudent(studentId, getGradesForStudent(studentId));
  const classes = getClassesForStudent(studentId);

  const rows = grades.map((g) => {
    const cls = classes.find((c) => c.subjectId === g.subjectId);
    const completion = cls ? computeCompletion(studentId, cls.id) : null;
    return { ...g, completion };
  });

  return (
    <div className="divide-y divide-slate-100">
      {rows.map((r) => (
        <div key={r.subjectId} className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="font-medium text-slate-900 text-sm truncate">{r.subject}</p>
            <div className="flex items-center gap-3 flex-shrink-0 text-xs">
              <span className="inline-flex items-center gap-1 text-slate-500">
                Current <b className="text-slate-900">{r.current}</b>
                {r._adjusted && (
                  <span className="ml-1 inline-flex items-center text-[9px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                    Updated
                  </span>
                )}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-500">
                Predicted <b className="text-slate-900">{r.predicted}</b>
                {trendIcon(r.trend)}
              </span>
            </div>
          </div>
          {r.completion !== null && (
            <>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${r.completion}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] font-medium text-slate-500">
                {r.completion}% of coursework submitted
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}