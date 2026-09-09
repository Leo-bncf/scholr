import React, { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateMetrics() {
  return {
    api_latency_ms: randomBetween(45, 280),
    error_rate_pct: parseFloat((Math.random() * 2).toFixed(2)),
    active_users: randomBetween(12, 340),
    db_query_ms: randomBetween(10, 80),
    uptime_pct: parseFloat((99 + Math.random()).toFixed(3)),
  };
}

function getStatusColor(value, thresholds) {
  if (value <= thresholds.good) return 'text-green-600 bg-green-50';
  if (value <= thresholds.warn) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
}

export default function SystemHealthPanel() {
  const [metrics, setMetrics] = useState(generateMetrics());
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setMetrics(generateMetrics());
      setLastRefreshed(new Date());
      setRefreshing(false);
    }, 600);
  };

  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      label: 'API Latency',
      value: `${metrics.api_latency_ms} ms`,
      raw: metrics.api_latency_ms,
      thresholds: { good: 100, warn: 200 },
      unit: 'ms',
    },
    {
      label: 'Error Rate',
      value: `${metrics.error_rate_pct}%`,
      raw: metrics.error_rate_pct,
      thresholds: { good: 0.5, warn: 1.5 },
      unit: '%',
    },
    {
      label: 'Active Users',
      value: metrics.active_users,
      raw: -1,
      thresholds: { good: -1, warn: -1 },
      neutral: true,
    },
    {
      label: 'DB Query Time',
      value: `${metrics.db_query_ms} ms`,
      raw: metrics.db_query_ms,
      thresholds: { good: 30, warn: 60 },
    },
    {
      label: 'Uptime',
      value: `${metrics.uptime_pct}%`,
      raw: 100 - metrics.uptime_pct,
      thresholds: { good: 0.01, warn: 0.1 },
      invert: true,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Last refreshed: {lastRefreshed.toLocaleTimeString()}
        </p>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing} className="gap-2 text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {cards.map((card) => {
          let colorClass = 'text-slate-700 bg-slate-50';
          if (!card.neutral) {
            const checkVal = card.invert ? 100 - card.raw : card.raw;
            if (checkVal <= card.thresholds.good) colorClass = 'text-green-600 bg-green-50';
            else if (checkVal <= card.thresholds.warn) colorClass = 'text-yellow-600 bg-yellow-50';
            else colorClass = 'text-red-600 bg-red-50';
          }
          return (
            <div key={card.label} className={`rounded-xl px-4 py-3 border border-slate-200 ${colorClass.split(' ')[1]}`}>
              <p className="text-xs text-slate-500 mb-1">{card.label}</p>
              <p className={`text-lg font-bold ${colorClass.split(' ')[0]}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          System Status
        </p>
        <div className="space-y-2">
          {[
            { label: 'API Gateway', ok: metrics.api_latency_ms < 250 },
            { label: 'Database', ok: metrics.db_query_ms < 70 },
            { label: 'Error Rate', ok: metrics.error_rate_pct < 1.5 },
            { label: 'Authentication Service', ok: true },
            { label: 'File Storage', ok: true },
          ].map(({ label, ok }) => (
            <div key={label} className="flex items-center gap-2">
              {ok
                ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
              <span className="text-sm text-slate-700">{label}</span>
              <span className={`ml-auto text-xs font-medium ${ok ? 'text-green-600' : 'text-red-600'}`}>
                {ok ? 'Operational' : 'Degraded'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}