import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one, none } from './_query';

/**
 * Assignments set by teachers, and the queries the dashboards need.
 *
 * `status` distinguishes a draft from something students can see — several
 * queries here filter on it explicitly rather than letting callers forget and
 * leak unpublished work to students.
 */

const COLUMNS = `
  id, school_id, class_id, teacher_id, title, description, type, due_date, publish_date,
  max_score, ib_criteria, attachments, curriculum_topic_ids, status, allow_late,
  primary_submission_format, allow_alternative_formats, alternative_formats, created_at
`;

const WITH_CLASS = `${COLUMNS}, class:classes (id, name, section, subject_id)`;

export function listForTeacher(schoolId, teacherId, { status } = {}) {
  let q = supabase
    .from('assignments')
    .select(WITH_CLASS)
    .eq('school_id', schoolId)
    .eq('teacher_id', teacherId);
  if (status) q = q.eq('status', status);
  return rows(q.order('due_date', { ascending: false }), 'assignments.listForTeacher');
}

export function listForClass(classId, { status } = {}) {
  let q = supabase.from('assignments').select(COLUMNS).eq('class_id', classId);
  if (status) q = q.eq('status', status);
  return rows(q.order('due_date', { ascending: false }), 'assignments.listForClass');
}

/**
 * Assignments a student should actually see.
 *
 * Restricted to published work across the classes they're enrolled in. Drafts
 * never leave the teacher's side.
 */
export function listPublishedForClasses(classIds) {
  if (!classIds?.length) return Promise.resolve([]);
  return rows(
    supabase
      .from('assignments')
      .select(WITH_CLASS)
      .in('class_id', classIds)
      .eq('status', 'published')
      .order('due_date'),
    'assignments.listPublishedForClasses',
  );
}

/** Published work still ahead of its due date, for "what's coming up" panels. */
export function listUpcomingForClasses(classIds, { limit = 10 } = {}) {
  if (!classIds?.length) return Promise.resolve([]);
  return rows(
    supabase
      .from('assignments')
      .select(WITH_CLASS)
      .in('class_id', classIds)
      .eq('status', 'published')
      .gte('due_date', new Date().toISOString())
      .order('due_date')
      .limit(limit),
    'assignments.listUpcomingForClasses',
  );
}

export function get(id) {
  return maybeOne(supabase.from('assignments').select(WITH_CLASS).eq('id', id), 'assignments.get');
}

export function create(assignment) {
  return one(supabase.from('assignments').insert(assignment).select(COLUMNS), 'assignments.create');
}

export function update(id, patch) {
  return one(
    supabase.from('assignments').update(patch).eq('id', id).select(COLUMNS),
    'assignments.update',
  );
}

export function remove(id) {
  return none(supabase.from('assignments').delete().eq('id', id), 'assignments.remove');
}

/** Count assignments per class in one round trip, for roster/list screens. */
export async function countByClass(classIds) {
  if (!classIds?.length) return {};
  const data = await rows(
    supabase.from('assignments').select('id, class_id').in('class_id', classIds),
    'assignments.countByClass',
  );
  return data.reduce((acc, a) => {
    acc[a.class_id] = (acc[a.class_id] ?? 0) + 1;
    return acc;
  }, {});
}

/**
 * Equality filters, for call sites migrated mechanically from base44's
 * `.filter({...})`. Prefer a named query above when you touch one of these.
 */
export function where(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('assignments').select(COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'assignments.where');
}
