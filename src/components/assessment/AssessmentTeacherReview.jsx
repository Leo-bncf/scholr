import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function AssessmentTeacherReview({ assignment }) {
  const queryClient = useQueryClient();
  const { data: assessment } = useQuery({
    queryKey: ['assessment-by-assignment-teacher', assignment.id],
    queryFn: async () => (await base44.entities.Assessment.filter({ assignment_id: assignment.id }))[0],
    enabled: !!assignment?.id,
  });
  const { data: submissions = [] } = useQuery({
    queryKey: ['assessment-review-submissions', assignment.id],
    queryFn: async () => base44.entities.AssessmentSubmission.filter({ assignment_id: assignment.id }),
    enabled: !!assignment?.id,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ submission, answers }) => {
      const total = answers.reduce((sum, item) => sum + Number(item.teacher_score ?? item.auto_score ?? 0), 0);
      await base44.entities.AssessmentSubmission.update(submission.id, {
        answers,
        total_score: total,
        status: 'reviewed',
        needs_teacher_review: false,
        locked: true,
      });

      const grade = (await base44.entities.GradeItem.filter({ assignment_id: assignment.id, student_id: submission.student_id }))[0];
      if (grade) {
        await base44.entities.GradeItem.update(grade.id, {
          score: total,
          percentage: submission.max_score ? (total / submission.max_score) * 100 : 0,
          status: 'published',
          visible_to_student: true,
          visible_to_parent: true,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-review-submissions', assignment.id] });
      queryClient.invalidateQueries({ queryKey: ['class-grades'] });
    }
  });

  if (!assessment) return null;

  return (
    <div className="space-y-4">
      {submissions.map((submission) => {
        const editableAnswers = submission.answers || [];
        return (
          <div key={submission.id} className="border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{submission.student_name}</h3>
              <span className="text-sm text-slate-500">{submission.total_score || 0} / {submission.max_score || assessment.max_score}</span>
            </div>
            {editableAnswers.map((answer, index) => {
              const question = assessment.questions.find((item) => item.id === answer.question_id);
              return (
                <div key={answer.question_id} className="border rounded-lg p-3 space-y-2">
                  <p className="font-medium text-sm">Q{index + 1}. {question?.prompt}</p>
                  <p className="text-sm text-slate-700">Answer: {answer.answer || '—'}</p>
                  {question?.type !== 'multiple_choice' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input type="number" defaultValue={answer.teacher_score ?? answer.auto_score ?? 0} onChange={(e) => { answer.teacher_score = Number(e.target.value) || 0; }} placeholder="Teacher score" />
                      <Textarea defaultValue={answer.teacher_feedback || ''} onChange={(e) => { answer.teacher_feedback = e.target.value; }} placeholder="Feedback" rows={2} />
                    </div>
                  )}
                  {question?.type === 'multiple_choice' && <p className={`text-xs ${answer.is_correct ? 'text-emerald-700' : 'text-red-700'}`}>{answer.is_correct ? 'Auto-graded correct' : 'Auto-graded incorrect'}</p>}
                </div>
              );
            })}
            {submission.needs_teacher_review && <Button onClick={() => reviewMutation.mutate({ submission, answers: editableAnswers })}>Publish reviewed result</Button>}
          </div>
        );
      })}
    </div>
  );
}