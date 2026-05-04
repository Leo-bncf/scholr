import React from 'react';

export default function ReportingSummaryCards({ cards = [] }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
          <p className="text-xs text-slate-400 mt-1">{card.helper}</p>
        </div>
      ))}
    </div>
  );
}