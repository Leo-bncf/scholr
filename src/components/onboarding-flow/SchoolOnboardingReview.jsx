import React from 'react';

export default function SchoolOnboardingReview({ summary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {summary.map((item) => (
        <div key={item.label} className="scholr-sunk rounded-xl p-4 border scholr-rule">
          <p className="text-xs scholr-muted">{item.label}</p>
          <p className="text-lg font-bold scholr-ink mt-1">{item.value}</p>
        </div>
      ))}
    </div>
  );
}