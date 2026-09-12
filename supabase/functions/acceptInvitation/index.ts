import { fromRequest } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, badRequest } from '../_shared/http.ts';

/**
 * Redeem an invitation: grant the membership and point the user at the school.
 *
 * Two changes from the base44 version, both deliberate:
 *
 * 1. The invitation is looked up BY TOKEN, not by id-plus-token. The token is
 *    the secret; ids are sequential-ish and enumerable, and taking both invited
 *    a lookup on the guessable one.
 *
 * 2. The invitation's email must match the signed-in user. base44 never checked
 *    this, so anyone holding a token could redeem an invitation addressed to
 *    someone else and take the role attached to it — including school_admin.
 */
Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req, 'Sign in to accept an invitation.');

    const { token } = await readJsonBody<{ token?: string }>(req);

    // Service role: the invitee has no membership yet, so RLS would hide the
    // invitation from them.
    //
    // Two ways in. With a token, they followed the emailed link. WITHOUT one,
    // they signed in some other way — in practice "Continue with Google" — and
    // we look for a pending invitation addressed to them. That second path is
    // what makes Google usable for clients at all: an OAuth sign-in never
    // carries the token, so without it an invited teacher would land with a
    // working login and no school.
    //
    // Claiming by email is safe because the email is the thing being proven:
    // Google verified it, and the token path independently checks it below.
    const COLUMNS = 'id, school_id, email, role, status, expires_at, metadata';

    // The token lookup deliberately does NOT filter on status: re-clicking a
    // used link should say "already accepted", not "not valid". Only the
    // email path filters, because there it's selecting among many.
    const { data: invitation, error } = token
      ? await caller.admin
          .from('user_invitations')
          .select(COLUMNS)
          .eq('invitation_token', token)
          .maybeSingle()
      : await caller.admin
          .from('user_invitations')
          .select(COLUMNS)
          .eq('status', 'pending')
          .ilike('email', caller.user.email ?? '')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

    if (error) return json(req, { error: error.message }, 500);
    if (!invitation) {
      return json(
        req,
        token
          ? { error: 'That invitation link is not valid.' }
          : { error: 'There is no pending invitation for your email address.', code: 'no_invitation' },
        404,
      );
    }

    if (invitation.status !== 'pending') {
      return badRequest(req, `This invitation has already been ${invitation.status}.`);
    }
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return badRequest(req, 'This invitation has expired. Ask for a new one.');
    }

    const callerEmail = (caller.user.email ?? '').toLowerCase();
    if (invitation.email.toLowerCase() !== callerEmail) {
      // Don't reveal who it was for.
      return json(
        req,
        { error: 'This invitation was sent to a different email address.' },
        403,
      );
    }

    // One statement rather than select-then-insert: 0010 added a unique index
    // on (user_id, school_id), so the read-then-write version had a race that
    // would surface as a constraint violation. Re-accepting just refreshes the
    // row.
    const { error: membershipError } = await caller.admin
      .from('school_memberships')
      .upsert(
        {
          user_id: caller.user.id,
          user_email: caller.user.email,
          user_name: caller.user.full_name ?? caller.user.email,
          school_id: invitation.school_id,
          role: invitation.role,
          status: 'active',
          grade_level: invitation.metadata?.grade_level ?? null,
          department: invitation.metadata?.department ?? null,
        },
        { onConflict: 'user_id,school_id' },
      );

    if (membershipError) return json(req, { error: membershipError.message }, 500);

    // Point them at the school they just joined. Service role, because the
    // profiles trigger blocks a self-service switch to a school you're not yet
    // a member of — and at this instant the membership may not be visible.
    await caller.admin
      .from('profiles')
      .update({ active_school_id: invitation.school_id })
      .eq('id', caller.user.id);

    const { error: statusError } = await caller.admin
      .from('user_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        user_id: caller.user.id,
      })
      .eq('id', invitation.id);

    if (statusError) {
      // The membership exists, so the user is in — log and carry on rather than
      // failing an action that actually succeeded.
      console.error('Could not mark invitation accepted:', statusError.message);
    }

    return json(req, {
      success: true,
      school_id: invitation.school_id,
      role: invitation.role,
    });
  }),
);
