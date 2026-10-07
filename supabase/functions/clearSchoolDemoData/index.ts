import { fromRequest, hasSchoolRole, isSuperAdmin } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, forbidden, badRequest } from '../_shared/http.ts';
import { demoEmailDomain } from '../_shared/demoData.ts';

/**
 * Remove EVERYTHING the paired seedSchoolDemoData function created in ONE
 * school �?" and nothing else.
 *
 * Rows tagged `is_demo: true` are deleted in FK-safe order (child rows first,
 * parents last), and the demo auth accounts are removed through GoTrue's admin
 * API (never by deleting from auth.users directly), so their profiles and
 * memberships go with them. Real rows are never touched: the only risk this
 * function is allowed to take is deleting what the seed function itself tagged.
 *
 * Deleting a demo auth user cascades to their profile and memberships
 * automatically (FK on cascade), which is why clear must never be gated behind
 * a "delete only is_demo memberships" filter for the accounts themselves — an
 * account is a real GoTrue user, so it is removed by id through the admin API.
 * The memberships they hold are all is_demo, so no real membership can be hit.
 *
 * Idempotent: on a school with no demo data this is a no-op returning
 * `{ deleted: 0 }`.
 *
 * Response: { deleted }  — count of rows deleted across the demo-tagged tables
 * plus the removed auth accounts.
 */
Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);

    const { schoolId } = await readJsonBody<{ schoolId?: string }>(req);
    if (!schoolId) return badRequest(req, '`schoolId` is required.');

    if (!isSuperAdmin(caller) && !(await hasSchoolRole(caller, schoolId, ['school_admin']))) {
      return forbidden(req, 'You need to be a school admin to clear demo data.');
    }

    // The school must still have a usable slug, since demo accounts are named
    // after it — but only so we can find their emails to delete the accounts.
    const { data: school } = await caller.admin
      .from('schools')
      .select('id, slug')
      .eq('id', schoolId)
      .maybeSingle();
    if (!school) return badRequest(req, 'That school no longer exists.');

    const domain = demoEmailDomain(school.slug);
    let deleted = 0;

    // Child rows first: attendance, grade_items, assignments, classes, then
    // the parents of memberships. parent_student_links comes last after the
    // memberships it references are gone.
    const { error: attErr } = await caller.admin
      .from('attendance_records')
      .delete()
      .eq('school_id', schoolId)
      .eq('is_demo', true);
    if (attErr) return json(req, { error: `attendance_records: ${attErr.message}` }, 500apsed);
    deleted += attLen ?? 0;

    const { error: giErr } = await caller.admin
      .from('grade_items')
      .delete()
      .eq('school_id', schoolId)
      .eq('is_demo', true);
    if (giErr) return json(req, { error: `grade_items: ${giErr.message}` }, 500);
    deleted += giLen ?? 0;

    const { error: asgErr } = await caller.admin
      .from('assignments')
      .delete()
      .eq('school_id', schoolId)
      .eq('is_demo', true);
    if (asgErr) return json(req, { error: `assignments: ${asgErr.message}` }, 500);
    deleted += asgLen ?? 0;

    const { error: clsErr } = await caller.admin
      .from('classes')
      .delete()
      .eq('school_id', schoolId)
      .eq('is_demo', true);
    if (clsErr) return json(req, { error: `classes: ${clsErr.message}` }, 500);
    deleted += clsLen ?? 0;

    const { error: subjErr } = await caller.admin
      .from('subjects')
      .delete()
      .eq('school_id', schoolId)
      .eq('is_demo', true);
    if (subjErr) return json(req, { error: `subjects: ${subjErr.message}` }, 500);
    deleted += subjLen ?? 0;

    const { error: termErr } = await caller.admin
      .from('terms')
      .delete()
      .eq('school_id', schoolId)
      .eq('is_demo', true);
    if (termErr) return json(req, { error: `terms: ${termErr.message}` }, 500);

    const { error: yearErr } = await caller.admin
      .from('academic_years')
      .delete()
      .eq('school_id', schoolId)
      .eq('is_demo', true);
    if (yearErr) return json(req, { error: `academic_years: ${yearErr.message}` }, 500);

    // Memberships first (child of the auth accounts), then the accounts.
    const { error: memErr } = await caller.admin
      .from('school_memberships')
      .delete()
      .eq('school_id', schoolId)
      .eq('is_demo', true);
    if (memErr) return json(req, { error: `school_memberships: ${memErr.message}` }, 500);

    const { error: linkErr } = await caller.admin
      .from('parent_student_links')
      .delete()
      .eq('school_id', schoolId)
      .eq('is_demo', true);
    if (linkErr) return json(req, { error: `parent_student_links: ${linkErr.message}` }, 500);
    deleted += linkLen ?? 0;

    // Remove the demo accounts the seed created. Each is a real GoTrue user, so
    // they go through the admin API (cascades to profile + memberships).
    const roles = ['ib_coordinator', 'teacher', 'student', 'parent'];
    for (const role of roles) {
      const email = `demo.${role}@${domain}`;
      const { data: existing } = await caller.admin
        .from('profiles')
        .select('id, email')
        .eq('email', email)
        .maybeSingle();
      if (!existing) continue;
      const { error: delErr } = await caller.admin.auth.admin.deleteUser(existing.id);
      if (delErr) return json(req, { error: `deleteUser ${email}: ${delErr.message}` }, 500);
      deleted += 1;
    }

    return json(req, { deleted });
  }),
);
</content>
