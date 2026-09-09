import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one, none, count } from './_query';

/**
 * Schools — the tenant root.
 *
 * RLS means a normal user only ever sees schools they're a member of, so
 * `list()` needs no school filter of its own: the policy is the filter. Super
 * admins see everything through the same call.
 */

const COLUMNS = `
  id, name, slug, country, city, address, email, phone, logo_url,
  curriculum, plan, status, max_students, max_users, modules_enabled,
  academic_year_start_month, timezone, billing_status, billing_email,
  trial_end_date, subscription_current_period_end, subscription_cancel_at_period_end,
  stripe_customer_id, stripe_subscription_id, created_at
`;

export function get(schoolId) {
  return maybeOne(supabase.from('schools').select(COLUMNS).eq('id', schoolId), 'schools.get');
}

/** Schools visible to the caller. Super admins get all of them. */
export function list() {
  return rows(supabase.from('schools').select(COLUMNS).order('name'), 'schools.list');
}

export function create(school) {
  return one(supabase.from('schools').insert(school).select(COLUMNS), 'schools.create');
}

export function update(schoolId, patch) {
  return one(
    supabase.from('schools').update(patch).eq('id', schoolId).select(COLUMNS),
    'schools.update',
  );
}

/**
 * Headline counts for a school dashboard, resolved server-side.
 *
 * `head: true` with an exact count returns only the number — no rows cross the
 * wire. The old code fetched whole tables and called `.length`, which is what
 * made big schools slow.
 */
function countIn(table, schoolId, extra = (q) => q) {
  return count(
    extra(supabase.from(table).select('id', { count: 'exact', head: true }).eq('school_id', schoolId)),
    `schools.count/${table}`,
  );
}

export async function getCounts(schoolId) {
  const [students, teachers, classes, subjects] = await Promise.all([
    countIn('school_memberships', schoolId, (q) => q.eq('role', 'student').eq('status', 'active')),
    countIn('school_memberships', schoolId, (q) => q.eq('role', 'teacher').eq('status', 'active')),
    countIn('classes', schoolId, (q) => q.eq('status', 'active')),
    countIn('subjects', schoolId),
  ]);

  return { students, teachers, classes, subjects };
}

/**
 * Counts behind the onboarding checklist ("have you set up years, terms,
 * subjects, classes, staff?").
 *
 * Five head-only counts in parallel. The version this replaces fetched all five
 * tables in full purely to read `.length`, which for a large school meant
 * pulling thousands of rows to render five numbers.
 */
export async function getSetupMetrics(schoolId) {
  const [academicYears, terms, subjects, classes, members] = await Promise.all([
    countIn('academic_years', schoolId),
    countIn('terms', schoolId),
    countIn('subjects', schoolId),
    countIn('classes', schoolId),
    countIn('school_memberships', schoolId),
  ]);

  const done = [academicYears, terms, subjects, classes].filter((n) => n > 0).length
    + (members > 1 ? 1 : 0);

  return {
    academicYears,
    terms,
    subjects,
    classes,
    // The school's own admin is a member too, so staff excludes them.
    staff: Math.max(0, members - 1),
    setupProgress: { completed: done, total: 5 },
  };
}

/**
 * Equality filters, for call sites migrated mechanically from base44's
 * `.filter({...})`. Prefer a named query above when you touch one of these.
 */
export function where(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('schools').select(COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'schools.where');
}

export function remove(id) {
  return none(supabase.from('schools').delete().eq('id', id), 'schools.remove');
}
