import React from 'react';

export default function CoverageSummaryCards({ stats = [] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((item) => (
        <div key={item.label} className="bg-white rounded-xl border scholr-rule p-5">
          <p className="text-sm scholr-muted">{item.label}</p>
          <p className="text-2xl font-bold scholr-ink mt-1">{item.value}</p>
          <p className="text-xs scholr-faint mt-1">{item.helper}</p>
        </div>
      ))}
    </div>
  );
}