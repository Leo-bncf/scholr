import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Users, GraduationCap, CheckSquare, FileText, Loader2,
  AlertTriangle, CheckCircle, ArrowRight, Settings, Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';

/**
 * Admin landing tab — "is this class healthy?" view.
 * Read-first; admin can drill into any tab to take action.
 */
export default function AdminOverviewTab({ classData, onNavigate }) {
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

  const { data: memberships = [] } = useQuery({
    queryKey: ['class-teachers', classData.school_id, classData.teacher_ids],
    queryFn: async () => {
      if (!classData.teacher_ids?.length) return [];
      const all = await base44.entities.SchoolMembership.filter({ school_id: classData.school_id });
      return all.filter(m => classData.teacher_ids.includes(m.user_id));
    },
  });

  const { data: attendance = [], isLoading: loadingAtt } = useQuery({
    queryKey: ['class-att-30d', classData.id],
    queryFn: () => base44.entities.AttendanceRecord.filter({
      school_id: classData.school_id,
      class_id: classData.id,
    }),
  });

  const { data: assignments = [], isLoading: loadingAssign } = useQuery({
    queryKey: ['class-assignments-admin', classData.id],
    queryFn: () => base44.entities.Assignment.filter({
      school_id: classData.school_id,
      class_id: classData.id,
    }),
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['class-grades-admin', classData.id],
    queryFn: () => base44.entities.GradeItem.filter({
      school_id: classData.school_id,
      class_id: classData.id,
    }),
  });

  const isLoading = loadingAtt || loadingAssign;

  const studentCount = classData.student_ids?.length || 0;
  const capacity = classData.capacity;
  const capacityPct = capacity ? Math.round((studentCount / capacity) * 100) : null;

  const recentAtt = attendance.filter(a => a.date >= thirtyDaysAgo);
  const presentCount = recentAtt.filter(a => a.status === 'present' || a.status === 'late').length;
  const attendanceRate = recentAtt.length ? Math.round((presentCount / recentAtt.length) * 100) : null;

  const publishedAssignments = assignments.filter(a => a.status === 'published');
  const publishedGrades = grades.filter(g => g.status === 'published' && !g.is_template);
  const avgPct = publishedGrades.length
    ? Math.round(publishedGrades.reduce((s, g) => s + (g.percentage || 0), 0) / publishedGrades.length)
    : null;

  // Health signals
  const issues = [];
  if (!classData.teacher_ids?.length) issues.push({ severity: 'high', msg: 'No teacher assigned' });
  if (studentCount === 0) issues.push({ severity: 'high', msg: 'No students enrolled' });
  if (capacity && studentCount > capacity) issues.push({ severity: 'medium', msg: `Over capacity (${studentCount}/${capacity})` });
  if (attendanceRate !== null && attendanceRate < 80) issues.push({ severity: 'medium', msg: `Low attendance (${attendanceRate}%)` });
  if (classData.status === 'archived') issues.push({ severity: 'low', msg: 'Class is archived' });

  if (isLoading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-300 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Class overview</h2>
          <p className="text-xs text-slate-500">Read-only health summary. Drill into any tab to make changes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onNavigate('people')}>
            <Users className="w-3.5 h-3.5 mr-1.5" /> Manage roster
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onNavigate('settings')}>
            <Settings className="w-3.5 h-3.5 mr-1.5" /> Settings
          </Button>
        </div>
      </div>

      {/* Health */}
      <div className={`rounded-xl border p-4 ${issues.length ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <div className="flex items-start gap-3">
          {issues.length ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${issues.length ? 'text-amber-800' : 'text-emerald-800'}`}>
              {issues.length === 0
                ? 'Class looks healthy'
                : `${issues.length} issue${issues.length !== 1 ? 's' : ''} to review`}
            </p>
            {issues.length > 0 && (
              <ul className="mt-2 space-y-1">
                {issues.map((iss, i) => (
                  <li key={i} className="text-xs text-amber-700 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      iss.severity === 'high' ? 'bg-red-500' : iss.severity === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                    }`} />
                    {iss.msg}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={Users}
          label="Students"
          value={studentCount}
          sub={capacity ? `${capacityPct}% of ${capacity}` : 'No capacity set'}
          onClick={() => onNavigate('people')}
        />
        <KpiCard
          icon={GraduationCap}
          label="Teachers"
          value={memberships.length}
          sub={memberships[0]?.user_name || (memberships.length === 0 ? 'Unassigned' : '')}
          onClick={() => onNavigate('people')}
        />
        <KpiCard
          icon={CheckSquare}
          label="Attendance (30d)"
          value={attendanceRate !== null ? `${attendanceRate}%` : '—'}
          sub={recentAtt.length ? `${recentAtt.length} records` : 'No data'}
          onClick={() => onNavigate('attendance')}
        />
        <KpiCard
          icon={FileText}
          label="Avg grade"
          value={avgPct !== null ? `${avgPct}%` : '—'}
          sub={`${publishedAssignments.length} assignment${publishedAssignments.length !== 1 ? 's' : ''}`}
          onClick={() => onNavigate('grades')}
        />
      </div>

      {/* Teacher list */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Assigned staff</h3>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={() => onNavigate('people')}>
            Manage <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        {memberships.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No teachers assigned to this class.</p>
        ) : (
          <div className="space-y-2">
            {memberships.map(m => (
              <div key={m.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center justify-center">
                    {m.user_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-slate-800">{m.user_name}</p>
                    <p className="text-[11px] text-slate-500">{m.user_email}</p>
                  </div>
                </div>
                {m.user_id === classData.primary_teacher_id && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-indigo-300 hover:shadow-sm transition"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{sub}</p>
    </button>
  );
}