import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Update a Class's status (active ↔ archived). Invoked by a school admin /
 * IB coordinator. Uses the service role after verifying the caller is
 * entitled to manage that class's school.
 *
 * Payload: { classId: string, status: 'active' | 'archived' }
 * Or bulk: { classIds: string[], status: 'active' | 'archived' }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { classId, classIds, status } = body;
    const targets = Array.isArray(classIds) && classIds.length ? classIds : (classId ? [classId] : []);
    if (targets.length === 0) {
      return Response.json({ error: 'classId or classIds is required' }, { status: 400 });
    }
    if (!['active', 'archived'].includes(status)) {
      return Response.json({ error: 'status must be "active" or "archived"' }, { status: 400 });
    }

    const effectiveRole =
      user.intended_role ||
      user.data?.intended_role ||
      user.data?.role ||
      user.role;

    const isPlatformAdmin =
      user.role === 'admin' ||
      user.role === 'super_admin' ||
      effectiveRole === 'admin' ||
      effectiveRole === 'super_admin';

    const sr = base44.asServiceRole;

    // Gather schools the caller can manage (unless platform admin)
    let managedSchoolIds = new Set();
    if (!isPlatformAdmin) {
      const myMemberships = await sr.entities.SchoolMembership.filter({ user_id: user.id });
      managedSchoolIds = new Set(
        myMemberships
          .filter((m) => (m.role === 'school_admin' || m.role === 'ib_coordinator') && m.status !== 'inactive')
          .map((m) => m.school_id)
      );
      // Legacy fallback
      if (effectiveRole === 'school_admin' || effectiveRole === 'ib_coordinator') {
        const legacySchool = user.data?.active_school_id || user.data?.school_id || user.school_id;
        if (legacySchool) managedSchoolIds.add(legacySchool);
      }
      if (managedSchoolIds.size === 0) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let updated = 0;
    const failures = [];

    for (const id of targets) {
      try {
        const klass = await sr.entities.Class.get(id);
        if (!klass) {
          failures.push({ id, error: 'not found' });
          continue;
        }
        if (!isPlatformAdmin && !managedSchoolIds.has(klass.school_id)) {
          failures.push({ id, error: 'not permitted' });
          continue;
        }
        await sr.entities.Class.update(id, { status });
        updated++;
      } catch (e) {
        console.error('class status update failed', id, e?.message || e);
        failures.push({ id, error: e?.message || 'update failed' });
      }
    }

    return Response.json({ updated, failures });
  } catch (error) {
    console.error('updateClassStatus error:', error?.message || error);
    return Response.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
});