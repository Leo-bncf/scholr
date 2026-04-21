import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  getAssignmentsForStudent, getSubmission, getClass, getSubject,
} from '@/components/demo-sandbox/mockSchoolData';
import { useDemoStore, getEffectiveSubmissionStatus } from '@/components/demo-sandbox/useDemoStore';

// Plain-English one-liner so parents don't need to decode the system
const parentStatusLine = (status) => {
  if (status === 'submitted') return { text: 'Handed in',     color: 'text-emerald-700', Icon: CheckCircle2 };
  if (status === 'graded')    return { text: 'Graded',        color: 'text-violet-700',  Icon: CheckCircle2 };
  if (status === 'in_progress') return { text: 'Working on it', color: 'text-amber-700', Icon: Clock };
  if (status === 'late')      return { text: 'Overdue',       color: 'text-red-700',     Icon: AlertTriangle };
  return                       { text: 'Not started yet',    color: 'text-slate-600',   Icon: Clock };
};

export default function ParentDeadlinesList({ studentId, limit = 5 }) {
  useDemoStore();
  const items = getAssignmentsForStudent(studentId)
    .map((a) => {
      const sub = getSubmission(studentId, a.id);
      const cls = a.classId ? getClass(a.classId) : null;
      return {
        ...a,
        status: sub ? getEffectiveSubmissionStatus(sub) : 'not_started',
        subjectName: cls ? getSubject(cls.subjectId)?.name : 'Core',
      };
    })
    .filter((a) => a.status !== 'submitted' && a.status !== 'graded')
    .slice(0, limit);

  if (items.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-slate-400">
        Nothing due soon — your child is caught up.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((a) => {
        const { text, color, Icon } = parentStatusLine(a.status);
        const urgent = (a.dueIn || '').toLowerCase().includes('tomorrow');
        return (
          <Link
            key={a.id}
            to={`/demo/parent/assignment/${a.id}`}
            className="group flex items-stretch hover:bg-slate-50/70 transition-colors"
          >
            <div className={`w-1 flex-shrink-0 ${urgent ? 'bg-red-500' : 'bg-transparent'}`} />
            <div className="flex-1 px-4 md:px-6 py-3.5 flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{a.title}</p>
                <p className="text-[11px] text-slate-500 truncate">{a.subjectName}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold text-slate-700">
                  Due {a.dueIn.toLowerCase()}
                </p>
                <p className={`text-[11px] font-medium inline-flex items-center gap-1 ${color}`}>
                  <Icon className="w-3 h-3" />
                  {text}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}