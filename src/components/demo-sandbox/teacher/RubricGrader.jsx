import React, { useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function RubricGrader({ rubric, onPublish }) {
  const [scores, setScores] = useState(() =>
    Object.fromEntries(rubric.criteria.map((c) => [c.id, null]))
  );

  const totalMax = useMemo(() => rubric.criteria.reduce((s, c) => s + c.max, 0), [rubric]);
  const totalScored = useMemo(
    () => rubric.criteria.reduce((s, c) => s + (scores[c.id] ?? 0), 0),
    [scores, rubric]
  );
  const scoredCount = Object.values(scores).filter((v) => v !== null).length;
  const complete = scoredCount === rubric.criteria.length;
  const percent = totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0;

  // Map percent to IB 1–7
  const ibGrade =
    percent >= 85 ? 7 :
    percent >= 72 ? 6 :
    percent >= 60 ? 5 :
    percent >= 48 ? 4 :
    percent >= 34 ? 3 :
    percent >= 20 ? 2 : 1;

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{rubric.name}</p>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total</p>
            <p className="text-3xl font-bold text-slate-900">
              {totalScored}<span className="text-base text-slate-400">/{totalMax}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">IB grade</p>
            <p className={`text-3xl font-bold ${complete ? 'text-emerald-600' : 'text-slate-300'}`}>
              {complete ? ibGrade : '—'}
            </p>
          </div>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {rubric.criteria.map((c) => {
          const value = scores[c.id];
          return (
            <div key={c.id}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                <span className="text-xs font-bold text-slate-500">
                  {value ?? '–'}/{c.max}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{c.descriptor}</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: c.max + 1 }, (_, i) => i).map((n) => {
                  const selected = value === n;
                  return (
                    <button
                      key={n}
                      onClick={() => setScores((s) => ({ ...s, [c.id]: n }))}
                      className={`h-7 w-8 rounded-md text-xs font-bold transition ${
                        selected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <button
        disabled={!complete}
        onClick={() => complete && onPublish?.({ totalScored, totalMax, ibGrade, percent })}
        className={`mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
          complete
            ? 'bg-slate-900 text-white hover:bg-slate-800'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }`}
      >
        <CheckCircle2 className="w-4 h-4" />
        {complete ? 'Publish grade & feedback' : `${rubric.criteria.length - scoredCount} criteria left`}
      </button>
    </div>
  );
}