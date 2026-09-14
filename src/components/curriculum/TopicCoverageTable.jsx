import React from 'react';
import { Badge } from '@/components/ui/badge';

export default function TopicCoverageTable({ rows = [] }) {
  return (
    <div className="bg-white rounded-xl border scholr-rule overflow-hidden">
      <div className="px-5 py-4 border-b scholr-rule">
        <h3 className="font-semibold scholr-ink">Topic Coverage & Mastery</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="scholr-sunk border-b scholr-rule">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold scholr-muted uppercase">Topic</th>
              <th className="px-4 py-3 text-center text-xs font-semibold scholr-muted uppercase">Assignments</th>
              <th className="px-4 py-3 text-center text-xs font-semibold scholr-muted uppercase">Avg Score</th>
              <th className="px-4 py-3 text-center text-xs font-semibold scholr-muted uppercase">Indicator</th>
              <th className="px-4 py-3 text-center text-xs font-semibold scholr-muted uppercase">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y scholr-divide">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">
                  <p className="font-medium scholr-ink">{row.title}</p>
                  {row.subtopics?.length > 0 && <p className="text-xs scholr-faint mt-1">{row.subtopics.join(', ')}</p>}
                </td>
                <td className="px-4 py-3 text-center scholr-body">{row.assignmentCount}</td>
                <td className="px-4 py-3 text-center scholr-body">{row.averageScore !== null ? `${row.averageScore}%` : '—'}</td>
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