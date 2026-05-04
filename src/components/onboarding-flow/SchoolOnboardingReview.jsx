import React from 'react';

export default function SchoolOnboardingReview({ summary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {summary.map((item) => (
        <div key={item.label} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <p className="text-xs text-slate-500">{item.label}</p>
          <p className="text-lg font-bold text-slate-900 mt-1">{item.value}</p>
        </div>
      ))}
    </div>
  );
}