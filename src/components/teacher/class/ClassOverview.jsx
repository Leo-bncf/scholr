import React from 'react';
import { format } from 'date-fns';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import ClassStream from '@/components/class/ClassStream';
import { GroupLink } from '../bits';
import { markingUrl, relativeDays, byAssignment } from '../links';
import { useClassAttendanceSummary } from './useClassAttendanceSummary';

/**
 * A class's front page: what this class needs from its teacher right now.
 *
 * Replaces the "Today" tab's three tinted cards. Its "2 upcoming" counted an
 * assignment that was already five days overdue — upcoming is now strictly in
 * the future, and overdue work is reported as missing, per student.
 */
export default function ClassOverview({ classData, load, onTab, userId }) {
  const row = load.byClass.get(classData.id);
  const attendance = useClassAttendanceSummary(classData);
  const marking = byAssignment(load.toMark);
  const missing = byAssignment(load.missing);
  const lessons = load.lessonsToday;

  const marked = load.grades.filter((g) => g.score != null && g.max_score);
  const average = marked.length
    ? Math.round(marked.reduce((n, g) => n + (g.score / g.max_score) * 100, 0) / marked.length)
    : null;

  return (
    <>
      <StatRow>
        <StatCard label="To mark" value={load.toMark.length} hint={load.toMark[0] ? `oldest ${relativeDays(load.toMark[0].submitted_at)}` : 'nothing waiting'} />
        <StatCard label="Missing work" value={load.missing.length} tone={load.missing.length ? 'warn' : undefined} hint="past due, not handed in" />
        <StatCard
          label="Attendance"
          value={attendance.rate == null ? '—' : `${attendance.rate}%`}
          hint={attendance.rate == null ? 'no registers in 30 days' : 'present or late, last 30 days'}
        />
        <StatCard label="Average mark" value={average == null ? '—' : `${average}%`} hint={average == null ? 'nothing marked yet' : `across ${marked.length} marks`} />
      </StatRow>

      <Group title="Today">
        {lessons.length === 0 ? (
          <GroupEmpty>This class isn't on your timetable today.</GroupEmpty>
        ) : lessons.map((l) => (
          <Row
            key={l.id}
            onClick={() => onTab('attendance')}
            label={`${l.start_time}–${l.end_time}`}
            detail={l.room_name ? `Room ${l.room_name}` : undefined}
          >
            {row?.registerTaken
              ? <StatusChip tone="good">Register taken</StatusChip>
              : <StatusChip tone="warn">Take register</StatusChip>}
          </Row>
        ))}
      </Group>

      <Group
        title="Waiting to be marked"
        action={load.toMark.length > 0 && <GroupLink to={markingUrl({ classId: classData.id })}>Mark now</GroupLink>}
      >
        {marking.length === 0 ? (
          <GroupEmpty>Nothing handed in is waiting for you.</GroupEmpty>
        ) : marking.map(({ assignment, items }) => (
          <Row
            key={assignment.id}
            href={markingUrl({ assignmentId: assignment.id })}
            label={assignment.title}
            detail={`first handed in ${relativeDays(items[0].submitted_at)}`}
            value={`${items.length} to mark`}
          />
        ))}
      </Group>

      {missing.length > 0 && (
        <Group title="Missing work" action={<GroupLink to={markingUrl({ view: 'missing', classId: classData.id })}>Who's missing</GroupLink>}>
          {missing.map(({ assignment, items }) => (
            <Row
              key={assignment.id}
              href={markingUrl({ view: 'missing', assignmentId: assignment.id })}
              label={assignment.title}
              detail={`${items.map((m) => m.studentName).slice(0, 3).join(', ')}${items.length > 3 ? ` and ${items.length - 3} more` : ''}`}
              value={`${items.length} missing`}
            />
          ))}
        </Group>
      )}

      <Group title="Due next" action={<GroupLink onClick={() => onTab('assignments')}>All assignments</GroupLink>}>
        {load.upcoming.length === 0 ? (
          <GroupEmpty>Nothing is due. Assignments you publish will appear here.</GroupEmpty>
        ) : load.upcoming.slice(0, 4).map((a) => (
          <Row
            key={a.id}
            onClick={() => onTab('assignments')}
            label={a.title}
            detail={a.type?.replace('_', ' ')}
            value={`${relativeDays(a.due_date)} · ${format(new Date(a.due_date), 'd MMM')}`}
          />
        ))}
      </Group>

      <section>
        <div className="app-group-head">
          <h2 className="scholr-label" style={{ margin: 0 }}>Class stream</h2>
        </div>
        <ClassStream classData={classData} isTeacher userId={userId} />
      </section>
    </>
  );
}
