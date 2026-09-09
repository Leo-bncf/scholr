import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local.',
  );
}

/**
 * The one Supabase client for the app.
 *
 * The anon key is safe in the bundle — it only grants the `anon` Postgres role.
 * Every table has RLS enabled, so what a signed-in user can actually read or
 * write is decided by their JWT against the policies in
 * supabase/migrations/0003_rls.sql, not by anything in this file.
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
