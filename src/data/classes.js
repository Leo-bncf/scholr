import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one, none } from './_query';

/**
 * Classes — the busiest table in the app (72 base44 call sites).
 *
 * `teacher_ids` and `student_ids` are uuid[] rather than join tables, carried
 * over from base44's shape. That means membership tests are array containment
 * (`.contains()`), which Postgres can answer directly — the old code fetched
 * every class in the school and filtered in JavaScript.
 */

const COLUMNS = `
  id, school_id, subject_id, academic_year_id, cohort_id, name, section, capacity,
  roster_locked, teacher_ids, primary_teacher_id, co_teacher_permissions,
  student_ids, subject_teacher_assignments, schedule_info, room, status, created_at
`;

/** Classes with their subject joined, so callers don't need a second lookup. */
const WITH_SUBJECT = `${COLUMNS}, subject:subjects (id, name, code, ib_group, level)`;

export function listForSchool(schoolId, { status = 'active' } = {}) {
  let q = supabase.from('classes').select(WITH_SUBJECT).eq('school_id', schoolId);
  if (status) q = q.eq('status', status);
  return rows(q.order('name'), 'classes.listForSchool');
}

/**
 * Classes a teacher teaches.
 *
 * `contains` maps to the Postgres `@>` array operator, so the filter runs in
 * the database. base44 required pulling the whole school and calling
 * `c.teacher_ids?.includes(userId)` client-side.
 */
export function listForTeacher(schoolId, teacherId, { status = 'active' } = {}) {
  let q = supabase
    .from('classes')
    .select(WITH_SUBJECT)
    .eq('school_id', schoolId)
    .contains('teacher_ids', [teacherId]);
  if (status) q = q.eq('status', status);
  return rows(q.order('name'), 'classes.listForTeacher');
}

/** Classes a student is enrolled in. */
export function listForStudent(schoolId, studentId, { status = 'active' } = {}) {
  let q = supabase
    .from('classes')
    .select(WITH_SUBJECT)
    .eq('school_id', schoolId)
    .contains('student_ids', [studentId]);
  if (status) q = q.eq('status', status);
  return rows(q.order('name'), 'classes.listForStudent');
}

export function listForSubject(subjectId, { status = 'active' } = {}) {
  let q = supabase.from('classes').select(COLUMNS).eq('subject_id', subjectId);
  if (status) q = q.eq('status', status);
  return rows(q.order('name'), 'classes.listForSubject');
}

export function get(classId) {
  return maybeOne(supabase.from('classes').select(WITH_SUBJECT).eq('id', classId), 'classes.get');
}

export function create(cls) {
  return one(supabase.from('classes').insert(cls).select(COLUMNS), 'classes.create');
}

export function update(classId, patch) {
  return one(
    supabase.from('classes').update(patch).eq('id', classId).select(COLUMNS),
    'classes.update',
  );
}

export function remove(classId) {
  return none(supabase.from('classes').delete().eq('id', classId), 'classes.remove');
}

/** Archive rather than delete — grades and attendance reference the class. */
export function archive(classId) {
  return update(classId, { status: 'archived' });
}

/**
 * Add or remove a student on the roster.
 *
 * Read-modify-write on a uuid[] is racy: two concurrent enrolments can clobber
 * each other. Acceptable while rosters are edited by one admin at a time, but
 * if bulk enrolment lands this should become a Postgres function using
 * array_append/array_remove in a single statement.
 */
export async function setStudentEnrolled(classId, studentId, enrolled) {
  const cls = await maybeOne(
    supabase.from('classes').select('id, student_ids, roster_locked').eq('id', classId),
    'classes.setStudentEnrolled/read',
  );
  if (!cls) throw new Error('classes.setStudentEnrolled: class not found');
  if (cls.roster_locked) throw new Error('This class roster is locked.');

  const current = cls.student_ids ?? [];
  const next = enrolled
    ? Array.from(new Set([...current, studentId]))
    : current.filter((id) => id !== studentId);

  return update(classId, { student_ids: next });
}

/**
 * Equality filters, for call sites migrated mechanically from base44's
 * `.filter({...})`. Prefer a named query above when you touch one of these.
 */
export function where(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('classes').select(COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'classes.where');
}
