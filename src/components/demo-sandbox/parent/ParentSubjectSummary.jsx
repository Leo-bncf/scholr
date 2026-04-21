import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getGradesForStudent } from '@/components/demo-sandbox/mockSchoolData';
import { useDemoStore, getEffectiveGradesForStudent } from '@/components/demo-sandbox/useDemoStore';

const trendMeta = (t) => {
  if (t === 'up')   return { Icon: TrendingUp,   color: 'text-emerald-600 bg-emerald-50', label: 'Improving' };
  if (t === 'down') return { Icon: TrendingDown, color: 'text-rose-600 bg-rose-50',       label: 'Needs attention' };
  return               { Icon: Minus,          color: 'text-slate-500 bg-slate-100',    label: 'Steady' };
};

export default function ParentSubjectSummary({ studentId }) {
  useDemoStore();
  const grades = getEffectiveGradesForStudent(studentId, getGradesForStudent(studentId));

  if (grades.length === 0) {
    return <div className="p-10 text-center text-sm text-slate-400">No grades this term yet.</div>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {grades.map((g) => {
        const { Icon, color, label } = trendMeta(g.trend);
        return (
          <div key={g.subjectId} className="px-4 md:px-6 py-4 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{g.subject}</p>
              <div className={`inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded mt-1 ${color}`}>
                <Icon className="w-3 h-3" />
                {label}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Current</p>
              <p className={`text-xl font-bold leading-none ${g._adjusted ? 'text-emerald-600' : 'text-slate-900'}`}>
                {g.current}
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <p className="text-[10px] uppercase tracking-wide text-indigo-500 font-semibold">Predicted</p>
              <p className="text-xl font-bold text-indigo-600 leading-none">{g.predicted}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}