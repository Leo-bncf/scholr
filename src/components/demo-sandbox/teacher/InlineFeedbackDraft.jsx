import React, { useState } from 'react';
import { MessageSquarePlus, X, Check } from 'lucide-react';

export default function InlineFeedbackDraft({ paragraphs }) {
  const [comments, setComments] = useState({}); // { paragraphId: [text, ...] }
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');

  const addComment = (paragraphId) => {
    const text = draft.trim();
    if (!text) return;
    setComments((prev) => ({
      ...prev,
      [paragraphId]: [...(prev[paragraphId] || []), text],
    }));
    setDraft('');
    setActiveId(null);
  };

  const totalComments = Object.values(comments).reduce((s, arr) => s + arr.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Student draft</p>
        {totalComments > 0 && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {totalComments} comment{totalComments === 1 ? '' : 's'}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {paragraphs.map((p) => {
          const isActive = activeId === p.id;
          const paragraphComments = comments[p.id] || [];
          return (
            <div key={p.id} className="group relative">
              <div
                className={`rounded-lg p-3 text-sm leading-relaxed transition cursor-text ${
                  paragraphComments.length > 0
                    ? 'bg-amber-50/60 border-l-2 border-amber-400'
                    : 'hover:bg-slate-50'
                }`}
              >
                <p className="text-slate-800">{p.text}</p>
                {paragraphComments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {paragraphComments.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 bg-white border border-amber-200 rounded-md p-2 text-xs text-slate-700">
                        <MessageSquarePlus className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span className="leading-snug">{c}</span>
                      </div>
                    ))}
                  </div>
                )}
                {!isActive && (
                  <button
                    onClick={() => setActiveId(p.id)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-700 opacity-0 group-hover:opacity-100 transition"
                  >
                    <MessageSquarePlus className="w-3 h-3" /> Add comment
                  </button>
                )}
                {isActive && (
                  <div className="mt-3 flex items-start gap-2">
                    <textarea
                      autoFocus
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Inline feedback…"
                      className="flex-1 rounded-md border border-slate-200 p-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                    />
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => addComment(p.id)}
                        className="p-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                        aria-label="Save comment"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => { setActiveId(null); setDraft(''); }}
                        className="p-1.5 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200"
                        aria-label="Cancel"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}