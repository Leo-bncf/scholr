import { fromRequest, isSuperAdmin } from '../_shared/client.ts';
import { handler, json, forbidden } from '../_shared/http.ts';

/**
 * Every user on the platform, for the super-admin directory.
 *
 * Needs the service role: profiles RLS deliberately only exposes people you
 * share a school with, so there is no way to enumerate the platform from the
 * browser. That restriction is the point — this function is the one sanctioned
 * exception, and it checks the caller first.
 */
Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);

    if (!isSuperAdmin(caller)) {
      return forbidden(req, 'Only super admins can list all users.');
    }

    const { data: users, error } = await caller.admin
      .from('profiles')
      .select('id, email, full_name, display_name, role, active_school_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10000);

    if (error) return json(req, { error: error.message }, 500);

    // A user's effective school is their active membership if they have one,
    // falling back to active_school_id. base44 did this join client-side over
    // two full table fetches; one query with a filter is enough.
    const { data: memberships } = await caller.admin
      .from('school_memberships')
      .select('user_id, school_id, role, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    const byUser = new Map<string, { school_id: string; role: string }>();
    for (const m of memberships ?? []) {
      if (!byUser.has(m.user_id)) byUser.set(m.user_id, m);
    }

    const enriched = (users ?? []).map((u) => {
      const membership = byUser.get(u.id);
      return {
        id: u.id,
        email: u.email,
        full_name: u.full_name ?? u.display_name,
        // The school-level role is the meaningful one; the profile role is the
        // platform default and is only interesting for super admins.
        role: membership?.role ?? u.role,
        created_at: u.created_at,
        active_school_id: membership?.school_id ?? u.active_school_id ?? null,
      };
    });

    return json(req, { count: enriched.length, users: enriched });
  }),
);
