import React from 'react';
import { Eye, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

const columns = [
  { key: 'not_submitted', label: 'Not Submitted' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'needs_review', label: 'Needs Review' },
  { key: 'reviewed', label: 'Reviewed' },
];

export default function WorkspacePipeline({ groupedRows, onOpenSubmission, onMarkReviewed }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
      {columns.map((column) => (
        <div key={column.key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
            <h3 className="text-sm font-bold text-slate-900">{column.label}</h3>
          </div>
          <div className="p-3 space-y-3 min-h-[28rem]">
            {groupedRows[column.key].length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 p-4 text-xs text-slate-400 text-center">No items</div>
            ) : groupedRows[column.key].map((row) => (
              <div key={row.key} className="rounded-xl border border-slate-200 p-3 bg-white hover:shadow-sm transition">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-900">{row.studentName}</p>
                  <p className="text-xs text-slate-600">{row.assignmentName}</p>
                  <p className="text-[11px] text-slate-500">{row.submittedAt ? format(new Date(row.submittedAt), 'MMM d, h:mm a') : 'Not submitted yet'}</p>
                  <p className="text-[11px] font-medium text-emerald-700">{row.statusLabel}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {row.submissionId && (
                    <Button size="sm" variant="outline" onClick={() => onOpenSubmission(row)}>
                      <Eye className="w-3.5 h-3.5" /> Open
                    </Button>
                  )}
                  {row.submissionId && row.canMarkReviewed && (
                    <Button size="sm" onClick={() => onMarkReviewed(row)}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark reviewed
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}