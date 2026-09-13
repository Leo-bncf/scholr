import { supabase } from '@/lib/supabase';
import { none, rows } from './_query';

/**
 * Demo requests — the public "book a demo" form.
 *
 * base44 had no RLS on this entity at all, so anyone authenticated could read
 * every lead. The policy now lets anyone INSERT (it's a public form) but only
 * super admins SELECT. See 0003_rls.sql.
 */

const COLUMNS = 'id, school_name, contact_name, email, phone, country, school_size, message, created_at';

/**
 * Submit a demo request. Callable while signed out.
 *
 * Deliberately NO `.select()`. `anon` may insert but has no SELECT policy, and
 * PostgREST evaluates `return=representation` as insert AND select — so asking
 * for the row back made the whole statement fail the RLS check and return 401
 * with nothing written. Verified against production: with `.select()` the API
 * answers 401 and drops the row; without it, 201.
 *
 * That meant every demo request submitted by a signed-out visitor — which is
 * all of them — was rejected, and the visitor was shown an error. Do not add a
 * `.select()` here unless `anon` also gains a SELECT policy, which it should
 * not: leads are readable by super admins alone.
 */
export function create(request) {
  return none(supabase.from('demo_requests').insert(request), 'demoRequests.create');
}

/** Super admin only — RLS returns nothing for anyone else. */
export function list() {
  return rows(
    supabase.from('demo_requests').select(COLUMNS).order('created_at', { ascending: false }),
    'demoRequests.list',
  );
}
