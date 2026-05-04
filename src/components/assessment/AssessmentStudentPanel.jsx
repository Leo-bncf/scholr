import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function AssessmentStudentPanel({ assignment, studentId, studentName }) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);

  const { data: assessment } = useQuery({
    queryKey: ['assessment-by-assignment', assignment.id],
    queryFn: async () => (await base44.entities.Assessment.filter({ assignment_id: assignment.id }))[0],
    enabled: !!assignment?.id,
  });

  const { data: submission } = useQuery({
    queryKey: ['assessment-submission', assessment?.id, studentId],
    queryFn: async () => (await base44.entities.AssessmentSubmission.filter({ assessment_id: assessment.id, student_id: studentId }))[0],
    enabled: !!assessment?.id && !!studentId,
  });

  useEffect(() => {
    if (submission?.answers?.length) {
      const mapped = {};
      submission.answers.forEach((item) => { mapped[item.question_id] = item.answer || ''; });
      setAnswers(mapped);
    }
  }, [submission]);

  useEffect(() => {
    if (!assessment?.duration_minutes || submission?.locked) return;
    const startedAt = submission?.started_at ? new Date(submission.started_at) : new Date();
    const endsAt = new Date(startedAt.getTime() + assessment.duration_minutes * 60 * 1000);
    const update = () => {
      const seconds = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));
      setTimeLeft(seconds);
      if (seconds === 0 && !submission?.locked) handleSubmit();
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [assessment, submission]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const preparedAnswers = (assessment?.questions || []).map((question) => {
        const raw = answers[question.id] || '';
        const isMcq = question.type === 'multiple_choice';
        const isCorrect = isMcq ? raw.trim() === (question.correct_answer || '').trim() : null;
        const autoScore = isMcq ? (isCorrect ? Number(question.points) || 0 : 0) : 0;
        return {
          question_id: question.id,
          answer: raw,
          is_correct: isCorrect,
          auto_score: autoScore,
          teacher_score: null,
          teacher_feedback: ''
        };
      });

      const totalAutoScore = preparedAnswers.reduce((sum, item) => sum + (item.auto_score || 0), 0);
      const needsTeacherReview = (assessment?.questions || []).some((question) => question.type !== 'multiple_choice');
      const payload = {
        school_id: assignment.school_id,
        assessment_id: assessment.id,
        assignment_id: assignment.id,
        class_id: assignment.class_id,
        student_id: studentId,
        student_name: studentName,
        answers: preparedAnswers,
        status: needsTeacherReview ? 'submitted' : 'auto_graded',
        started_at: submission?.started_at || new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        time_remaining_seconds: timeLeft,
        total_score: totalAutoScore,
        max_score: assessment.max_score,
        needs_teacher_review: needsTeacherReview,
        locked: true,
      };

      if (submission?.id) {
        await base44.entities.AssessmentSubmission.update(submission.id, payload);
      } else {
        await base44.entities.AssessmentSubmission.create(payload);
      }

      const existingGrades = await base44.entities.GradeItem.filter({ class_id: assignment.class_id, assignment_id: assignment.id, student_id: studentId });
      const gradePayload = {
        school_id: assignment.school_id,
        class_id: assignment.class_id,
        student_id: studentId,
        student_name: studentName,
        assignment_id: assignment.id,
        title: assignment.title,
        score: totalAutoScore,
        max_score: assessment.max_score,
        percentage: assessment.max_score ? (totalAutoScore / assessment.max_score) * 100 : 0,
        status: needsTeacherReview ? 'draft' : 'published',
        visible_to_student: !needsTeacherReview,
        visible_to_parent: !needsTeacherReview,
      };

      if (existingGrades[0]) {
        await base44.entities.GradeItem.update(existingGrades[0].id, gradePayload);
      } else {
        await base44.entities.GradeItem.create(gradePayload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-submission', assessment?.id, studentId] });
      queryClient.invalidateQueries({ queryKey: ['class-grades'] });
    }
  });

  const reviewItems = useMemo(() => (submission?.answers || []).map((item) => {
    const question = assessment?.questions?.find((entry) => entry.id === item.question_id);
    return { ...item, question };
  }), [submission, assessment]);

  const handleSubmit = () => {
    if (submitMutation.isPending) return;
    submitMutation.mutate();
  };

  const handleStart = async () => {
    if (submission) return;
    await base44.entities.AssessmentSubmission.create({
      school_id: assignment.school_id,
      assessment_id: assessment.id,
      assignment_id: assignment.id,
      class_id: assignment.class_id,
      student_id: studentId,
      student_name: studentName,
      answers: [],
      status: 'in_progress',
      started_at: new Date().toISOString(),
      locked: false,
      max_score: assessment.max_score,
    });
    queryClient.invalidateQueries({ queryKey: ['assessment-submission', assessment?.id, studentId] });
  };

  if (!assessment) return null;

  if (submission?.locked) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Assessment Results</h2>
          <Badge>{submission.total_score || 0} / {submission.max_score || assessment.max_score}</Badge>
        </div>
        {reviewItems.map((item, index) => (
          <div key={item.question_id} className="border rounded-xl p-4">
            <p className="font-medium text-slate-900 mb-2">Q{index + 1}. {item.question?.prompt}</p>
            <p className="text-sm text-slate-700 mb-2">Your answer: {item.answer || '—'}</p>
            {item.question?.type === 'multiple_choice' && (
              <p className={`text-sm font-medium ${item.is_correct ? 'text-emerald-700' : 'text-red-700'}`}>
                {item.is_correct ? 'Correct' : 'Incorrect'}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-2">Score: {(item.teacher_score ?? item.auto_score) || 0} / {item.question?.points || 0}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-900">Assessment</h2>
          <p className="text-sm text-slate-500">Single submission only. Auto-submit when the timer ends.</p>
        </div>
        {typeof timeLeft === 'number' && <Badge>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</Badge>}
      </div>
      {!submission ? (
        <Button onClick={handleStart}>Start {assessment.type}</Button>
      ) : (
        <>
          {(assessment.questions || []).map((question, index) => (
            <div key={question.id} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">Q{index + 1}. {question.prompt}</p>
                <span className="text-xs text-slate-500">{question.points} pts</span>
              </div>
              {question.type === 'multiple_choice' ? (
                <RadioGroup value={answers[question.id] || ''} onValueChange={(value) => setAnswers({ ...answers, [question.id]: value })}>
                  {(question.options || []).map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${question.id}_${optionIndex}`} />
                      <Label htmlFor={`${question.id}_${optionIndex}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea value={answers[question.id] || ''} onChange={(e) => setAnswers({ ...answers, [question.id]: e.target.value })} rows={question.type === 'long_answer' ? 6 : 3} />
              )}
            </div>
          ))}
          <Button onClick={handleSubmit} disabled={submitMutation.isPending}>Submit assessment</Button>
        </>
      )}
    </div>
  );
}