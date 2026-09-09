import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one } from './_query';

/**
 * Other people's profiles.
 *
 * base44 had a single `User` entity covering identity and app data. Here
 * identity lives in `auth.users` (GoTrue, not readable from the browser) and
 * app data in `public.profiles`. This module is the readable half.
 *
 * Visibility comes from RLS: you can see yourself, and anyone you share an
 * active school with. There is no way to enumerate the whole platform from the
 * client — that needs the service role, i.e. an edge function.
 *
 * For the *current* user, use src/data/session.js instead.
 */

const COLUMNS = 'id, email, full_name, display_name, role, active_school_id, phone, avatar_url';

export function get(id) {
  return maybeOne(supabase.from('profiles').select(COLUMNS).eq('id', id), 'users.get');
}

export function getMany(ids) {
  if (!ids?.length) return Promise.resolve([]);
  return rows(supabase.from('profiles').select(COLUMNS).in('id', ids), 'users.getMany');
}

export function findByEmail(email) {
  return maybeOne(
    supabase.from('profiles').select(COLUMNS).ilike('email', email),
    'users.findByEmail',
  );
}

/** Equality filters over visible profiles. */
export function where(filters = {}, { order = 'full_name', ascending = true, limit } = {}) {
  let q = supabase.from('profiles').select(COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'users.where');
}

/**
 * Update someone else's profile.
 *
 * Only a super admin can do this — the `guard_profile_privileges` trigger
 * blocks role changes by anyone else, and RLS blocks the write entirely unless
 * you own the row or are a super admin. Changing another user's role from the
 * browser is deliberately not possible for school admins; that belongs in an
 * edge function with the service role.
 */
export function update(id, patch) {
  return one(supabase.from('profiles').update(patch).eq('id', id).select(COLUMNS), 'users.update');
}
