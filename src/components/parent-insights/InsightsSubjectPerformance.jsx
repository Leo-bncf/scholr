import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

function Sparkline({ values }) {
  const width = 120;
  const height = 36;
  const safeValues = values.length ? values : [0, 0, 0];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = max - min || 1;
  const points = safeValues.map((value, index) => {
    const x = (index / Math.max(safeValues.length - 1, 1)) * width;
    const y = height - ((value - min) / range) * (height - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-32 h-10">
      <polyline
        fill="none"
        stroke="#047857"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function InsightsSubjectPerformance({ subjects }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-lg font-bold text-slate-900">Subject performance</h3>
      <div className="mt-4 space-y-3">
        {subjects.map((subject) => {
          const TrendIcon = subject.trend === 'up' ? TrendingUp : subject.trend === 'down' ? TrendingDown : Minus;
          const trendColor = subject.trend === 'up' ? 'text-emerald-700' : subject.trend === 'down' ? 'text-rose-700' : 'text-slate-500';
          return (
            <div key={subject.name} className="rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">{subject.name}</p>
                <p className="text-sm text-slate-500 mt-1">Current grade: {subject.currentGrade}%</p>
              </div>
              <div className="flex items-center gap-4">
                <div className={`inline-flex items-center gap-1.5 text-sm font-medium ${trendColor}`}>
                  <TrendIcon className="w-4 h-4" />
                  {subject.trend === 'up' ? 'Improving' : subject.trend === 'down' ? 'Falling' : 'Stable'}
                </div>
                <Sparkline values={subject.recentScores} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}