import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  getAssignmentsForStudent, getSubmission, getClass, getSubject,
} from '@/components/demo-sandbox/mockSchoolData';

const typeColors = {
  homework:           'bg-blue-50 text-blue-700',
  essay:              'bg-purple-50 text-purple-700',
  exam:               'bg-red-50 text-red-700',
  project:            'bg-emerald-50 text-emerald-700',
  quiz:               'bg-amber-50 text-amber-700',
  lab_report:         'bg-cyan-50 text-cyan-700',
  presentation:       'bg-pink-50 text-pink-700',
  internal_assessment:'bg-indigo-50 text-indigo-700',
  extended_essay:     'bg-violet-50 text-violet-700',
};

const urgencyColor = (dueIn = '') => {
  const lower = dueIn.toLowerCase();
  if (lower.includes('tomorrow')) return 'text-red-600';
  if (lower.includes('3 days') || lower.includes('in 4')) return 'text-amber-600';
  if (lower.includes('5 days') || lower.includes('6 days') || lower.includes('next week')) return 'text-slate-600';
  return 'text-slate-500';
};

export default function UpcomingDeadlinesTimeline({ studentId, limit }) {
  const assignments = getAssignmentsForStudent(studentId)
    .map((a) => {
      const sub = getSubmission(studentId, a.id);
      return { ...a, submission: sub };
    })
    .filter((a) => a.submission?.status !== 'submitted' && a.submission?.status !== 'graded');

  const items = typeof limit === 'number' ? assignments.slice(0, limit) : assignments;

  if (items.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-slate-400">
        Nothing due — you're all caught up 🎉
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((a) => {
        const cls = a.classId ? getClass(a.classId) : null;
        const subj = cls ? getSubject(cls.subjectId) : null;
        const isUrgent = (a.dueIn || '').toLowerCase().includes('tomorrow');
        return (
          <Link
            key={a.id}
            to={`/demo/student/assignment/${a.id}`}
            className="group flex items-stretch hover:bg-slate-50/70 transition-colors"
          >
            {/* Urgency rail */}
            <div className={`w-1 flex-shrink-0 ${isUrgent ? 'bg-red-500' : 'bg-transparent'}`} />

            <div className="flex-1 px-4 md:px-6 py-4 flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-medium text-slate-900 text-sm truncate">{a.title}</p>
                  <Badge className={`${typeColors[a.type] || 'bg-slate-100 text-slate-700'} border-0 text-[10px] capitalize`}>
                    {a.type?.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {subj?.name || 'Core'}
                  {cls && <span className="text-slate-300"> · {cls.name.split(' — ')[1] || ''}</span>}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1 text-xs font-semibold ${urgencyColor(a.dueIn)}`}>
                    {isUrgent && <AlertTriangle className="w-3 h-3" />}
                    <Clock className="w-3 h-3" />
                    {a.dueIn}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{a.dueLabel}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}