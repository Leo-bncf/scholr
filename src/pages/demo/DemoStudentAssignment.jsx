import React from 'react';
import { Link, useParams } from 'react-router-dom';
import DemoShell from '@/components/demo-sandbox/DemoShell';
import AppStyleCard from '@/components/demo-sandbox/AppStyleCard';
import { Badge } from '@/components/ui/badge';
import {
  STUDENT, getAssignment, getClass, getSubject, getTeacher,
  getSubmission, getFeedbackForSubmission, getRubricFor, getDraftFor,
} from '@/components/demo-sandbox/mockSchoolData';
import {
  ArrowLeft, Calendar, FileText, CheckCircle2, Clock, AlertCircle,
  CircleDashed, Target, MessageSquare, ListChecks, Paperclip,
} from 'lucide-react';

const statusVisual = {
  submitted:   { label: 'Submitted',   icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700' },
  graded:      { label: 'Graded',      icon: CheckCircle2, color: 'bg-violet-50 text-violet-700' },
  in_progress: { label: 'In progress', icon: Clock,        color: 'bg-amber-50 text-amber-700' },
  late:        { label: 'Late',        icon: AlertCircle,  color: 'bg-red-50 text-red-700' },
  not_started: { label: 'Not started', icon: CircleDashed, color: 'bg-slate-100 text-slate-700' },
};

const typeColors = {
  homework:            'bg-blue-50 text-blue-700',
  essay:               'bg-purple-50 text-purple-700',
  internal_assessment: 'bg-indigo-50 text-indigo-700',
  extended_essay:      'bg-violet-50 text-violet-700',
  lab_report:          'bg-cyan-50 text-cyan-700',
};

export default function DemoStudentAssignment() {
  const { assignmentId } = useParams();
  const assignment = getAssignment(assignmentId);

  if (!assignment) {
    return (
      <DemoShell roleKey="student">
        <p className="text-sm text-slate-500">Assignment not found.</p>
        <Link to="/demo/student" className="text-sm font-semibold text-indigo-700 hover:underline">
          ← Back to dashboard
        </Link>
      </DemoShell>
    );
  }

  const cls = assignment.classId ? getClass(assignment.classId) : null;
  const subject = cls ? getSubject(cls.subjectId) : null;
  const teacher = cls ? getTeacher(cls.teacherId) : null;
  const submission = getSubmission(STUDENT.id, assignment.id);
  const status = submission?.status || 'not_started';
  const sv = statusVisual[status];
  const feedback = submission ? getFeedbackForSubmission(submission.id) : [];
  const rubric = getRubricFor(assignment.id);
  const draft = submission ? getDraftFor(submission.id) : [];

  return (
    <DemoShell roleKey="student">
      <Link
        to="/demo/student"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5 md:p-6 mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">{assignment.title}</h1>
          <Badge className={`${typeColors[assignment.type] || 'bg-slate-100 text-slate-700'} border-0 capitalize`}>
            {assignment.type?.replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs md:text-sm text-slate-500 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> Due {assignment.dueLabel} ({assignment.dueIn.toLowerCase()})
          </span>
          {assignment.maxScore && (
            <span className="inline-flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> {assignment.maxScore} points
            </span>
          )}
          {subject && <span>{subject.name}</span>}
          {teacher && <span>· {teacher.name}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Requirements */}
          <AppStyleCard title="Requirements" icon={ListChecks}>
            <div className="p-5 md:p-6">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-5">
                {assignment.description}
              </p>

              {rubric && rubric.criteria.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                    Assessed against
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {rubric.criteria.map((c) => (
                      <Badge key={c.id} className="bg-indigo-50 text-indigo-700 border-0 text-xs">
                        {c.name} <span className="text-indigo-400 ml-1">/ {c.max}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {(!rubric && assignment.ibCriteria?.length > 0) && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                    IB criteria
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {assignment.ibCriteria.map((c) => (
                      <Badge key={c} className="bg-indigo-50 text-indigo-700 border-0 text-xs">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AppStyleCard>

          {/* Teacher feedback */}
          <AppStyleCard title="Teacher feedback" icon={MessageSquare}>
            {feedback.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">
                No feedback yet — your teacher will review this once you submit.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {feedback.map((f) => {
                  const t = getTeacher(f.teacherId);
                  return (
                    <div key={f.id} className="px-5 md:px-6 py-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold">
                          {t?.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{t?.name}</p>
                          <p className="text-[10px] text-slate-500">{f.createdAt}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{f.body}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </AppStyleCard>

          {/* Your work */}
          <AppStyleCard title="Your submission" icon={Paperclip}>
            {draft.length > 0 ? (
              <div className="p-5 md:p-6 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Draft preview</p>
                {draft.map((p) => (
                  <p key={p.id} className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-md p-3">
                    {p.text}
                  </p>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-sm text-slate-400">
                You haven't started this assignment yet.
              </div>
            )}
          </AppStyleCard>
        </div>

        {/* Right rail: status + what to do next */}
        <div className="space-y-6">
          <AppStyleCard title="Submission status" icon={Target}>
            <div className="p-5 md:p-6">
              <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${sv.color}`}>
                <sv.icon className="w-3.5 h-3.5" />
                {sv.label}
              </div>
              {submission?.submittedAt && (
                <p className="text-xs text-slate-500 mt-3">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Submitted {submission.submittedAt}
                  {submission.late && <span className="text-red-600 font-semibold ml-2">· Late</span>}
                </p>
              )}

              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">
                  What to do next
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {status === 'not_started' && 'Open the requirements above and start a draft before the due date.'}
                  {status === 'in_progress' && 'Keep working on your draft — you can submit once you feel it\'s ready.'}
                  {status === 'submitted' && 'Your submission is in. Check back here for your teacher\'s feedback.'}
                  {status === 'late' && 'Submitted after the deadline. Your teacher will still review it.'}
                  {status === 'graded' && 'Graded! Review the feedback above to see how to improve next time.'}
                </p>
              </div>
            </div>
          </AppStyleCard>

          <AppStyleCard title="Details">
            <div className="p-5 md:p-6 space-y-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Class</p>
                <p className="font-medium text-slate-900">{cls?.name || 'Core'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Due date</p>
                <p className="font-medium text-slate-900">{assignment.dueLabel}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Points</p>
                <p className="font-medium text-slate-900">{assignment.maxScore || 'Ungraded'}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Teacher</p>
                <p className="font-medium text-slate-900">{teacher?.name || '—'}</p>
              </div>
            </div>
          </AppStyleCard>
        </div>
      </div>
    </DemoShell>
  );
}