import { fromRequest, hasSchoolRole, isSuperAdmin } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, forbidden, badRequest } from '../_shared/http.ts';

/**
 * Remove someone from a school.
 *
 * base44 worked out the caller's authority from four different places
 * (`user.role`, `user.intended_role`, `user.data.role`,
 * `user.data.intended_role`) and accepted admin from any of them, because its
 * platform only had `admin`/`user` natively. Roles now live in exactly two
 * places — `profiles.role` for the platform, `school_memberships.role` per
 * school — so this asks one question.
 */
Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);

    const { membershipId } = await readJsonBody<{ membershipId?: string }>(req);
    if (!membershipId) return badRequest(req, '`membershipId` is required.');

    // Service role: the caller may legitimately manage a membership their own
    // RLS view wouldn't return (e.g. an inactive one).
    const { data: target, error } = await caller.admin
      .from('school_memberships')
      .select('id, user_id, school_id, role')
      .eq('id', membershipId)
      .maybeSingle();

    if (error) return json(req, { error: error.message }, 500);
    if (!target) return json(req, { error: 'That membership no longer exists.' }, 404);

    const allowed =
      isSuperAdmin(caller) ||
      (await hasSchoolRole(caller, target.school_id, ['school_admin', 'ib_coordinator']));
    if (!allowed) {
      return forbidden(req, 'You need to be an admin of this school to remove its members.');
    }

    // Removing yourself would silently strip your own access; refuse it.
    if (target.user_id === caller.user.id) {
      return badRequest(req, 'You cannot remove your own membership.');
    }

    // Only a super admin may remove a school admin, so one admin can't lock out
    // another during a disagreement.
    if (target.role === 'school_admin' && !isSuperAdmin(caller)) {
      return forbidden(req, 'Only a super admin can remove a school admin.');
    }

    const { error: deleteError } = await caller.admin
      .from('school_memberships')
      .delete()
      .eq('id', membershipId);
    if (deleteError) return json(req, { error: deleteError.message }, 500);

    // If that was their active school, clear the pointer — otherwise they land
    // on a school they can no longer see.
    await caller.admin
      .from('profiles')
      .update({ active_school_id: null })
      .eq('id', target.user_id)
      .eq('active_school_id', target.school_id);

    await caller.admin.from('audit_logs').insert({
      school_id: target.school_id,
      user_id: caller.user.id,
      user_email: caller.user.email,
      action: 'membership.removed',
      entity_type: 'school_membership',
      entity_id: membershipId,
      details: { removed_user_id: target.user_id, role: target.role },
      level: 'warning',
    });

    return json(req, { success: true, removed: membershipId });
  }),
);
