import { supabase } from '@/lib/supabase';
import { rows, maybeOne, one } from './_query';

/**
 * Platform administration: cross-school stats, the audit trail, and global
 * config.
 *
 * Nothing here needs a "am I a super admin?" check. RLS answers that: a school
 * admin calling `listSchoolStats()` gets their own school, a super admin gets
 * every school, and `listAuditLogs()` returns nothing at all to anyone else.
 * Guarding in the UI as well is fine for presentation, but it is not the
 * boundary.
 */

// ── Per-school counts ───────────────────────────────────────────────────────

/**
 * One row per visible school with its counts, from the `school_stats` view.
 *
 * Replaces fetching academic years, terms, subjects, classes and memberships
 * across the whole platform and counting them client-side — which also hit the
 * 5000-row cap and silently under-reported once the platform grew.
 */
export function listSchoolStats() {
  return rows(
    supabase
      .from('school_stats')
      .select('*')
      .order('name'),
    'admin.listSchoolStats',
  );
}

export function getSchoolStats(schoolId) {
  return maybeOne(
    supabase.from('school_stats').select('*').eq('school_id', schoolId),
    'admin.getSchoolStats',
  );
}

/** Which of the five setup steps a school has completed. */
export function onboardingSummary(stats) {
  const steps = [
    { key: 'academicYears', label: 'Academic year', done: (stats?.academic_years ?? 0) > 0 },
    { key: 'terms', label: 'Terms', done: (stats?.terms ?? 0) > 0 },
    { key: 'subjects', label: 'Subjects', done: (stats?.subjects ?? 0) > 0 },
    { key: 'classes', label: 'Classes', done: (stats?.classes ?? 0) > 0 },
    { key: 'staff', label: 'Staff invited', done: (stats?.members ?? 0) > 1 },
  ];
  return { steps, completed: steps.filter((s) => s.done).length, total: steps.length };
}

// ── Audit log ───────────────────────────────────────────────────────────────

const AUDIT_COLUMNS =
  'id, school_id, user_id, user_email, action, entity_type, entity_id, details, level, created_at';

export function listAuditLogs({ limit = 500, schoolId, level } = {}) {
  let q = supabase.from('audit_logs').select(AUDIT_COLUMNS);
  if (schoolId) q = q.eq('school_id', schoolId);
  if (level) q = q.eq('level', level);
  return rows(q.order('created_at', { ascending: false }).limit(limit), 'admin.listAuditLogs');
}

export function recordAuditLog(entry) {
  return one(supabase.from('audit_logs').insert(entry).select(AUDIT_COLUMNS), 'admin.recordAuditLog');
}

// ── Platform config ─────────────────────────────────────────────────────────

const CONFIG_COLUMNS = `
  id, name, default_trial_days, default_notification_email, allow_school_brand_overrides,
  theme_mode, default_primary_color, default_accent_color, default_logo_url,
  notifications, integration_settings, global_feature_flags, school_feature_overrides
`;

/** The single platform config row, or null if it hasn't been created yet. */
export function getPlatformConfig() {
  return maybeOne(
    supabase.from('platform_config').select(CONFIG_COLUMNS).order('updated_at', { ascending: false }).limit(1),
    'admin.getPlatformConfig',
  );
}

export function updatePlatformConfig(id, patch) {
  return one(
    supabase.from('platform_config').update(patch).eq('id', id).select(CONFIG_COLUMNS),
    'admin.updatePlatformConfig',
  );
}

/**
 * Just the creation timestamps of memberships, for growth charts.
 *
 * Selecting one column instead of whole membership rows: the chart only ever
 * buckets these by month.
 */
export function listMembershipCreationDates({ since } = {}) {
  let q = supabase.from('school_memberships').select('created_at, school_id');
  if (since) q = q.gte('created_at', since);
  return rows(q.order('created_at', { ascending: false }), 'admin.listMembershipCreationDates');
}

/** Equality filters over audit_logs. Super admins only, per RLS. */
export function whereAuditLogs(filters = {}, { order = 'created_at', ascending = false, limit } = {}) {
  let q = supabase.from('audit_logs').select(AUDIT_COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  q = q.order(order, { ascending });
  if (limit) q = q.limit(limit);
  return rows(q, 'admin.whereAuditLogs');
}

export function createPlatformConfig(record) {
  return one(supabase.from('platform_config').insert(record).select(CONFIG_COLUMNS), 'admin.createPlatformConfig');
}

/** Equality filters over platform_config. There is normally a single row. */
export function wherePlatformConfig(filters = {}, { limit } = {}) {
  let q = supabase.from('platform_config').select(CONFIG_COLUMNS);
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) q = q.eq(key, value);
  }
  if (limit) q = q.limit(limit);
  return rows(q, 'admin.wherePlatformConfig');
}
