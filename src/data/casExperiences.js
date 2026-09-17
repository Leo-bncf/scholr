import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one, none, raise } from './_query';

/**
 * cas_experiences
 *
 * Promoted to hand-written in scripts/gen-data-modules.mjs: this file now
 * carries school-level aggregates (via an RPC) and a limited "recently
 * completed" list instead of shipping every experience into the browser.
 *
 * RLS decides what a caller can see; these functions do not re-check roles.
 */

const COLUMNS = 'id, school_id, student_id, student_name, title, description, cas_strands, learning_outcomes, start_date, end_date, status, hours, evidence_urls, reflection, supervisor_name, supervisor_email, coordinator_feedback, coordinator_approved_by, coordinator_approved_at, created_at';

/** Everything in a school. */
export function listForSchool(schoolId) {
  return rows(
    supabase.from('cas_experiences').select(COLUMNS).eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
    'casExperiences.listForSchool',
  );
}

/**
 * The numbers on the IB Core overview, computed in Postgres.
 *
 * total / approved / pending and the strand counts used to come from filtering
 * the full CAS table in the browser. See
 * supabase/migrations/0015_bounded_reads.sql.
 */
export async function summaryForSchool(schoolId) {
  const { data, error } = await supabase.rpc('cas_school_summary', {
    p_school_id: schoolId,
  });
  if (error) raise(error, 'casExperiences.summaryForSchool');
  return data?.[0] ?? null;
}

/** The most recent completed experiences awaiting approval. */
export function listRecentlyCompleted(schoolId, { limit = 10 } = {}) {
  return rows(
    supabase
      .from('cas_experiences')
      .select(COLUMNS)
      .eq('school_id', schoolId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit),
    'casExperiences.listRecentlyCompleted',
  );
}

export function get(id) {
  return maybeOne(supabase.from('cas_experiences').select(COLUMNS).eq('id', id), 'casExperiences.get');
}

/**
 * Equality filters, for call sites that don't have a named query yet.
 *
 * `where({ school_id, status })` maps each key to `.eq()`; an array value
 * becomes `.in()` and null becomes `.is(null)`. Prefer adding a named
 * function above when the same filter shows up more than once.
 */
export function where(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('cas_experiences').select(COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'casExperiences.where');
}

export function create(record) {
  return one(supabase.from('cas_experiences').insert(record).select(COLUMNS), 'casExperiences.create');
}

export function update(id, patch) {
  return one(
    supabase.from('cas_experiences').update(patch).eq('id', id).select(COLUMNS),
    'casExperiences.update',
  );
}

export function remove(id) {
  return none(supabase.from('cas_experiences').delete().eq('id', id), 'casExperiences.remove');
}
