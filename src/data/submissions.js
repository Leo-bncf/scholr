import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one, none, count, raise } from './_query';

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

/**
 * Current submissions across a set of classes.
 *
 * Scoped to the caller's classes (the teacher workspace) and to the current
 * version only — a superseded resubmission is not a second piece of work in
 * the marking queue.
 */
export function listForClasses(classIds, { limit } = {}) {
  if (!classIds?.length) return Promise.resolve([]);
  let q = supabase
    .from('submissions')
    .select(COLUMNS)
    .in('class_id', classIds)
    .eq('is_current_version', true)
    .order('submitted_at', { ascending: false });
  if (limit) q = q.limit(limit);
  return rows(q, 'submissions.listForClasses');
}

/** Head-count of submissions, without transferring any rows. */
export function countForSchool(schoolId) {
  return count(
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
    'submissions.countForSchool',
  );
}

/**
 * Storage in use by a school's submissions, computed in Postgres.
 *
 * The files panel used to fetch every submission to sum `size_bytes` on the
 * document arrays. See supabase/migrations/0015_bounded_reads.sql.
 */
export async function storageUsage(schoolId) {
  const { data, error } = await supabase.rpc('school_storage_usage', {
    p_school_id: schoolId,
  });
  if (error) raise(error, 'submissions.storageUsage');
  return data?.[0] ?? null;
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

/** The student's in-progress draft for an assignment, if there is one. */
export function getDraft(assignmentId, studentId) {
  return maybeOne(
    supabase
      .from('submissions')
      .select(COLUMNS)
      .eq('assignment_id', assignmentId)
      .eq('student_id', studentId)
      .eq('status', 'draft')
      .eq('is_current_version', true),
    'submissions.getDraft',
  );
}

/**
 * Save work in progress.
 *
 * Editing an existing draft updates it in place — a draft is a scratchpad, not
 * a version. Only submitting creates one.
 */
export async function saveDraft({ assignmentId, studentId, ...payload }) {
  const draft = await getDraft(assignmentId, studentId);

  if (draft) {
    return one(
      supabase.from('submissions').update(payload).eq('id', draft.id).select(COLUMNS),
      'submissions.saveDraft/update',
    );
  }

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
        status: 'draft',
      })
      .select(COLUMNS),
    'submissions.saveDraft/insert',
  );
}

/**
 * Submit, or resubmit.
 *
 * If the student has a draft open, submitting promotes that row rather than
 * inserting beside it — otherwise the draft would linger as a second current
 * version and the marking queue would show the work twice.
 *
 * Otherwise: demote the previous current version, then insert the new one. If
 * the second statement fails the student briefly has no current version, which
 * reads as "not submitted" — recoverable by resubmitting. Making it atomic
 * needs a Postgres function, worth doing if resubmission turns out to be
 * common.
 *
 * `late` is decided by the caller, which is the only place that knows the
 * assignment's due date.
 */
export async function submit({ assignmentId, studentId, late = false, ...payload }) {
  const status = late ? 'late' : 'submitted';
  const now = new Date().toISOString();

  const draft = await getDraft(assignmentId, studentId);
  if (draft) {
    return one(
      supabase
        .from('submissions')
        .update({ ...payload, status, submitted_at: now, submission_time: now })
        .eq('id', draft.id)
        .select(COLUMNS),
      'submissions.submit/promoteDraft',
    );
  }

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
        submitted_at: now,
        submission_time: now,
        status,
      })
      .select(COLUMNS),
    'submissions.submit',
  );
}

/**
 * Record a mark and feedback.
 *
 * `publish: false` returns the work to the student with the feedback attached
 * but stops short of calling it final — that is the "returned" state, which is
 * what a teacher wants when they expect a resubmission. `score` is optional:
 * marking something reviewed without a number is a normal thing to do.
 */
export function grade(id, { score, feedback, annotations, publish = true } = {}) {
  return one(
    supabase
      .from('submissions')
      .update({
        ...(score !== undefined ? { score } : {}),
        ...(feedback !== undefined ? { feedback } : {}),
        ...(annotations !== undefined ? { annotations } : {}),
        status: publish ? 'graded' : 'returned',
        graded_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(COLUMNS),
    'submissions.grade',
  );
}

/** Send work back for another attempt, with written feedback and no mark. */
export function returnForRevision(id, { feedback }) {
  return one(
    supabase
      .from('submissions')
      .update({ feedback, status: 'returned' })
      .eq('id', id)
      .select(COLUMNS),
    'submissions.returnForRevision',
  );
}

/** Replace the margin annotations on a submission. */
export function setAnnotations(id, annotations) {
  return one(
    supabase.from('submissions').update({ annotations }).eq('id', id).select(COLUMNS),
    'submissions.setAnnotations',
  );
}

/**
 * Overwrite the denormalised student name.
 *
 * Only for erasure requests: the row is kept because a mark is an academic
 * record, but the name on it is replaced. Nothing else should call this.
 */
export function anonymiseStudentName(id, studentName) {
  return none(
    supabase.from('submissions').update({ student_name: studentName }).eq('id', id),
    'submissions.anonymiseStudentName',
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
