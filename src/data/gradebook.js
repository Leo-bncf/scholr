import { supabase } from '@/lib/supabase';
import { maybeOne, rows, one, none } from './_query';

/**
 * Grades.
 *
 * Publication is a security boundary, not a UI preference: RLS on grade_items
 * only lets a student read their own row when `visible_to_student` is true, and
 * the same for parents. Queries here don't need to filter on those flags —
 * Postgres already has — but writes must set them deliberately.
 */

const COLUMNS = `
  id, school_id, class_id, student_id, student_name, assignment_id, title,
  score, max_score, percentage, ib_grade, comment, status,
  visible_to_student, visible_to_parent, term_id, grading_type,
  rubric_criteria, criterion_scores, created_at
`;

/** Everything recorded for one class — the gradebook grid. */
export function listForClass(classId, { termId } = {}) {
  let q = supabase.from('grade_items').select(COLUMNS).eq('class_id', classId).eq('is_template', false);
  if (termId) q = q.eq('term_id', termId);
  return rows(q.order('created_at', { ascending: false }), 'gradebook.listForClass');
}

/** Every recorded grade across several classes — a teacher's whole load. */
export function listForClasses(classIds) {
  if (!classIds?.length) return Promise.resolve([]);
  return rows(
    supabase.from('grade_items').select(COLUMNS).in('class_id', classIds).eq('is_template', false),
    'gradebook.listForClasses',
  );
}

/**
 * Record a mark for one student on one assignment.
 *
 * One grade item per (assignment, student): amends the existing row rather
 * than adding a second, so the gradebook cell and the marking queue agree.
 * Works with or without a submission — a mark for work handed in on paper is
 * recorded the same way.
 */
export async function recordMark({ assignment, studentId, studentName, score, maxScore, comment, publish, rubric }) {
  const existing = await maybeOne(
    supabase
      .from('grade_items')
      .select('id')
      .eq('assignment_id', assignment.id)
      .eq('student_id', studentId)
      .eq('is_template', false)
      .limit(1),
    'gradebook.recordMark/find',
  );
  const max = maxScore ?? assignment.max_score ?? null;
  const row = {
    school_id: assignment.school_id,
    class_id: assignment.class_id,
    assignment_id: assignment.id,
    student_id: studentId,
    student_name: studentName,
    title: assignment.title,
    score: score ?? null,
    max_score: max,
    percentage: score != null && max ? Math.round((score / max) * 1000) / 10 : null,
    comment: comment ?? null,
    status: publish ? 'published' : 'draft',
    visible_to_student: !!publish,
    visible_to_parent: !!publish,
    is_template: false,
    grading_type: rubric?.length ? 'rubric' : 'simple',
    ...(rubric?.length ? {
      rubric_criteria: rubric.map((c) => ({ id: c.criterion_id, name: c.name, description: c.description, max_score: c.max_score })),
      criterion_scores: rubric.map((c) => ({ criterion_id: c.criterion_id, score: Number(c.score) || 0, feedback: c.feedback })),
    } : {}),
  };
  return existing ? update(existing.id, row) : create(row);
}

/**
 * A student's grades. Returns only what the caller is allowed to see, so a
 * student calling this gets their published grades and a teacher gets the lot.
 */
export function listForStudent(schoolId, studentId, { termId, classId } = {}) {
  let q = supabase
    .from('grade_items')
    .select(`${COLUMNS}, class:classes (id, name, subject_id)`)
    .eq('school_id', schoolId)
    .eq('student_id', studentId)
    .eq('is_template', false);
  if (termId) q = q.eq('term_id', termId);
  if (classId) q = q.eq('class_id', classId);
  return rows(q.order('created_at', { ascending: false }), 'gradebook.listForStudent');
}

export function create(gradeItem) {
  return one(supabase.from('grade_items').insert(gradeItem).select(COLUMNS), 'gradebook.create');
}

export function update(id, patch) {
  return one(
    supabase.from('grade_items').update(patch).eq('id', id).select(COLUMNS),
    'gradebook.update',
  );
}

export function remove(id) {
  return none(supabase.from('grade_items').delete().eq('id', id), 'gradebook.remove');
}

/** Enter or amend several grades at once — the gradebook grid saves in bulk. */
export function upsertMany(gradeItems) {
  if (!gradeItems?.length) return Promise.resolve([]);
  return rows(
    supabase.from('grade_items').upsert(gradeItems).select(COLUMNS),
    'gradebook.upsertMany',
  );
}

/**
 * Publish or unpublish a set of grades.
 *
 * Kept as its own function rather than a generic update because it changes who
 * can read the rows. Making that explicit at the call site is the point.
 */
export function setVisibility(ids, { toStudent, toParent }) {
  if (!ids?.length) return Promise.resolve([]);
  const patch = {};
  if (toStudent !== undefined) patch.visible_to_student = toStudent;
  if (toParent !== undefined) patch.visible_to_parent = toParent;
  return rows(
    supabase.from('grade_items').update(patch).in('id', ids).select('id, visible_to_student, visible_to_parent'),
    'gradebook.setVisibility',
  );
}

/** Predicted IB grades — same visibility rules as grade items. */
const PREDICTED_COLUMNS = `
  id, school_id, student_id, student_name, class_id, class_name, subject_id, subject_name,
  teacher_id, teacher_name, predicted_ib_grade, confidence_level, rationale,
  academic_year_id, term_id, entry_date, visible_to_student, visible_to_parent,
  coordinator_notes, created_at
`;

export function listPredicted(schoolId, { studentId, classId, academicYearId } = {}) {
  let q = supabase.from('predicted_grades').select(PREDICTED_COLUMNS).eq('school_id', schoolId);
  if (studentId) q = q.eq('student_id', studentId);
  if (classId) q = q.eq('class_id', classId);
  if (academicYearId) q = q.eq('academic_year_id', academicYearId);
  return rows(q.order('entry_date', { ascending: false }), 'gradebook.listPredicted');
}

export function createPredicted(row) {
  return one(
    supabase.from('predicted_grades').insert(row).select(PREDICTED_COLUMNS),
    'gradebook.createPredicted',
  );
}

export function updatePredicted(id, patch) {
  return one(
    supabase.from('predicted_grades').update(patch).eq('id', id).select(PREDICTED_COLUMNS),
    'gradebook.updatePredicted',
  );
}

/** Equality filters over grade_items. See the note on generic `where` helpers. */
export function whereGradeItems(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('grade_items').select(COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'gradebook.whereGradeItems');
}

/** Equality filters over predicted_grades. See the note on generic `where` helpers. */
export function wherePredictedGrades(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('predicted_grades').select(PREDICTED_COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'gradebook.wherePredictedGrades');
}
