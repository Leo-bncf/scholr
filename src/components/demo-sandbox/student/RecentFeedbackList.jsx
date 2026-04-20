import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ArrowRight } from 'lucide-react';
import {
  getFeedbackForStudent, getSubmissionById, getAssignment, getTeacher,
} from '@/components/demo-sandbox/mockSchoolData';

export default function RecentFeedbackList({ studentId, limit = 3 }) {
  const feedback = getFeedbackForStudent(studentId).slice(0, limit);

  if (feedback.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-slate-400">
        No recent feedback from your teachers.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {feedback.map((f) => {
        const sub = getSubmissionById(f.submissionId);
        const assignment = sub ? getAssignment(sub.assignmentId) : null;
        const teacher = getTeacher(f.teacherId);

        return (
          <Link
            key={f.id}
            to={assignment ? `/demo/student/assignment/${assignment.id}` : '#'}
            className="group block px-4 md:px-6 py-4 hover:bg-slate-50/70 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                {teacher?.initials || '??'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-slate-900 truncate">{teacher?.name}</p>
                  <span className="text-[10px] text-slate-400">·</span>
                  <p className="text-[10px] text-slate-500 truncate">{f.createdAt}</p>
                </div>
                <p className="text-xs text-slate-500 truncate mb-1.5">
                  <MessageSquare className="w-3 h-3 inline mr-1" />
                  {assignment?.title}
                </p>
                <p className="text-sm text-slate-700 line-clamp-2 leading-snug">{f.body}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition mt-1" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}