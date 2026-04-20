import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getSubjectPerformance } from '@/components/demo-sandbox/mockSchoolData';

const trendMeta = (trend, delta) => {
  if (trend === 'up')   return { Icon: TrendingUp,   color: 'text-emerald-600', bg: 'bg-emerald-50',  label: `+${delta}` };
  if (trend === 'down') return { Icon: TrendingDown, color: 'text-rose-600',    bg: 'bg-rose-50',     label: `${delta}` };
  return                   { Icon: Minus,          color: 'text-slate-500',   bg: 'bg-slate-100',   label: '±0' };
};

const barColor = (current) => {
  if (current >= 6) return 'bg-emerald-500';
  if (current >= 5) return 'bg-indigo-500';
  if (current >= 4) return 'bg-amber-500';
  return 'bg-rose-500';
};

export default function SubjectPerformanceOverview({ yearGroup, subjectId }) {
  const rows = getSubjectPerformance({ yearGroup, subjectId });

  if (rows.length === 0) {
    return <div className="p-10 text-center text-sm text-slate-400">No data for this filter combination.</div>;
  }

  return (
    <div className="divide-y divide-slate-100">
      {rows.map((r) => {
        const { Icon, color, bg, label } = trendMeta(r.trend, r.delta);
        const pct = Math.min(100, Math.max(0, (r.current / 7) * 100));
        return (
          <div key={r.subjectId} className="px-4 md:px-6 py-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm font-medium text-slate-900 truncate">{r.subject}</p>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-slate-500">
                  Prev <b className="text-slate-700">{r.previous}</b>
                </span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">{r.current}</span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${bg} ${color}`}>
                  <Icon className="w-3 h-3" />
                  {label}
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full transition-all ${barColor(r.current)}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}