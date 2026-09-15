import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import { Field, SelectField, FilterBar } from '@/components/app/Field';
import DataTable from '@/components/app/DataTable';
import StatCard from '@/components/app/StatCard';
import StatusChip from '@/components/app/StatusChip';
import Meter from '@/components/app/Meter';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ChevronRight, ArrowLeft } from 'lucide-react';
import { format, subDays, eachDayOfInterval, parseISO, differenceInDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import * as attendanceData from '@/data/attendance';
import * as classesData from '@/data/classes';
import * as academics from '@/data/academics';
import * as attendancePoliciesData from '@/data/attendancePolicies';

/* Attendance thresholds, in one place.
 *
 * 90 and 75 were written inline in five spots — the KPI tint, the daily bars,
 * the class bars, the class percentage and the drilldown — so a school that
 * wanted a different bar would have had to find all five. */
const rateTone = (rate) => (rate >= 90 ? 'good' : rate >= 75 ? 'warn' : 'crit');

/* Recharts resolves CSS custom properties in fill, so the series follow the
   theme with no JS. The four hex codes here were fixed light-mode values. */
const SERIES = {
  present: 'var(--good)',
  absent: 'var(--crit)',
  late: 'var(--warn)',
  excused: 'var(--faint)',
};

function StudentDrilldown({ student, records, onBack }) {
  const studentRecords = records.filter(r => r.student_id === student.id).sort((a, b) => a.date.localeCompare(b.date));
  const total = studentRecords.length;
  const counts = studentRecords.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const rate = total > 0 ? Math.round((counts.present || 0) / total * 100) : '—';

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
      <button
        type="button"
        onClick={onBack}
        className="scholr-focus"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', fontSize: '.86rem', color: 'var(--brand)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to attendance
      </button>

      <Group title={student.name} action={<span className="scholr-label">{total} records</span>}>
        <div className="scholr-grid app-cols-4">
          <StatCard label="Attendance" value={`${rate}%`} tone={rate === '—' ? undefined : rateTone(rate)} hint="in this period" />
          <StatCard label="Present" value={counts.present || 0} />
          <StatCard label="Absent" value={counts.absent || 0} tone={counts.absent ? 'crit' : undefined} />
          <StatCard label="Late" value={counts.late || 0} tone={counts.late ? 'warn' : undefined} />
        </div>
      </Group>

      {weeklyData.length > 0 && (
        <Group title="Week by week">
          <div style={{ padding: '.9rem' }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} barSize={14}>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--chart-grid)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="present" name="Present" fill={SERIES.present} stackId="a" />
                <Bar dataKey="absent" name="Absent" fill={SERIES.absent} stackId="a" />
                <Bar dataKey="late" name="Late" fill={SERIES.late} stackId="a" />
                <Bar dataKey="excused" name="Excused" fill={SERIES.excused} radius={[3, 3, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Group>
      )}

      <Group title="Every record">
        <DataTable
          columns={[
            { key: 'date', header: 'Date' },
            {
              key: 'status',
              header: 'Status',
              /* Present is the expected outcome and takes no colour; a register
                 where every line glows green hides the two that do not. */
              render: (r) => (r.status === 'present'
                ? 'Present'
                : <StatusChip tone={r.status === 'absent' ? 'crit' : r.status === 'late' ? 'warn' : 'mute'}>{r.status}</StatusChip>),
            },
            { key: 'note', header: 'Note', render: (r) => r.note || '—' },
          ]}
          rows={studentRecords.slice().reverse()}
          rowKey={(r) => r.id}
          empty="No attendance recorded for this student in this period."
        />
      </Group>
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
  const attendanceRate = total > 0 ? Math.round((counts.present || 0) / total * 100) : '—';

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
    <div className="space-y-4">
      <FilterBar>
        <Field label="From" htmlFor="att-from">
          <input id="att-from" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="app-input scholr-focus" />
        </Field>
        <Field label="To" htmlFor="att-to">
          <input id="att-to" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="app-input scholr-focus" />
        </Field>
        <Field label="Cohort" htmlFor="att-cohort">
          <SelectField
            id="att-cohort" label="Cohort" value={filterCohort} onChange={setFilterCohort}
            options={[{ value: 'all', label: 'All cohorts' }, ...cohorts.map(c => ({ value: c.id, label: c.name }))]}
          />
        </Field>
        <Field label="Class" htmlFor="att-class">
          <SelectField
            id="att-class" label="Class" value={filterClass} onChange={setFilterClass}
            options={[{ value: 'all', label: 'All classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]}
          />
        </Field>
      </FilterBar>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin scholr-accent" /></div>
      ) : (
        <>
          <Group>
            <div className="scholr-grid app-cols-4">
              <StatCard
                label="Attendance"
                value={`${attendanceRate}%`}
                tone={attendanceRate === '—' ? undefined : rateTone(attendanceRate)}
                hint={`over ${differenceInDays(parseISO(endDate), parseISO(startDate)) + 1} days`}
              />
              <StatCard label="Absences" value={counts.absent || 0} tone={counts.absent ? 'crit' : undefined} hint="records in range" />
              <StatCard label="Lates" value={counts.late || 0} tone={counts.late ? 'warn' : undefined} hint="records in range" />
              <StatCard
                label="Chronic absence"
                value={chronicAbsent.length}
                tone={chronicAbsent.length > 0 ? 'crit' : undefined}
                hint={`students at or over ${chronicThreshold}% absent`}
              />
            </div>
          </Group>

          {dailyData.length > 0 && (
            <Group title="Attendance rate, day by day">
              <div style={{ padding: '.9rem' }}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dailyData} barSize={14}>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} unit="%" tickLine={false} axisLine={false} />
                    <Tooltip formatter={v => [`${v}%`, 'Rate']} cursor={{ fill: 'var(--chart-grid)' }} />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      {dailyData.map((d, i) => (
                        <Cell key={i} fill={`var(--${rateTone(d.rate) === 'good' ? 'good' : rateTone(d.rate) === 'warn' ? 'warn' : 'crit'})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Group>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Group title="Chronic absence" action={<span className="scholr-label">{chronicAbsent.length}</span>}>
              {chronicAbsent.length === 0 ? (
                <GroupEmpty>No student is at or over {chronicThreshold}% absent in this period.</GroupEmpty>
              ) : (
                chronicAbsent.map((s, i) => (
                  <Row key={i} label={s.name} onClick={() => setDrilldownStudent(s)}>
                    <StatusChip tone="crit">{Math.round(s.absent / s.total * 100)}% absent</StatusChip>
                    <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--faint)' }} />
                  </Row>
                ))
              )}
            </Group>

            <Group title="Frequent lateness" action={<span className="scholr-label">{frequentLate.length}</span>}>
              {frequentLate.length === 0 ? (
                <GroupEmpty>Nobody has been late often enough to flag in this period.</GroupEmpty>
              ) : (
                frequentLate.map((s, i) => (
                  <Row key={i} label={s.name} onClick={() => setDrilldownStudent(s)}>
                    <StatusChip tone="warn">{s.late} late</StatusChip>
                    <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--faint)' }} />
                  </Row>
                ))
              )}
            </Group>
          </div>

          <Group title="By class">
            {classBreakdown.length === 0 ? (
              <GroupEmpty>No attendance has been recorded against a class in this period.</GroupEmpty>
            ) : (
              <div style={{ padding: '.8rem .9rem', display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
                {classBreakdown.map((c, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '.6rem' }}>
                      <span style={{ fontSize: '.88rem', color: 'var(--ink)' }}>{c.name}</span>
                      <span
                        className="scholr-num"
                        style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '.82rem', color: `var(--${rateTone(c.rate)})` }}
                      >
                        {c.rate}%
                      </span>
                    </div>
                    <div style={{ marginTop: '.25rem' }}>
                      <Meter value={c.rate} tone={rateTone(c.rate)} height={4} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Group>
        </>
      )}
    </div>
  );
}
