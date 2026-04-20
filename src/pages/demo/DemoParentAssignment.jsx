import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DemoShell from '@/components/demo-sandbox/DemoShell';
import AppStyleCard from '@/components/demo-sandbox/AppStyleCard';
import { Badge } from '@/components/ui/badge';
import {
  PARENT, getAssignment, getClass, getSubject, getTeacher,
  getSubmission, getFeedbackForSubmission, getChildrenOf,
} from '@/components/demo-sandbox/mockSchoolData';
import {
  ArrowLeft, Calendar, CheckCircle2, Clock, AlertCircle, CircleDashed,
  MessageSquare, Info, BookOpen,
} from 'lucide-react';

// Plain-English status explanation — the core "what does this mean?" mapping
const statusExplanation = {
  submitted: {
    label: 'Handed in',
    icon: CheckCircle2,
    color: 'bg-emerald-50 text-emerald-700',
    explanation: 'Your child has submitted their work. The teacher will review and share feedback soon.',
  },
  graded: {
    label: 'Graded',
    icon: CheckCircle2,
    color: 'bg-violet-50 text-violet-700',
    explanation: 'The teacher has graded this work. You can read their feedback below.',
  },
  in_progress: {
    label: 'Working on it',
    icon: Clock,
    color: 'bg-amber-50 text-amber-700',
    explanation: 'Your child has started this assignment but hasn\'t submitted it yet.',
  },
  late: {
    label: 'Overdue',
    icon: AlertCircle,
    color: 'bg-red-50 text-red-700',
    explanation: 'This assignment is past its due date. The teacher will still accept and review it.',
  },
  not_started: {
    label: 'Not started yet',
    icon: CircleDashed,
    color: 'bg-slate-100 text-slate-700',
    explanation: 'Your child hasn\'t begun this assignment yet. It\'s still before the due date.',
  },
};

// Simplify teacher feedback into a parent-friendly highlight
const simplifyFeedback = (body) => {
  const sentences = body.split(/(?<=[.!?])\s+/).filter(Boolean);
  const headline = sentences[0] || body;
  const rest = sentences.slice(1).join(' ');
  return { headline, rest };
};

export default function DemoParentAssignment() {
  const { assignmentId } = useParams();
  const assignment = getAssignment(assignmentId);
  const [selectedChild] = useState(PARENT.children[0]);

  // Find first child enrolled in this assignment's class (or fall back to first child)
  const child = PARENT.children.find((c) => {
    const cls = assignment?.classId ? getClass(assignment.classId) : null;
    return cls?.studentIds?.includes(c.id);
  }) || selectedChild;

  if (!assignment) {
    return (
      <DemoShell roleKey="parent">
        <p className="text-sm text-slate-500">Assignment not found.</p>
        <Link to="/demo/parent" className="text-sm font-semibold text-indigo-700 hover:underline">
          ← Back to overview
        </Link>
      </DemoShell>
    );
  }

  const cls = assignment.classId ? getClass(assignment.classId) : null;
  const subject = cls ? getSubject(cls.subjectId) : null;
  const teacher = cls ? getTeacher(cls.teacherId) : null;
  const submission = getSubmission(child.id, assignment.id);
  const status = submission?.status || 'not_started';
  const se = statusExplanation[status];
  const feedback = submission ? getFeedbackForSubmission(submission.id) : [];

  return (
    <DemoShell roleKey="parent">
      <Link
        to="/demo/parent"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to overview
      </Link>

      {/* Header */}
      <div className="bg-white rounded-md border border-slate-200 shadow-sm p-5 md:p-6 mb-6">
        <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 mb-1">
          {child.name}'s assignment
        </p>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">{assignment.title}</h1>
        <div className="flex items-center gap-4 text-xs md:text-sm text-slate-500 flex-wrap">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-4 h-4" /> Due {assignment.dueLabel}
          </span>
          {subject && (
            <span className="inline-flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> {subject.name}
            </span>
          )}
          {teacher && <span>· {teacher.name}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* What's happening — plain-English status */}
          <AppStyleCard title="What's happening" icon={Info}>
            <div className="p-5 md:p-6">
              <div className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-md ${se.color}`}>
                <se.icon className="w-4 h-4" />
                {se.label}
              </div>
              <p className="text-sm md:text-base text-slate-700 leading-relaxed mt-4">
                {se.explanation}
              </p>
              {submission?.submittedAt && (
                <p className="text-xs text-slate-500 mt-3 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Submitted {submission.submittedAt}
                  {submission.late && <span className="text-red-600 font-semibold ml-1">· Handed in late</span>}
                </p>
              )}
            </div>
          </AppStyleCard>

          {/* Teacher feedback — simplified */}
          <AppStyleCard title="What the teacher says" icon={MessageSquare}>
            {feedback.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-400">
                No feedback yet — the teacher will share notes once this work is reviewed.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {feedback.map((f) => {
                  const t = getTeacher(f.teacherId);
                  const { headline, rest } = simplifyFeedback(f.body);
                  return (
                    <div key={f.id} className="px-5 md:px-6 py-5">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold">
                          {t?.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{t?.name}</p>
                          <p className="text-[11px] text-slate-500">{t?.department} · {f.createdAt}</p>
                        </div>
                      </div>
                      {/* Headline callout */}
                      <div className="rounded-md bg-indigo-50 border-l-4 border-indigo-400 p-3 mb-3">
                        <p className="text-sm font-semibold text-indigo-900 leading-snug">
                          “{headline}”
                        </p>
                      </div>
                      {rest && (
                        <p className="text-sm text-slate-600 leading-relaxed">{rest}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </AppStyleCard>
        </div>

        <div className="space-y-6">
          <AppStyleCard title="About this assignment">
            <div className="p-5 md:p-6 space-y-4 text-sm">
              <p className="text-slate-700 leading-relaxed">{assignment.description}</p>
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Class</p>
                  <p className="font-medium text-slate-900">{cls?.name || 'Core'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Due</p>
                  <p className="font-medium text-slate-900">{assignment.dueLabel}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Teacher</p>
                  <p className="font-medium text-slate-900">{teacher?.name || '—'}</p>
                </div>
              </div>
            </div>
          </AppStyleCard>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
            <p className="font-semibold text-slate-900 mb-1">Need to talk to the teacher?</p>
            <p>
              You can message {teacher?.name.split(' ').slice(-1)} directly from Scholr — no more chasing email threads.
            </p>
          </div>
        </div>
      </div>
    </DemoShell>
  );
}