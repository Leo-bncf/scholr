import { fromRequest, hasSchoolRole, isSuperAdmin } from '../_shared/client.ts';
import { readJsonBody } from '../_shared/readBody.ts';
import { handler, json, unauthorized, forbidden, badRequest } from '../_shared/http.ts';

/**
 * Archive or reactivate classes, singly or in bulk.
 *
 * base44 also had a separate `archiveClass` doing the same thing for one class;
 * that one is gone and its caller points here.
 *
 * Classes are archived rather than deleted because grades, attendance and
 * submissions all reference them — a delete would either cascade away real
 * records or fail on the foreign key.
 */

const STATUSES = ['active', 'archived'];

interface Payload {
  classId?: string;
  classIds?: string[];
  status?: string;
}

Deno.serve(
  handler(async (req) => {
    const caller = await fromRequest(req);
    if (!caller.user) return unauthorized(req);

    const { classId, classIds, status } = await readJsonBody<Payload>(req);
    const ids = classIds?.length ? classIds : classId ? [classId] : [];

    if (!ids.length) return badRequest(req, '`classId` or `classIds` is required.');
    if (!status || !STATUSES.includes(status)) {
      return badRequest(req, 'status must be "active" or "archived".');
    }

    const { data: classes, error } = await caller.admin
      .from('classes')
      .select('id, school_id, name')
      .in('id', ids);

    if (error) return json(req, { error: error.message }, 500);
    if (!classes?.length) return json(req, { error: 'No matching classes.' }, 404);

    // A bulk call could span schools; check each one the caller is touching
    // rather than assuming they all belong to the same place.
    const schoolIds = [...new Set(classes.map((c) => c.school_id))];
    for (const schoolId of schoolIds) {
      const allowed =
        isSuperAdmin(caller) ||
        (await hasSchoolRole(caller, schoolId, ['school_admin', 'ib_coordinator']));
      if (!allowed) {
        return forbidden(req, 'You need to be an admin of every school these classes belong to.');
      }
    }

    const { data: updated, error: updateError } = await caller.admin
      .from('classes')
      .update({ status })
      .in(
        'id',
        classes.map((c) => c.id),
      )
      .select('id, name, status');

    if (updateError) return json(req, { error: updateError.message }, 500);

    await caller.admin.from('audit_logs').insert(
      schoolIds.map((schoolId) => ({
        school_id: schoolId,
        user_id: caller.user!.id,
        user_email: caller.user!.email,
        action: `class.${status}`,
        entity_type: 'class',
        details: { count: updated?.length ?? 0, ids: classes.map((c) => c.id) },
        level: 'info',
      })),
    );

    return json(req, { success: true, updated: updated ?? [], count: updated?.length ?? 0 });
  }),
);
