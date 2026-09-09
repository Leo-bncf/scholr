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
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  }

  if (grades.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
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
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-700 font-medium">Overall Average</p>
            <p className="text-3xl font-bold text-indigo-900 mt-1">{average}%</p>
          </div>
          <TrendingUp className="w-10 h-10 text-indigo-400" />
        </div>
      )}

      <div className="space-y-3">
        {grades.map(grade => (
          <div key={grade.id} className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">{grade.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {grade.created_at ? format(new Date(grade.created_at), 'MMM d, yyyy') : ''}
                </p>
              </div>
              <div className="text-right">
                {grade.score != null && (
                  <div>
                    <span className="text-2xl font-bold text-slate-900">{grade.score}</span>
                    <span className="text-slate-400 ml-1">/ {grade.max_score}</span>
                    {grade.percentage && (
                      <p className="text-sm text-slate-500">{grade.percentage}%</p>
                    )}
                  </div>
                )}
                {grade.ib_grade && (
                  <Badge className="bg-violet-50 text-violet-700 border-0 mt-2">
                    IB {grade.ib_grade}/7
                  </Badge>
                )}
              </div>
            </div>
            {grade.comment && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 mb-1">Teacher Feedback</p>
                <p className="text-sm text-slate-600">{grade.comment}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}