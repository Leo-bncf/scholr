import { fromRequest, isSuperAdmin } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, forbidden, badRequest } from '../_shared/http.ts';

/**
 * Delete a user account outright. Super admins only.
 *
 * Deleting `auth.users` cascades to `profiles` (FK on delete cascade), but
 * several tables reference profiles with ON DELETE RESTRICT — deliberately,
 * so a user can't be erased by a stray cascade. Those references are removed
 * first, in order:
 *
 *   1. Stored files. A student's work lives in the `submissions` bucket under
 *      `<school>/<user>/<assignment>/<file>`, and storage RLS keys "their own
 *      files" off that path segment, so a GDPR erasure must delete the objects
 *      themselves — not just the rows that pointed at them. Only the service
 *      role can do this: an authenticated super admin (or anyone else) fails
 *      the bucket write policy on a path that isn't their own.
 *   2. Own records that block the profile cascade (ON DELETE RESTRICT):
 *      account_states, notifications, google_connections, predicted_grades
 *      (by student_id) and ee_milestones (by student_id). The GDPR console
 *      deletes the rest (memberships, submissions, attendance, behaviour,
 *      grades, reports, CAS, parent links) before calling this function.
 *   3. School memberships — removed, in order, as before.
 *
 * Records that reference the user for provenance (audit logs, grades they
 * created) use ON DELETE SET NULL and survive, which is what you want: deleting
 * a teacher must not delete their students' grades.
 *
 * The response reports what was actually done — `filesRemoved`, `fileErrors`
 * and the per-table `extraDeleted` counts — so the console can state the
 * outcome honestly rather than assuming.
 */

const SUBMISSIONS_BUCKET = 'submissions';

/** True for folder listings in supabase-js storage: folders carry a null id. */
function isFolder(item: { id: string | null }): boolean {
  return item.id === null;
}

/** Recursively collect every object path under `prefix` in a bucket. */
async function listObjectPaths(
  admin: import('../_shared/client.ts').Caller['admin'],
  prefix: string,
): Promise<{ paths: string[]; error: string | null }> {
  const { data, error } = await admin.storage
    .from(SUBMISSIONS_BUCKET)
    .list(prefix, { limit: 1000, offset: 0 });
  if (error) return { paths: [], error: error.message };

  const paths: string[] = [];
  for (const item of data ?? []) {
    const at = `${prefix}/${item.name}`;
    if (isFolder(item)) {
      const nested = await listObjectPaths(admin, at);
      if (nested.error) return { paths: [], error: nested.error };
      paths.push(...nested.paths);
    } else {
      paths.push(at);
    }
  }
  return { paths, error: null };
}

/** Delete stored files in batches, returning how many went and any failures. */
async function removeStoredFiles(
  admin: import('../_shared/client.ts').Caller['admin'],
  paths: string[],
): Promise<{ removed: number; errors: string[] }> {
  let removed = 0;
  const errors: string[] = [];
  for (let i = 0; i < paths.length; i += 100) {
    const batch = paths.slice(i, i + 100);
    const { error } = await admin.storage.from(SUBMISSIONS_BUCKET).remove(batch);
    if (error) errors.push(error.message);
    else removed += batch.length;
  }
  return { removed, errors };
}

/** Delete a user's own rows in one table, returning how many went. */
async function deleteOwnRows(
  admin: import('../_shared/client.ts').Caller['admin'],
  table: string,
  column: 'user_id' | 'student_id',
  userId: string,
): Promise<{ count: number; error: string | null }> {
  const { data, error } = await admin.from(table).delete().eq(column, userId).select('id');
  if (error) return { count: 0, error: `${table}: ${error.message}` };
  return { count: data?.length ?? 0, error: null };
}

Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);
    if (!isSuperAdmin(caller)) {
      return forbidden(req, 'Only super admins can delete user accounts.');
    }

    const { userId } = await readJsonBody<{ userId?: string }>(req);
    if (!userId) return badRequest(req, '`userId` is required.');
    if (userId === caller.user.id) {
      return badRequest(req, 'You cannot delete your own account.');
    }

    const { data: target } = await caller.admin
      .from('profiles')
      .select('id, email, role')
      .eq('id', userId)
      .maybeSingle();
    if (!target) return json(req, { error: 'No such user.' }, 404);

    // Deleting the last super admin would lock everyone out of platform admin.
    if (target.role === 'super_admin') {
      const { count } = await caller.admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin');
      if ((count ?? 0) <= 1) {
        return badRequest(req, 'This is the only super admin — promote someone else first.');
      }
    }

    // Scope stored files by the schools the user belongs to; membership rows
    // are removed below, so capture the school ids first.
    const { data: schoolRows } = await caller.admin
      .from('school_memberships')
      .select('school_id')
      .eq('user_id', userId);

    let filesRemoved = 0;
    const fileErrors: string[] = [];
    for (const row of schoolRows ?? []) {
      const { paths, error } = await listObjectPaths(caller.admin, `${row.school_id}/${userId}`);
      if (error) {
        fileErrors.push(error.message);
        continue;
      }
      if (paths.length === 0) continue;
      const { removed, errors } = await removeStoredFiles(caller.admin, paths);
      filesRemoved += removed;
      fileErrors.push(...errors);
    }

    // Clear the user's own rows that otherwise block the profile cascade.
    const extraDeleted: Record<string, number> = {};
    const blockedBy: Array<[string, 'user_id' | 'student_id']> = [
      ['account_states', 'user_id'],
      ['notifications', 'user_id'],
      ['google_connections', 'user_id'],
      ['predicted_grades', 'student_id'],
      ['ee_milestones', 'student_id'],
    ];
    for (const [table, column] of blockedBy) {
      const { count, error } = await deleteOwnRows(caller.admin, table, column, userId);
      if (error) return json(req, { error }, 500);
      extraDeleted[table] = count;
    }

    const { error: membershipError } = await caller.admin
      .from('school_memberships')
      .delete()
      .eq('user_id', userId);
    if (membershipError) return json(req, { error: membershipError.message }, 500);

    const { error: deleteError } = await caller.admin.auth.admin.deleteUser(userId);
    if (deleteError) return json(req, { error: deleteError.message }, 500);

    await caller.admin.from('audit_logs').insert({
      user_id: caller.user.id,
      user_email: caller.user.email,
      action: 'user.deleted',
      entity_type: 'user',
      entity_id: userId,
      details: {
        deleted_email: target.email,
        deleted_role: target.role,
        files_removed: filesRemoved,
        file_errors: fileErrors.length,
      },
      level: 'warning',
    });

    return json(req, {
      success: true,
      deleted: userId,
      filesRemoved,
      fileErrors,
      extraDeleted,
    });
  }),
);
