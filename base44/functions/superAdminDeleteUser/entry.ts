import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const effectiveRole =
      me.intended_role ||
      me.data?.intended_role ||
      me.data?.role ||
      me.role;

    const isPlatformAdmin =
      me.role === 'admin' ||
      me.role === 'super_admin' ||
      effectiveRole === 'admin' ||
      effectiveRole === 'super_admin';

    const sr = base44.asServiceRole;

    // If not a platform admin, the caller must be a school_admin / ib_coordinator
    // somewhere. Collect the schools they manage; they may only delete users
    // whose memberships are entirely within those schools.
    let managedSchoolIds = new Set();
    if (!isPlatformAdmin) {
      const myMemberships = await sr.entities.SchoolMembership.filter({
        user_id: me.id,
      });
      managedSchoolIds = new Set(
        myMemberships
          .filter((m) => (m.role === 'school_admin' || m.role === 'ib_coordinator') && m.status !== 'inactive')
          .map((m) => m.school_id)
      );
      // Legacy fallback — role lives on user.data / intended_role instead of a membership row
      if (effectiveRole === 'school_admin' || effectiveRole === 'ib_coordinator') {
        const legacySchool = me.data?.active_school_id || me.data?.school_id || me.school_id;
        if (legacySchool) managedSchoolIds.add(legacySchool);
      }
      if (managedSchoolIds.size === 0) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const { userId, userIds } = body;
    const targets = Array.isArray(userIds) && userIds.length ? userIds : (userId ? [userId] : []);
    if (targets.length === 0) {
      return Response.json({ error: 'userId or userIds is required' }, { status: 400 });
    }

    let deleted = 0;
    const failures = [];

    for (const id of targets) {
      if (id === me.id) {
        failures.push({ id, error: 'Cannot delete your own account' });
        continue;
      }
      try {
        const memberships = await sr.entities.SchoolMembership.filter({ user_id: id });

        // For non-platform admins, require that EVERY membership of the target
        // is in a school the caller manages. Otherwise refuse.
        if (!isPlatformAdmin) {
          const outside = memberships.find((m) => !managedSchoolIds.has(m.school_id));
          if (outside || memberships.length === 0) {
            failures.push({ id, error: 'Not permitted for this user' });
            continue;
          }
        }

        // Clean up memberships first
        for (const m of memberships) {
          try { await sr.entities.SchoolMembership.delete(m.id); } catch (e) { console.warn('membership delete failed', m.id, e?.message); }
        }
        await sr.entities.User.delete(id);
        deleted++;
      } catch (e) {
        console.error('user delete failed', id, e?.message || e);
        failures.push({ id, error: e?.message || 'delete failed' });
      }
    }

    return Response.json({ deleted, failures });
  } catch (error) {
    console.error('superAdminDeleteUser error:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
});