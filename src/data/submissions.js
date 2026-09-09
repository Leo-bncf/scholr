import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one, none } from './_query';

/**
 * Student submissions against assignments.
 *
 * Submissions are versioned: resubmitting writes a new row pointing at the
 * previous one, and only the newest carries `is_current_version`. Every query
 * here filters on that unless it's explicitly asking for history — forgetting
 * it is how a marker ends up grading a superseded draft.
 */

const COLUMNS = `
  id, school_id, assignment_id, class_id, student_id, student_name, content,
  file_urls, link_url, documents, version_number, submission_time, file_type,
  previous_submission_id, is_current_version, annotations, status, submitted_at,
  score, feedback, graded_at, created_at
`;

/** Current submissions for an assignment — the marking queue. */
export function listForAssignment(assignmentId) {
  return rows(
    supabase
      .from('submissions')
      .select(COLUMNS)
      .eq('assignment_id', assignmentId)
      .eq('is_current_version', true)
      .order('submitted_at', { ascending: false }),
    'submissions.listForAssignment',
  );
}

/** One student's current submission for one assignment, if any. */
export function getForStudent(assignmentId, studentId) {
  return maybeOne(
    supabase
      .from('submissions')
      .select(COLUMNS)
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .eq('is_current_version', true),
    'submissions.getForStudent',
  );
}

export function listForStudent(schoolId, studentId, { status } = {}) {
  let q = supabase
    .from('submissions')
    .select(`${COLUMNS}, assignment:assignments (id, title, due_date, max_score)`)
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .eq('is_current_version', true);
  if (status) q = q.eq('status', status);
  return rows(q.order('submitted_at', { ascending: false }), 'submissions.listForStudent');
}

/** Full version history for one student on one assignment, oldest first. */
export function listVersions(assignmentId, studentId) {
  return rows(
    supabase
      .from('submissions')
      .select(COLUMNS)
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .order('version_number'),
    'submissions.listVersions',
  );
}

/**
 * Submit, or resubmit.
 *
 * Two statements: demote the previous current version, then insert the new one.
 * If the second fails the student briefly has no current version, which reads
 * as "not submitted" — recoverable by resubmitting. Making this atomic needs a
 * Postgres function, worth doing if resubmission turns out to be common.
 */
export async function submit({ assignmentId, studentId, ...payload }) {
  const previous = await getForStudent(assignmentId, studentId);

  if (previous) {
    await supabase.from('submissions').update({ is_current_version: false }).eq('id', previous.id);
  }

  return one(
    supabase
      .from('submissions')
      .insert({
        ...payload,
        assignment_id: assignmentId,
        student_id: studentId,
        previous_submission_id: previous?.id ?? null,
        version_number: (previous?.version_number ?? 0) + 1,
        is_current_version: true,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .select(COLUMNS),
    'submissions.submit',
  );
}

/** Record a mark and feedback against a submission. */
export function grade(id, { score, feedback, annotations }) {
  return one(
    supabase
      .from('submissions')
      .update({
        score,
        feedback,
        ...(annotations !== undefined ? { annotations } : {}),
        status: 'graded',
        graded_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(COLUMNS),
    'submissions.grade',
  );
}

/** How many have come in per assignment, for progress indicators. */
export async function countByAssignment(assignmentIds) {
  if (!assignmentIds?.length) return {};
  const data = await rows(
    supabase
      .from('submissions')
      .select('id, assignment_id, status')
      .in('assignment_id', assignmentIds)
      .eq('is_current_version', true),
    'submissions.countByAssignment',
  );
  return data.reduce((acc, s) => {
    const bucket = (acc[s.assignment_id] ??= { total: 0, graded: 0 });
    bucket.total += 1;
    if (s.status === 'graded') bucket.graded += 1;
    return acc;
  }, {});
}

/**
 * Equality filters, for call sites migrated mechanically from base44's
 * `.filter({...})`. Prefer a named query above when you touch one of these.
 */
export function where(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('submissions').select(COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'submissions.where');
}

export function remove(id) {
  return none(supabase.from('submissions').delete().eq('id', id), 'submissions.remove');
}
