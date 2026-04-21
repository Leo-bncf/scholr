import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import DemoShell from '@/components/demo-sandbox/DemoShell';
import DemoSectionCard from '@/components/demo-sandbox/DemoSectionCard';
import RubricGrader from '@/components/demo-sandbox/teacher/RubricGrader';
import InlineFeedbackDraft from '@/components/demo-sandbox/teacher/InlineFeedbackDraft';
import GradingSuccessState from '@/components/demo-sandbox/teacher/GradingSuccessState';
import {
  getSubmissionById, getAssignment, getStudent, getClass,
  getRubricFor, getDraftFor, getSubmissionsForAssignment,
} from '@/components/demo-sandbox/mockSchoolData';
import {
  useDemoStore, publishDemoGrade, saveDemoFeedback, getEffectiveSubmissionStatus,
} from '@/components/demo-sandbox/useDemoStore';
import { ArrowLeft, ArrowRight, Clock, AlertCircle, FileText } from 'lucide-react';

export default function DemoTeacherReview() {
  const { submissionId } = useParams();
  const sub = getSubmissionById(submissionId);
  const store = useDemoStore();
  const override = sub ? store.submissions[sub.id] : null;
  const [publishedResult, setPublishedResult] = useState(override?.result || null);

  // When navigating between submissions, re-hydrate from the store.
  useEffect(() => {
    setPublishedResult(override?.result || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  const handlePublish = (result) => {
    setPublishedResult(result);
    publishDemoGrade(submissionId, result);
  };

  const handleFeedbackChange = (commentsByParagraph) => {
    saveDemoFeedback(submissionId, commentsByParagraph);
  };

  if (!sub) {
    return (
      <DemoShell roleKey="teacher">
        <p className="text-sm text-slate-500">Submission not found.</p>
        <Link to="/demo/teacher" className="text-sm font-semibold text-emerald-700 hover:underline">← Back to dashboard</Link>
      </DemoShell>
    );
  }

  const assignment = getAssignment(sub.assignmentId);
  const student = getStudent(sub.studentId);
  const cls = assignment?.classId ? getClass(assignment.classId) : null;
  const rubric = getRubricFor(sub.assignmentId);
  const draft = getDraftFor(sub.id);

  // Progress: where in the class queue is this student — use effective status
  // so already-graded submissions (via the demo store) are excluded from "next".
  const classmates = getSubmissionsForAssignment(sub.assignmentId);
  const currentIdx = classmates.findIndex((s) => s.id === sub.id);
  const isPending = (s) => {
    const status = getEffectiveSubmissionStatus(s);
    return status === 'submitted' || status === 'late';
  };
  const nextInQueue =
    classmates.slice(currentIdx + 1).find((s) => s.id !== sub.id && isPending(s)) ||
    classmates.find((s) => s.id !== sub.id && isPending(s));

  // Count graded using both the mock baseline and any local overrides.
  const gradedCount = classmates.filter(
    (s) => getEffectiveSubmissionStatus(s) === 'graded'
  ).length;
  const classRemaining = Math.max(0, classmates.length - gradedCount);

  return (
    <DemoShell roleKey="teacher">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <Link
          to={cls ? `/demo/teacher/class/${cls.id}` : '/demo/teacher'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> {cls ? `Back to ${cls.name}` : 'Back to dashboard'}
        </Link>
        {nextInQueue && (
          <Link
            to={`/demo/teacher/review/${nextInQueue.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Next in queue <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">{assignment?.type?.replace('_', ' ')}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">{assignment?.title}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {student?.name} · {student?.grade} · {cls?.name}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5" /> Submitted {sub.submittedAt || '—'}
          </span>
          {sub.late && (
            <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" /> Late
            </span>
          )}
        </div>
      </div>

      {/* Review progress strip */}
      <div className="mb-6 bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
          <span>Grading progress for this assignment</span>
          <span>{gradedCount} of {classmates.length} graded</span>
        </div>
        <div className="flex gap-1">
          {classmates.map((s) => {
            const isCurrent = s.id === sub.id;
            const effectiveStatus = getEffectiveSubmissionStatus(s);
            const color =
              effectiveStatus === 'graded' ? 'bg-emerald-500' :
              effectiveStatus === 'submitted' || effectiveStatus === 'late' ? 'bg-amber-400' :
              'bg-slate-200';
            return (
              <div
                key={s.id}
                className={`h-1.5 flex-1 rounded-full ${color} transition-colors duration-500 ${isCurrent ? 'ring-2 ring-offset-1 ring-emerald-500' : ''}`}
                title={getStudent(s.studentId)?.name}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <DemoSectionCard title={
            <span className="inline-flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Inline feedback
            </span>
          }>
            {draft.length > 0 ? (
              <InlineFeedbackDraft
                key={sub.id}
                paragraphs={draft}
                initialComments={override?.feedback}
                onChange={handleFeedbackChange}
              />
            ) : (
              <p className="text-sm text-slate-500">Student has not attached a draft.</p>
            )}
          </DemoSectionCard>
        </div>

        <div className="lg:col-span-2">
          <div className="sticky top-20">
            <DemoSectionCard title={publishedResult ? 'Review complete' : 'Rubric-based grading'}>
              {publishedResult ? (
                <GradingSuccessState
                  result={publishedResult}
                  studentName={student?.name}
                  classRemaining={classRemaining}
                  classTotal={classmates.length}
                  nextSubmissionId={nextInQueue?.id || null}
                  onGradeAnother={() => setPublishedResult(null)}
                />
              ) : rubric ? (
                <RubricGrader rubric={rubric} onPublish={handlePublish} />
              ) : (
                <p className="text-sm text-slate-500">No rubric configured for this assignment.</p>
              )}
            </DemoSectionCard>
          </div>
        </div>
      </div>
    </DemoShell>
  );
}