import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Remove a SchoolMembership record. Invoked by a school admin (or super admin)
 * to delete a member from their school. Uses service role after verifying that
 * the caller is entitled to manage the target school.
 *
 * Payload: { membershipId: string }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { membershipId } = body;
    console.log('removeSchoolMember called by', user.email, 'user.role=', user.role, 'membershipId=', membershipId);
    if (!membershipId) {
      return Response.json({ error: 'membershipId is required' }, { status: 400 });
    }

    // Load the target membership via service role so RLS doesn't block the read.
    let target = null;
    try {
      target = await base44.asServiceRole.entities.SchoolMembership.get(membershipId);
    } catch (e) {
      console.warn('get() failed, falling back to filter:', e?.message);
    }
    if (!target) {
      const memberships = await base44.asServiceRole.entities.SchoolMembership.filter({ id: membershipId });
      target = memberships[0];
    }
    if (!target) {
      return Response.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Authorisation: platform super_admin OR the caller is a school_admin /
    // ib_coordinator of the same school as the target membership.
    const isPlatformAdmin = user.role === 'super_admin' || user.role === 'admin';

    let isSchoolAdmin = false;
    if (!isPlatformAdmin) {
      const callerMemberships = await base44.asServiceRole.entities.SchoolMembership.filter({
        user_id: user.id,
        school_id: target.school_id,
        status: 'active',
      });
      isSchoolAdmin = callerMemberships.some(
        (m) => m.role === 'school_admin' || m.role === 'ib_coordinator'
      );
    }

    console.log('auth check:', { isPlatformAdmin, isSchoolAdmin, targetSchoolId: target.school_id });

    if (!isPlatformAdmin && !isSchoolAdmin) {
      return Response.json(
        { error: 'You do not have permission to remove members from this school.' },
        { status: 403 }
      );
    }

    // Don't let an admin remove themselves by accident via this path.
    if (target.user_id === user.id) {
      return Response.json(
        { error: 'You cannot remove yourself from the school.' },
        { status: 400 }
      );
    }

    await base44.asServiceRole.entities.SchoolMembership.delete(membershipId);

    return Response.json({ success: true, removed: membershipId });
  } catch (error) {
    console.error('removeSchoolMember error:', error);
    return Response.json({ error: error.message || 'Failed to remove member' }, { status: 500 });
  }
});