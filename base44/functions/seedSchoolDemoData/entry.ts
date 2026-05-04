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

    // Check if demo data already seeded
    const existingYears = await base44.asServiceRole.entities.AcademicYear.filter({
      school_id: schoolId,
      name: 'Demo Year 2025-2026',
    });
    if (existingYears.length > 0) {
      return Response.json({ message: 'Demo data already seeded for this school. Clear it first to re-seed.' });
    }

    // Create academic year (tagged is_demo via name prefix)
    const year = await base44.asServiceRole.entities.AcademicYear.create({
      school_id: schoolId,
      name: 'Demo Year 2025-2026',
      start_date: '2025-09-01',
      end_date: '2026-06-30',
      is_current: false,
      status: 'planning',
    });

    // Create terms
    const terms = await Promise.all([
      base44.asServiceRole.entities.Term.create({ school_id: schoolId, academic_year_id: year.id, name: '[Demo] Term 1', start_date: '2025-09-01', end_date: '2025-12-19' }),
      base44.asServiceRole.entities.Term.create({ school_id: schoolId, academic_year_id: year.id, name: '[Demo] Term 2', start_date: '2026-01-05', end_date: '2026-03-27' }),
      base44.asServiceRole.entities.Term.create({ school_id: schoolId, academic_year_id: year.id, name: '[Demo] Term 3', start_date: '2026-04-13', end_date: '2026-06-26' }),
    ]);

    // Create subjects
    const subjectData = [
      { name: '[Demo] English Literature A', code: 'EN-A', ib_group: 1, is_ib: true },
      { name: '[Demo] Spanish B', code: 'SP-B', ib_group: 2, is_ib: true },
      { name: '[Demo] History', code: 'HI', ib_group: 3, is_ib: true },
      { name: '[Demo] Biology', code: 'BIO', ib_group: 4, is_ib: true },
      { name: '[Demo] Mathematics AA', code: 'MA-AA', ib_group: 5, is_ib: true },
      { name: '[Demo] Visual Arts', code: 'VA', ib_group: 6, is_ib: true },
    ];
    const subjects = await Promise.all(
      subjectData.map(s => base44.asServiceRole.entities.Subject.create({ ...s, school_id: schoolId }))
    );

    // Create memberships (placeholder demo staff/students)
    const membershipData = [
      { user_email: 'demo.teacher1@example.com', user_name: '[Demo] Sarah Thompson', role: 'teacher' },
      { user_email: 'demo.teacher2@example.com', user_name: '[Demo] James Richards', role: 'teacher' },
      { user_email: 'demo.coordinator@example.com', user_name: '[Demo] Maria Chen', role: 'ib_coordinator' },
      { user_email: 'demo.student1@example.com', user_name: '[Demo] Alex Johnson', role: 'student' },
      { user_email: 'demo.student2@example.com', user_name: '[Demo] Priya Patel', role: 'student' },
      { user_email: 'demo.student3@example.com', user_name: '[Demo] Lucas Müller', role: 'student' },
    ];
    const memberships2 = await Promise.all(
      membershipData.map(m => base44.asServiceRole.entities.SchoolMembership.create({
        ...m,
        school_id: schoolId,
        status: 'pending',
      }))
    );

    const teachers = memberships2.filter(m => ['teacher', 'ib_coordinator'].includes(m.role));
    const students = memberships2.filter(m => m.role === 'student');

    // Create classes
    const classes = await Promise.all([
      base44.asServiceRole.entities.Class.create({
        school_id: schoolId,
        name: '[Demo] IB DP Year 1 — English Lit',
        section: 'A',
        academic_year_id: year.id,
        teacher_ids: [teachers[0].id],
        student_ids: students.map(s => s.id),
        status: 'active',
      }),
      base44.asServiceRole.entities.Class.create({
        school_id: schoolId,
        name: '[Demo] IB DP Year 1 — Mathematics',
        section: 'A',
        academic_year_id: year.id,
        teacher_ids: [teachers[1].id],
        student_ids: students.map(s => s.id),
        status: 'active',
      }),
      base44.asServiceRole.entities.Class.create({
        school_id: schoolId,
        name: '[Demo] IB DP Year 2 — Biology HL',
        section: 'B',
        academic_year_id: year.id,
        teacher_ids: [teachers[0].id, teachers[2]?.id].filter(Boolean),
        student_ids: students.slice(0, 2).map(s => s.id),
        status: 'active',
      }),
    ]);

    console.log(`Demo data seeded for school ${schoolId}: year=${year.id}, ${terms.length} terms, ${subjects.length} subjects, ${memberships2.length} memberships, ${classes.length} classes`);

    return Response.json({
      success: true,
      message: 'Demo data seeded. All demo records are prefixed with [Demo] for easy identification.',
      stats: {
        academic_year: 1,
        terms: terms.length,
        subjects: subjects.length,
        memberships: memberships2.length,
        classes: classes.length,
      },
    });
  } catch (error) {
    console.error('seedSchoolDemoData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});