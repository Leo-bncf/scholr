import React from 'react';

export default function InsightsWeeklySummary({ bullets }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-lg font-bold text-slate-900">This week in simple terms</h3>
      <ul className="mt-4 space-y-3">
        {bullets.map((item, index) => (
          <li key={index} className="flex gap-3 text-sm text-slate-700">
            <span className="mt-1 h-2 w-2 rounded-full bg-emerald-600 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}