import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Parent-facing view of rubric-based grades
 * Shows what parents are allowed to see based on school visibility policy
 * Respects student visibility settings
 */
export default function ChildRubricGradesView({ 
  gradeItems = [], 
  studentName,
  visibleComponentsOverride = null 
}) {
  if (!gradeItems || gradeItems.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-sm">No grades available yet for {studentName}</p>
      </div>
    );
  }

  // Filter to only rubric-based grades
  const rubricGrades = gradeItems.filter(g => g.grading_type === 'rubric' && g.visible_to_parent);

  if (rubricGrades.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-sm">No detailed assessments visible yet</p>
      </div>
    );
  }

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'text-emerald-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getPerformanceLabel = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 50) return 'Satisfactory';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-4">
      {rubricGrades.map((grade) => {
        const criterionScores = grade.criterion_scores || [];
        const percentage = grade.percentage || 0;

        const calculateCriterionPercentage = (criterion) => {
          const score = criterionScores.find(cs => cs.criterion_id === criterion.id)?.score || 0;
          return criterion.max_score ? (score / criterion.max_score) * 100 : 0;
        };

        return (
          <Card key={grade.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{grade.title}</CardTitle>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${getPerformanceColor(percentage)}`}>
                    {percentage}%
                  </p>
                  <p className={`text-xs font-semibold ${getPerformanceColor(percentage)} mt-1`}>
                    {getPerformanceLabel(percentage)}
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Teacher Comment */}
              {grade.comment && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">Teacher Feedback</p>
                  <p className="text-sm text-slate-700">{grade.comment}</p>
                </div>
              )}

              {/* Criteria Breakdown */}
              {grade.rubric_criteria && grade.rubric_criteria.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-3">Assessment Criteria</p>
                  <div className="space-y-3">
                    {grade.rubric_criteria.map((criterion) => {
                      const criterionScore = criterionScores.find(cs => cs.criterion_id === criterion.id);
                      const criterionPercentage = calculateCriterionPercentage(criterion);

                      return (
                        <div key={criterion.id} className="pb-3 border-b last:border-b-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{criterion.name}</p>
                              {criterion.description && (
                                <p className="text-xs text-slate-600 mt-0.5">{criterion.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900">
                                {criterionScore?.score || 0} / {criterion.max_score}
                              </p>
                              <p className={`text-xs font-semibold ${getPerformanceColor(criterionPercentage)}`}>
                                {Math.round(criterionPercentage)}%
                              </p>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full bg-slate-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                criterionPercentage >= 80
                                  ? 'bg-emerald-500'
                                  : criterionPercentage >= 60
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(criterionPercentage, 100)}%` }}
                            />
                          </div>

                          {/* Criterion Feedback */}
                          {criterionScore?.feedback && (
                            <p className="text-xs text-slate-600 mt-2 italic">
                              "{criterionScore.feedback}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}