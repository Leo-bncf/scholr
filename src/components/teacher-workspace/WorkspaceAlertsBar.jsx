import React from 'react';
import { AlertTriangle, ClipboardCheck, TrendingDown } from 'lucide-react';

export default function WorkspaceAlertsBar({ alerts }) {
  const items = [
    {
      key: 'missing',
      label: 'Missing assignments',
      value: alerts.missing,
      icon: AlertTriangle,
      tone: 'bg-rose-50 border-rose-200 text-rose-700',
    },
    {
      key: 'review',
      label: 'Need review',
      value: alerts.needsReview,
      icon: ClipboardCheck,
      tone: 'bg-amber-50 border-amber-200 text-amber-700',
    },
    {
      key: 'drops',
      label: 'Performance drops',
      value: alerts.performanceDrops,
      icon: TrendingDown,
      tone: 'bg-sky-50 border-sky-200 text-sky-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.key} className={`rounded-xl border p-4 ${item.tone}`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{item.label}</p>
                <p className="text-2xl font-bold mt-1">{item.value}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-white/70 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}