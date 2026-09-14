import React from 'react';

export default function ReportingSummaryCards({ cards = [] }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl border scholr-rule p-5">
          <p className="text-sm scholr-muted">{card.label}</p>
          <p className="text-2xl font-bold scholr-ink mt-1">{card.value}</p>
          <p className="text-xs scholr-faint mt-1">{card.helper}</p>
        </div>
      ))}
    </div>
  );
}