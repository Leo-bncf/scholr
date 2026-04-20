import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  getFeedbackForStudent, getTeacher, getSubmissionById, getAssignment,
} from '@/components/demo-sandbox/mockSchoolData';

// Compress the full teacher comment into a parent-digestible highlight
const summarise = (body) => {
  const first = body.split(/[.!?]/)[0]?.trim();
  return first ? `${first}.` : body;
};

export default function ParentFeedbackList({ studentId, limit = 3 }) {
  const items = getFeedbackForStudent(studentId).slice(0, limit);

  if (items.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-slate-400">
        No new notes from teachers this week.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((f) => {
        const teacher = getTeacher(f.teacherId);
        const sub = getSubmissionById(f.submissionId);
        const assignment = sub ? getAssignment(sub.assignmentId) : null;

        return (
          <Link
            key={f.id}
            to={assignment ? `/demo/parent/assignment/${assignment.id}` : '#'}
            className="group block px-4 md:px-6 py-4 hover:bg-slate-50/70 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                {teacher?.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{teacher?.name}</p>
                  <p className="text-[10px] text-slate-400 flex-shrink-0">{f.createdAt}</p>
                </div>
                <p className="text-[11px] text-slate-500 truncate mb-1">{assignment?.title}</p>
                <p className="text-sm text-slate-700 leading-snug">“{summarise(f.body)}”</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition mt-1" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}