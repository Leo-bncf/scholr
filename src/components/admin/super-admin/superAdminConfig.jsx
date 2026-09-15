export const SUPER_ADMIN_ALLOWED_ROLES = ['super_admin', 'admin'];

export const DEFAULT_SCHOOL_PLAN = 'starter';
export const DEFAULT_SCHOOL_STATUS = 'onboarding';
export const DEFAULT_BILLING_STATUS = 'trial';
export const SCHOOL_TRIAL_DURATION_DAYS = 30;

/* Price does not live here any more.
 *
 * This file used to declare flat monthly figures of €99 / €299 / €799 that no
 * school was ever quoted — the public site sold per student and Stripe was
 * configured per student. The super-admin revenue screen read these, so its
 * "estimated MRR" was derived from prices that existed nowhere else.
 *
 * What a school pays is now answered in one place: src/lib/pricing.js. */

/* Two axes, not eight hues.
 *
 * A plan is an ATTRIBUTE — Starter is not healthier than Enterprise — so it
 * wears the neutral chip. Only billing and school status describe something
 * that can be wrong, so only they draw from the reserved good/warn/crit
 * palette. This used to be eight Tailwind hues (blue, indigo, violet, emerald,
 * red, slate, amber, orange) with hand-written light/dark class pairs, and
 * every caller asked for the 'dark' pair — so the console rendered navy pills
 * with pale text on a white page.
 */
const PLAN_META = {
  starter: { label: 'Starter' },
  professional: { label: 'Professional' },
  enterprise: { label: 'Enterprise' },
};

const SCHOOL_STATUS_META = {
  active: { label: 'Active', tone: 'good' },
  onboarding: { label: 'Onboarding', tone: 'info' },
  suspended: { label: 'Suspended', tone: 'crit' },
  cancelled: { label: 'Cancelled', tone: 'mute' },
};

const BILLING_STATUS_META = {
  trial: { label: 'Trial', tone: 'info' },
  active: { label: 'Paid', tone: 'good' },
  past_due: { label: 'Past due', tone: 'crit' },
  incomplete: { label: 'Incomplete', tone: 'warn' },
  canceled: { label: 'Canceled', tone: 'mute' },
  unpaid: { label: 'Unpaid', tone: 'crit' },
  none: { label: 'No billing', tone: 'mute' },
};

/* The `plan` column is legacy: one product now, priced by roll. These options
   remain so existing rows still render a label. */
export const SCHOOL_PLAN_OPTIONS = Object.entries(PLAN_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const SCHOOL_STATUS_OPTIONS = Object.entries(SCHOOL_STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const BILLING_STATUS_OPTIONS = Object.entries(BILLING_STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export function canAccessSuperAdmin(user, allowedRoles = SUPER_ADMIN_ALLOWED_ROLES) {
  return !!user && allowedRoles.includes(user.role);
}

export function getPlanMeta(plan) {
  return PLAN_META[plan] || PLAN_META[DEFAULT_SCHOOL_PLAN];
}

export function getSchoolStatusMeta(status) {
  return SCHOOL_STATUS_META[status] || { label: status || 'Unknown', tone: 'mute' };
}

export function getBillingStatusMeta(status) {
  // The database has both spellings in the wild; normalise before lookup.
  const key = status === 'cancelled' ? 'canceled' : (status || 'none');
  return BILLING_STATUS_META[key] || { label: key, tone: 'mute' };
}

export function isPaidSchool(school) {
  return school?.billing_status === 'active' || school?.billing_status === 'past_due';
}

export function isAtRiskSchool(school) {
  return school?.status === 'suspended' || school?.billing_status === 'past_due' || school?.billing_status === 'canceled';
}

export function getSchoolHealthIssues(school) {
  const issues = [];
  if (school?.status === 'suspended') issues.push('School is suspended');
  if (school?.billing_status === 'past_due') issues.push('Payment is past due');
  if (school?.billing_status === 'incomplete') issues.push('Billing setup incomplete');
  if (school?.status === 'onboarding') issues.push('School is still in setup phase');
  return issues;
}