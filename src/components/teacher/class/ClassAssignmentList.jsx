import React from 'react';
import { format } from 'date-fns';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';
import { createPageUrl } from '@/utils';
import { AWAITING } from '../useTeacherLoad';

const TYPE_LABEL = {
  homework: 'Homework', essay: 'Essay', lab_report: 'Lab report', presentation: 'Presentation',
  exam: 'Exam', project: 'Project', quiz: 'Quiz', other: 'Other',
};

/**
 * A class's assignments, split by where they are in their life.
 *
 * Each row answers the question a teacher opens the list with — how many are
 * in, and how many of those still need marking — instead of repeating the
 * description and the points total.
 */
export default function ClassAssignmentList({ classData, load }) {
  const students = classData.student_ids?.length || 0;
  const now = new Date();
  const mine = load.assignments.filter((a) => a.class_id === classData.id);

  const stats = (a) => {
    const subs = load.submissions.filter((s) => s.assignment_id === a.id && s.status !== 'draft');
    return { handedIn: subs.length, toMark: subs.filter((s) => AWAITING.has(s.status)).length };
  };

  const drafts = mine.filter((a) => a.status === 'draft');
  const open = mine.filter((a) => a.status === 'published' && (!a.due_date || new Date(a.due_date) >= now))
    .sort((a, b) => new Date(a.due_date || 8.64e15) - new Date(b.due_date || 8.64e15));
  const past = mine.filter((a) => (a.status === 'published' && a.due_date && new Date(a.due_date) < now) || a.status === 'closed')
    .sort((a, b) => new Date(b.due_date || 0) - new Date(a.due_date || 0));

  const row = (a, kind) => {
    const { handedIn, toMark } = stats(a);
    return (
      <Row
        key={a.id}
        href={`${createPageUrl('AssignmentDetail')}?assignment_id=${a.id}`}
        label={a.title}
        detail={[
          TYPE_LABEL[a.type] || null,
          a.due_date ? `due ${format(new Date(a.due_date), 'EEE d MMM, HH:mm')}` : 'no due date',
          a.max_score != null ? `out of ${a.max_score}` : null,
        ].filter(Boolean).join(' · ')}
      >
        {kind === 'draft' ? (
          <StatusChip tone="mute">Draft — students can't see it</StatusChip>
        ) : (
          <>
            {toMark > 0 && <StatusChip tone="info">{toMark} to mark</StatusChip>}
            <span className="scholr-num" style={{ fontFamily: 'var(--font-mono)', fontSize: '.86rem' }}>
              {handedIn}/{students} in
            </span>
          </>
        )}
      </Row>
    );
  };

  if (mine.length === 0) {
    return (
      <Group>
        <GroupEmpty>No assignments yet. Use “New assignment” to set the first one — attach the brief, choose a due date, and publish when it's ready.</GroupEmpty>
      </Group>
    );
  }

  return (
    <>
      {drafts.length > 0 && <Group title="Drafts">{drafts.map((a) => row(a, 'draft'))}</Group>}
      <Group title="Open">
        {open.length === 0 ? <GroupEmpty>Nothing is open right now.</GroupEmpty> : open.map((a) => row(a, 'open'))}
      </Group>
      {past.length > 0 && <Group title="Past due">{past.map((a) => row(a, 'past'))}</Group>}
    </>
  );
}
