import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one, none } from './_query';

/**
 * schedule_entries
 *
 * Promoted to hand-written in scripts/gen-data-modules.mjs: this file now
 * carries a class-scoped named query so a timetable screen fetches only the
 * entries for the classes it renders.
 *
 * RLS decides what a caller can see; these functions do not re-check roles.
 */

const COLUMNS = 'id, school_id, class_id, class_name, teacher_id, teacher_name, room_id, room_name, period_id, day_of_week, start_time, end_time, academic_year_id, term_id, effective_from, effective_until, status, external_sync_id, last_synced_at, created_at';

/** Everything in a school. */
export function listForSchool(schoolId) {
  return rows(
    supabase.from('schedule_entries').select(COLUMNS).eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
    'scheduleEntries.listForSchool',
  );
}

/**
 * Entries for a set of classes, ordered for the week grid.
 *
 * A student timetable or a filtered calendar cares about its own classes, not
 * the whole school's schedule, so the class filter is the bound. `status`
 * narrows to live entries where the caller only renders those.
 */
export function listForClasses(classIds, { status } = {}) {
  if (!classIds?.length) return Promise.resolve([]);
  let q = supabase.from('schedule_entries').select(COLUMNS).in('class_id', classIds);
  if (status) q = q.eq('status', status);
  return rows(
    q.order('day_of_week').order('start_time'),
    'scheduleEntries.listForClasses',
  );
}

export function get(id) {
  return maybeOne(supabase.from('schedule_entries').select(COLUMNS).eq('id', id), 'scheduleEntries.get');
}

/**
 * Equality filters, for call sites that don't have a named query yet.
 *
 * `where({ school_id, status })` maps each key to `.eq()`; an array value
 * becomes `.in()` and null becomes `.is(null)`. Prefer adding a named
 * function above when the same filter shows up more than once.
 */
export function where(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('schedule_entries').select(COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'scheduleEntries.where');
}

export function create(record) {
  return one(supabase.from('schedule_entries').insert(record).select(COLUMNS), 'scheduleEntries.create');
}

export function update(id, patch) {
  return one(
    supabase.from('schedule_entries').update(patch).eq('id', id).select(COLUMNS),
    'scheduleEntries.update',
  );
}

export function remove(id) {
  return none(supabase.from('schedule_entries').delete().eq('id', id), 'scheduleEntries.remove');
}
