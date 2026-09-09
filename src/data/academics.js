import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one, none } from './_query';

/**
 * The academic skeleton a school hangs everything else on: subjects, academic
 * years, terms and cohorts. Grouped in one module because they're almost always
 * loaded together (the academic-setup screens, and any dashboard that needs the
 * current year).
 */

// ── Subjects ────────────────────────────────────────────────────────────────

const SUBJECT_COLUMNS = 'id, school_id, name, code, ib_group, level, status, created_at';

export function listSubjects(schoolId, { status = 'active' } = {}) {
  let q = supabase.from('subjects').select(SUBJECT_COLUMNS).eq('school_id', schoolId);
  if (status) q = q.eq('status', status);
  return rows(q.order('name'), 'academics.listSubjects');
}

export function getSubject(id) {
  return maybeOne(supabase.from('subjects').select(SUBJECT_COLUMNS).eq('id', id), 'academics.getSubject');
}

export function createSubject(subject) {
  return one(supabase.from('subjects').insert(subject).select(SUBJECT_COLUMNS), 'academics.createSubject');
}

export function updateSubject(id, patch) {
  return one(
    supabase.from('subjects').update(patch).eq('id', id).select(SUBJECT_COLUMNS),
    'academics.updateSubject',
  );
}

export function removeSubject(id) {
  return none(supabase.from('subjects').delete().eq('id', id), 'academics.removeSubject');
}

// ── Academic years ──────────────────────────────────────────────────────────

const YEAR_COLUMNS = 'id, school_id, name, start_date, end_date, is_current, status, created_at';

export function listAcademicYears(schoolId) {
  return rows(
    supabase
      .from('academic_years')
      .select(YEAR_COLUMNS)
      .eq('school_id', schoolId)
      .order('start_date', { ascending: false }),
    'academics.listAcademicYears',
  );
}

/**
 * The school's current academic year.
 *
 * Falls back to the most recent one if nothing is flagged `is_current` — a
 * school that hasn't run the rollover yet should still see a sensible year
 * rather than an empty dashboard.
 */
export async function getCurrentAcademicYear(schoolId) {
  const flagged = await maybeOne(
    supabase
      .from('academic_years')
      .select(YEAR_COLUMNS)
      .eq('school_id', schoolId)
      .eq('is_current', true)
      .limit(1),
    'academics.getCurrentAcademicYear',
  );
  if (flagged) return flagged;

  const all = await listAcademicYears(schoolId);
  return all[0] ?? null;
}

export function createAcademicYear(year) {
  return one(
    supabase.from('academic_years').insert(year).select(YEAR_COLUMNS),
    'academics.createAcademicYear',
  );
}

export function updateAcademicYear(id, patch) {
  return one(
    supabase.from('academic_years').update(patch).eq('id', id).select(YEAR_COLUMNS),
    'academics.updateAcademicYear',
  );
}

/**
 * Mark one year current, clearing the flag on the others.
 *
 * Two statements rather than one, so a failure between them can leave no year
 * flagged. `getCurrentAcademicYear` falls back to the newest year, which keeps
 * the app usable until it's retried.
 */
export async function setCurrentAcademicYear(schoolId, yearId) {
  await none(
    supabase
      .from('academic_years')
      .update({ is_current: false })
      .eq('school_id', schoolId)
      .neq('id', yearId),
    'academics.setCurrentAcademicYear/clear',
  );
  return updateAcademicYear(yearId, { is_current: true });
}

// ── Terms ───────────────────────────────────────────────────────────────────

const TERM_COLUMNS = 'id, school_id, academic_year_id, name, start_date, end_date, is_current, created_at';

export function listTerms(schoolId, { academicYearId } = {}) {
  let q = supabase.from('terms').select(TERM_COLUMNS).eq('school_id', schoolId);
  if (academicYearId) q = q.eq('academic_year_id', academicYearId);
  return rows(q.order('start_date'), 'academics.listTerms');
}

export function getCurrentTerm(schoolId) {
  return maybeOne(
    supabase
      .from('terms')
      .select(TERM_COLUMNS)
      .eq('school_id', schoolId)
      .eq('is_current', true)
      .limit(1),
    'academics.getCurrentTerm',
  );
}

export function createTerm(term) {
  return one(supabase.from('terms').insert(term).select(TERM_COLUMNS), 'academics.createTerm');
}

export function updateTerm(id, patch) {
  return one(
    supabase.from('terms').update(patch).eq('id', id).select(TERM_COLUMNS),
    'academics.updateTerm',
  );
}

export function removeTerm(id) {
  return none(supabase.from('terms').delete().eq('id', id), 'academics.removeTerm');
}

// ── Cohorts ─────────────────────────────────────────────────────────────────

const COHORT_COLUMNS =
  'id, school_id, name, type, academic_year_id, student_ids, description, color, status, created_at';

export function listCohorts(schoolId, { academicYearId, status = 'active' } = {}) {
  let q = supabase.from('cohorts').select(COHORT_COLUMNS).eq('school_id', schoolId);
  if (academicYearId) q = q.eq('academic_year_id', academicYearId);
  if (status) q = q.eq('status', status);
  return rows(q.order('name'), 'academics.listCohorts');
}

export function listCohortsForStudent(schoolId, studentId) {
  return rows(
    supabase
      .from('cohorts')
      .select(COHORT_COLUMNS)
      .eq('school_id', schoolId)
      .contains('student_ids', [studentId]),
    'academics.listCohortsForStudent',
  );
}

export function createCohort(cohort) {
  return one(supabase.from('cohorts').insert(cohort).select(COHORT_COLUMNS), 'academics.createCohort');
}

export function updateCohort(id, patch) {
  return one(
    supabase.from('cohorts').update(patch).eq('id', id).select(COHORT_COLUMNS),
    'academics.updateCohort',
  );
}

export function removeCohort(id) {
  return none(supabase.from('cohorts').delete().eq('id', id), 'academics.removeCohort');
}

/** Equality filters over subjects. See the note on generic `where` helpers. */
export function whereSubjects(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('subjects').select(SUBJECT_COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'academics.whereSubjects');
}

/** Equality filters over academic_years. See the note on generic `where` helpers. */
export function whereAcademicYears(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('academic_years').select(YEAR_COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'academics.whereAcademicYears');
}

/** Equality filters over terms. See the note on generic `where` helpers. */
export function whereTerms(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('terms').select(TERM_COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'academics.whereTerms');
}

/** Equality filters over cohorts. See the note on generic `where` helpers. */
export function whereCohorts(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('cohorts').select(COHORT_COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'academics.whereCohorts');
}

export function removeAcademicYear(id) {
  return none(supabase.from('academic_years').delete().eq('id', id), 'academics.removeAcademicYear');
}
