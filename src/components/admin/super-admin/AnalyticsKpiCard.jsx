import React from 'react';

export default function AnalyticsKpiCard({ title, value, description, icon: Icon, iconClassName = 'scholr-muted' }) {
  return (
    <div className="app-group p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="scholr-muted text-xs font-medium uppercase tracking-wide">{title}</span>
        {Icon ? <Icon className={`w-4 h-4 ${iconClassName}`} /> : null}
      </div>
      <p className="text-3xl font-bold scholr-ink">{value}</p>
      {description ? <p className="scholr-muted text-xs mt-1">{description}</p> : null}
    </div>
  );
}