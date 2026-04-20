import React from 'react';
import { AlertTriangle, TrendingDown, ClipboardX, UserX, Flag } from 'lucide-react';
import { getAtRiskStudents } from '@/components/demo-sandbox/mockSchoolData';

const flagMeta = {
  grade_drop:     { Icon: TrendingDown, color: 'bg-rose-50 text-rose-700',       label: 'Grade drop' },
  missing_work:   { Icon: ClipboardX,   color: 'bg-amber-50 text-amber-700',     label: 'Missing work' },
  low_attendance: { Icon: UserX,        color: 'bg-indigo-50 text-indigo-700',   label: 'Low attendance' },
  behavior:       { Icon: Flag,         color: 'bg-violet-50 text-violet-700',   label: 'Behaviour' },
};

const severityRail = {
  high:   'bg-rose-500',
  medium: 'bg-amber-500',
  low:    'bg-slate-300',
};

export default function AtRiskStudentsList({ yearGroup, subjectId, limit }) {
  const students = getAtRiskStudents({ yearGroup, subjectId });
  const items = typeof limit === 'number' ? students.slice(0, limit) : students;

  if (items.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-slate-400">
        <AlertTriangle className="w-5 h-5 text-emerald-500 inline mb-1" />
        <p>No at-risk students for this filter — great news.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((s) => {
        const { Icon, color, label } = flagMeta[s.flag] || flagMeta.grade_drop;
        return (
          <div key={s.id} className="flex items-stretch">
            <div className={`w-1 flex-shrink-0 ${severityRail[s.severity]}`} />
            <div className="flex-1 px-4 md:px-6 py-3.5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                {s.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-slate-900 truncate">{s.name}</p>
                  <span className="text-[10px] text-slate-400">·</span>
                  <p className="text-[11px] font-medium text-slate-500">{s.yearGroup} · {s.subject}</p>
                </div>
                <p className="text-xs text-slate-600 truncate">{s.detail}</p>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded ${color} flex-shrink-0`}>
                <Icon className="w-3 h-3" />
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}