import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Eye, MessageSquare, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import StudentRubricGradeView from './StudentRubricGradeView';
import * as gradebookData from '@/data/gradebook';

export default function StudentGradesView({ classData, studentId }) {
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['student-grades', classData.id, studentId],
    queryFn: () => gradebookData.whereGradeItems({
      school_id: classData.school_id,
      class_id: classData.id,
      student_id: studentId,
      visible_to_student: true
    }, { order: 'created_at', ascending: false }),
  });

  const { data: predictedGrade } = useQuery({
    queryKey: ['student-predicted-grade', classData.id, studentId],
    queryFn: async () => {
      const preds = await gradebookData.wherePredictedGrades({
        school_id: classData.school_id,
        class_id: classData.id,
        student_id: studentId,
        visible_to_student: true
      });
      return preds[0];
    },
  });

  if (isLoading) {
    return <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>;
  }

  if (grades.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Eye className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No grades available yet</p>
      </div>
    );
  }

  const validGrades = grades.filter(g => g.score != null);
  const average = validGrades.length > 0
    ? (validGrades.reduce((sum, g) => sum + ((g.score / g.max_score) * 100), 0) / validGrades.length).toFixed(1)
    : null;

  const ibGrades = grades.filter(g => g.ib_grade != null);
  const ibAverage = ibGrades.length > 0
    ? (ibGrades.reduce((sum, g) => sum + g.ib_grade, 0) / ibGrades.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 font-medium">Total Grades</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{grades.length}</p>
        </div>
        <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-5">
          <p className="text-sm text-indigo-700 font-medium">Class Average</p>
          <p className="text-3xl font-bold text-indigo-900 mt-1">
            {average ? `${average}%` : '—'}
          </p>
        </div>
        <div className="bg-violet-50 rounded-xl border border-violet-200 p-5">
          <p className="text-sm text-violet-700 font-medium">IB Average</p>
          <p className="text-3xl font-bold text-violet-900 mt-1">
            {ibAverage || '—'}{ibAverage && <span className="text-lg text-violet-600">/7</span>}
          </p>
        </div>
        {predictedGrade && (
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <p className="text-sm text-emerald-700 font-medium">Predicted Grade</p>
            </div>
            <p className="text-3xl font-bold text-emerald-900 mt-1">
              {predictedGrade.predicted_ib_grade}<span className="text-lg text-emerald-600">/7</span>
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {grades.map(grade => {
          if (grade.grading_type === 'rubric') {
            return <StudentRubricGradeView key={grade.id} grade={grade} />;
          }

          return (
            <div key={grade.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-lg">{grade.title}</h3>
                  {grade.created_at && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(new Date(grade.created_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {grade.score != null && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-900">
                        {grade.score}
                        <span className="text-lg text-slate-400 ml-1">/ {grade.max_score}</span>
                      </div>
                      {grade.percentage && (
                        <div className="text-sm text-slate-500">{grade.percentage}%</div>
                      )}
                    </div>
                  )}
                  {grade.ib_grade && (
                    <Badge className="bg-violet-50 text-violet-700 border-0">
                      IB {grade.ib_grade}/7
                    </Badge>
                  )}
                  {grade.status && grade.status !== 'draft' && grade.status !== 'published' && (
                    <Badge className={`border-0 ${
                      grade.status === 'missing' ? 'bg-red-50 text-red-700' :
                      grade.status === 'late' ? 'bg-amber-50 text-amber-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {grade.status}
                    </Badge>
                  )}
                </div>
              </div>

              {grade.comment && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700 mb-1">Teacher Feedback</p>
                      <p className="text-sm text-slate-600">{grade.comment}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}