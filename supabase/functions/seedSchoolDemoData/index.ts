import { fromRequest, hasSchoolRole, isSuperAdmin } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, forbidden, badRequest } from '../_shared/http.ts';
import {
  ensureDemoUser,
  demoEmailDomain,
  sleep,
} from '../_shared/demoData.ts';

/**
 * Seed a small, realistic demo dataset into ONE school.
 *
 * This is the per-school half of the onboarding "Demo data" controls. Unlike
 * seedDevSchool (which rebuilds the whole demo instance for the marketing
 * sandbox), this seeds a school the caller already administers, tagging every
 * row `is_demo: true` so the paired clearSchoolDemoData can remove exactly
 * what was created here — and nothing else.
 *
 * Auth accounts are created through GoTrue's admin API (never by inserting into
 * auth.users directly), so each demo user is a real, sign-inable account with
 * their own profile row. ensureDemoUser waits for the post-signup trigger to
 * provision the profile, then this function links memberships to the returned
 * user ids.
 *
 * Idempotent: re-running on an already-seeded school is a no-op that returns
 * the existing counts rather than duplicating rows.
 *
 * Response: { stats: { subjects, classes, memberships }, logins: [...] }
 */
Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);

    const { schoolId } = await readJsonBody<{ schoolId?: string }>(req);
    if (!schoolId) return badRequest(req, '`schoolId` is required.');

    if (!isSuperAdmin(caller) && !(await hasSchoolRole(caller, schoolId, ['school_admin']))) {
      return forbidden(req, 'You need to be a school admin to seed demo data.');
    }

    // The school must have a usable slug, since demo accounts are named after it.
    const { data: school } = await caller.admin
      .from('schools')
      .select('id, slug')
      .eq('id', schoolId)
      .maybeSingle();
    if (!school) return badRequest(req, 'That school no longer exists.');

    const domain = demoEmailDomain(school.slug);
    if (!domain) return badRequest(req, 'This school has no usable slug, so demo accounts cannot be named.');

    const stats = { subjects: 0, classes: 0, memberships: 0 };
    const logins: Array<{ role: string; name: string; email: string; password: string }> = [];

    // Only seed if nothing demo-tagged exists yet; otherwise report what's there.
    const { data: existing, error: existingErr } = await caller.admin
      .from('subjects')
      .select('id')
      .eq('school_id', schoolId)
      .eq('is_demo', true)
      .limit(1);
    if (existingErr) return json(req, { error: `existing: ${existingErr.message}` }, 500);
    if (existing && existing.length > 0) {
      return json(req, {
        seeded: false,
        already: true,
        stats,
        logins,
        message: 'This school already has demo data.',
      });
    }

    const password = (() => {
      // One account per role, named after the school slug for a stable email.
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      let p = '';
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      for (const b of bytes) p += chars[b % chars.length];
      return `${p}!`;
    })();

    const roles = [
      { role: 'ib_coordinator', name: 'Demo Coordinator' },
      { role: 'teacher', name: 'Demo Teacher' },
      { role: 'student', name: 'Demo Student' },
      { role: 'parent', name: 'Demo Parent' },
    ];

    const users: Record<string, { userId: string; email: string }> = {};
    for (const { role, name } of roles) {
      const email = `demo.${role}@${domain}`;
      const existingUser = await caller.admin
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();
      if (existingUser?.email) {
        // Reuse the account (idempotent) but issue a fresh password so the
        // admin gets a working sign-in.
        const pw = generatePassword();
        const { error } = await caller.admin.auth.admin.updateUserById(existingUser.id, {
          password: pw,
        });
        if (error) return json(req, { error: `updateUser ${email}: ${error.message}` }, 500);
        users[role] = { userId: existingUser.id, email };
        logins.push({ role, name, email, password: pw });
      } else {
        const { userId, email: created } = await ensureDemoUser(caller.admin, {
          schoolId,
          schoolSlug: school.slug,
          role: role as 'ib_coordinator' | 'teacher' | 'student' | 'parent',
          name,
          password,
        });
        users[role] = { userId, email: created };
        logins.push({ role, name, email: created, password });
      }
    }

    // Academic year + two terms, tagged demo.
    const yearName = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    const { data: yearRow, error: yearErr } = await caller.admin
      .from('academic_years')
      .insert({
        school_id: schoolId,
        name: yearName,
        is_current: true,
        status: 'active',
        is_demo: true,
      })
      .select('id')
      .single();
    if (yearErr) return json(req, { error: `academic_years: ${yearErr.message}` }, 500);

    const { error: termErr } = await caller.admin.from('terms').insert([
      { school_id: schoolId, academic_year_id: yearRow.id, name: 'Term 1', is_current: true, is_demo: true },
      { school_id: schoolId, academic_year_id: yearRow.id, name: 'Term 2', is_current: false, is_demo: true },
    ]);
    if (termErr) return json(req, { error: `terms: ${termErr.message}` }, 500);

    // Six IB subjects, mirroring the seeded demo school.
    const ibSubjects = [
      ['English A: Literature', 'ENGA', 'group1_language_literature'],
      ['French B', 'FRB', 'group2_language_acquisition'],
      ['History', 'HIS', 'group3_individuals_societies'],
      ['Biology', 'BIO', 'group4_sciences'],
      ['Mathematics: Analysis', 'MAA', 'group5_mathematics'],
      ['Visual Arts', 'VA', 'group6_arts'],
    ];
    const { error: subjErr } = await caller.admin.from('subjects').insert(
      ibSubjects.map(([name, code, ib_group]) => ({
        school_id: schoolId,
        name,
        code,
        ib_group,
        level: 'HL',
        status: 'active',
        is_demo: true,
      })),
    );
    if (subjErr) return json(req, { error: `subjects: ${subjErr.message}` }, 500);
    stats.subjects = ibSubjects.length;

    // Three classes, each with the demo teacher and a student roster.
    const { data: subjectRows } = await caller.admin
      .from('subjects')
      .select('id')
      .eq('school_id', schoolId)
      .eq('is_demo', true)
      .limit(3);
    const classes = (subjectRows ?? []).map((s, i) => ({
      school_id: schoolId,
      subject_id: s.id,
      academic_year_id: yearRow.id,
      name: `Demo ${['English', 'Maths', 'Science'][i]} HL`,
      section: `D${i + 1}`,
      capacity: 24,
      teacher_ids: [users.teacher.userId],
      primary_teacher_id: users.teacher.userId,
      student_ids: [users.student.userId],
      status: 'active',
      is_demo: true,
    }));
    const { error: classErr, data: classRows } = await caller.admin
      .from('classes')
      .insert(classes)
      .select('id');
    if (classErr) return json(req, { error: `classes: ${classErr.message}` }, 500);
    stats.classes = classRows.length;

    // Memberships (real profiles via the auth accounts above).
    const membershipRows = [
      { user_id: users.ib_coordinator.userId, role: 'ib_coordinator' },
      { user_id: users.teacher.userId, role: 'teacher' },
      { user_id: users.student.userId, role: 'student' },
      { user_id: users.parent.userId, role: 'parent' },
    ].map((m) => ({
      school_id: schoolId,
      user_id: m.user_id,
      role: m.role,
      status: 'active',
      is_demo: true,
      user_email: `${m.role === 'parent' ? 'demo.parent' : 'demo.' + m.role}@${domain}`,
      user_name: `Demo ${m.role.replace(/_/g, ' ')}`,
    }));
    const { error: memErr } = await caller.admin.from('school_memberships').insert(membershipRows);
    if (memErr) return json(req, { error: `school_memberships: ${memErr.message}` }, 500);
    stats.memberships = membershipRows.length;

    // Parent-student link so the demo parent has someone to look at.
    const { error: linkErr } = await caller.admin.from('parent_student_links').insert({
      school_id: schoolId,
      parent_id: users.parent.userId,
      parent_name: 'Demo Parent',
      student_id: users.student.userId,
      student_name: 'Demo Student',
      relationship: 'guardian',
      is_demo: true,
    });
    if (linkErr) return json(req, { error: `parent_student_links: ${linkErr.message}` }, 500);

    return json(req, { seeded: true, stats, logins });
  }),
);
