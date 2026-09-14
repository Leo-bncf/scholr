import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default function SubjectCoverageList({ subjects = [], onSelectSubject, selectedSubjectId }) {
  return (
    <div className="bg-white rounded-xl border scholr-rule overflow-hidden">
      <div className="px-5 py-4 border-b scholr-rule">
        <h3 className="font-semibold scholr-ink">Subjects</h3>
      </div>
      <div className="divide-y scholr-divide">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            onClick={() => onSelectSubject(subject.id)}
            className={`w-full text-left px-5 py-4 hover:scholr-sunk transition-colors ${selectedSubjectId === subject.id ? 'scholr-sunk' : ''}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium scholr-ink">{subject.name}</p>
                <p className="text-xs scholr-muted mt-1">{subject.coveredCount} / {subject.totalCount} topics covered</p>
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