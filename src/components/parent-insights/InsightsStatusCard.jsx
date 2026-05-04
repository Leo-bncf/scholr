import React from 'react';
import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';

const statusConfig = {
  above: {
    title: 'Above Expectations',
    description: 'Your child is doing very well across grades, attendance, and homework.',
    icon: TrendingUp,
    tone: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  },
  on_track: {
    title: 'On Track',
    description: 'Your child is keeping up well, with only a few areas to watch.',
    icon: CheckCircle2,
    tone: 'bg-sky-50 border-sky-200 text-sky-800',
  },
  at_risk: {
    title: 'At Risk',
    description: 'Your child may need support with grades, attendance, or missing work.',
    icon: AlertTriangle,
    tone: 'bg-rose-50 border-rose-200 text-rose-800',
  },
};

export default function InsightsStatusCard({ statusKey, summary }) {
  const config = statusConfig[statusKey] || statusConfig.on_track;
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border p-5 md:p-6 ${config.tone}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-75">Current status</p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">{config.title}</h2>
          <p className="text-sm mt-2 max-w-2xl opacity-90">{config.description}</p>
        </div>
        <div className="h-12 w-12 rounded-xl bg-white/70 flex items-center justify-center">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-5">
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-[11px] uppercase tracking-wide opacity-70">Average grade</p>
          <p className="text-lg font-semibold mt-1">{summary.averageGrade}%</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-[11px] uppercase tracking-wide opacity-70">Attendance</p>
          <p className="text-lg font-semibold mt-1">{summary.attendanceRate}%</p>
        </div>
        <div className="rounded-xl bg-white/70 p-3">
          <p className="text-[11px] uppercase tracking-wide opacity-70">Missing work</p>
          <p className="text-lg font-semibold mt-1">{summary.missingAssignments}</p>
        </div>
      </div>
    </div>
  );
}