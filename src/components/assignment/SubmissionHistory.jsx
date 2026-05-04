import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function SubmissionHistory({ submissions = [], currentId, onSelect }) {
  if (!submissions.length) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-900 mb-4">Submission History</h3>
      <div className="space-y-3">
        {submissions.map((submission) => (
          <button
            key={submission.id}
            onClick={() => onSelect?.(submission)}
            className={`w-full text-left rounded-lg border p-3 transition-colors ${submission.id === currentId ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">Version {submission.version_number || 1}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {submission.submission_time ? format(new Date(submission.submission_time), 'MMM d, yyyy h:mm a') : 'Draft'}
                </p>
              </div>
              <Badge variant="outline">{submission.status}</Badge>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}