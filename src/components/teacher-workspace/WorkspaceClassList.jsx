import React from 'react';
import { BookOpen, Users, ClipboardList, AlertCircle } from 'lucide-react';

export default function WorkspaceClassList({ classes, selectedClassId, onSelectClass }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">My classes</h2>
      </div>
      <div className="max-h-[calc(100vh-13rem)] overflow-y-auto">
        {classes.map((item) => {
          const isActive = item.id === selectedClassId;
          return (
            <button
              key={item.id}
              onClick={() => onSelectClass(item.id)}
              className={`w-full text-left p-4 border-b border-slate-100 last:border-b-0 transition ${isActive ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{item.section ? `Section ${item.section}` : 'Class overview'}</p>
                </div>
                <BookOpen className={`w-4 h-4 mt-0.5 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> {item.studentCount} students</div>
                <div className="flex items-center gap-2"><ClipboardList className="w-3.5 h-3.5" /> {item.upcomingAssignments} upcoming assignments</div>
                <div className="flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> {item.missingSubmissions} missing submissions</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}