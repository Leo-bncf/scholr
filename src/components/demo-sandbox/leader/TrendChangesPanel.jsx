import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { getTrendChanges } from '@/components/demo-sandbox/mockSchoolData';

function MiniChart({ data, color }) {
  return (
    <div style={{ height: 120 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="term" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis domain={[3, 7]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} />
          <Line type="monotone" dataKey="avg" stroke={color} strokeWidth={2.5} dot={{ r: 3, fill: color }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendBlock({ title, items, tone }) {
  const color = tone === 'down' ? '#e11d48' : '#10b981';
  const Icon = tone === 'down' ? TrendingDown : TrendingUp;
  const textColor = tone === 'down' ? 'text-rose-700' : 'text-emerald-700';
  const bg = tone === 'down' ? 'bg-rose-50' : 'bg-emerald-50';

  if (items.length === 0) {
    return (
      <div className="p-4 text-xs text-slate-400">
        {tone === 'down' ? 'No declining subjects' : 'No improving subjects'} for this filter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 2).map((item) => (
        <div key={item.subjectId} className="p-3 rounded-md border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-900 truncate">{item.subject}</p>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded ${bg} ${textColor}`}>
              <Icon className="w-3 h-3" />
              {item.delta > 0 ? `+${item.delta}` : item.delta}
            </span>
          </div>
          <MiniChart data={item.termSeries} color={color} />
        </div>
      ))}
    </div>
  );
}

export default function TrendChangesPanel({ yearGroup, subjectId }) {
  const { declining, improving } = getTrendChanges({ yearGroup, subjectId });

  return (
    <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-rose-700 mb-2 inline-flex items-center gap-1">
          <TrendingDown className="w-3 h-3" /> Declining
        </p>
        <TrendBlock title="Declining" items={declining} tone="down" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 mb-2 inline-flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> Improving
        </p>
        <TrendBlock title="Improving" items={improving} tone="up" />
      </div>
    </div>
  );
}