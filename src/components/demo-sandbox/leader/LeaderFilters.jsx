import React from 'react';
import { Filter } from 'lucide-react';
import { SUBJECTS, YEAR_GROUPS } from '@/components/demo-sandbox/mockSchoolData';

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition border ${
        active
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
      }`}
    >
      {children}
    </button>
  );
}

export default function LeaderFilters({ yearGroup, subjectId, onChange }) {
  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Filters</p>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Year group</p>
          <div className="flex flex-wrap gap-2">
            {YEAR_GROUPS.map((yg) => (
              <Pill key={yg} active={yearGroup === yg} onClick={() => onChange({ yearGroup: yg, subjectId })}>
                {yg}
              </Pill>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Subject</p>
          <div className="flex flex-wrap gap-2">
            <Pill active={subjectId === 'All'} onClick={() => onChange({ yearGroup, subjectId: 'All' })}>
              All subjects
            </Pill>
            {SUBJECTS.filter((s) => s.id !== 'tok').map((s) => (
              <Pill key={s.id} active={subjectId === s.id} onClick={() => onChange({ yearGroup, subjectId: s.id })}>
                {s.name.replace(' HL', '').replace(' SL', '')}
              </Pill>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}