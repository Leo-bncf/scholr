import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Loader2, BarChart3, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import * as gradebookData from '@/data/gradebook';

export default function ChildGradesOverview({ schoolId, studentId }) {
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['parent-child-grades', schoolId, studentId],
    queryFn: () => gradebookData.whereGradeItems({
      school_id: schoolId,
      student_id: studentId,
      visible_to_parent: true
    }, { order: 'created_at', ascending: false }),
    enabled: !!schoolId && !!studentId,
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin scholr-accent" /></div>;
  }

  if (grades.length === 0) {
    return (
      <div className="text-center py-8 scholr-faint">
        <BarChart3 className="w-10 h-10 mx-auto mb-2 scholr-faint" />
        <p className="text-sm">No grades available yet</p>
      </div>
    );
  }

  const validGrades = grades.filter(g => g.score != null);
  const average = validGrades.length > 0
    ? (validGrades.reduce((sum, g) => sum + ((g.score / g.max_score) * 100), 0) / validGrades.length).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      {average && (
        <div className="scholr-accent-sf rounded-xl border scholr-accent-rule p-4 flex items-center justify-between">
          <div>
            <p className="text-sm scholr-accent font-medium">Overall Average</p>
            <p className="text-3xl font-bold scholr-accent mt-1">{average}%</p>
          </div>
          <TrendingUp className="w-10 h-10 scholr-accent" />
        </div>
      )}

      <div className="space-y-3">
        {grades.map(grade => (
          <div key={grade.id} className="bg-white rounded-lg border scholr-rule p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold scholr-ink">{grade.title}</h4>
                <p className="text-xs scholr-muted mt-0.5">
                  {grade.created_at ? format(new Date(grade.created_at), 'MMM d, yyyy') : ''}
                </p>
              </div>
              <div className="text-right">
                {grade.score != null && (
                  <div>
                    <span className="text-2xl font-bold scholr-ink">{grade.score}</span>
                    <span className="scholr-faint ml-1">/ {grade.max_score}</span>
                    {grade.percentage && (
                      <p className="text-sm scholr-muted">{grade.percentage}%</p>
                    )}
                  </div>
                )}
                {grade.ib_grade && (
                  <Badge className="scholr-accent-sf scholr-accent border-0 mt-2">
                    IB {grade.ib_grade}/7
                  </Badge>
                )}
              </div>
            </div>
            {grade.comment && (
              <div className="mt-3 pt-3 border-t scholr-rule-soft">
                <p className="text-xs font-semibold scholr-body mb-1">Teacher Feedback</p>
                <p className="text-sm scholr-muted">{grade.comment}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}