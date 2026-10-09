import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import Notice from '@/components/app/Notice';
import TeacherPage from '@/components/teacher/TeacherPage';
import { ClassSignals, GroupLink, PageLoading } from '@/components/teacher/bits';
import { useTeacherLoad } from '@/components/teacher/useTeacherLoad';
import { classUrl, markingUrl, relativeDays, byAssignment } from '@/components/teacher/links';
import { useUser } from '@/components/auth/UserContext';

/**
 * Today — the page a teacher lands on.
 *
 * Ordered by what a teacher has to do, not by what the database holds: the
 * lessons on now (and whether their registers are taken), then the work
 * waiting to be marked, then what has gone missing, then what is due next.
 * Every number links to the place it is acted on.
 */
export default function TeacherDashboard() {
  const { user } = useUser();
  const load = useTeacherLoad();
  const firstName = user?.full_name?.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const markingGroups = byAssignment(load.toMark);
  const missingGroups = byAssignment(load.missing);
  const oldest = load.toMark[0];
  const students = load.classes.reduce((n, c) => n + (c.student_ids?.length || 0), 0);

  return (
    <TeacherPage
      eyebrow={format(new Date(), 'EEEE d MMMM')}
      title={firstName ? `${greeting}, ${firstName}` : 'Today'}
      actions={load.toMark.length > 0 ? (
        <Link to={markingUrl()} className="pub-btn pub-btn-primary scholr-focus">
          Start marking
          <ArrowRight className="w-4 h-4" />
        </Link>
      ) : null}
    >
      {load.error && (
        <Notice tone="crit" title="Some of today's information didn't load">
          {String(load.error.message || load.error)}
        </Notice>
      )}

      {load.isLoading ? (
        <PageLoading />
      ) : load.classes.length === 0 ? (
        <Group>
          <GroupEmpty>
            You aren't teaching any classes yet. When your school adds you to a class it will appear here.
          </GroupEmpty>
        </Group>
      ) : (
        <>
          <StatRow>
            <StatCard
              label="To mark"
              value={load.toMark.length}
              hint={oldest ? `oldest handed in ${relativeDays(oldest.submitted_at)}` : 'nothing waiting'}
            />
            <StatCard
              label="Missing work"
              value={load.missing.length}
              tone={load.missing.length ? 'warn' : undefined}
              hint="past due, not handed in"
            />
            <StatCard
              label="Registers today"
              value={load.registersDue.length}
              tone={load.registersDue.length ? 'warn' : undefined}
              hint={load.lessonsToday.length === 0 ? 'no lessons today' : load.registersDue.length ? 'still to take' : 'all taken'}
            />
            <StatCard label="Classes" value={load.classes.length} hint={`${students} students`} />
          </StatRow>

          <Group title="Today">
            {load.lessonsToday.length === 0 ? (
              <GroupEmpty>No lessons on your timetable today.</GroupEmpty>
            ) : load.lessonsToday.map((lesson) => {
              const row = load.byClass.get(lesson.class_id);
              return (
                <Row
                  key={lesson.id}
                  href={classUrl(lesson.class_id, row?.registerTaken ? 'overview' : 'attendance')}
                  label={lesson.class_name || row?.cls?.name || 'Lesson'}
                  detail={[`${lesson.start_time}–${lesson.end_time}`, lesson.room_name].filter(Boolean).join(' · ')}
                >
                  {row?.registerTaken
                    ? <StatusChip tone="good">Register taken</StatusChip>
                    : <StatusChip tone="warn">Take register</StatusChip>}
                </Row>
              );
            })}
          </Group>

          <Group
            title="Waiting to be marked"
            action={load.toMark.length > 0 && <GroupLink to={markingUrl()}>All marking</GroupLink>}
          >
            {markingGroups.length === 0 ? (
              <GroupEmpty>Nothing handed in is waiting for you.</GroupEmpty>
            ) : markingGroups.slice(0, 6).map(({ assignment, cls, items }) => (
              <Row
                key={assignment.id}
                href={markingUrl({ assignmentId: assignment.id })}
                label={assignment.title}
                detail={`${cls?.name ?? ''} · first handed in ${relativeDays(items[0].submitted_at)}`}
                value={`${items.length} to mark`}
              />
            ))}
          </Group>

          {missingGroups.length > 0 && (
            <Group
              title="Missing work"
              action={<GroupLink to={markingUrl({ view: 'missing' })}>Who's missing</GroupLink>}
            >
              {missingGroups.slice(0, 5).map(({ assignment, cls, items }) => (
                <Row
                  key={assignment.id}
                  href={markingUrl({ view: 'missing', assignmentId: assignment.id })}
                  label={assignment.title}
                  detail={`${cls?.name ?? ''} · was due ${relativeDays(assignment.due_date)}`}
                  value={`${items.length} of ${cls?.student_ids?.length ?? '—'}`}
                />
              ))}
            </Group>
          )}

          <Group title="Due next">
            {load.upcoming.length === 0 ? (
              <GroupEmpty>Nothing is due. Assignments you publish will show here.</GroupEmpty>
            ) : load.upcoming.slice(0, 5).map((a) => (
              <Row
                key={a.id}
                href={classUrl(a.class_id, 'assignments')}
                label={a.title}
                detail={a.cls?.name}
                value={`${relativeDays(a.due_date)} · ${format(new Date(a.due_date), 'd MMM')}`}
              />
            ))}
          </Group>

          <Group title="Your classes" action={<GroupLink to="/TeacherClasses">All classes</GroupLink>}>
            {[...load.byClass.values()].map((r) => (
              <Row
                key={r.cls.id}
                href={classUrl(r.cls.id)}
                label={r.cls.name}
                detail={[`${r.students} students`, r.cls.room && `Room ${r.cls.room}`].filter(Boolean).join(' · ')}
              >
                <ClassSignals row={r} />
              </Row>
            ))}
          </Group>
        </>
      )}
    </TeacherPage>
  );
}
