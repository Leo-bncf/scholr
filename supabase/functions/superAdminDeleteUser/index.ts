import { fromRequest, isSuperAdmin } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, forbidden, badRequest } from '../_shared/http.ts';

/**
 * Delete a user account outright. Super admins only.
 *
 * Deleting `auth.users` cascades to `profiles` (FK on delete cascade), but
 * `school_memberships.user_id` references profiles with ON DELETE RESTRICT —
 * deliberately, so a user can't be erased while still rostered somewhere. Those
 * memberships are therefore removed first, in order.
 *
 * Records that reference the user for provenance (audit logs, grades they
 * created) use ON DELETE SET NULL and survive, which is what you want: deleting
 * a teacher must not delete their students' grades.
 */
Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);
    if (!isSuperAdmin(caller)) {
      return forbidden(req, 'Only super admins can delete user accounts.');
    }

    const { userId } = await readJsonBody<{ userId?: string }>(req);
    if (!userId) return badRequest(req, '`userId` is required.');
    if (userId === caller.user.id) {
      return badRequest(req, 'You cannot delete your own account.');
    }

    const { data: target } = await caller.admin
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .maybeSingle();
    if (!target) return json(req, { error: 'No such user.' }, 404);

    // Deleting the last super admin would lock everyone out of platform admin.
    if (target.role === 'super_admin') {
      const { count } = await caller.admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin');
      if ((count ?? 0) <= 1) {
        return badRequest(req, 'This is the only super admin — promote someone else first.');
      }
    }

    const { error: membershipError } = await caller.admin
      .from('school_memberships')
      .delete()
      .eq('user_id', userId);
    if (membershipError) return json(req, { error: membershipError.message }, 500);

    const { error: deleteError } = await caller.admin.auth.admin.deleteUser(userId);
    if (deleteError) return json(req, { error: deleteError.message }, 500);

    await caller.admin.from('audit_logs').insert({
      user_id: caller.user.id,
      user_email: caller.user.email,
      action: 'user.deleted',
      entity_type: 'user',
      entity_id: userId,
      details: { deleted_email: target.email, deleted_role: target.role },
      level: 'warning',
    });

    return json(req, { success: true, deleted: userId });
  }),
);
