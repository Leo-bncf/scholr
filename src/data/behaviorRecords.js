import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one, none, count, raise } from './_query';

/**
 * behavior_records
 *
 * Promoted to hand-written in scripts/gen-data-modules.mjs: this file now
 * carries named queries (date ranges, pastoral queues, counts) that push the
 * work into Postgres instead of fetching a school's whole behaviour log into
 * the browser.
 *
 * RLS decides what a caller can see; these functions do not re-check roles.
 */

const COLUMNS = 'id, school_id, student_id, student_name, class_id, recorded_by, recorded_by_name, type, incident_type_id, category, title, description, date, severity, visible_to_student, visible_to_parent, staff_only, action_taken, follow_up_required, follow_up_completed, follow_up_note, pastoral_reviewed, pastoral_reviewed_by, pastoral_reviewed_at, created_at';

/** Everything in a school. */
export function listForSchool(schoolId) {
  return rows(
    supabase.from('behavior_records').select(COLUMNS).eq('school_id', schoolId)
      .order('date', { ascending: false }),
    'behaviorRecords.listForSchool',
  );
}

/**
 * Records in a date window.
 *
 * The dashboard and export screens both filter on a user-chosen range; doing
 * that in Postgres keeps the transfer bounded by what the screen will show
 * instead of pulling the school's whole log every time. `date` is a DATE —
 * pass YYYY-MM-DD.
 */
export function listRange(schoolId, { from, to } = {}) {
  let q = supabase.from('behavior_records').select(COLUMNS).eq('school_id', schoolId);
  if (from) q = q.gte('date', from);
  if (to) q = q.lte('date', to);
  return rows(q.order('date', { ascending: false }), 'behaviorRecords.listRange');
}

/**
 * The working queues for the pastoral team: high/critical records still
 * awaiting sign-off, and follow-ups that were opened but not yet closed.
 *
 * Open work is inherently small — it is a queue someone is clearing — so this
 * `.or()` filter is the bound. The 'recently reviewed' tray is fetched
 * separately, with a limit, below.
 */
export function listPastoralQueue(schoolId) {
  return rows(
    supabase
      .from('behavior_records')
      .select(COLUMNS)
      .eq('school_id', schoolId)
      .or(
        'and(severity.in.(high,critical),pastoral_reviewed.is.false),' +
        'and(follow_up_required.is.true,follow_up_completed.is.false)',
      )
      .order('date', { ascending: false }),
    'behaviorRecords.listPastoralQueue',
  );
}

/** The most recent pastoral reviews, for the "recently reviewed" tray. */
export function listRecentlyReviewed(schoolId, { limit = 20 } = {}) {
  return rows(
    supabase
      .from('behavior_records')
      .select(COLUMNS)
      .eq('school_id', schoolId)
      .eq('pastoral_reviewed', true)
      .order('pastoral_reviewed_at', { ascending: false, nullsFirst: false })
      .limit(limit),
    'behaviorRecords.listRecentlyReviewed',
  );
}

/** Head-count of records, without transferring any rows. */
export function countForSchool(schoolId) {
  return count(
    supabase.from('behavior_records').select('id', { count: 'exact', head: true }).eq('school_id', schoolId),
    'behaviorRecords.countForSchool',
  );
}

/**
 * One row per (student, type) with how many records that student has.
 *
 * The analytics screen shows a total plus a four-way breakdown, filtered by
 * cohort. Summing these rows in the browser after filtering by student gives
 * exactly the old numbers — without shipping every behaviour record across.
 * See supabase/migrations/0015_bounded_reads.sql.
 */
export async function countsByStudentAndType(schoolId) {
  const { data, error } = await supabase.rpc('behavior_counts_by_student', {
    p_school_id: schoolId,
  });
  if (error) raise(error, 'behaviorRecords.countsByStudentAndType');
  return data || [];
}

/** The distinct categories in a school, for the filter dropdown. */
export async function listCategories(schoolId) {
  const { data, error } = await supabase.rpc('behavior_categories', {
    p_school_id: schoolId,
  });
  if (error) raise(error, 'behaviorRecords.listCategories');
  return (data || []).map((r) => r.category).filter(Boolean);
}

export function get(id) {
  return maybeOne(supabase.from('behavior_records').select(COLUMNS).eq('id', id), 'behaviorRecords.get');
}

/**
 * Equality filters, for call sites that don't have a named query yet.
 *
 * `where({ school_id, status })` maps each key to `.eq()`; an array value
 * becomes `.in()` and null becomes `.is(null)`. Prefer adding a named
 * function above when the same filter shows up more than once.
 */
export function where(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('behavior_records').select(COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'behaviorRecords.where');
}

export function create(record) {
  return one(supabase.from('behavior_records').insert(record).select(COLUMNS), 'behaviorRecords.create');
}

export function update(id, patch) {
  return one(
    supabase.from('behavior_records').update(patch).eq('id', id).select(COLUMNS),
    'behaviorRecords.update',
  );
}

export function remove(id) {
  return none(supabase.from('behavior_records').delete().eq('id', id), 'behaviorRecords.remove');
}
