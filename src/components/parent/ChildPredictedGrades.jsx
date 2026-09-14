import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import * as gradebookData from '@/data/gradebook';

export default function ChildPredictedGrades({ schoolId, studentId }) {
  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['child-predicted-grades', schoolId, studentId],
    queryFn: () => gradebookData.wherePredictedGrades({
      school_id: schoolId,
      student_id: studentId,
      visible_to_parent: true
    }, { order: 'entry_date', ascending: false }),
    enabled: !!schoolId && !!studentId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin scholr-accent" />
      </div>
    );
  }

  if (predictions.length === 0) {
    return (
      <div className="text-center py-12 scholr-faint">
        <TrendingUp className="w-10 h-10 mx-auto mb-3 scholr-faint" />
        <p className="text-sm">No predicted grades shared yet</p>
      </div>
    );
  }

  const confidenceColors = {
    high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  const averagePredicted = predictions.length > 0
    ? (predictions.reduce((sum, p) => sum + p.predicted_ib_grade, 0) / predictions.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="scholr-accent-sf border scholr-accent-rule rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 scholr-accent" />
              <h3 className="text-lg font-bold scholr-accent">Predicted IB Performance</h3>
            </div>
            <p className="text-sm scholr-accent">
              Based on current academic trajectory and teacher assessments
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm scholr-accent font-semibold">Average Predicted</p>
            <p className="text-4xl font-bold scholr-accent">{averagePredicted}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {predictions.map(pred => (
          <div key={pred.id} className="bg-white rounded-xl border scholr-rule p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold scholr-ink">{pred.class_name}</h4>
                {pred.entry_date && (
                  <p className="text-xs scholr-faint mt-1">
                    Updated: {format(new Date(pred.entry_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge className={`${confidenceColors[pred.confidence_level]} border`} variant="outline">
                  {pred.confidence_level} confidence
                </Badge>
                <div className="scholr-accent-sf rounded-lg px-4 py-2 border scholr-accent-rule">
                  <p className="text-xs scholr-accent font-semibold">Predicted</p>
                  <p className="text-2xl font-bold scholr-accent">{pred.predicted_ib_grade}</p>
                </div>
              </div>
            </div>

            {pred.rationale && (
              <div className="mt-3 pt-3 border-t scholr-rule-soft">
                <p className="text-xs font-semibold scholr-body mb-1">Teacher Notes</p>
                <p className="text-sm scholr-muted">{pred.rationale}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}