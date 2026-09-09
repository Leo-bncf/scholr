import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one, none } from './_query';

/**
 * School membership — who belongs to which school, in what role.
 *
 * This is the tenancy table: every RLS policy in the app resolves through
 * `is_member_of(school_id)` / `has_school_role(school_id, roles)`, both of
 * which read from here. Treat it as security-relevant, not as ordinary data.
 */

const COLUMNS =
  'id, user_id, school_id, role, status, grade_level, department, permissions, user_email, user_name';

/** Every active membership for a user, newest first. */
export function listActiveForUser(userId) {
  return rows(
    supabase
      .from('school_memberships')
      .select(COLUMNS)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    'memberships.listActiveForUser',
  );
}

/**
 * The membership a user should be acting under.
 *
 * Prefers their `active_school_id`, falling back to the first active
 * membership — matching the behaviour the app already relied on, but resolved
 * in one place instead of at every call site.
 */
export async function resolveActive(userId, activeSchoolId) {
  const memberships = await listActiveForUser(userId);
  if (memberships.length === 0) return null;
  if (!activeSchoolId) return memberships[0];
  return memberships.find((m) => m.school_id === activeSchoolId) ?? memberships[0];
}

/**
 * Everyone in a school, optionally filtered by role.
 *
 * Joins the profile in a single round trip. base44 needed two calls plus a
 * client-side merge for this.
 */
export function listForSchool(schoolId, { roles, status = 'active' } = {}) {
  let q = supabase
    .from('school_memberships')
    .select(`${COLUMNS}, profile:profiles!school_memberships_user_id_fkey (id, email, full_name, display_name, avatar_url)`)
    .eq('school_id', schoolId);

  if (status) q = q.eq('status', status);
  if (roles?.length) q = q.in('role', roles);

  return rows(q.order('role').order('user_name'), 'memberships.listForSchool');
}

/** Students in a school — the most common roster query. */
export function listStudents(schoolId, { gradeLevel } = {}) {
  let q = supabase
    .from('school_memberships')
    .select(`${COLUMNS}, profile:profiles!school_memberships_user_id_fkey (id, email, full_name, display_name, avatar_url)`)
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .eq('role', 'student');

  if (gradeLevel) q = q.eq('grade_level', gradeLevel);
  return rows(q.order('user_name'), 'memberships.listStudents');
}

export function get(id) {
  return maybeOne(
    supabase.from('school_memberships').select(COLUMNS).eq('id', id),
    'memberships.get',
  );
}

export function create(membership) {
  return one(
    supabase.from('school_memberships').insert(membership).select(COLUMNS),
    'memberships.create',
  );
}

export function update(id, patch) {
  return one(
    supabase.from('school_memberships').update(patch).eq('id', id).select(COLUMNS),
    'memberships.update',
  );
}

export function remove(id) {
  return none(supabase.from('school_memberships').delete().eq('id', id), 'memberships.remove');
}

/**
 * Equality filters, for call sites migrated mechanically from base44's
 * `.filter({...})`. Prefer a named query above when you touch one of these.
 */
export function where(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('school_memberships').select(COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'memberships.where');
}
