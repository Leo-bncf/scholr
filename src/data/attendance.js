import { supabase } from '@/lib/supabase';
import { rows, one, none } from './_query';

/**
 * Attendance.
 *
 * Registers are taken per class per day, so nearly every query is bounded by a
 * date or a date range. The old code frequently pulled a school's whole history
 * and filtered in JavaScript — with `.list('-created_at', 5000)` it also hit
 * the row cap and silently lost the oldest records.
 */

const COLUMNS = `
  id, school_id, class_id, student_id, student_name, date, status, note,
  reason_category, recorded_by, last_corrected_at, last_corrected_by, created_at
`;

/** The register for one class on one day. `date` is a DATE — pass YYYY-MM-DD. */
export function listForClassOnDate(classId, date) {
  return rows(
    supabase.from('attendance_records').select(COLUMNS).eq('class_id', classId).eq('date', date),
    'attendance.listForClassOnDate',
  );
}

export function listForClassBetween(classId, from, to) {
  return rows(
    supabase
      .from('attendance_records')
      .select(COLUMNS)
      .eq('class_id', classId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false }),
    'attendance.listForClassBetween',
  );
}

export function listForStudent(schoolId, studentId, { from, to } = {}) {
  let q = supabase
    .from('attendance_records')
    .select(`${COLUMNS}, class:classes (id, name)`)
    .eq('school_id', schoolId)
    .eq('student_id', studentId);
  if (from) q = q.gte('date', from);
  if (to) q = q.lte('date', to);
  return rows(q.order('date', { ascending: false }), 'attendance.listForStudent');
}

/**
 * Save a register.
 *
 * Upsert on (class_id, student_id, date) so re-taking a register corrects it
 * rather than duplicating. Requires a unique index on those columns —
 * see 0006_attendance_unique.sql.
 */
export function saveRegister(records) {
  if (!records?.length) return Promise.resolve([]);
  return rows(
    supabase
      .from('attendance_records')
      .upsert(records, { onConflict: 'class_id,student_id,date' })
      .select(COLUMNS),
    'attendance.saveRegister',
  );
}

export function update(id, patch) {
  return one(
    supabase.from('attendance_records').update(patch).eq('id', id).select(COLUMNS),
    'attendance.update',
  );
}

/**
 * Attendance rates for a student, computed from a bounded window.
 *
 * Deliberately takes a date range: "all attendance ever" is the query that grows
 * without limit and eventually truncates.
 */
export async function getStudentSummary(schoolId, studentId, { from, to }) {
  const records = await listForStudent(schoolId, studentId, { from, to });
  const total = records.length;
  const counts = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const present = (counts.present ?? 0) + (counts.late ?? 0);
  return {
    total,
    counts,
    presentRate: total ? Math.round((present / total) * 100) : null,
  };
}

/** Equality filters over attendance_records. See the note on generic `where` helpers. */
export function whereRecords(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('attendance_records').select(COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'attendance.whereRecords');
}

export function create(record) {
  return one(supabase.from('attendance_records').insert(record).select(COLUMNS), 'attendance.create');
}

export function remove(id) {
  return none(supabase.from('attendance_records').delete().eq('id', id), 'attendance.remove');
}
