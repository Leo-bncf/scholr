import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import Meter from '@/components/app/Meter';
import { Group } from '@/components/app/AppShell';

// ─── shared bits ─────────────────────────────────────────────────────────────

/** The "go deeper" link that closes a panel. One per panel, never more. */
function PanelLink({ to, children }) {
  return (
    <Link
      to={createPageUrl(to)}
      className="scholr-focus inline-flex items-center gap-1 text-xs"
      style={{ color: 'var(--brand)', textDecoration: 'none' }}
    >
      {children} <ArrowRight className="w-3 h-3" />
    </Link>
  );
}

/**
 * A measured row: label, value, meter, and — where there is a target to miss —
 * a status word.
 *
 * `tone` is passed in rather than derived here, because the thresholds differ
 * per metric and two of them are inverted (less missing work is better).
 */
function MetricRow({ label, value, suffix = '%', tone, statusWord, meterValue, nullLabel }) {
  if (value === null || value === undefined) {
    return (
      <div className="flex items-baseline gap-3 py-2.5" style={{ borderBottom: '1px solid var(--rule-soft)' }}>
        <span className="text-sm" style={{ color: 'var(--body)' }}>{label}</span>
        <span className="ml-auto text-xs" style={{ color: 'var(--faint)' }}>{nullLabel}</span>
      </div>
    );
  }
  return (
    <div className="py-2.5" style={{ borderBottom: '1px solid var(--rule-soft)' }}>
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-sm" style={{ color: 'var(--body)' }}>{label}</span>
        {statusWord && <StatusChip tone={tone}>{statusWord}</StatusChip>}
        <span
          className="ml-auto text-sm scholr-num"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}
        >
          {value}{suffix}
        </span>
      </div>
      <Meter value={meterValue ?? value} tone={tone} height={4} />
    </div>
  );
}

function rateTone(value, { good, warn, lowerIsBetter = false }) {
  if (value === null || value === undefined) return 'mute';
  if (lowerIsBetter) return value <= good ? 'good' : value <= warn ? 'warn' : 'crit';
  return value >= good ? 'good' : value >= warn ? 'warn' : 'crit';
}

// ─── panels ──────────────────────────────────────────────────────────────────

function MemberBreakdown({ members }) {
  const total = members.total || 0;
  const items = [
    { label: 'Students', count: members.students.length },
    { label: 'Teachers & staff', count: members.teachers.length },
    { label: 'Parents', count: members.parents.length },
  ];

  return (
    <Group title="Members" action={<PanelLink to="SchoolAdminUsers">Manage</PanelLink>}>
      <div className="px-4 py-3 flex flex-col gap-3">
        {items.map(item => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div key={item.label}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm" style={{ color: 'var(--body)' }}>{item.label}</span>
                <span className="ml-auto text-xs scholr-num" style={{ color: 'var(--muted)' }}>{pct}%</span>
                <span
                  className="text-sm scholr-num w-10 text-right"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}
                >
                  {item.count}
                </span>
              </div>
              {/* A composition, not three independent rates — each bar is a
                  share of the same total, so they use one neutral accent. */}
              <Meter value={pct} height={4} />
            </div>
          );
        })}
        <p className="scholr-label m-0">{total} active members</p>
      </div>
    </Group>
  );
}

function ActivitySignals({ attendanceRate, missingWorkRate, messagingVolume }) {
  return (
    <Group title="Activity" action={<PanelLink to="SchoolAdminAttendance">Attendance</PanelLink>}>
      <div className="px-4 py-1">
        <MetricRow
          label="Attendance"
          value={attendanceRate}
          tone={rateTone(attendanceRate, { good: 90, warn: 75 })}
          statusWord={attendanceRate === null ? null : attendanceRate >= 90 ? 'On target' : attendanceRate >= 75 ? 'Low' : 'Critical'}
          nullLabel="no records yet"
        />
        <MetricRow
          label="Missing work"
          value={missingWorkRate}
          tone={rateTone(missingWorkRate, { good: 10, warn: 30, lowerIsBetter: true })}
          statusWord={missingWorkRate === null ? null : missingWorkRate <= 10 ? 'Low' : missingWorkRate <= 30 ? 'Moderate' : 'High'}
          nullLabel="nothing published yet"
        />
        <div className="flex items-baseline gap-3 py-2.5">
          <span className="text-sm" style={{ color: 'var(--body)' }}>Messages</span>
          <span
            className="ml-auto text-sm scholr-num"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}
          >
            {messagingVolume}
          </span>
        </div>
        <p className="scholr-label m-0 pb-3">Rolling 30 days</p>
      </div>
    </Group>
  );
}

function ClassCoverage({ classes }) {
  const totalClasses = classes.length;
  const classesWithTeacher = classes.filter(c => {
    const legacyOk = c.teacher_ids && c.teacher_ids.length > 0;
    const assignmentsOk = c.subject_teacher_assignments &&
      c.subject_teacher_assignments.some(a => a.teacher_ids && a.teacher_ids.length > 0);
    return legacyOk || assignmentsOk;
  }).length;
  const classesWithStudents = classes.filter(c => (c.student_ids || []).length > 0).length;
  const totalStudentEnrollments = classes.reduce((sum, c) => sum + (c.student_ids || []).length, 0);
  const avgStudentsPerClass = totalClasses > 0 ? Math.round(totalStudentEnrollments / totalClasses) : 0;

  const teacherPct = totalClasses > 0 ? (classesWithTeacher / totalClasses) * 100 : 0;
  const studentPct = totalClasses > 0 ? (classesWithStudents / totalClasses) * 100 : 0;

  return (
    <Group title="Class coverage" action={<PanelLink to="SchoolAdminClasses">Manage</PanelLink>}>
      {totalClasses === 0 ? (
        <p className="px-4 py-6 m-0 text-sm" style={{ color: 'var(--faint)' }}>
          No active classes yet, so there is no coverage to report.
        </p>
      ) : (
        <div className="px-4 py-1">
          <MetricRow
            label="Teacher assigned"
            value={`${classesWithTeacher} / ${totalClasses}`}
            suffix=""
            meterValue={teacherPct}
            tone={rateTone(teacherPct, { good: 100, warn: 80 })}
            statusWord={teacherPct === 100 ? 'Complete' : teacherPct >= 80 ? 'Gaps' : 'Critical'}
          />
          <MetricRow
            label="Has students"
            value={`${classesWithStudents} / ${totalClasses}`}
            suffix=""
            meterValue={studentPct}
            tone={rateTone(studentPct, { good: 100, warn: 80 })}
            statusWord={studentPct === 100 ? 'Complete' : 'Gaps'}
          />
          <p className="scholr-label m-0 py-3">
            {totalClasses} classes · {avgStudentsPerClass} students each on average
          </p>
        </div>
      )}
    </Group>
  );
}

function ReportingWindows({ upcomingTerms }) {
  return (
    <Group title="Reporting windows" action={<PanelLink to="SchoolAdminAcademicSetup">Calendar</PanelLink>}>
      {upcomingTerms.length === 0 ? (
        <div className="px-4 py-6">
          <p className="m-0 text-sm" style={{ color: 'var(--faint)' }}>
            No upcoming terms configured, so no report deadlines are being tracked.
          </p>
          <div className="mt-2">
            <PanelLink to="SchoolOnboarding">Set up the academic calendar</PanelLink>
          </div>
        </div>
      ) : (
        <div className="px-4 py-1">
          {upcomingTerms.map(term => {
            const end = new Date(term.end_date);
            const daysLeft = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
            const tone = daysLeft <= 14 ? 'crit' : daysLeft <= 30 ? 'warn' : 'mute';
            return (
              <div
                key={term.id}
                className="flex items-baseline gap-3 py-2.5 panel-row"
                style={{ borderBottom: '1px solid var(--rule-soft)' }}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>{term.name}</span>
                  <span className="block text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    ends {end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </span>
                <span className="ml-auto shrink-0 flex items-baseline gap-2">
                  {tone !== 'mute' && (
                    <StatusChip tone={tone}>{daysLeft <= 14 ? 'Due soon' : 'Approaching'}</StatusChip>
                  )}
                  <span
                    className="text-sm scholr-num whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}
                  >
                    {daysLeft}d
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Group>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export default function SchoolHealthOverview({ data }) {
  const { members, classes, attendanceRate, missingWorkRate, messagingVolume, upcomingTerms } = data;

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <StatRow>
        <StatCard label="Students" value={members.students.length} hint="active enrolments" />
        <StatCard label="Teachers & staff" value={members.teachers.length} hint="active accounts" />
        <StatCard label="Parents" value={members.parents.length} hint="linked accounts" />
        <StatCard label="Classes" value={classes.length} hint="this academic year" />
      </StatRow>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        <MemberBreakdown members={members} />
        <ActivitySignals
          attendanceRate={attendanceRate}
          missingWorkRate={missingWorkRate}
          messagingVolume={messagingVolume}
        />
        <ClassCoverage classes={classes} />
        <ReportingWindows upcomingTerms={upcomingTerms} />
      </div>
    </div>
  );
}
