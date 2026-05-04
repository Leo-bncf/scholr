import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function SubjectCoverageList({ subjects = [], onSelectSubject, selectedSubjectId }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">Subjects</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => onSelectSubject(subject.id)}
            className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors ${selectedSubjectId === subject.id ? 'bg-slate-50' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{subject.name}</p>
                <p className="text-xs text-slate-500 mt-1">{subject.coveredCount} / {subject.totalCount} topics covered</p>
              </div>
              <Badge variant="outline">{subject.coveragePercent}%</Badge>
            </div>
            <Progress value={subject.coveragePercent} className="mt-3 h-2" />
          </button>
        ))}
      </div>
    </div>
  );
}