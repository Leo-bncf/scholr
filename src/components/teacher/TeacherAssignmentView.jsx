import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText, ExternalLink } from 'lucide-react';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import Notice from '@/components/app/Notice';
import StoredFileLink from '@/components/common/StoredFileLink';
import AssignmentComments from '@/components/assignment/AssignmentComments';
import AssessmentTeacherReview from '@/components/assessment/AssessmentTeacherReview';
import { useUser } from '@/components/auth/UserContext';
import * as assignmentsData from '@/data/assignments';
import TeacherPage from './TeacherPage';
import MarkSheet from './MarkSheet';
import { PageLoading } from './bits';
import { useTeacherLoad, AWAITING, TEACHER_LOAD_KEY } from './useTeacherLoad';
import { classUrl, relativeDays } from './links';

/**
 * One assignment, for the teacher who set it.
 *
 * The page shared by students and teachers drew the teacher's half as a
 * five-column table whose last column — the button to review the work — was
 * cut off at a normal window width. The teacher's half is now its own page in
 * the teacher frame: who has handed in, who hasn't, and every row opens the
 * same marking sheet as the queue.
 */
export default function TeacherAssignmentView({ assignment, classData }) {
  const { user, membership, schoolId } = useUser();
  const queryClient = useQueryClient();
  const load = useTeacherLoad({ classId: classData.id });
  const [openId, setOpenId] = useState(null);

  const setStatus = useMutation({
    mutationFn: (status) => assignmentsData.update(assignment.id, {
      status,
      ...(status === 'published' && !assignment.publish_date ? { publish_date: new Date().toISOString() } : {}),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-detail'] });
      queryClient.invalidateQueries({ queryKey: TEACHER_LOAD_KEY });
    },
  });

  const isAssessment = assignment.type === 'quiz' || assignment.type === 'exam';
  const pastDue = assignment.due_date && new Date(assignment.due_date) < new Date();

  const students = (classData.student_ids || []).map((id) => {
    const sub = load.submissionFor(assignment.id, id);
    const grade = load.gradeFor(assignment.id, id);
    let state = 'none';
    if (sub && AWAITING.has(sub.status)) state = 'todo';
    else if (sub?.status === 'graded' || grade?.status === 'published') state = 'marked';
    else if (sub?.status === 'returned') state = 'returned';
    else if (pastDue) state = 'missing';
    return { id, name: load.nameOf.get(id) || 'Student', sub, grade, state };
  });
  const order = { todo: 0, missing: 1, returned: 2, none: 3, marked: 4 };
  students.sort((a, b) => order[a.state] - order[b.state] || a.name.localeCompare(b.name));

  const count = (s) => students.filter((x) => x.state === s).length;
  const handedIn = students.filter((x) => x.sub && x.sub.status !== 'draft').length;
  const late = students.filter((x) => x.sub?.status === 'late').length;

  const open = students.find((s) => s.id === openId);
  const openItem = open && {
    key: `${assignment.id}:${open.id}`,
    assignment,
    cls: classData,
    student_id: open.id,
    studentName: open.name,
    submission: open.sub,
    grade: open.grade,
  };
  const nextTodo = open && students.find((s) => s.id !== open.id && s.state === 'todo');

  const attachments = assignment.attachments || [];

  return (
    <TeacherPage
      title={assignment.title}
      eyebrow={[
        classData.name,
        assignment.due_date ? `due ${format(new Date(assignment.due_date), 'EEE d MMM, HH:mm')}` : 'no due date',
        assignment.max_score != null ? `out of ${assignment.max_score}` : null,
      ].filter(Boolean).join(' · ')}
      actions={
        <>
          <Link to={classUrl(classData.id, 'assignments')} className="pub-btn pub-btn-line scholr-focus">All assignments</Link>
          {assignment.status === 'draft' && (
            <button type="button" className="pub-btn pub-btn-primary scholr-focus" disabled={setStatus.isPending} onClick={() => setStatus.mutate('published')}>
              Publish to students
            </button>
          )}
          {assignment.status === 'published' && pastDue && (
            <button type="button" className="pub-btn pub-btn-line scholr-focus" disabled={setStatus.isPending} onClick={() => setStatus.mutate('closed')}>
              Close submissions
            </button>
          )}
        </>
      }
    >
      {assignment.status === 'draft' && (
        <Notice title="Draft">Students can't see this yet. Publish it when the brief is ready.</Notice>
      )}
      {assignment.status === 'closed' && (
        <Notice title="Closed">Students can no longer hand in. You can still mark what was submitted.</Notice>
      )}
      {setStatus.error && <Notice tone="crit" title="That didn't change">{String(setStatus.error.message)}</Notice>}

      {load.isLoading ? <PageLoading /> : (
        <>
          <StatRow>
            <StatCard label="Handed in" value={`${handedIn}/${students.length}`} hint={late ? `${late} late` : 'none late'} />
            <StatCard label="To mark" value={count('todo')} />
            <StatCard label="Missing" value={count('missing')} tone={count('missing') ? 'warn' : undefined} hint={pastDue ? 'past due, not handed in' : 'not due yet'} />
            <StatCard label="Marked" value={count('marked')} />
          </StatRow>

          <Group title="Brief">
            {assignment.description ? (
              <p style={{ margin: 0, padding: '.8rem .9rem', fontSize: '.92rem', color: 'var(--ink)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {assignment.description}
              </p>
            ) : (
              <GroupEmpty>No written brief.</GroupEmpty>
            )}
            {attachments.map((url, i) => (
              <StoredFileLink
                key={url || i}
                href={url}
                className="app-row scholr-focus"
                style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.7rem .9rem', color: 'var(--ink)', textDecoration: 'none', fontSize: '.9rem' }}
              >
                <FileText className="w-4 h-4" style={{ color: 'var(--muted)', flex: 'none' }} />
                <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{fileName(url, i)}</span>
                <ExternalLink className="w-3.5 h-3.5" style={{ marginLeft: 'auto', color: 'var(--muted)', flex: 'none' }} />
              </StoredFileLink>
            ))}
          </Group>

          {isAssessment ? (
            <Group title="Online test">
              <div style={{ padding: '.8rem .9rem' }}>
                <AssessmentTeacherReview assignment={assignment} />
              </div>
            </Group>
          ) : (
            <Group title="Students">
              {students.length === 0 ? <GroupEmpty>No students in this class.</GroupEmpty> : students.map((s) => (
                <Row
                  key={s.id}
                  onClick={() => setOpenId(s.id)}
                  label={s.name}
                  detail={detail(s)}
                >
                  {s.state === 'todo' && (s.sub.status === 'late' ? <StatusChip tone="warn">Late · to mark</StatusChip> : <StatusChip tone="info">To mark</StatusChip>)}
                  {s.state === 'missing' && <StatusChip tone="warn">Missing</StatusChip>}
                  {s.state === 'returned' && <StatusChip tone="mute">Returned</StatusChip>}
                  {s.grade?.status === 'draft' && <StatusChip tone="info">Draft mark</StatusChip>}
                  {s.state === 'marked' && (
                    <span className="scholr-num" style={{ fontFamily: 'var(--font-mono)', fontSize: '.86rem' }}>
                      {s.grade?.score ?? s.sub?.score ?? '—'}{assignment.max_score != null ? ` / ${assignment.max_score}` : ''}
                    </span>
                  )}
                </Row>
              ))}
            </Group>
          )}

          <Group>
            <div style={{ padding: '.8rem .9rem' }}>
              <AssignmentComments
                assignment={assignment}
                userId={user.id}
                userName={user.full_name}
                userRole={membership?.role}
                schoolId={schoolId}
              />
            </div>
          </Group>
        </>
      )}

      <MarkSheet
        item={openItem}
        open={!!openItem}
        onOpenChange={(o) => { if (!o) setOpenId(null); }}
        onNext={nextTodo ? () => setOpenId(nextTodo.id) : undefined}
      />
    </TeacherPage>
  );
}

function detail(s) {
  if (s.sub?.submitted_at && s.sub.status !== 'draft') return `handed in ${relativeDays(s.sub.submitted_at)}${s.sub.version_number > 1 ? ` · version ${s.sub.version_number}` : ''}`;
  if (s.sub?.status === 'draft') return 'started, not handed in';
  if (s.grade) return 'marked without a submission';
  return 'nothing handed in';
}

/** A readable name for a stored attachment: the file name without the upload stamp. */
function fileName(url, i) {
  const last = decodeURIComponent(String(url).split('?')[0].split('/').pop() || '');
  const clean = last.replace(/^[a-z0-9]{6,10}-/, '');
  return clean || `Attachment ${i + 1}`;
}
