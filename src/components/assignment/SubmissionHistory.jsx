import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function SubmissionHistory({ submissions = [], currentId, onSelect }) {
  if (!submissions.length) return null;

  return (
    <div className="bg-white rounded-xl border scholr-rule p-5">
      <h3 className="font-semibold scholr-ink mb-4">Submission History</h3>
      <div className="space-y-3">
        {submissions.map((submission) => (
          <button
            key={submission.id}
            onClick={() => onSelect?.(submission)}
            className={`w-full text-left rounded-lg border p-3 transition-colors ${submission.id === currentId ? 'scholr-accent-rule scholr-accent-sf' : 'scholr-rule hover:scholr-sunk'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium scholr-ink">Version {submission.version_number || 1}</p>
                <p className="text-xs scholr-muted mt-1">
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