import { fromRequest, hasSchoolRole, isSuperAdmin } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, forbidden, badRequest } from '../_shared/http.ts';

/**
 * Change a user's details or their role at a school.
 *
 * base44 only supported `admin`/`user` natively, so it stored the real role in
 * an `intended_role` field on the user and every caller had to know to look
 * there. That indirection is gone: the platform role is `profiles.role` and the
 * per-school role is `school_memberships.role`.
 *
 * Deliberately split by authority — a school admin may change someone's role
 * *within their school*, but only a super admin can touch `profiles.role`,
 * which is what grants platform-wide access.
 */

const SCHOOL_ROLES = ['school_admin', 'ib_coordinator', 'teacher', 'student', 'parent'];
const PLATFORM_ROLES = [...SCHOOL_ROLES, 'super_admin', 'user'];

interface Payload {
  userId?: string;
  schoolId?: string;
  role?: string;
  platformRole?: string;
  fullName?: string;
  displayName?: string;
  phone?: string;
  gradeLevel?: string;
  department?: string;
  status?: string;
}

Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);

    const body = await readJsonBody<Payload>(req);
    const { userId, schoolId } = body;
    if (!userId) return badRequest(req, '`userId` is required.');

    const superAdmin = isSuperAdmin(caller);

    // ── platform role: super admin only ───────────────────────────────────
    if (body.platformRole !== undefined) {
      if (!superAdmin) {
        return forbidden(req, 'Only a super admin can change a platform role.');
      }
      if (!PLATFORM_ROLES.includes(body.platformRole)) {
        return badRequest(req, `"${body.platformRole}" is not a valid role.`);
      }
      if (userId === caller.user.id && body.platformRole !== 'super_admin') {
        return badRequest(req, 'You cannot demote yourself.');
      }
      const { error } = await caller.admin
        .from('profiles')
        .update({ role: body.platformRole })
        .eq('id', userId);
      if (error) return json(req, { error: error.message }, 500);
    }

    // ── profile details: the person themselves, or an admin of their school ─
    const profilePatch: Record<string, unknown> = {};
    if (body.fullName !== undefined) profilePatch.full_name = body.fullName;
    if (body.displayName !== undefined) profilePatch.display_name = body.displayName;
    if (body.phone !== undefined) profilePatch.phone = body.phone;

    if (Object.keys(profilePatch).length) {
      const mayEdit =
        superAdmin ||
        userId === caller.user.id ||
        (schoolId && (await hasSchoolRole(caller, schoolId, ['school_admin', 'ib_coordinator'])));
      if (!mayEdit) return forbidden(req, "You cannot edit this person's details.");

      const { error } = await caller.admin.from('profiles').update(profilePatch).eq('id', userId);
      if (error) return json(req, { error: error.message }, 500);
    }

    // ── school role and membership fields ─────────────────────────────────
    const membershipPatch: Record<string, unknown> = {};
    if (body.role !== undefined) membershipPatch.role = body.role;
    if (body.gradeLevel !== undefined) membershipPatch.grade_level = body.gradeLevel;
    if (body.department !== undefined) membershipPatch.department = body.department;
    if (body.status !== undefined) membershipPatch.status = body.status;

    if (Object.keys(membershipPatch).length) {
      if (!schoolId) return badRequest(req, '`schoolId` is required to change a school role.');
      if (body.role !== undefined && !SCHOOL_ROLES.includes(body.role)) {
        return badRequest(req, `"${body.role}" is not a valid school role.`);
      }

      const mayManage =
        superAdmin || (await hasSchoolRole(caller, schoolId, ['school_admin', 'ib_coordinator']));
      if (!mayManage) {
        return forbidden(req, 'You need to be an admin of this school.');
      }
      // Promoting someone to school_admin is how you hand over the school.
      if (body.role === 'school_admin' && !superAdmin) {
        const isSchoolAdmin = await hasSchoolRole(caller, schoolId, ['school_admin']);
        if (!isSchoolAdmin) {
          return forbidden(req, 'Only a school admin can appoint another school admin.');
        }
      }

      const { error } = await caller.admin
        .from('school_memberships')
        .update(membershipPatch)
        .eq('user_id', userId)
        .eq('school_id', schoolId);
      if (error) return json(req, { error: error.message }, 500);
    }

    await caller.admin.from('audit_logs').insert({
      school_id: schoolId ?? null,
      user_id: caller.user.id,
      user_email: caller.user.email,
      action: 'user.updated',
      entity_type: 'user',
      entity_id: userId,
      details: { ...body, userId: undefined },
      level: 'info',
    });

    const { data: profile } = await caller.admin
      .from('profiles')
      .select('id, email, full_name, display_name, role, phone')
      .eq('id', userId)
      .maybeSingle();

    return json(req, { success: true, user: profile });
  }),
);
