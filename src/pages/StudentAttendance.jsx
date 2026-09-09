import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle2, XCircle, Clock, AlertCircle, Loader2, ClipboardList
} from 'lucide-react';
import { format, subDays, eachWeekOfInterval, endOfWeek, parseISO, isWithinInterval } from 'date-fns';
import { getStudentSidebarLinks } from '@/components/app/studentSidebarLinks';
import * as classesData from '@/data/classes';
import * as attendanceData from '@/data/attendance';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const STATUS_META = {
  present: { label: 'Present', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: '#10b981' },
  absent:  { label: 'Absent',  icon: XCircle,      bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     bar: '#ef4444' },
  late:    { label: 'Late',    icon: Clock,         bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   bar: '#f59e0b' },
  excused: { label: 'Excused', icon: AlertCircle,   bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    bar: '#3b82f6' },
};

// ── Weekly trend chart ────────────────────────────────────────────────────────

function WeeklyTrendChart({ records }) {
  const weeks = useMemo(() => {
    if (records.length === 0) return [];
    const end = new Date();
    const start = subDays(end, 84); // 12 weeks
    const weekStarts = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });

    return weekStarts.map(ws => {
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const weekRecords = records.filter(r => {
        const d = parseISO(r.date);
        return isWithinInterval(d, { start: ws, end: we });
      });
      const present = weekRecords.filter(r => r.status === 'present').length;
      const total = weekRecords.length;
      return {
        week: format(ws, 'MMM d'),
        rate: total > 0 ? Math.round((present / total) * 100) : null,
        total,
      };
    }).filter(w => w.total > 0);
  }, [records]);

  if (weeks.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-bold text-sm text-slate-700 mb-4 uppercase tracking-wide">Weekly Attendance Rate</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={weeks} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
          <Tooltip
            formatter={(v) => [`${v}%`, 'Rate']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
          />
          <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
            {weeks.map((entry, i) => (
              <Cell key={i} fill={entry.rate >= 90 ? '#10b981' : entry.rate >= 75 ? '#f59e0b' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Status breakdown donut-like bar ──────────────────────────────────────────

function StatusBreakdownBar({ counts, total }) {
  if (total === 0) return null;
  return (
    <div className="flex rounded-full overflow-hidden h-3 w-full">
      {Object.entries(STATUS_META).map(([key, meta]) => {
        const pct = ((counts[key] || 0) / total) * 100;
        if (pct === 0) return null;
        return (
          <div key={key} style={{ width: `${pct}%`, backgroundColor: meta.bar }} title={`${meta.label}: ${counts[key] || 0}`} />
        );
      })}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function StudentAttendance() {
  const { user, school, schoolId, curriculum } = useUser();
  const studentLinks = getStudentSidebarLinks(curriculum);
  const [range, setRange] = useState('90');
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['student-classes', schoolId, user?.id],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => c.student_ids?.includes(user.id));
    },
    enabled: !!schoolId && !!user?.id,
  });

  const { data: allRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: ['student-attendance-all', schoolId, user?.id],
    queryFn: async () => {
      const recs = await attendanceData.whereRecords({
        school_id: schoolId,
        student_id: user.id,
      }, { order: 'date', ascending: false });
      const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]));
      return recs.map(r => ({ ...r, class_name: classMap[r.class_id] || 'Unknown' }));
    },
    enabled: !!schoolId && !!user?.id && classes.length > 0,
  });

  const cutoff = format(subDays(new Date(), parseInt(range)), 'yyyy-MM-dd');

  const filtered = useMemo(() => allRecords.filter(r => {
    const inRange = r.date >= cutoff;
    const inClass = classFilter === 'all' || r.class_id === classFilter;
    const inStatus = statusFilter === 'all' || r.status === statusFilter;
    return inRange && inClass && inStatus;
  }).sort((a, b) => b.date.localeCompare(a.date)), [allRecords, cutoff, classFilter, statusFilter]);

  const counts = useMemo(() => filtered.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {}), [filtered]);

  const total = filtered.length;
  const presentCount = counts.present || 0;
  const rate = total > 0 ? Math.round((presentCount / total) * 100) : null;

  const isLoading = loadingClasses || loadingRecords;

  // Records for trend chart (no status filter, full range)
  const trendRecords = useMemo(() => allRecords.filter(r => {
    const inRange = r.date >= cutoff;
    const inClass = classFilter === 'all' || r.class_id === classFilter;
    return inRange && inClass;
  }), [allRecords, cutoff, classFilter]);

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={studentLinks} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">My Attendance</h1>
              <p className="text-sm text-slate-500 mt-1">Personal attendance records and trends</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="space-y-5">
                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                  <Select value={range} onValueChange={setRange}>
                    <SelectTrigger className="w-40 h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="14">Last 14 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-48 h-9 text-sm"><SelectValue placeholder="All classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36 h-9 text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.entries(STATUS_META).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(STATUS_META).map(([key, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
                        className={`rounded-xl border p-4 text-left transition-all ${meta.bg} ${meta.border} ${statusFilter === key ? 'ring-2 ring-offset-1 ring-current' : 'hover:opacity-80'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`w-4 h-4 ${meta.text}`} />
                          <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
                        </div>
                        <p className={`text-3xl font-black ${meta.text}`}>{counts[key] || 0}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Rate + breakdown bar */}
                {rate !== null && (
                  <div className={`rounded-xl border p-5 ${rate >= 90 ? 'bg-emerald-50 border-emerald-200' : rate >= 75 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Overall Attendance Rate</p>
                        <p className="text-xs text-slate-500 mt-0.5">{total} sessions recorded</p>
                      </div>
                      <p className={`text-4xl font-black ${rate >= 90 ? 'text-emerald-700' : rate >= 75 ? 'text-amber-700' : 'text-red-700'}`}>{rate}%</p>
                    </div>
                    <StatusBreakdownBar counts={counts} total={total} />
                    <div className="flex flex-wrap gap-3 mt-3">
                      {Object.entries(STATUS_META).map(([key, meta]) => counts[key] > 0 && (
                        <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.bar }} />
                          {meta.label}: {Math.round(((counts[key] || 0) / total) * 100)}%
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weekly trend chart */}
                {trendRecords.length > 0 && <WeeklyTrendChart records={trendRecords} />}

                {/* Per-class breakdown */}
                {classFilter === 'all' && classes.length > 1 && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="font-bold text-sm text-slate-700 mb-4 uppercase tracking-wide">By Class</h3>
                    <div className="space-y-3">
                      {classes.map(cls => {
                        const clsRecords = filtered.filter(r => r.class_id === cls.id);
                        const clsPresent = clsRecords.filter(r => r.status === 'present').length;
                        const clsTotal = clsRecords.length;
                        const clsRate = clsTotal > 0 ? Math.round((clsPresent / clsTotal) * 100) : null;
                        const clsCounts = clsRecords.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
                        if (clsTotal === 0) return null;
                        return (
                          <div key={cls.id} className="flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{cls.name}</p>
                              <StatusBreakdownBar counts={clsCounts} total={clsTotal} />
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <p className={`text-lg font-bold ${clsRate >= 90 ? 'text-emerald-700' : clsRate >= 75 ? 'text-amber-700' : 'text-red-700'}`}>
                                {clsRate !== null ? `${clsRate}%` : '—'}
                              </p>
                              <p className="text-xs text-slate-400">{clsTotal} sessions</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Records table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wide">Record History</h3>
                    <span className="text-xs text-slate-400">{filtered.length} records</span>
                  </div>
                  {filtered.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm">No records match these filters</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Class</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {filtered.map(r => {
                            const meta = STATUS_META[r.status] || STATUS_META.absent;
                            const Icon = meta.icon;
                            return (
                              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-700">{format(parseISO(r.date), 'EEE, MMM d yyyy')}</td>
                                <td className="px-4 py-3 text-slate-600 text-xs">{r.class_name}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.bg} ${meta.text} ${meta.border}`}>
                                    <Icon className="w-3 h-3" /> {meta.label}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-xs italic">{r.note || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}