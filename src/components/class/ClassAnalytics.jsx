import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, Users, ClipboardCheck, BarChart3,
  CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { format, subDays, parseISO, startOfWeek } from 'date-fns';
import * as assignmentsData from '@/data/assignments';
import * as gradebookData from '@/data/gradebook';
import * as submissionsData from '@/data/submissions';
import * as attendanceData from '@/data/attendance';
import * as membershipsData from '@/data/memberships';

// ── small helpers ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    violet: 'bg-violet-50 text-violet-600',
    sky: 'bg-sky-50 text-sky-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4">
      <div className={`rounded-lg p-2.5 flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value ?? '—'}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{children}</h3>;
}

const GRADE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

// ── Attendance trend over last N weeks ──────────────────────────────────────

function AttendanceTrend({ attendance }) {
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
      const rate = inRange.length > 0 ? Math.round((present / inRange.length) * 100) : null;
      if (rate !== null) weeks.push({ week: label, rate, total: inRange.length });
    }
    return weeks;
  }, [attendance]);

  if (data.length < 2) return <p className="text-sm text-slate-400 py-4 text-center">Not enough data to show trend</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip formatter={(v) => [`${v}%`, 'Attendance Rate']} />
        <Line type="monotone" dataKey="rate" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4, fill: '#4f46e5' }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Grade distribution bar chart ─────────────────────────────────────────────

function GradeDistribution({ grades }) {
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

  if (data.every(d => d.count === 0)) return <p className="text-sm text-slate-400 py-4 text-center">No published grade scores yet</p>;

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

// ── IB Grade distribution pie ────────────────────────────────────────────────

function IBGradePie({ grades }) {
  const data = useMemo(() => {
    const counts = {};
    grades.filter(g => g.ib_grade).forEach(g => {
      counts[g.ib_grade] = (counts[g.ib_grade] || 0) + 1;
    });
    return Object.entries(counts).map(([grade, count]) => ({ name: `Grade ${grade}`, value: count }));
  }, [grades]);

  if (data.length === 0) return <p className="text-sm text-slate-400 py-4 text-center">No IB grades recorded</p>;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
          {data.map((_, i) => <Cell key={i} fill={GRADE_COLORS[i % GRADE_COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Per-student performance table ────────────────────────────────────────────

function StudentPerformanceTable({ memberships, grades, attendance, classData }) {
  const [sortKey, setSortKey] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  const students = useMemo(() => memberships.filter(m => classData.student_ids?.includes(m.user_id)), [memberships, classData]);

  const rows = useMemo(() => students.map(s => {
    const sGrades = grades.filter(g => g.student_id === s.user_id && g.status === 'published');
    const scores = sGrades.filter(g => g.score != null && g.max_score).map(g => (g.score / g.max_score) * 100);
    const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const sAtt = attendance.filter(a => a.student_id === s.user_id);
    const present = sAtt.filter(a => a.status === 'present').length;
    const attRate = sAtt.length > 0 ? (present / sAtt.length) * 100 : null;
    const late = sAtt.filter(a => a.status === 'late').length;
    const absent = sAtt.filter(a => a.status === 'absent').length;
    return { id: s.user_id, name: s.user_name || s.user_email, grades: sGrades.length, avg, attRate, late, absent };
  }), [students, grades, attendance]);

  const sorted = useMemo(() => [...rows].sort((a, b) => {
    let av = a[sortKey], bv = b[sortKey];
    if (av === null) av = -Infinity;
    if (bv === null) bv = -Infinity;
    if (typeof av === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc ? av - bv : bv - av;
  }), [rows, sortKey, sortAsc]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const Th = ({ k, children }) => (
    <th onClick={() => toggleSort(k)} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase cursor-pointer select-none hover:text-slate-800">
      <span className="flex items-center gap-1">
        {children}
        {sortKey === k ? (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
      </span>
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <Th k="name">Student</Th>
            <Th k="grades">Grades</Th>
            <Th k="avg">Avg Score</Th>
            <Th k="attRate">Att. Rate</Th>
            <Th k="absent">Absences</Th>
            <Th k="late">Late</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sorted.map(row => {
            const avgOk = row.avg !== null;
            const attOk = row.attRate !== null;
            return (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                <td className="px-4 py-3 text-slate-600">{row.grades}</td>
                <td className="px-4 py-3">
                  {avgOk ? (
                    <span className={`font-semibold ${row.avg >= 70 ? 'text-emerald-700' : row.avg >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                      {row.avg.toFixed(1)}%
                    </span>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {attOk ? (
                    <span className={`font-semibold ${row.attRate >= 90 ? 'text-emerald-700' : row.attRate >= 75 ? 'text-amber-700' : 'text-red-700'}`}>
                      {row.attRate.toFixed(1)}%
                    </span>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3">{row.absent > 0 ? <span className="text-red-600 font-semibold">{row.absent}</span> : <span className="text-slate-400">0</span>}</td>
                <td className="px-4 py-3">{row.late > 0 ? <span className="text-amber-600 font-semibold">{row.late}</span> : <span className="text-slate-400">0</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Submission completion per assignment ──────────────────────────────────────

function SubmissionRateChart({ assignments, submissions, classData }) {
  const data = useMemo(() => {
    const enrolled = classData.student_ids?.length || 1;
    return assignments.slice(0, 8).map(a => {
      const subs = submissions.filter(s => s.assignment_id === a.id);
      const rate = Math.round((subs.length / enrolled) * 100);
      return { title: a.title.length > 18 ? a.title.slice(0, 18) + '…' : a.title, rate, submitted: subs.length, total: enrolled };
    });
  }, [assignments, submissions, classData]);

  if (data.length === 0) return <p className="text-sm text-slate-400 py-4 text-center">No assignments yet</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <YAxis type="category" dataKey="title" tick={{ fontSize: 10 }} width={120} />
        <Tooltip formatter={(v, _, { payload }) => [`${payload?.submitted}/${payload?.total} (${v}%)`, 'Submitted']} />
        <Bar dataKey="rate" name="Submission Rate" fill="#10b981" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ClassAnalytics({ classData, isTeacher }) {
  const { schoolId } = useUser();

  const { data: assignments = [] } = useQuery({
    queryKey: ['analytics-assignments', classData.id],
    queryFn: () => assignmentsData.where({ school_id: classData.school_id, class_id: classData.id }),
    enabled: isTeacher,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['analytics-grades', classData.id],
    queryFn: () => gradebookData.whereGradeItems({ school_id: classData.school_id, class_id: classData.id }),
    enabled: isTeacher,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['analytics-submissions', classData.id],
    queryFn: () => submissionsData.where({ school_id: classData.school_id, class_id: classData.id }),
    enabled: isTeacher,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['analytics-attendance', classData.id],
    queryFn: () => attendanceData.whereRecords({ school_id: classData.school_id, class_id: classData.id }),
    enabled: isTeacher,
  });

  const { data: memberships = [] } = useQuery({
    queryKey: ['analytics-memberships', classData.school_id],
    queryFn: () => membershipsData.where({ school_id: classData.school_id, status: 'active' }),
    enabled: isTeacher,
  });

  if (!isTeacher) {
    return (
      <div className="p-6 text-center text-slate-400">
        <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>Analytics are only available to teachers</p>
      </div>
    );
  }

  const enrolled = classData.student_ids?.length || 0;
  const publishedGrades = grades.filter(g => g.status === 'published' && g.score != null && g.max_score);
  const scores = publishedGrades.map(g => (g.score / g.max_score) * 100);
  const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attRate = attendance.length > 0 ? ((presentCount / attendance.length) * 100).toFixed(1) : null;

  const submissionRate = assignments.length > 0 && enrolled > 0
    ? ((submissions.length / (assignments.length * enrolled)) * 100).toFixed(1)
    : null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <h2 className="text-xl font-bold text-slate-900">Class Analytics</h2>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Students Enrolled" value={enrolled} icon={Users} color="indigo" />
        <StatCard label="Avg Score" value={avgScore ? `${avgScore}%` : '—'} sub={`${publishedGrades.length} published grades`} icon={TrendingUp} color="violet" />
        <StatCard label="Attendance Rate" value={attRate ? `${attRate}%` : '—'} sub={`${attendance.length} records`} icon={CheckCircle} color="emerald" />
        <StatCard label="Submission Rate" value={submissionRate ? `${submissionRate}%` : '—'} sub={`${submissions.length} of ${assignments.length * enrolled}`} icon={ClipboardCheck} color="amber" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionTitle>Attendance Rate — Weekly Trend</SectionTitle>
          <AttendanceTrend attendance={attendance} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionTitle>Grade Score Distribution</SectionTitle>
          <GradeDistribution grades={grades} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionTitle>Assignment Submission Rates</SectionTitle>
          <SubmissionRateChart assignments={assignments} submissions={submissions} classData={classData} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionTitle>IB Grade Distribution</SectionTitle>
          <IBGradePie grades={grades} />
        </div>
      </div>

      {/* Attendance status breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Present', count: presentCount, color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
          { label: 'Absent', count: attendance.filter(a => a.status === 'absent').length, color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
          { label: 'Late', count: attendance.filter(a => a.status === 'late').length, color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
          { label: 'Excused', count: attendance.filter(a => a.status === 'excused').length, color: 'bg-blue-50 text-blue-700 border-blue-200', icon: AlertCircle },
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className={`rounded-xl border p-4 flex items-center gap-3 ${color}`}>
            <Icon className="w-5 h-5 flex-shrink-0 opacity-70" />
            <div>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-xs font-medium opacity-80">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Per-student table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Per-Student Performance</h3>
          <p className="text-xs text-slate-400 mt-0.5">Click column headers to sort</p>
        </div>
        <StudentPerformanceTable memberships={memberships} grades={grades} attendance={attendance} classData={classData} />
      </div>
    </div>
  );
}