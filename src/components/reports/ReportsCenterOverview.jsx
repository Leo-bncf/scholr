import React from 'react';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import Meter from '@/components/app/Meter';

/**
 * What the school looks like right now, before you export any of it.
 *
 * This was twelve tiles: eight KPI cards each with an icon in a pastel square
 * (a different tint per card, chosen for variety rather than meaning), then
 * two rows of four fully-tinted boxes. Three of those boxes were green, amber
 * and red while reading zero — nothing was wrong, and the page shouted anyway.
 *
 * Two rules applied here:
 *
 *   Counts are counts. They go in the instrument panel — hairline-joined, one
 *   object — not in eight separate cards competing for attention.
 *
 *   Colour marks a state someone must act on, and nothing else. Absent and
 *   late earn it; present, excused and a count of zero incidents do not. The
 *   breakdowns are parts of one whole, so they are measured against their own
 *   total rather than dressed as four independent metrics.
 */

/** Parts of one whole: a labelled row, its share, and a bar. */
function Breakdown({ title, total, parts, empty }) {
  if (total === 0) {
    return (
      <Group title={title}>
        <GroupEmpty>{empty}</GroupEmpty>
      </Group>
    );
  }
  return (
    <Group title={title} action={<span className="scholr-label">{total} recorded</span>}>
      <div className="px-4 py-3.5 flex flex-col gap-2.5">
        {parts.map(({ label, count, tone }) => (
          <div key={label}>
            <div className="flex items-baseline gap-2.5">
              {tone ? (
                <StatusChip tone={tone}>{label}</StatusChip>
              ) : (
                <span className="text-sm" style={{ color: 'var(--ink)' }}>{label}</span>
              )}
              <span
                className="ml-auto text-sm scholr-num"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--body)' }}
              >
                {count}
              </span>
              <span className="scholr-label" style={{ minWidth: '2.6rem', textAlign: 'right' }}>
                {Math.round((count / total) * 100)}%
              </span>
            </div>
            <div className="mt-1">
              <Meter value={(count / total) * 100} height={4} />
            </div>
          </div>
        ))}
      </div>
    </Group>
  );
}

export default function ReportsCenterOverview({ memberships, classes, grades, attendance, behavior, predictedGrades, casExperiences }) {
  const students = memberships.filter(m => m.role === 'student');
  const teachers = memberships.filter(m => m.role === 'teacher');

  const byStatus = (s) => attendance.filter(a => a.status === s).length;
  const presentCount = byStatus('present');
  const attendanceRate = attendance.length > 0
    ? Math.round((presentCount / attendance.length) * 100)
    : null;

  const byType = (t) => behavior.filter(b => b.type === t).length;
  const incidentCount = byType('incident');
  const casApproved = casExperiences.filter(c => c.status === 'approved').length;
  const pgCount = predictedGrades.filter(p => p.predicted_ib_grade).length;

  const predictedByGrade = [1, 2, 3, 4, 5, 6, 7]
    .map(grade => ({ grade, count: predictedGrades.filter(p => p.predicted_ib_grade === grade).length }))
    .filter(g => g.count > 0);

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      <StatRow>
        <StatCard label="Students" value={students.length} />
        <StatCard label="Teaching staff" value={teachers.length} />
        <StatCard label="Classes" value={classes.length} hint="active" />
        <StatCard label="Grade records" value={grades.length} />
      </StatRow>

      <StatRow>
        <StatCard
          label="Attendance"
          value={attendanceRate === null ? '—' : `${attendanceRate}%`}
          hint={attendance.length ? `${attendance.length} records` : 'nothing recorded yet'}
        />
        <StatCard label="Incidents" value={incidentCount} hint="behaviour" />
        <StatCard label="Predicted grades" value={pgCount} />
        <StatCard label="CAS approved" value={casApproved} />
      </StatRow>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <Breakdown
          title="Attendance"
          total={attendance.length}
          empty="No attendance has been taken yet."
          parts={[
            { label: 'Present', count: presentCount },
            { label: 'Absent', count: byStatus('absent'), tone: 'crit' },
            { label: 'Late', count: byStatus('late'), tone: 'warn' },
            { label: 'Excused', count: byStatus('excused') },
          ]}
        />

        <Breakdown
          title="Behaviour"
          total={behavior.length}
          empty="Nothing has been logged yet."
          parts={[
            { label: 'Positive', count: byType('positive'), tone: 'good' },
            { label: 'Concerns', count: byType('concern'), tone: 'warn' },
            { label: 'Incidents', count: incidentCount, tone: 'crit' },
            { label: 'Notes', count: byType('note') },
          ]}
        />
      </div>

      {(predictedGrades.length > 0 || casExperiences.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
          <Group title="Predicted grades">
            {predictedByGrade.length === 0 ? (
              <GroupEmpty>No predicted grades recorded.</GroupEmpty>
            ) : (
              predictedByGrade.map(({ grade, count }) => (
                <Row
                  key={grade}
                  label={`Grade ${grade}`}
                  value={`${count} student${count === 1 ? '' : 's'}`}
                />
              ))
            )}
          </Group>

          <Group title="CAS experiences">
            {casExperiences.length === 0 ? (
              <GroupEmpty>No experiences logged.</GroupEmpty>
            ) : (
              ['creativity', 'activity', 'service'].map(strand => (
                <Row
                  key={strand}
                  label={strand[0].toUpperCase() + strand.slice(1)}
                  value={casExperiences.filter(c => c.cas_strands?.includes(strand)).length}
                />
              ))
            )}
          </Group>
        </div>
      )}
    </div>
  );
}
