import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only platform super-admins may delete users outright
    if (me.role !== 'admin' && me.role !== 'super_admin') {
      return Response.json({ error: 'Forbidden: super admin only' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { userId, userIds } = body;
    const targets = Array.isArray(userIds) && userIds.length ? userIds : (userId ? [userId] : []);
    if (targets.length === 0) {
      return Response.json({ error: 'userId or userIds is required' }, { status: 400 });
    }

    const sr = base44.asServiceRole;
    let deleted = 0;
    const failures = [];

    for (const id of targets) {
      if (id === me.id) {
        failures.push({ id, error: 'Cannot delete your own account' });
        continue;
      }
      try {
        // Clean up memberships first
        const memberships = await sr.entities.SchoolMembership.filter({ user_id: id });
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