import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function InsightsAlertsSection({ alerts }) {
  return (
    <div className="bg-white rounded-2xl border scholr-rule shadow-sm p-5">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        <h3 className="text-lg font-bold scholr-ink">Alerts</h3>
      </div>
      <div className="mt-4 space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">No urgent alerts right now.</div>
        ) : alerts.map((alert, index) => (
          <div key={index} className="rounded-xl border scholr-rule p-4">
            <p className="text-sm font-semibold scholr-ink">{alert.title}</p>
            <p className="text-sm scholr-muted mt-1">{alert.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}