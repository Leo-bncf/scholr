import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { schoolId } = await req.json();
    if (!schoolId) return Response.json({ error: 'schoolId required' }, { status: 400 });

    // Verify user belongs to this school with admin role
    const memberships = await base44.asServiceRole.entities.SchoolMembership.filter({
      school_id: schoolId,
      user_id: user.id,
    });
    const isAdmin = memberships.some(m => ['school_admin', 'ib_coordinator'].includes(m.role)) || ['admin', 'super_admin'].includes(user.role);
    if (!isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    let deleted = 0;

    // Helper: delete all records whose name starts with [Demo]
    const deleteIfDemo = async (entity, filterFn) => {
      const records = await base44.asServiceRole.entities[entity].filter({ school_id: schoolId });
      const demoRecords = records.filter(filterFn);
      await Promise.all(demoRecords.map(r => base44.asServiceRole.entities[entity].delete(r.id)));
      deleted += demoRecords.length;
    };

    // Delete demo classes first (dependencies)
    await deleteIfDemo('Class', r => r.name?.startsWith('[Demo]'));

    // Delete demo memberships (prefixed with [Demo])
    await deleteIfDemo('SchoolMembership', r => r.user_name?.startsWith('[Demo]'));

    // Delete demo subjects
    await deleteIfDemo('Subject', r => r.name?.startsWith('[Demo]'));

    // Delete demo terms before academic years
    await deleteIfDemo('Term', r => r.name?.startsWith('[Demo]'));

    // Delete demo academic years
    await deleteIfDemo('AcademicYear', r => r.name?.startsWith('Demo Year'));

    console.log(`Cleared ${deleted} demo records from school ${schoolId}`);

    return Response.json({
      success: true,
      message: `Cleared ${deleted} demo records. All [Demo]-prefixed records have been removed.`,
      deleted,
    });
  } catch (error) {
    console.error('clearSchoolDemoData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});