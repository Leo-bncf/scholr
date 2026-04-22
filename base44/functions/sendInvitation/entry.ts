import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { schoolId, email, role, firstName, lastName, gradeLevel, department, customMessage } = await req.json();

    if (!schoolId || !email || !role) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Authorize: caller must be platform admin OR have an active school_admin / ib_coordinator
    // membership for this school, OR have the school_admin/ib_coordinator role on their user record
    // for this school (legacy path — SchoolMembership records may not exist yet).
    const isPlatformAdmin = user.role === 'admin';

    if (!isPlatformAdmin) {
      const memberships = await base44.asServiceRole.entities.SchoolMembership.filter({
        user_id: user.id,
        school_id: schoolId,
        status: 'active',
      });
      let allowed = memberships.some(m => ['school_admin', 'ib_coordinator'].includes(m.role));

      // Fallback: check the user's own data fields for school role (legacy / pre-membership setup)
      if (!allowed) {
        const userData = user.data || {};
        const nestedUserData = userData.data || {};
        const userSchoolId = userData.active_school_id || userData.school_id || nestedUserData.active_school_id || nestedUserData.school_id;
        const userRole = userData.role || userData.intended_role || nestedUserData.role || nestedUserData.intended_role || user.role;
        if (
          userSchoolId === schoolId &&
          ['school_admin', 'ib_coordinator', 'admin', 'super_admin'].includes(userRole)
        ) {
          allowed = true;
        }
      }

      if (!allowed) {
        return Response.json({ error: 'Forbidden: you do not have permission to invite users to this school' }, { status: 403 });
      }
    }

    // Use service role to invite the user — school admins don't have platform-admin rights,
    // but we've already authorized them via their school membership above.
    try {
      await base44.asServiceRole.users.inviteUser(email, 'user');
    } catch (inviteErr) {
      // If the user already exists in Base44, Base44 returns an error — that's fine, we still want to
      // create the school invitation so their role gets assigned on next login.
      console.log('inviteUser info:', inviteErr?.message);
    }

    // Store the school invitation record for role assignment on first login
    const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const invitation = await base44.asServiceRole.entities.UserInvitation.create({
      school_id: schoolId,
      email,
      role,
      invited_by: user.id,
      invited_by_name: user.full_name || user.email,
      status: 'pending',
      invitation_token: invitationToken,
      expires_at: expiresAt.toISOString(),
      metadata: {
        first_name: firstName,
        last_name: lastName,
        grade_level: gradeLevel,
        department,
        custom_message: customMessage,
      },
    });

    return Response.json({ success: true, invitation });
  } catch (error) {
    console.error('sendInvitation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});