import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, FileText } from 'lucide-react';
import {
  getClass, getSubmissionsForClass, getAssignmentsForClass,
} from '@/components/demo-sandbox/mockSchoolData';
import { useDemoStore, getEffectiveSubmissionStatus } from '@/components/demo-sandbox/useDemoStore';

export default function TeacherClassCard({ classId, avgGrade }) {
  useDemoStore(); // re-render when local grades change
  const cls = getClass(classId);
  if (!cls) return null;

  const subs = getSubmissionsForClass(classId);
  const assignments = getAssignmentsForClass(classId);
  const totalExpected = cls.studentIds.length * assignments.length;
  const effectiveStatuses = subs.map((s) => getEffectiveSubmissionStatus(s));
  const submittedOrGraded = effectiveStatuses.filter(
    (st) => st === 'submitted' || st === 'graded' || st === 'late'
  ).length;
  const pending = effectiveStatuses.filter((st) => st === 'submitted' || st === 'late').length;
  const progress = totalExpected > 0 ? Math.round((submittedOrGraded / totalExpected) * 100) : 0;

  return (
    <Link
      to={`/demo/teacher/class/${cls.id}`}
      className="group block p-4 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-sm hover:bg-slate-50/50 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 truncate">{cls.name}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" />{cls.studentIds.length}</span>
            <span className="inline-flex items-center gap-1"><FileText className="w-3 h-3" />{assignments.length} assignments</span>
            {avgGrade !== '—' && <span>Avg <b className="text-slate-700">{avgGrade}</b></span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {pending > 0 ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
              {pending} to grade
            </span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              All clear
            </span>
          )}
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
        </div>
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">
          <span>Submission progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </Link>
  );
}