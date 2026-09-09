import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingDown, Clock, Users, CheckCircle2, XCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { format, subDays, eachDayOfInterval, parseISO, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import * as attendanceData from '@/data/attendance';
import * as classesData from '@/data/classes';
import * as academics from '@/data/academics';
import * as attendancePoliciesData from '@/data/attendancePolicies';

function StatCard({ label, value, sub, accent = 'slate', icon: Icon, onClick }) {
  const accents = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    red:     'bg-red-50 border-red-200 text-red-900',
    amber:   'bg-amber-50 border-amber-200 text-amber-900',
    blue:    'bg-blue-50 border-blue-200 text-blue-900',
    slate:   'bg-slate-50 border-slate-200 text-slate-900',
  };
  return (
    <div
      className={`rounded-xl border p-5 ${accents[accent]} ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium opacity-80">{label}</p>
        {Icon && <Icon className="w-4 h-4 opacity-60" />}
      </div>
      <p className="text-3xl font-black">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
  );
}

function StudentDrilldown({ student, records, onBack }) {
  const studentRecords = records.filter(r => r.student_id === student.id).sort((a, b) => a.date.localeCompare(b.date));
  const total = studentRecords.length;
  const counts = studentRecords.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const rate = total > 0 ? ((counts.present || 0) / total * 100).toFixed(1) : '—';

  const STATUS_META = {
    present: { label: 'Present', color: '#10b981' },
    absent:  { label: 'Absent',  color: '#ef4444' },
    late:    { label: 'Late',    color: '#f59e0b' },
    excused: { label: 'Excused', color: '#3b82f6' },
  };

  const weeklyData = useMemo(() => {
    const weeks = {};
    studentRecords.forEach(r => {
      const week = format(parseISO(r.date), "'W'ww yyyy");
      if (!weeks[week]) weeks[week] = { week, present: 0, absent: 0, late: 0, excused: 0 };
      weeks[week][r.status] = (weeks[week][r.status] || 0) + 1;
    });
    return Object.values(weeks);
  }, [studentRecords]);

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </button>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-bold text-slate-900 mb-1">{student.name}</h2>
        <p className="text-sm text-slate-500 mb-5">{total} records in selected period</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Attendance Rate" value={`${rate}%`} accent={parseFloat(rate) >= 90 ? 'emerald' : parseFloat(rate) >= 75 ? 'amber' : 'red'} icon={CheckCircle2} />
          <StatCard label="Present" value={counts.present || 0} accent="emerald" icon={CheckCircle2} />
          <StatCard label="Absent" value={counts.absent || 0} accent="red" icon={XCircle} />
          <StatCard label="Late" value={counts.late || 0} accent="amber" icon={Clock} />
        </div>
      </div>

      {weeklyData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4">Weekly Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barSize={14}>
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="present" name="Present" fill="#10b981" stackId="a" />
              <Bar dataKey="absent" name="Absent" fill="#ef4444" stackId="a" />
              <Bar dataKey="late" name="Late" fill="#f59e0b" stackId="a" />
              <Bar dataKey="excused" name="Excused" fill="#3b82f6" radius={[3, 3, 0, 0]} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {studentRecords.slice().reverse().map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 text-slate-700">{r.date}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                    r.status === 'present' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    r.status === 'absent'  ? 'bg-red-50 text-red-700 border-red-200' :
                    r.status === 'late'    ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs italic">{r.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AttendanceDashboard({ schoolId }) {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterCohort, setFilterCohort] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [drilldownStudent, setDrilldownStudent] = useState(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance-dashboard', schoolId],
    queryFn: () => attendanceData.whereRecords({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-for-attendance', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: cohorts = [] } = useQuery({
    queryKey: ['cohorts-for-attendance', schoolId],
    queryFn: () => academics.whereCohorts({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: policy = {} } = useQuery({
    queryKey: ['attendance-policy', schoolId],
    queryFn: async () => {
      const p = await attendancePoliciesData.where({ school_id: schoolId });
      return p[0] || {};
    },
    enabled: !!schoolId,
  });

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (r.date < startDate || r.date > endDate) return false;
      if (filterClass !== 'all' && r.class_id !== filterClass) return false;
      if (filterCohort !== 'all') {
        const cohort = cohorts.find(c => c.id === filterCohort);
        if (!cohort?.student_ids?.includes(r.student_id)) return false;
      }
      return true;
    });
  }, [records, startDate, endDate, filterClass, filterCohort, cohorts]);

  const counts = filtered.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const total = filtered.length;
  const attendanceRate = total > 0 ? ((counts.present || 0) / total * 100).toFixed(1) : '—';

  // Daily chart data
  const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
  const dailyData = days.map(day => {
    const d = format(day, 'yyyy-MM-dd');
    const dayRecs = filtered.filter(r => r.date === d);
    const t = dayRecs.length;
    const present = dayRecs.filter(r => r.status === 'present').length;
    return {
      date: format(day, 'MMM d'),
      rate: t > 0 ? Math.round(present / t * 100) : null,
      absent: dayRecs.filter(r => r.status === 'absent').length,
      late: dayRecs.filter(r => r.status === 'late').length,
    };
  }).filter(d => d.rate !== null);

  // Per-student aggregates
  const studentMap = {};
  filtered.forEach(r => {
    if (!studentMap[r.student_id]) studentMap[r.student_id] = { id: r.student_id, name: r.student_name, absent: 0, late: 0, total: 0 };
    studentMap[r.student_id].total++;
    if (r.status === 'absent') studentMap[r.student_id].absent++;
    if (r.status === 'late') studentMap[r.student_id].late++;
  });

  const chronicThreshold = policy.chronic_absence_threshold_percent ?? 20;
  const latenessThreshold = policy.frequent_lateness_threshold ?? 3;

  const chronicAbsent = Object.values(studentMap).filter(s => s.total > 0 && (s.absent / s.total * 100) >= chronicThreshold);
  const frequentLate = Object.values(studentMap).filter(s => s.late >= latenessThreshold);

  // Per-class breakdown
  const classBreakdown = useMemo(() => {
    const classMap = {};
    filtered.forEach(r => {
      if (!classMap[r.class_id]) classMap[r.class_id] = { total: 0, present: 0 };
      classMap[r.class_id].total++;
      if (r.status === 'present') classMap[r.class_id].present++;
    });
    return classes
      .filter(c => classMap[c.id])
      .map(c => ({ name: c.name, rate: Math.round((classMap[c.id].present / classMap[c.id].total) * 100) }))
      .sort((a, b) => a.rate - b.rate);
  }, [filtered, classes]);

  if (drilldownStudent) {
    return <StudentDrilldown student={drilldownStudent} records={records} onBack={() => setDrilldownStudent(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Cohort</label>
          <select value={filterCohort} onChange={e => setFilterCohort(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="all">All Cohorts</option>
            {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Class</label>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Attendance Rate" value={`${attendanceRate}%`} sub={`${differenceInDays(parseISO(endDate), parseISO(startDate)) + 1}-day window`} accent="emerald" icon={CheckCircle2} />
            <StatCard label="Absent Records" value={counts.absent || 0} sub="in selected range" accent="red" icon={XCircle} />
            <StatCard label="Late Records" value={counts.late || 0} sub="in selected range" accent="amber" icon={Clock} />
            <StatCard label="Chronic Absence Alerts" value={chronicAbsent.length} sub={`click to view ≥${chronicThreshold}% absent`} accent={chronicAbsent.length > 0 ? 'red' : 'slate'} icon={TrendingDown} />
          </div>

          {/* Daily Trend Chart */}
          {dailyData.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Daily Attendance Rate (%)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={dailyData} barSize={14}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={v => [`${v}%`, 'Rate']} />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {dailyData.map((d, i) => (
                      <Cell key={i} fill={d.rate >= 90 ? '#10b981' : d.rate >= 75 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chronic Absence */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-900">Chronic Absence</h3>
                <Badge className="bg-red-50 text-red-700 border border-red-200">{chronicAbsent.length}</Badge>
              </div>
              {chronicAbsent.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No students flagged in this period.</p>
              ) : (
                <div className="space-y-2">
                  {chronicAbsent.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setDrilldownStudent(s)}
                      className="w-full flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-100 hover:bg-red-100 transition-colors text-left"
                    >
                      <span className="text-sm font-medium text-slate-900">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-red-700">{Math.round(s.absent / s.total * 100)}% absent</span>
                        <ChevronRight className="w-3.5 h-3.5 text-red-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Frequent Lateness */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900">Frequent Lateness</h3>
                <Badge className="bg-amber-50 text-amber-700 border border-amber-200">{frequentLate.length}</Badge>
              </div>
              {frequentLate.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No students flagged in this period.</p>
              ) : (
                <div className="space-y-2">
                  {frequentLate.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setDrilldownStudent(s)}
                      className="w-full flex items-center justify-between p-2.5 bg-amber-50 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors text-left"
                    >
                      <span className="text-sm font-medium text-slate-900">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-700">{s.late} late</span>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Attendance by Class */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Attendance by Class</h3>
              </div>
              {classBreakdown.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No class data in this period.</p>
              ) : (
                <div className="space-y-2">
                  {classBreakdown.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm text-slate-700 w-48 truncate">{c.name}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${c.rate >= 90 ? 'bg-emerald-500' : c.rate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${c.rate}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold w-10 text-right ${c.rate >= 90 ? 'text-emerald-700' : c.rate >= 75 ? 'text-amber-700' : 'text-red-700'}`}>{c.rate}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}