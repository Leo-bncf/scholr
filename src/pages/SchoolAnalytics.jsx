import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, Users, AlertTriangle,
  CheckCircle2, Activity, Loader2
} from 'lucide-react';
import { format, subDays, startOfWeek, parseISO } from 'date-fns';
import * as membershipsData from '@/data/memberships';
import * as classesData from '@/data/classes';
import * as gradebookData from '@/data/gradebook';
import * as attendanceData from '@/data/attendance';
import * as academics from '@/data/academics';
import * as behaviorRecordsData from '@/data/behaviorRecords';

// ── Helpers ────────────────────────────────────────────────────────────────

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4', '#ec4899'];

function KpiCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'text-indigo-600 bg-indigo-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50',
    violet: 'text-violet-600 bg-violet-50',
    sky: 'text-sky-600 bg-sky-50',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`rounded-lg p-2.5 flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{children}</h3>;
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <SectionTitle>{title}</SectionTitle>
      {children}
    </div>
  );
}

// ── Class performance bar chart ───────────────────────────────────────────────

function ClassPerformanceChart({ classes, grades }) {
  const data = useMemo(() => {
    return classes.map(cls => {
      const cGrades = grades.filter(g => g.class_id === cls.id && g.status === 'published' && g.score != null && g.max_score);
      const avg = cGrades.length > 0
        ? cGrades.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / cGrades.length
        : null;
      return { name: cls.name.length > 16 ? cls.name.slice(0, 16) + '…' : cls.name, avg: avg ? parseFloat(avg.toFixed(1)) : null, count: cGrades.length };
    }).filter(d => d.avg !== null).sort((a, b) => b.avg - a.avg).slice(0, 12);
  }, [classes, grades]);

  if (data.length === 0) return <p className="text-sm text-slate-400 py-4 text-center">No grade data available</p>;

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
        <Tooltip formatter={(v, _, p) => [`${v}% (${p?.payload?.count} grades)`, 'Avg Score']} />
        <Bar dataKey="avg" name="Avg Score" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.avg >= 70 ? '#10b981' : entry.avg >= 50 ? '#f59e0b' : '#f43f5e'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Attendance trend (school-wide) ────────────────────────────────────────────

function SchoolAttendanceTrend({ attendance }) {
  const data = useMemo(() => {
    if (!attendance || attendance.length === 0) return [];
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 });
      const weekEnd = subDays(subDays(new Date(), (i - 1) * 7), 1);
      const label = format(weekStart, 'MMM d');
      const inRange = attendance.filter(a => {
        const d = parseISO(a.date);
        return d >= weekStart && d <= weekEnd;
      });
      if (inRange.length === 0) continue;
      const present = inRange.filter(a => a.status === 'present').length;
      const rate = Math.round((present / inRange.length) * 100);
      weeks.push({ week: label, rate, sessions: inRange.length });
    }
    return weeks;
  }, [attendance]);

  if (data.length < 2) return <p className="text-sm text-slate-400 py-4 text-center">Not enough attendance data for trend</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip formatter={(v, _, { payload }) => [`${v}% (${payload?.sessions} sessions)`, 'Att. Rate']} />
        <Line type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4, fill: '#4f46e5' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Class-wise attendance heatmap (bar) ───────────────────────────────────────

function ClassAttendanceComparison({ classes, attendance }) {
  const data = useMemo(() => {
    return classes.map(cls => {
      const cAtt = attendance.filter(a => a.class_id === cls.id);
      const present = cAtt.filter(a => a.status === 'present').length;
      const rate = cAtt.length > 0 ? parseFloat(((present / cAtt.length) * 100).toFixed(1)) : null;
      return { name: cls.name.length > 16 ? cls.name.slice(0, 16) + '…' : cls.name, rate };
    }).filter(d => d.rate !== null).sort((a, b) => b.rate - a.rate).slice(0, 10);
  }, [classes, attendance]);

  if (data.length === 0) return <p className="text-sm text-slate-400 py-4 text-center">No attendance data</p>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
        <Tooltip formatter={(v) => [`${v}%`, 'Attendance Rate']} />
        <Bar dataKey="rate" name="Attendance Rate" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.rate >= 90 ? '#10b981' : entry.rate >= 75 ? '#f59e0b' : '#f43f5e'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Grade distribution school-wide ───────────────────────────────────────────

function SchoolGradeDistribution({ grades }) {
  const data = useMemo(() => {
    const bins = [
      { range: '0–49%', min: 0, max: 49 },
      { range: '50–59%', min: 50, max: 59 },
      { range: '60–69%', min: 60, max: 69 },
      { range: '70–79%', min: 70, max: 79 },
      { range: '80–89%', min: 80, max: 89 },
      { range: '90–100%', min: 90, max: 100 },
    ];
    const published = grades.filter(g => g.status === 'published' && g.score != null && g.max_score);
    return bins.map(b => ({
      range: b.range,
      count: published.filter(g => {
        const pct = (g.score / g.max_score) * 100;
        return pct >= b.min && pct <= b.max;
      }).length,
    }));
  }, [grades]);

  if (data.every(d => d.count === 0)) return <p className="text-sm text-slate-400 py-4 text-center">No grade data</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="range" tick={{ fontSize: 10 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" name="Students" fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── IB Predicted Grade distribution ──────────────────────────────────────────

function PredictedGradeDistribution({ predictedGrades }) {
  const data = useMemo(() => {
    const counts = {};
    predictedGrades.filter(p => p.predicted_ib_grade).forEach(p => {
      const g = p.predicted_ib_grade;
      counts[g] = (counts[g] || 0) + 1;
    });
    return [1, 2, 3, 4, 5, 6, 7].map(g => ({ grade: `Grade ${g}`, count: counts[g] || 0 }));
  }, [predictedGrades]);

  if (data.every(d => d.count === 0)) return <p className="text-sm text-slate-400 py-4 text-center">No predicted grades</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="grade" tick={{ fontSize: 10 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" name="Students" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── At-risk students table ────────────────────────────────────────────────────

function AtRiskStudents({ memberships, attendance, grades, classes }) {
  const classMap = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes]);

  const atRisk = useMemo(() => {
    const students = memberships.filter(m => m.role === 'student');
    return students.map(s => {
      const sAtt = attendance.filter(a => a.student_id === s.user_id);
      const attRate = sAtt.length > 0 ? (sAtt.filter(a => a.status === 'present').length / sAtt.length) * 100 : 100;
      const sGrades = grades.filter(g => g.student_id === s.user_id && g.status === 'published' && g.score != null && g.max_score);
      const avgScore = sGrades.length > 0
        ? sGrades.reduce((acc, g) => acc + (g.score / g.max_score) * 100, 0) / sGrades.length
        : null;
      const flags = [];
      if (attRate < 80) flags.push({ label: `${attRate.toFixed(0)}% att.`, color: 'bg-red-100 text-red-700' });
      if (avgScore !== null && avgScore < 50) flags.push({ label: `${avgScore.toFixed(0)}% avg`, color: 'bg-amber-100 text-amber-700' });
      return { ...s, attRate, avgScore, flags };
    }).filter(s => s.flags.length > 0).sort((a, b) => a.attRate - b.attRate).slice(0, 15);
  }, [memberships, attendance, grades]);

  if (atRisk.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
        <p className="font-semibold text-emerald-700">No at-risk students detected</p>
        <p className="text-sm text-emerald-600 mt-1">All students have attendance ≥80% and grades ≥50%</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="font-semibold text-slate-800">At-Risk Students</h3>
        <Badge variant="outline" className="text-xs ml-auto">{atRisk.length} flagged</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Student</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Att. Rate</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Avg Score</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {atRisk.map(s => (
              <tr key={s.user_id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{s.user_name || s.user_email}</p>
                  <p className="text-xs text-slate-400">{s.grade_level || ''}</p>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${s.attRate < 80 ? 'text-red-600' : 'text-slate-700'}`}>{s.attRate.toFixed(1)}%</span>
                </td>
                <td className="px-4 py-3 text-center">
                  {s.avgScore !== null ? <span className={`font-semibold ${s.avgScore < 50 ? 'text-amber-600' : 'text-slate-700'}`}>{s.avgScore.toFixed(1)}%</span> : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {s.flags.map((f, i) => (
                      <span key={i} className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${f.color}`}>{f.label}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function SchoolAnalytics() {
  const { user, school, schoolId } = useUser();
  const [cohortFilter, setCohortFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  const { data: memberships = [], isLoading: loadingM } = useQuery({
    queryKey: ['analytics-memberships', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: classes = [], isLoading: loadingC } = useQuery({
    queryKey: ['analytics-classes', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: grades = [], isLoading: loadingG } = useQuery({
    queryKey: ['analytics-grades-school', schoolId],
    queryFn: () => gradebookData.whereGradeItems({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: attendance = [], isLoading: loadingA } = useQuery({
    queryKey: ['analytics-attendance-school', schoolId],
    queryFn: () => attendanceData.whereRecords({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: cohorts = [] } = useQuery({
    queryKey: ['analytics-cohorts', schoolId],
    queryFn: () => academics.whereCohorts({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: predictedGrades = [] } = useQuery({
    queryKey: ['analytics-pg', schoolId],
    queryFn: () => gradebookData.wherePredictedGrades({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: behavior = [] } = useQuery({
    queryKey: ['analytics-behavior', schoolId],
    queryFn: () => behaviorRecordsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const isLoading = loadingM || loadingC || loadingG || loadingA;

  // Apply filters
  const filteredStudentIds = useMemo(() => {
    let ids = memberships.filter(m => m.role === 'student').map(m => m.user_id);
    if (cohortFilter !== 'all') {
      const cohort = cohorts.find(c => c.id === cohortFilter);
      if (cohort) ids = ids.filter(id => cohort.student_ids?.includes(id));
    }
    return new Set(ids);
  }, [memberships, cohortFilter, cohorts]);

  const filteredClasses = useMemo(() => {
    if (classFilter !== 'all') return classes.filter(c => c.id === classFilter);
    return classes;
  }, [classes, classFilter]);

  const filteredGrades = useMemo(() => grades.filter(g => filteredStudentIds.has(g.student_id) && (classFilter === 'all' || g.class_id === classFilter)), [grades, filteredStudentIds, classFilter]);
  const filteredAttendance = useMemo(() => attendance.filter(a => filteredStudentIds.has(a.student_id) && (classFilter === 'all' || a.class_id === classFilter)), [attendance, filteredStudentIds, classFilter]);
  const filteredPG = useMemo(() => predictedGrades.filter(p => filteredStudentIds.has(p.student_id)), [predictedGrades, filteredStudentIds]);
  const filteredBehavior = useMemo(() => behavior.filter(b => filteredStudentIds.has(b.student_id)), [behavior, filteredStudentIds]);

  // KPIs
  const students = useMemo(() => memberships.filter(m => m.role === 'student' && filteredStudentIds.has(m.user_id)), [memberships, filteredStudentIds]);
  const publishedGrades = filteredGrades.filter(g => g.status === 'published' && g.score != null && g.max_score);
  const avgScore = publishedGrades.length > 0
    ? (publishedGrades.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / publishedGrades.length).toFixed(1)
    : null;
  const presentCount = filteredAttendance.filter(a => a.status === 'present').length;
  const attRate = filteredAttendance.length > 0 ? ((presentCount / filteredAttendance.length) * 100).toFixed(1) : null;
  const incidentCount = filteredBehavior.filter(b => b.type === 'incident').length;

  return (
    <RoleGuard allowedRoles={['school_admin', 'ib_coordinator', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={SCHOOL_ADMIN_SIDEBAR_LINKS} role="school_admin" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />

        <main className="md:ml-64 min-h-screen flex flex-col">
          <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 max-w-7xl mx-auto">
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight">School Analytics</h1>
                <p className="text-xs text-slate-400 mt-0.5">Performance, attendance, and pastoral trends across your school.</p>
              </div>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Cohort</p>
                  <Select value={cohortFilter} onValueChange={setCohortFilter}>
                    <SelectTrigger className="h-9 w-44 text-sm"><SelectValue placeholder="All cohorts" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cohorts</SelectItem>
                      {cohorts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Class</p>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="h-9 w-44 text-sm"><SelectValue placeholder="All classes" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
            {isLoading ? (
              <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="space-y-8">
                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon={Users} label="Students" value={students.length} sub={`${filteredClasses.length} classes`} color="indigo" />
                  <KpiCard icon={TrendingUp} label="Avg Score" value={avgScore ? `${avgScore}%` : '—'} sub={`${publishedGrades.length} grades`} color="violet" />
                  <KpiCard icon={Activity} label="Attendance Rate" value={attRate ? `${attRate}%` : '—'} sub={`${filteredAttendance.length} records`} color="emerald" />
                  <KpiCard icon={AlertTriangle} label="Incidents" value={incidentCount} sub={`${filteredBehavior.length} total records`} color="rose" />
                </div>

                {/* Attendance trend + grade distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ChartCard title="School-Wide Attendance Trend (Weekly)">
                    <SchoolAttendanceTrend attendance={filteredAttendance} />
                  </ChartCard>
                  <ChartCard title="Score Distribution (School-Wide)">
                    <SchoolGradeDistribution grades={filteredGrades} />
                  </ChartCard>
                </div>

                {/* Class performance comparison */}
                {classFilter === 'all' && (
                  <ChartCard title="Class Performance Comparison (Avg Score)">
                    <ClassPerformanceChart classes={filteredClasses} grades={filteredGrades} />
                  </ChartCard>
                )}

                {/* Class attendance comparison + IB predicted */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {classFilter === 'all' && (
                    <ChartCard title="Class Attendance Comparison">
                      <ClassAttendanceComparison classes={filteredClasses} attendance={filteredAttendance} />
                    </ChartCard>
                  )}
                  <ChartCard title="IB Predicted Grade Distribution">
                    <PredictedGradeDistribution predictedGrades={filteredPG} />
                  </ChartCard>
                </div>

                {/* Behavior breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Positive', type: 'positive', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { label: 'Concerns', type: 'concern', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { label: 'Incidents', type: 'incident', color: 'bg-red-50 text-red-700 border-red-200' },
                    { label: 'Notes', type: 'note', color: 'bg-slate-50 text-slate-600 border-slate-200' },
                  ].map(({ label, type, color }) => (
                    <div key={type} className={`rounded-xl border p-4 text-center ${color}`}>
                      <p className="text-2xl font-bold">{filteredBehavior.filter(b => b.type === type).length}</p>
                      <p className="text-sm font-medium mt-1">{label} Behavior</p>
                    </div>
                  ))}
                </div>

                {/* At-risk students */}
                <AtRiskStudents memberships={memberships.filter(m => filteredStudentIds.has(m.user_id))} attendance={filteredAttendance} grades={filteredGrades} classes={filteredClasses} />
              </div>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}