import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import StatusChip from '@/components/app/StatusChip';
import Notice from '@/components/app/Notice';
import { Field } from '@/components/app/Field';
import FileInlinePreview from '@/components/assignment/FileInlinePreview';
import StoredFileLink from '@/components/common/StoredFileLink';
import * as submissionsData from '@/data/submissions';
import * as gradebookData from '@/data/gradebook';
import { TEACHER_LOAD_KEY } from './useTeacherLoad';

/**
 * Marking one student's work, in a sheet over the list.
 *
 * Opens from the marking queue, the missing list, or a gradebook cell, so it
 * handles three cases: work that was handed in, work that was marked before
 * (amend it), and no work at all — a mark for something done on paper.
 *
 * Three outcomes, and they are not the same thing:
 *   Publish       — the mark is final and the student and family can see it.
 *   Save draft    — the mark is kept for you only; the work stays in the queue.
 *   Return        — no mark; the work goes back with feedback for another try.
 */
export default function MarkSheet({ item, open, onOpenChange, onNext, nextLabel }) {
  const queryClient = useQueryClient();
  const assignment = item?.assignment;
  const submission = item?.submission || null;
  const grade = item?.grade || null;
  const max = assignment?.max_score ?? grade?.max_score ?? null;

  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [criteria, setCriteria] = useState([]);

  useEffect(() => {
    if (!item) return;
    setScore(grade?.score ?? submission?.score ?? '');
    setFeedback(grade?.comment ?? submission?.feedback ?? '');
    setCriteria((grade?.rubric_criteria || []).map((c) => ({
      criterion_id: c.id,
      name: c.name,
      description: c.description,
      max_score: c.max_score,
      score: grade?.criterion_scores?.find((s) => s.criterion_id === c.id)?.score ?? '',
      feedback: grade?.criterion_scores?.find((s) => s.criterion_id === c.id)?.feedback ?? '',
    })));
  }, [item, grade, submission]);

  const usesRubric = criteria.length > 0;
  const total = usesRubric
    ? criteria.reduce((n, c) => n + (Number(c.score) || 0), 0)
    : (score === '' ? null : Number(score));
  const overMax = max != null && total != null && total > max;
  const invalid = total != null && (Number.isNaN(total) || total < 0);

  const done = async (advance) => {
    await queryClient.invalidateQueries({ queryKey: TEACHER_LOAD_KEY });
    queryClient.invalidateQueries({ queryKey: ['class-grade-items'] });
    queryClient.invalidateQueries({ queryKey: ['class-grades'] });
    if (advance && onNext) onNext(); else onOpenChange(false);
  };

  const save = useMutation({
    mutationFn: async ({ publish }) => {
      await gradebookData.recordMark({
        assignment,
        studentId: item.student_id,
        studentName: item.studentName,
        score: total,
        maxScore: max,
        comment: feedback.trim() || null,
        publish,
        rubric: usesRubric ? criteria : null,
      });
      // The submission's own status is what moves it out of the queue, so a
      // draft leaves it there on purpose.
      if (submission && publish) {
        await submissionsData.grade(submission.id, { score: total, feedback: feedback.trim() || null, publish: true });
      }
    },
  });

  const giveBack = useMutation({
    mutationFn: () => submissionsData.returnForRevision(submission.id, { feedback: feedback.trim() }),
  });

  const busy = save.isPending || giveBack.isPending;
  const failed = save.error || giveBack.error;

  if (!item) return null;

  const docs = submission?.documents || [];
  const preview = docs.find((d) => d.type === 'uploaded_file');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="mark-sheet"
        style={{ width: 'min(100vw, 40rem)', maxWidth: '100vw', padding: 0, background: 'var(--paper)', borderLeft: '1px solid var(--rule)', display: 'flex', flexDirection: 'column' }}
      >
        <header style={{ padding: 'var(--space-md) var(--space-md) var(--space-sm)', borderBottom: '1px solid var(--rule-soft)' }}>
          <p className="scholr-label" style={{ margin: 0 }}>{item.cls?.name}</p>
          <SheetTitle style={{ margin: '.3rem 0 0', fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 620, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            {item.studentName}
          </SheetTitle>
          <SheetDescription style={{ margin: '.2rem 0 0', fontSize: '.88rem', color: 'var(--body)' }}>
            {assignment?.title}
          </SheetDescription>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginTop: '.6rem' }}>
            {submission ? (
              <>
                {submission.status === 'late' && <StatusChip tone="warn">Late</StatusChip>}
                {submission.version_number > 1 && <StatusChip tone="info">Version {submission.version_number}</StatusChip>}
                {submission.status === 'graded' && <StatusChip tone="good">Marked</StatusChip>}
                {submission.status === 'returned' && <StatusChip tone="mute">Returned for revision</StatusChip>}
                {submission.submitted_at && (
                  <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                    Handed in {format(new Date(submission.submitted_at), 'd MMM, HH:mm')}
                  </span>
                )}
              </>
            ) : (
              <StatusChip tone="mute">Nothing handed in</StatusChip>
            )}
            {grade?.status === 'draft' && <StatusChip tone="info">Draft mark saved</StatusChip>}
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* The work */}
          <section>
            <h3 className="scholr-label" style={{ margin: '0 0 .5rem' }}>The work</h3>
            {!submission ? (
              <p style={{ margin: 0, fontSize: '.88rem', color: 'var(--muted)' }}>
                This student hasn't handed anything in. You can still record a mark — for work done on paper or in class.
              </p>
            ) : (
              <div className="app-group" style={{ padding: 0 }}>
                {submission.content ? (
                  <p style={{ margin: 0, padding: '.8rem .9rem', fontSize: '.9rem', color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{submission.content}</p>
                ) : null}
                {docs.map((d) => (
                  <StoredFileLink
                    key={d.id || d.url}
                    href={d.url}
                    className="app-row scholr-focus"
                    style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.7rem .9rem', color: 'var(--ink)', textDecoration: 'none', fontSize: '.9rem' }}
                  >
                    <FileText className="w-4 h-4" style={{ color: 'var(--muted)', flex: 'none' }} />
                    <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{d.name || 'Attachment'}</span>
                    <ExternalLink className="w-3.5 h-3.5" style={{ marginLeft: 'auto', color: 'var(--muted)', flex: 'none' }} />
                  </StoredFileLink>
                ))}
                {submission.link_url && (
                  <StoredFileLink
                    href={submission.link_url}
                    className="app-row scholr-focus"
                    style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.7rem .9rem', color: 'var(--brand)', textDecoration: 'none', fontSize: '.9rem' }}
                  >
                    <ExternalLink className="w-4 h-4" style={{ flex: 'none' }} />
                    <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{submission.link_url}</span>
                  </StoredFileLink>
                )}
                {!submission.content && docs.length === 0 && !submission.link_url && (
                  <p style={{ margin: 0, padding: '.8rem .9rem', fontSize: '.88rem', color: 'var(--muted)' }}>
                    Marked as handed in, with nothing attached.
                  </p>
                )}
              </div>
            )}
            {preview && <div style={{ marginTop: '.75rem' }}><FileInlinePreview document={preview} /></div>}
          </section>

          {/* The mark */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <h3 className="scholr-label" style={{ margin: 0 }}>Mark</h3>
            {usesRubric ? (
              <div className="app-group" style={{ padding: 0 }}>
                {criteria.map((c, i) => (
                  <div key={c.criterion_id || i} style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.6rem .9rem' }}>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: 'block', fontSize: '.9rem', color: 'var(--ink)' }}>{c.name}</span>
                      {c.description && <span style={{ display: 'block', fontSize: '.78rem', color: 'var(--muted)' }}>{c.description}</span>}
                    </span>
                    <input
                      type="number" inputMode="decimal" min="0" max={c.max_score ?? undefined}
                      className="app-input scholr-focus scholr-num"
                      style={{ width: '5rem', textAlign: 'right' }}
                      aria-label={`${c.name} score`}
                      value={c.score}
                      onChange={(e) => setCriteria((cur) => cur.map((x, j) => (j === i ? { ...x, score: e.target.value } : x)))}
                    />
                    <span className="scholr-num" style={{ fontSize: '.85rem', color: 'var(--muted)', width: '2.5rem' }}>/ {c.max_score}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', padding: '.6rem .9rem', fontSize: '.9rem', color: 'var(--ink)' }}>
                  <span>Total</span>
                  <span className="scholr-num" style={{ marginLeft: 'auto' }}>{total ?? '—'}{max != null ? ` / ${max}` : ''}</span>
                </div>
              </div>
            ) : (
              <Field label={max != null ? `Score out of ${max}` : 'Score'} htmlFor="mark-score" hint="Leave empty to give feedback without a number.">
                <input
                  id="mark-score"
                  type="number" inputMode="decimal" min="0" max={max ?? undefined} step="any"
                  className="app-input scholr-focus scholr-num"
                  style={{ maxWidth: '9rem' }}
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </Field>
            )}
            {overMax && <Notice tone="warn">That's more than the {max} marks this assignment is out of.</Notice>}
            <Field label="Feedback" htmlFor="mark-feedback">
              <textarea
                id="mark-feedback"
                className="app-input scholr-focus"
                rows={5}
                style={{ resize: 'vertical', minHeight: '7rem', lineHeight: 1.5 }}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What went well, and the one thing to do next time."
              />
            </Field>
            {failed && <Notice tone="crit" title="That didn't save">{String(failed.message || failed)}</Notice>}
          </section>
        </div>

        <footer style={{ padding: 'var(--space-sm) var(--space-md)', borderTop: '1px solid var(--rule-soft)', display: 'flex', flexWrap: 'wrap', gap: '.5rem', alignItems: 'center', background: 'var(--surface)' }}>
          <button
            type="button"
            className="pub-btn pub-btn-primary scholr-focus"
            disabled={busy || invalid}
            onClick={() => save.mutate({ publish: true }, { onSuccess: () => done(true) })}
          >
            {save.isPending && save.variables?.publish ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {onNext ? `Publish and ${nextLabel || 'next'}` : 'Publish mark'}
          </button>
          <button
            type="button"
            className="pub-btn pub-btn-line scholr-focus"
            disabled={busy || invalid}
            onClick={() => save.mutate({ publish: false }, { onSuccess: () => done(false) })}
          >
            Save draft
          </button>
          {submission && submission.status !== 'returned' && (
            <button
              type="button"
              className="pub-btn pub-btn-line scholr-focus"
              disabled={busy || !feedback.trim()}
              title={feedback.trim() ? undefined : 'Write feedback first — it is what the student gets back.'}
              onClick={() => giveBack.mutate(undefined, { onSuccess: () => done(true) })}
            >
              Return for revision
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '.78rem', color: 'var(--muted)' }}>
            Published marks are visible to the student and family.
          </span>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
