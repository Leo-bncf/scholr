import { serviceClient } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, badRequest } from '../_shared/http.ts';

/**
 * Create an account by redeeming an invitation.
 *
 * Unauthenticated by necessity — the account doesn't exist yet — so the token
 * is the only credential and everything hangs off validating it properly.
 *
 * The account is created with the invitation's email, NOT with an email
 * supplied in the request. base44 took `email` from the payload and never
 * checked it against the invitation, so a leaked token could be redeemed into
 * an attacker-controlled address while still receiving the invited role.
 */

const MIN_PASSWORD = 8;

interface Payload {
  password?: string;
  first_name?: string;
  last_name?: string;
  invitation_token?: string;
}

Deno.serve(
  handler(async (req) => {
    const { password, first_name, last_name, invitation_token } =
      await readJsonBody<Payload>(req);

    if (!invitation_token) return badRequest(req, 'An invitation token is required.');
    if (!password) return badRequest(req, 'A password is required.');
    if (password.length < MIN_PASSWORD) {
      return badRequest(req, `Your password must be at least ${MIN_PASSWORD} characters.`);
    }

    const admin = serviceClient();

    const { data: invitation, error } = await admin
      .from('user_invitations')
      .select('id, school_id, email, role, status, expires_at, metadata')
      .eq('invitation_token', invitation_token)
      .maybeSingle();

    if (error) return json(req, { success: false, error: error.message }, 500);
    if (!invitation) {
      return badRequest(req, 'That invitation link is not valid.');
    }
    if (invitation.status !== 'pending') {
      return badRequest(req, `This invitation has already been ${invitation.status}.`);
    }
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return badRequest(req, 'This invitation has expired. Ask for a new one.');
    }

    // The invitation decides the address, so a token can only ever create the
    // account it was issued for.
    const email = invitation.email.toLowerCase();

    const fullName =
      [first_name, last_name].filter(Boolean).join(' ').trim() ||
      [invitation.metadata?.first_name, invitation.metadata?.last_name].filter(Boolean).join(' ').trim() ||
      email;

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // the invitation itself proves they control the address
      user_metadata: { full_name: fullName },
    });

    if (createError) {
      // An existing account isn't a failure state — they should sign in and let
      // acceptInvitation attach the membership instead of creating a duplicate.
      if (/already|exists|registered/i.test(createError.message)) {
        return json(
          req,
          {
            success: false,
            error: 'An account already exists for this address. Sign in and open the invitation link again.',
            code: 'account_exists',
          },
          409,
        );
      }
      return json(req, { success: false, error: createError.message }, 500);
    }

    const userId = created.user.id;

    // handle_new_user creates the profile; fill in the parts only we know.
    await admin
      .from('profiles')
      .update({ full_name: fullName, active_school_id: invitation.school_id })
      .eq('id', userId);

    const { error: membershipError } = await admin.from('school_memberships').insert({
      user_id: userId,
      user_email: email,
      user_name: fullName,
      school_id: invitation.school_id,
      role: invitation.role,
      status: 'active',
      grade_level: invitation.metadata?.grade_level ?? null,
      department: invitation.metadata?.department ?? null,
    });

    if (membershipError) {
      // Without a membership the account exists but belongs to no school, which
      // is a confusing dead end. Roll the account back so they can retry.
      await admin.auth.admin.deleteUser(userId);
      return json(req, { success: false, error: membershipError.message }, 500);
    }

    await admin
      .from('user_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        user_id: userId,
      })
      .eq('id', invitation.id);

    return json(req, {
      success: true,
      user_id: userId,
      email,
      school_id: invitation.school_id,
      role: invitation.role,
    });
  }),
);
