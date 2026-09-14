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
        <div key={column.key} className="bg-white rounded-xl border scholr-rule shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b scholr-rule scholr-sunk">
            <h3 className="text-sm font-bold scholr-ink">{column.label}</h3>
          </div>
          <div className="p-3 space-y-3 min-h-[28rem]">
            {groupedRows[column.key].length === 0 ? (
              <div className="rounded-lg border border-dashed scholr-rule p-4 text-xs scholr-faint text-center">No items</div>
            ) : groupedRows[column.key].map((row) => (
              <div key={row.key} className="rounded-xl border scholr-rule p-3 bg-white hover:shadow-sm transition">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold scholr-ink">{row.studentName}</p>
                  <p className="text-xs scholr-muted">{row.assignmentName}</p>
                  <p className="text-[11px] scholr-muted">{row.submittedAt ? format(new Date(row.submittedAt), 'MMM d, h:mm a') : 'Not submitted yet'}</p>
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