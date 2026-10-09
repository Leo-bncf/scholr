import React, { useMemo, useState } from 'react';
import { Group, GroupEmpty } from '@/components/app/AppShell';
import MarkSheet from '../MarkSheet';

/**
 * The gradebook: students down the side, assignments across the top.
 *
 * The old gradebook only drew columns for "grade item templates" — rows with
 * no student attached — so a mark given while marking an assignment never
 * appeared in it. A teacher marked thirty pieces of work and the gradebook
 * still said "No grade items yet". Columns are now the class's published
 * assignments, and every cell opens the same marking sheet as the queue.
 *
 * Grade items that aren't tied to an assignment still live in the Other marks
 * view (the previous gradebook), which also holds predicted grades.
 */
export default function ClassMarksGrid({ classData, load }) {
  const [open, setOpen] = useState(null);

  const assignments = useMemo(
    () => load.assignments
      .filter((a) => a.class_id === classData.id && a.status !== 'draft')
      .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0)),
    [load.assignments, classData.id],
  );
  const students = useMemo(
    () => (classData.student_ids || [])
      .map((id) => ({ id, name: load.nameOf.get(id) || 'Student' }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [classData.student_ids, load.nameOf],
  );

  const now = new Date();
  const cell = (a, st) => {
    const grade = load.gradeFor(a.id, st.id);
    const sub = load.submissionFor(a.id, st.id);
    const due = a.due_date && new Date(a.due_date) < now;
    if (grade?.score != null) return { text: `${fmt(grade.score)}`, tone: grade.status === 'draft' ? 'draft' : 'mark', grade, sub };
    if (sub && ['submitted', 'late', 'resubmitted'].includes(sub.status)) return { text: 'To mark', tone: 'todo', grade, sub };
    if (sub?.status === 'returned') return { text: 'Returned', tone: 'quiet', grade, sub };
    if (sub?.status === 'graded') return { text: 'Marked', tone: 'mark', grade, sub };
    if (due) return { text: 'Missing', tone: 'missing', grade, sub };
    return { text: '—', tone: 'quiet', grade, sub };
  };

  const averageFor = (st) => {
    const marks = assignments.map((a) => load.gradeFor(a.id, st.id)).filter((g) => g?.score != null && g.max_score);
    if (!marks.length) return null;
    return Math.round(marks.reduce((n, g) => n + (g.score / g.max_score) * 100, 0) / marks.length);
  };

  if (assignments.length === 0 || students.length === 0) {
    return (
      <Group>
        <GroupEmpty>
          {students.length === 0
            ? 'No students in this class yet.'
            : 'Publish an assignment and its marks will appear here, one column per assignment.'}
        </GroupEmpty>
      </Group>
    );
  }

  const openItem = open && {
    key: `${open.a.id}:${open.st.id}`,
    assignment: open.a,
    cls: classData,
    student_id: open.st.id,
    studentName: open.st.name,
    submission: load.submissionFor(open.a.id, open.st.id),
    grade: load.gradeFor(open.a.id, open.st.id),
  };

  return (
    <>
      <Group>
        <div className="app-tablewrap" style={{ overflowX: 'auto' }}>
          <table className="app-table marks-grid" style={{ minWidth: `${12 + assignments.length * 7}rem` }}>
            <thead>
              <tr>
                <th scope="col" style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 1, minWidth: '11rem' }}>Student</th>
                {assignments.map((a) => (
                  <th key={a.id} scope="col" className="num" title={a.title} style={{ maxWidth: '8rem' }}>
                    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '8rem', marginLeft: 'auto' }}>{a.title}</span>
                    <span style={{ display: 'block', fontWeight: 400, color: 'var(--faint)' }}>/ {a.max_score ?? '—'}</span>
                  </th>
                ))}
                <th scope="col" className="num">Average</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => {
                const avg = averageFor(st);
                return (
                  <tr key={st.id}>
                    <th scope="row" style={{ position: 'sticky', left: 0, background: 'var(--surface)', fontWeight: 500, color: 'var(--ink)', textAlign: 'left' }}>{st.name}</th>
                    {assignments.map((a) => {
                      const c = cell(a, st);
                      return (
                        <td key={a.id} className="num" style={{ padding: 0 }}>
                          <button
                            type="button"
                            className="marks-cell scholr-focus"
                            data-tone={c.tone}
                            onClick={() => setOpen({ a, st })}
                            aria-label={`${st.name}, ${a.title}: ${c.text}. Open to mark.`}
                          >
                            {c.text}
                          </button>
                        </td>
                      );
                    })}
                    <td className="num scholr-num" style={{ fontFamily: 'var(--font-mono)' }}>{avg == null ? '—' : `${avg}%`}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Group>
      <p style={{ margin: '-1.25rem 0 0', fontSize: '.78rem', color: 'var(--muted)' }}>
        Select any cell to mark, amend, or record a mark for work done on paper. Marks shown in grey are drafts — students can't see them yet.
      </p>

      <MarkSheet item={openItem} open={!!openItem} onOpenChange={(o) => { if (!o) setOpen(null); }} />
    </>
  );
}

const fmt = (n) => (Number.isInteger(n) ? n : Math.round(n * 10) / 10);
