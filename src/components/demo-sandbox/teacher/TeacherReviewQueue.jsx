import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, Zap } from 'lucide-react';
import DemoSectionCard from '@/components/demo-sandbox/DemoSectionCard';
import {
  getSubmissionsForTeacher, getAssignment, getStudent, getClass,
} from '@/components/demo-sandbox/mockSchoolData';
import { useDemoStore, getEffectiveSubmissionStatus } from '@/components/demo-sandbox/useDemoStore';

export default function TeacherReviewQueue({ teacherId }) {
  useDemoStore(); // re-render when the local demo store changes
  // Include ALL submissions for this teacher, not just baseline-pending — a
  // student may have submitted during the demo, flipping in_progress → submitted.
  const queue = getSubmissionsForTeacher(teacherId)
    .filter((s) => {
      const status = getEffectiveSubmissionStatus(s);
      return status === 'submitted' || status === 'late';
    })
    .map((s) => {
      const a = getAssignment(s.assignmentId);
      const stu = getStudent(s.studentId);
      const cls = a?.classId ? getClass(a.classId) : null;
      return { sub: s, assignment: a, student: stu, cls };
    });

  return (
    <DemoSectionCard
      title="Assignments to review this week"
      action={
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
          <Zap className="w-3 h-3" /> {queue.length} ready to grade
        </span>
      }
    >
      {queue.length === 0 ? (
        <p className="text-sm text-slate-500">Inbox zero — all submissions graded.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {queue.map(({ sub, assignment, student, cls }) => (
            <Link
              key={sub.id}
              to={`/demo/teacher/review/${sub.id}`}
              className="flex items-center justify-between py-3 -mx-2 px-2 rounded-lg hover:bg-slate-50 transition group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {student?.initials}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 truncate">{student?.name}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {assignment?.title} · {cls?.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {sub.late && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-rose-600">
                    <AlertCircle className="w-3 h-3" /> Late
                  </span>
                )}
                <span className="text-xs text-slate-500 hidden sm:inline">{sub.submittedAt}</span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 group-hover:gap-2 transition-all">
                  Grade <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DemoSectionCard>
  );
}