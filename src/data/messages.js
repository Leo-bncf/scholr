import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one, none, count } from './_query';

/**
 * messages
 *
 * Promoted to hand-written in scripts/gen-data-modules.mjs: this file now
 * carries recipient-scoped and date-bounded queries so a screen never pulls a
 * school's whole message history into the browser.
 *
 * RLS decides what a caller can see; these functions do not re-check roles.
 */

const COLUMNS = 'id, school_id, sender_id, sender_name, sender_role, recipient_ids, subject, body, class_id, class_name, thread_id, is_announcement, is_school_wide, is_pinned, read_by, attachments, created_at';

/** Everything in a school. */
export function listForSchool(schoolId) {
  return rows(
    supabase.from('messages').select(COLUMNS).eq('school_id', schoolId)
      .order('created_at', { ascending: false }),
    'messages.listForSchool',
  );
}

/**
 * The most recent messages addressed to one person.
 *
 * `contains` maps to the Postgres `@>` array operator, so the recipient filter
 * runs in the database and the limit keeps the transfer to what the inbox
 * shows. Use for "what's new in my inbox" panels.
 */
export function listForRecipient(schoolId, recipientId, { limit = 20 } = {}) {
  return rows(
    supabase
      .from('messages')
      .select(COLUMNS)
      .eq('school_id', schoolId)
      .contains('recipient_ids', [recipientId])
      .order('created_at', { ascending: false })
      .limit(limit),
    'messages.listForRecipient',
  );
}

/** Count messages since a timestamp, without transferring any rows. */
export function countRecentForSchool(schoolId, { since } = {}) {
  let q = supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('school_id', schoolId);
  if (since) q = q.gte('created_at', since);
  return count(q, 'messages.countRecentForSchool');
}

export function get(id) {
  return maybeOne(supabase.from('messages').select(COLUMNS).eq('id', id), 'messages.get');
}

/**
 * Equality filters, for call sites that don't have a named query yet.
 *
 * `where({ school_id, status })` maps each key to `.eq()`; an array value
 * becomes `.in()` and null becomes `.is(null)`. Prefer adding a named
 * function above when the same filter shows up more than once.
 */
export function where(filters = {}, { order, ascending = false, limit } = {}) {
  let q = supabase.from('messages').select(COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  if (order) q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'messages.where');
}

export function create(record) {
  return one(supabase.from('messages').insert(record).select(COLUMNS), 'messages.create');
}

export function update(id, patch) {
  return one(
    supabase.from('messages').update(patch).eq('id', id).select(COLUMNS),
    'messages.update',
  );
}

export function remove(id) {
  return none(supabase.from('messages').delete().eq('id', id), 'messages.remove');
}
