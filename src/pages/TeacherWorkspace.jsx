import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';
import Notice from '@/components/app/Notice';
import { SelectField, FilterBar } from '@/components/app/Field';
import TeacherPage from '@/components/teacher/TeacherPage';
import MarkSheet from '@/components/teacher/MarkSheet';
import { PageLoading } from '@/components/teacher/bits';
import { useTeacherLoad } from '@/components/teacher/useTeacherLoad';
import { relativeDays, byAssignment } from '@/components/teacher/links';

/**
 * Marking — everything handed in, everything missing, everything marked.
 *
 * This was a four-column kanban with one card per student per assignment:
 * forty-five "Not submitted" cards for a teacher with three classes, each
 * with its own button, and the column that mattered (Submitted) squeezed to a
 * fifth of the width. It is now a queue. Work is grouped by assignment, oldest
 * first, and marking one piece opens the next.
 *
 * "Missing" is its own view because it is a different job: chasing students,
 * or recording a mark for work done on paper.
 */
export default function TeacherWorkspace() {
  const load = useTeacherLoad();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'queue');
  const classFilter = params.get('class') || 'all';
  const assignmentFilter = params.get('assignment');
  const [openKey, setOpenKey] = useState(null);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const keep = (x) => (classFilter === 'all' || x.cls?.id === classFilter)
    && (!assignmentFilter || x.assignment?.id === assignmentFilter);

  const toItem = (s) => ({
    key: `${s.assignment_id}:${s.student_id}`,
    assignment: s.assignment,
    cls: s.cls,
    student_id: s.student_id,
    studentName: s.studentName,
    submission: s,
    grade: s.grade,
  });

  const lists = useMemo(() => ({
    queue: load.toMark.filter(keep).map(toItem),
    missing: load.missing.filter(keep).map((m) => ({
      ...m,
      submission: load.submissionFor(m.assignment.id, m.student_id),
      grade: load.gradeFor(m.assignment.id, m.student_id),
    })),
    marked: load.marked.filter(keep).map(toItem),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [load.toMark, load.missing, load.marked, classFilter, assignmentFilter]);

  const current = lists[tab] || lists.queue;
  const groups = byAssignment(current);
  const openIndex = current.findIndex((x) => x.key === openKey);
  const openItem = openIndex >= 0 ? current[openIndex] : null;
  const nextItem = openIndex >= 0 ? current.find((x, i) => i > openIndex) : null;
  const filteredAssignment = assignmentFilter && [...load.toMark, ...load.missing, ...load.marked]
    .find((x) => x.assignment?.id === assignmentFilter)?.assignment;

  return (
    <TeacherPage
      title="Marking"
      eyebrow={load.isLoading ? undefined : `${load.toMark.length} waiting · ${load.missing.length} missing`}
      tabs={[
        { value: 'queue', label: `To mark${lists.queue.length ? ` · ${lists.queue.length}` : ''}` },
        { value: 'missing', label: `Missing${lists.missing.length ? ` · ${lists.missing.length}` : ''}` },
        { value: 'marked', label: 'Marked' },
      ]}
      activeTab={tab}
      onTabChange={(v) => { setTab(v); setOpenKey(null); }}
    >
      {load.error && <Notice tone="crit" title="Marking didn't load">{String(load.error.message || load.error)}</Notice>}

      <FilterBar>
        {load.classes.length > 1 && (
          <span style={{ width: 'min(100%, 18rem)' }}>
          <SelectField
            label="Class"
            value={classFilter}
            onChange={(v) => setParam('class', v)}
            options={[{ value: 'all', label: 'All classes' }, ...load.classes.map((c) => ({ value: c.id, label: c.name }))]}
          />
          </span>
        )}
        {filteredAssignment && (
          <button
            type="button"
            className="pub-btn pub-btn-line scholr-focus"
            onClick={() => setParam('assignment', null)}
            aria-label={`Stop filtering by ${filteredAssignment.title}`}
          >
            {filteredAssignment.title}
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </FilterBar>

      {load.isLoading ? <PageLoading /> : groups.length === 0 ? (
        <Group>
          <GroupEmpty>
            {tab === 'queue' && 'Nothing is waiting to be marked. Work your students hand in lands here, oldest first.'}
            {tab === 'missing' && 'Nobody is missing work that was due.'}
            {tab === 'marked' && 'Nothing marked yet.'}
          </GroupEmpty>
        </Group>
      ) : groups.map(({ assignment, cls, items }) => (
        <Group
          key={assignment.id}
          title={`${assignment.title} · ${cls?.name ?? ''}`}
          action={
            <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
              {assignment.due_date ? `due ${format(new Date(assignment.due_date), 'd MMM')}` : 'no due date'}
              {assignment.max_score != null ? ` · out of ${assignment.max_score}` : ''}
            </span>
          }
        >
          {items.map((x) => (
            <Row
              key={x.key}
              onClick={() => setOpenKey(x.key)}
              label={x.studentName}
              detail={detailFor(tab, x)}
            >
              {chipsFor(tab, x)}
            </Row>
          ))}
        </Group>
      ))}

      <MarkSheet
        item={openItem}
        open={!!openItem}
        onOpenChange={(o) => { if (!o) setOpenKey(null); }}
        onNext={tab === 'marked' ? undefined : () => setOpenKey(nextItem ? nextItem.key : null)}
        nextLabel={nextItem ? 'next' : 'close'}
      />
    </TeacherPage>
  );
}

function detailFor(tab, x) {
  if (tab === 'missing') {
    return `was due ${relativeDays(x.assignment.due_date)}${x.submission?.status === 'draft' ? ' · started a draft' : ''}`;
  }
  if (tab === 'marked') {
    const s = x.submission;
    return s?.graded_at ? `marked ${relativeDays(s.graded_at)}` : 'marked';
  }
  return x.submission?.submitted_at ? `handed in ${relativeDays(x.submission.submitted_at)}` : 'handed in';
}

function chipsFor(tab, x) {
  const s = x.submission;
  if (tab === 'marked') {
    const score = x.grade?.score ?? s?.score;
    return (
      <>
        {s?.status === 'returned'
          ? <StatusChip tone="mute">Returned</StatusChip>
          : <StatusChip tone="good">Published</StatusChip>}
        {score != null && <span className="scholr-num" style={{ fontFamily: 'var(--font-mono)', fontSize: '.86rem' }}>{score}{x.assignment?.max_score != null ? ` / ${x.assignment.max_score}` : ''}</span>}
      </>
    );
  }
  if (tab === 'missing') {
    return x.grade?.status === 'draft' ? <StatusChip tone="info">Draft mark</StatusChip> : null;
  }
  return (
    <>
      {s?.status === 'late' && <StatusChip tone="warn">Late</StatusChip>}
      {s?.version_number > 1 && <StatusChip tone="info">Resubmitted</StatusChip>}
      {x.grade?.status === 'draft' && <StatusChip tone="info">Draft mark</StatusChip>}
    </>
  );
}
