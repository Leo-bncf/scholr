import { fromRequest, hasSchoolRole, isSuperAdmin } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, forbidden, badRequest } from '../_shared/http.ts';

/**
 * Invite somebody to a school.
 *
 * Two things happen: GoTrue sends the invitation email and creates the auth
 * user, and we record a UserInvitation so their role and school get applied
 * when they first sign in (acceptInvitation does that half).
 *
 * The base44 version authorised by checking a scattering of possible
 * school_id fields on the user object (`user.school_id`, `user.active_school_id`,
 * `user.data.school_id`, `user.data.data.school_id`) and accepted any of them.
 * Membership is now the single source of truth, so this asks one question:
 * are you an admin *at this school*.
 */

const APP_URL = Deno.env.get('SITE_URL') ?? 'https://scholr.pro';
const INVITE_ROLES = ['school_admin', 'ib_coordinator', 'teacher', 'student', 'parent'];

interface Payload {
  schoolId?: string;
  email?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  gradeLevel?: string;
  department?: string;
  customMessage?: string;
}

Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);

    const body = await readJsonBody<Payload>(req);
    const { schoolId, email, role } = body;

    if (!schoolId || !email || !role) {
      return badRequest(req, '`schoolId`, `email` and `role` are required.');
    }
    if (!INVITE_ROLES.includes(role)) {
      return badRequest(req, `"${role}" is not a role you can invite someone as.`);
    }

    const allowed =
      isSuperAdmin(caller) ||
      (await hasSchoolRole(caller, schoolId, ['school_admin', 'ib_coordinator']));
    if (!allowed) {
      return forbidden(req, 'You need to be an admin of this school to invite people to it.');
    }

    // Only a super admin may mint another school admin.
    if (role === 'school_admin' && !isSuperAdmin(caller)) {
      const isSchoolAdmin = await hasSchoolRole(caller, schoolId, ['school_admin']);
      if (!isSchoolAdmin) {
        return forbidden(req, 'Only a school admin can invite another school admin.');
      }
    }

    const normalisedEmail = email.trim().toLowerCase();

    // Don't invite someone who is already here.
    const { data: existing } = await caller.admin
      .from('school_memberships')
      .select('id, status')
      .eq('school_id', schoolId)
      .ilike('user_email', normalisedEmail)
      .maybeSingle();
    if (existing) {
      return badRequest(req, 'That person is already a member of this school.');
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { data: invitation, error: inviteError } = await caller.admin
      .from('user_invitations')
      .insert({
        school_id: schoolId,
        email: normalisedEmail,
        role,
        invited_by: caller.user.id,
        invited_by_name: caller.user.full_name ?? caller.user.email,
        status: 'pending',
        invitation_token: token,
        expires_at: expiresAt.toISOString(),
        metadata: {
          first_name: body.firstName,
          last_name: body.lastName,
          grade_level: body.gradeLevel,
          department: body.department,
          custom_message: body.customMessage,
        },
      })
      .select()
      .single();

    if (inviteError) return json(req, { error: inviteError.message }, 500);

    // Create the account up front, with no password.
    //
    // Two reasons this isn't left to inviteUserByEmail. First, that call
    // *sends* an email, so with SMTP unconfigured it fails with a 500 and the
    // account is never created — the invitation silently referred to nobody.
    // Second, and more importantly: signups are disabled, so "Continue with
    // Google" can only ever work for an address that already exists. Creating
    // the account here is what lets an invited teacher sign in with Google
    // without first setting a password.
    //
    // email_confirm is true because the school admin inviting them is the
    // verification — the same assertion base44 relied on.
    let accountCreated = false;
    const { error: createError } = await caller.admin.auth.admin.createUser({
      email: normalisedEmail,
      email_confirm: true,
      user_metadata: {
        full_name: [body.firstName, body.lastName].filter(Boolean).join(' ') || undefined,
        invited_to_school: schoolId,
      },
    });

    if (createError && !/already|exists|registered/i.test(createError.message)) {
      console.error('createUser failed:', createError.message);
    } else {
      accountCreated = true;
    }

    // Then try to email them the link. Separate step, because a mail failure
    // must not undo the account.
    let emailSent = true;
    const { error: mailError } = await caller.admin.auth.admin.inviteUserByEmail(
      normalisedEmail,
      { redirectTo: `${APP_URL}/AcceptInvitation?token=${token}` },
    );
    if (mailError) {
      // Expected while SMTP is unconfigured, and expected for an address that
      // already had an account. Either way the caller needs to know so they can
      // pass the link on themselves.
      emailSent = false;
    }

    return json(req, {
      success: true,
      invitation,
      accountCreated,
      emailSent,
      acceptUrl: `${APP_URL}/AcceptInvitation?token=${token}`,
    });
  }),
);
