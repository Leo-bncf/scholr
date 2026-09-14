import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

/**
 * Dialog for teachers to grade a rubric criterion-by-criterion
 * Collects score and feedback for each criterion
 */
export default function RubricGradingDialog({ 
  open, 
  onClose, 
  rubric, 
  studentName, 
  initialScores = [],
  onSave,
  isLoading = false
}) {
  const [scores, setScores] = useState(
    initialScores.length > 0
      ? initialScores
      : rubric?.criteria?.map(c => ({ criterion_id: c.id, score: 0, feedback: '' })) || []
  );

  const handleUpdateScore = (criterionId, score) => {
    setScores(scores.map(s =>
      s.criterion_id === criterionId ? { ...s, score: parseInt(score) || 0 } : s
    ));
  };

  const handleUpdateFeedback = (criterionId, feedback) => {
    setScores(scores.map(s =>
      s.criterion_id === criterionId ? { ...s, feedback } : s
    ));
  };

  const handleSave = () => {
    const criterion_scores = scores.map(s => ({
      criterion_id: s.criterion_id,
      score: s.score,
      feedback: s.feedback
    }));

    // Calculate total score
    const totalScore = scores.reduce((sum, s) => sum + (s.score || 0), 0);
    const avgPercentage = rubric?.max_score ? (totalScore / rubric.max_score) * 100 : 0;

    onSave({
      criterion_scores,
      score: totalScore,
      percentage: Math.round(avgPercentage),
      ib_grade: calculateIBGrade(avgPercentage)
    });
  };

  const calculateIBGrade = (percentage) => {
    if (percentage >= 90) return 7;
    if (percentage >= 80) return 6;
    if (percentage >= 70) return 5;
    if (percentage >= 60) return 4;
    if (percentage >= 50) return 3;
    if (percentage >= 40) return 2;
    return 1;
  };

  const currentTotal = scores.reduce((sum, s) => sum + (s.score || 0), 0);
  const maxTotal = rubric?.criteria?.reduce((sum, c) => sum + (c.max_score || 0), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grade {studentName} - Rubric Assessment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">
              <p className="font-semibold">Criterion-Based Grading</p>
              <p className="text-sm mt-1">Enter a score and feedback for each criterion below.</p>
            </AlertDescription>
          </Alert>

          {rubric?.criteria?.map((criterion) => {
            const score = scores.find(s => s.criterion_id === criterion.id);
            return (
              <div key={criterion.id} className="border rounded-lg p-4 space-y-3">
                <div>
                  <h4 className="font-semibold scholr-ink">{criterion.name}</h4>
                  {criterion.description && (
                    <p className="text-sm scholr-muted mt-1">{criterion.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold scholr-muted">
                      Score (out of {criterion.max_score})
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      max={criterion.max_score}
                      value={score?.score || 0}
                      onChange={(e) => handleUpdateScore(criterion.id, e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold scholr-muted">Feedback</Label>
                  <Textarea
                    placeholder="Specific feedback for this criterion..."
                    value={score?.feedback || ''}
                    onChange={(e) => handleUpdateFeedback(criterion.id, e.target.value)}
                    rows={2}
                    className="mt-1"
                  />
                </div>
              </div>
            );
          })}

          <div className="scholr-accent-sf border scholr-accent-rule rounded-lg p-4">
            <p className="text-sm scholr-accent">
              <span className="font-semibold">Total Score:</span> {currentTotal} / {maxTotal}
              {maxTotal > 0 && (
                <>
                  {' '}
                  <span className="font-semibold">({Math.round((currentTotal / maxTotal) * 100)}%)</span>
                </>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="scholr-accent-sf hover:scholr-accent-sf"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Save Grade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}