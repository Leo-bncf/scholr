import React from 'react';

export default function AnalyticsChartCard({ title, subtitle, children, actions }) {
  return (
    <div className="app-group overflow-hidden">
      <div className="px-5 py-4 border-b scholr-rule flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold scholr-ink">{title}</h2>
          {subtitle ? <p className="text-xs scholr-muted mt-1">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}