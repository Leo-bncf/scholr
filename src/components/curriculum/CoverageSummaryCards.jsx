import React from 'react';

export default function CoverageSummaryCards({ stats = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((item) => (
        <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}</p>
          <p className="text-xs text-slate-400 mt-1">{item.helper}</p>
        </div>
      ))}
    </div>
  );
}