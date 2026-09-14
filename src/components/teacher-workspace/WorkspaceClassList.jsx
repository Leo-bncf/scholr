import React from 'react';
import { BookOpen, Users, ClipboardList, AlertCircle } from 'lucide-react';

export default function WorkspaceClassList({ classes, selectedClassId, onSelectClass }) {
  return (
    <div className="bg-white rounded-xl border scholr-rule shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b scholr-rule scholr-sunk">
        <h2 className="text-sm font-bold uppercase tracking-wide scholr-ink">My classes</h2>
      </div>
      <div className="max-h-[calc(100vh-13rem)] overflow-y-auto">
        {classes.map((item) => {
          const isActive = item.id === selectedClassId;
          return (
            <button
              key={item.id}
              onClick={() => onSelectClass(item.id)}
              className={`w-full text-left p-4 border-b scholr-rule-soft last:border-b-0 transition ${isActive ? 'bg-emerald-50' : 'hover:scholr-sunk'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold scholr-ink truncate">{item.name}</p>
                  <p className="text-xs scholr-muted mt-1">{item.section ? `Section ${item.section}` : 'Class overview'}</p>
                </div>
                <BookOpen className={`w-4 h-4 mt-0.5 ${isActive ? 'text-emerald-700' : 'scholr-faint'}`} />
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 text-xs scholr-muted">
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