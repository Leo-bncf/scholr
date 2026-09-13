import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import StatusChip from '@/components/app/StatusChip';

function buildAlerts(data) {
  const { studentsWithoutClasses, classesWithoutTeachers, failedSyncs, school, missingWorkRate, attendanceRate } = data;
  const alerts = [];

  if (classesWithoutTeachers.length > 0) {
    alerts.push({
      id: 'no-teacher',
      severity: 'crit',
      title: `${classesWithoutTeachers.length} class${classesWithoutTeachers.length > 1 ? 'es' : ''} without a teacher`,
      desc: 'Attendance, grading and assignments are blocked for the students in them.',
      detail: classesWithoutTeachers.slice(0, 8).map(c => c.name).join(', ') + (classesWithoutTeachers.length > 8 ? ` +${classesWithoutTeachers.length - 8} more` : ''),
      action: 'Assign teachers',
      link: 'SchoolAdminEnrollments',
    });
  }

  if (studentsWithoutClasses.length > 0) {
    alerts.push({
      id: 'no-enroll',
      severity: 'warn',
      title: `${studentsWithoutClasses.length} student${studentsWithoutClasses.length > 1 ? 's' : ''} not enrolled`,
      desc: 'They cannot see assignments, attendance or grades until they are in at least one class.',
      detail: studentsWithoutClasses.slice(0, 8).map(s => s.user_name || s.user_email).join(', ') + (studentsWithoutClasses.length > 8 ? ` +${studentsWithoutClasses.length - 8} more` : ''),
      action: 'Manage enrolments',
      link: 'SchoolAdminEnrollments',
    });
  }

  if (attendanceRate !== null && attendanceRate < 75) {
    alerts.push({
      id: 'attendance-low',
      severity: 'crit',
      title: `Attendance at ${attendanceRate}%`,
      desc: 'School-wide attendance has been below 75% for the last 30 days.',
      detail: null,
      action: 'View attendance',
      link: 'SchoolAdminAttendance',
    });
  } else if (attendanceRate !== null && attendanceRate < 90) {
    alerts.push({
      id: 'attendance-warn',
      severity: 'warn',
      title: `Attendance at ${attendanceRate}%`,
      desc: 'Between 75% and 90% over the last 30 days — worth reviewing chronic absentees.',
      detail: null,
      action: 'View attendance',
      link: 'SchoolAdminAttendance',
    });
  }

  if (missingWorkRate !== null && missingWorkRate > 30) {
    alerts.push({
      id: 'missing-work',
      severity: 'warn',
      title: `${missingWorkRate}% of work is missing`,
      desc: 'More than 30% of expected submissions are outstanding.',
      detail: null,
      action: 'View classes',
      link: 'SchoolAdminClasses',
    });
  }

  if (failedSyncs && failedSyncs.length > 0) {
    alerts.push({
      id: 'sync-error',
      severity: 'crit',
      title: `${failedSyncs.length} timetable sync${failedSyncs.length > 1 ? 's' : ''} failed`,
      desc: 'Schedule data may be out of date until the sync succeeds.',
      detail: null,
      action: 'View timetable',
      link: 'SchoolAdminTimetable',
    });
  }

  if (school?.billing_status === 'past_due') {
    alerts.push({
      id: 'billing',
      severity: 'crit',
      title: 'Payment past due',
      desc: 'Update the payment method to avoid an interruption in service.',
      detail: null,
      action: 'Manage billing',
      link: 'SchoolAdminBilling',
    });
  }

  if (school?.billing_status === 'unpaid' || school?.billing_status === 'incomplete') {
    alerts.push({
      id: 'billing-unpaid',
      severity: 'crit',
      title: 'Subscription unpaid',
      desc: 'Access to the platform may be restricted.',
      detail: null,
      action: 'Manage billing',
      link: 'SchoolAdminBilling',
    });
  }

  return alerts;
}

const SEVERITY_WORD = { crit: 'Critical', warn: 'Warning' };

/**
 * One alert.
 *
 * Severity is a 3px left rule in the reserved palette plus the word itself in
 * a chip — never the colour alone. The whole row is not tinted: a page of
 * red-and-amber panels flattens the difference between "billing failed" and
 * "attendance is a little low", which is precisely the distinction an admin
 * comes here to make.
 */
function Alert({ alert }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5 panel-row"
      style={{
        borderBottom: '1px solid var(--rule-soft)',
        borderLeft: `3px solid var(--${alert.severity})`,
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="m-0 text-sm font-medium" style={{ color: 'var(--ink)' }}>{alert.title}</p>
          <StatusChip tone={alert.severity}>{SEVERITY_WORD[alert.severity]}</StatusChip>
        </div>
        {/* Held to a readable measure — the CTA is pinned right, and without a
            cap the sentence stretches the full width of a desktop panel. */}
        <p className="m-0 mt-1 text-xs leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '58ch' }}>
          {alert.desc}
        </p>

        {alert.detail && (
          <>
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              aria-expanded={expanded}
              className="cobalt-focus mt-2 inline-flex items-center gap-1 text-xs"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--cobalt)' }}
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? 'Hide affected items' : 'Show affected items'}
            </button>
            {expanded && (
              <p
                className="m-0 mt-2 px-3 py-2 text-xs leading-relaxed"
                style={{
                  background: 'var(--surface-sunk)',
                  borderRadius: 'var(--radius-control)',
                  color: 'var(--body)',
                }}
              >
                {alert.detail}
              </p>
            )}
          </>
        )}
      </div>

      <Link
        to={createPageUrl(alert.link)}
        className="cobalt-focus shrink-0 inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap"
        style={{
          color: 'var(--cobalt)',
          border: '1px solid var(--rule)',
          borderRadius: 'var(--radius-control)',
          padding: '0.3rem 0.6rem',
          textDecoration: 'none',
        }}
      >
        {alert.action}
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

export default function OperationalAlerts({ data }) {
  const alerts = buildAlerts(data);
  const critCount = alerts.filter(a => a.severity === 'crit').length;
  const warnCount = alerts.filter(a => a.severity === 'warn').length;

  if (alerts.length === 0) {
    return (
      <div className="cobalt-panel px-4 py-3.5 flex items-center gap-3 flex-wrap">
        <StatusChip tone="good">Clear</StatusChip>
        <p className="m-0 text-sm" style={{ color: 'var(--body)' }}>
          Nothing needs attention — enrolments, attendance, billing and the timetable all check out.
        </p>
      </div>
    );
  }

  return (
    <div className="cobalt-panel overflow-hidden">
      <header
        className="flex items-center gap-2 px-4 py-2.5 flex-wrap"
        style={{ borderBottom: '1px solid var(--rule-soft)' }}
      >
        <h2 className="cobalt-label m-0">Needs attention</h2>
        <span className="ml-auto flex items-center gap-2">
          {critCount > 0 && <StatusChip tone="crit">{critCount} critical</StatusChip>}
          {warnCount > 0 && <StatusChip tone="warn">{warnCount} warning{warnCount > 1 ? 's' : ''}</StatusChip>}
        </span>
      </header>
      {/* Critical before warning: the order is the triage. */}
      {['crit', 'warn'].flatMap(sev =>
        alerts.filter(a => a.severity === sev).map(alert => <Alert key={alert.id} alert={alert} />)
      )}
    </div>
  );
}
