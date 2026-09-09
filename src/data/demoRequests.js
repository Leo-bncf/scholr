import { supabase } from '@/lib/supabase';
import { rows, one } from './_query';

/**
 * Demo requests — the public "book a demo" form.
 *
 * base44 had no RLS on this entity at all, so anyone authenticated could read
 * every lead. The policy now lets anyone INSERT (it's a public form) but only
 * super admins SELECT. See 0003_rls.sql.
 */

const COLUMNS = 'id, school_name, contact_name, email, phone, country, school_size, message, created_at';

/** Submit a demo request. Callable while signed out. */
export function create(request) {
  return one(supabase.from('demo_requests').insert(request).select(COLUMNS), 'demoRequests.create');
}

/** Super admin only — RLS returns nothing for anyone else. */
export function list() {
  return rows(
    supabase.from('demo_requests').select(COLUMNS).order('created_at', { ascending: false }),
    'demoRequests.list',
  );
}
