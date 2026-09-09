import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import * as jose from 'jsr:@panva/jose@6';

/**
 * The equivalent of base44's `createClientFromRequest(req)`.
 *
 * base44 handed you one object with `base44.entities` (acting as the caller)
 * and `base44.asServiceRole.entities` (bypassing all rules). The same split
 * exists here, but it's explicit:
 *
 *   `supabase` — carries the caller's JWT, so RLS applies exactly as it does
 *                in the browser. Use this by default.
 *   `admin`    — service role, bypasses RLS entirely. Use only after you have
 *                checked the caller is allowed to do the thing.
 *
 * Reaching for `admin` because a query returned nothing is almost always a bug:
 * it usually means RLS was right and the caller shouldn't see those rows.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? 'http://api-gw:8000';
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET = new TextEncoder().encode(Deno.env.get('JWT_SECRET')!);

export interface Caller {
  /** The signed-in user's profile row merged with their auth identity. */
  user: {
    id: string;
    email: string | null;
    role: string;
    active_school_id: string | null;
    full_name?: string | null;
  } | null;
  /** Acts as the caller. RLS applies. */
  supabase: SupabaseClient;
  /** Bypasses RLS. Authorise before using. */
  admin: SupabaseClient;
}

/** Service-role client with no caller attached, for unauthenticated handlers. */
export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Build the clients for a request and resolve who is calling.
 *
 * `user` is null when there's no valid Authorization header — handlers should
 * check it and return 401 rather than assuming.
 */
export async function fromRequest(req: Request): Promise<Caller> {
  const authHeader = req.headers.get('Authorization') ?? '';

  const supabase = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const admin = serviceClient();

  if (!authHeader.startsWith('Bearer ')) {
    return { user: null, supabase, admin };
  }

  // Verify the JWT locally against the project secret rather than calling
  // GoTrue's /user endpoint.
  //
  // Two reasons. It removes a network round-trip from every single function
  // call; and /user requires a live GoTrue *session*, so it rejects any
  // correctly-signed token that didn't come from an interactive login —
  // which makes server-to-server calls and automated testing impossible.
  // PostgREST validates the same way, so this is consistent with how RLS
  // already decides who you are.
  let sub: string;
  let tokenEmail: string | null = null;
  try {
    const { payload } = await jose.jwtVerify(authHeader.slice(7).trim(), JWT_SECRET);
    if (!payload.sub) return { user: null, supabase, admin };
    sub = payload.sub;
    tokenEmail = (payload.email as string) ?? null;
  } catch {
    // Bad signature, expired, malformed — all mean "not signed in".
    return { user: null, supabase, admin };
  }

  // The profile carries role and active_school_id, which base44 folded into
  // auth.me(). Read it with the service role: a handler needs the caller's own
  // role to authorise them, and profiles RLS would let them see it anyway.
  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, full_name, role, active_school_id')
    .eq('id', sub)
    .maybeSingle();

  return {
    user: {
      id: sub,
      email: profile?.email ?? tokenEmail,
      role: profile?.role ?? 'user',
      active_school_id: profile?.active_school_id ?? null,
      full_name: profile?.full_name ?? null,
    },
    supabase,
    admin,
  };
}

/** True when the caller is a platform super admin. */
export function isSuperAdmin(caller: Caller): boolean {
  return caller.user?.role === 'super_admin';
}

/**
 * Whether the caller holds one of `roles` at `schoolId`.
 *
 * Checked against school_memberships with the service role, so it gives the
 * true answer regardless of what the caller can see.
 */
export async function hasSchoolRole(
  caller: Caller,
  schoolId: string,
  roles: string[],
): Promise<boolean> {
  if (!caller.user || !schoolId) return false;
  if (isSuperAdmin(caller)) return true;

  const { data } = await caller.admin
    .from('school_memberships')
    .select('role')
    .eq('user_id', caller.user.id)
    .eq('school_id', schoolId)
    .eq('status', 'active')
    .maybeSingle();

  return !!data && roles.includes(data.role);
}

/** Whether the caller belongs to the school at all. */
export async function isMemberOf(caller: Caller, schoolId: string): Promise<boolean> {
  if (!caller.user || !schoolId) return false;
  if (isSuperAdmin(caller)) return true;

  const { count } = await caller.admin
    .from('school_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', caller.user.id)
    .eq('school_id', schoolId)
    .eq('status', 'active');

  return (count ?? 0) > 0;
}
