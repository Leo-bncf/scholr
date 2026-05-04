import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function TopicCoverageTable({ rows = [] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-900">Topic Coverage & Mastery</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Topic</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Assignments</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Avg Score</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Indicator</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{row.title}</p>
                  {row.subtopics?.length > 0 && <p className="text-xs text-slate-400 mt-1">{row.subtopics.join(', ')}</p>}
                </td>
                <td className="px-4 py-3 text-center text-slate-700">{row.assignmentCount}</td>
                <td className="px-4 py-3 text-center text-slate-700">{row.averageScore !== null ? `${row.averageScore}%` : '—'}</td>
                <td className="px-4 py-3 text-center">
                  <Badge className={row.indicatorClass}>{row.indicatorLabel}</Badge>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant={row.covered ? 'default' : 'outline'}>{row.covered ? 'Covered' : 'Not Covered'}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}