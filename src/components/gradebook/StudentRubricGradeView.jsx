import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Student-facing view of rubric-based grades
 * Shows criterion scores and feedback
 * Respects visibility settings
 */
export default function StudentRubricGradeView({ 
  gradeItem, 
  visibleComponents,
  showIBGrade = true 
}) {
  if (!gradeItem || !gradeItem.rubric_criteria || gradeItem.rubric_criteria.length === 0) {
    return null;
  }

  const criterionScores = gradeItem.criterion_scores || [];
  const totalScore = gradeItem.score || 0;
  const percentage = gradeItem.percentage || 0;

  const calculateCriterionPercentage = (criterion) => {
    const score = criterionScores.find(cs => cs.criterion_id === criterion.id)?.score || 0;
    return criterion.max_score ? (score / criterion.max_score) * 100 : 0;
  };

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
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{gradeItem.title}</CardTitle>
            </div>
            <div className="text-right">
              {visibleComponents?.score && (
                <div>
                  <p className="text-sm text-slate-600">Score</p>
                  <p className="text-2xl font-bold text-slate-900">{totalScore}</p>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {visibleComponents?.percentage && (
              <div>
                <p className="text-sm text-slate-600">Percentage</p>
                <p className={`text-xl font-bold ${getPerformanceColor(percentage)}`}>
                  {percentage}%
                </p>
              </div>
            )}
            {visibleComponents?.ib_grade && showIBGrade && (
              <div>
                <p className="text-sm text-slate-600">IB Grade</p>
                <p className="text-xl font-bold text-indigo-600">{gradeItem.ib_grade || '-'}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-600">Performance</p>
              <p className={`text-sm font-semibold ${getPerformanceColor(percentage)}`}>
                {getPerformanceLabel(percentage)}
              </p>
            </div>
          </div>

          {visibleComponents?.comment && gradeItem.comment && (
            <div className="pt-4 border-t">
              <p className="text-sm font-semibold text-slate-700 mb-2">Teacher Comment</p>
              <p className="text-sm text-slate-600">{gradeItem.comment}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Criterion Breakdown */}
      {visibleComponents?.rubric_breakdown && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">Assessment Criteria Breakdown</h3>
          {gradeItem.rubric_criteria.map((criterion) => {
            const criterionScore = criterionScores.find(cs => cs.criterion_id === criterion.id);
            const criterionPercentage = calculateCriterionPercentage(criterion);

            return (
              <Card key={criterion.id}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">{criterion.name}</h4>
                        {criterion.description && (
                          <p className="text-sm text-slate-600 mt-1">{criterion.description}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {visibleComponents?.criteria_scores && (
                          <div>
                            <p className="text-sm text-slate-600">
                              {criterionScore?.score || 0} / {criterion.max_score}
                            </p>
                            <p className={`text-sm font-semibold ${getPerformanceColor(criterionPercentage)}`}>
                              {Math.round(criterionPercentage)}%
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {visibleComponents?.criteria_scores && (
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            criterionPercentage >= 80
                              ? 'bg-emerald-500'
                              : criterionPercentage >= 60
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(criterionPercentage, 100)}%` }}
                        />
                      </div>
                    )}

                    {/* Feedback */}
                    {visibleComponents?.criteria_scores && criterionScore?.feedback && (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-semibold text-slate-700 mb-1">Feedback</p>
                        <p className="text-sm text-slate-600">{criterionScore.feedback}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}