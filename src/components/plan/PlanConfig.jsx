import { annualCost } from '@/lib/pricing';
// Student-based pricing tiers
// Starter:    up to 200 students  @ €24/student/yr
// Growth:     201–600 students    @ €20/student/yr
// Enterprise: 600+ students       @ €16/student/yr
// Teachers are UNLIMITED on all plans.

export const PLAN_LIMITS = {
  starter: {
    max_students: 200,
    max_teachers: -1, // unlimited
    max_classes: -1,  // unlimited
    modules: ['core', 'gradebook', 'assignments', 'attendance'],
    features: {
      parent_portal: false,
      timetable_integration: false,
      advanced_analytics: false,
      predicted_grades: false,
      rubric_grading: false,
      bulk_operations: false,
      api_access: false,
      custom_reports: false,
      audit_logs: false,
    },
  },
  growth: {
    max_students: 600,
    max_teachers: -1,
    max_classes: -1,
    modules: ['core', 'gradebook', 'assignments', 'attendance', 'ib_core', 'behavior', 'messaging'],
    features: {
      parent_portal: true,
      timetable_integration: true,
      advanced_analytics: true,
      predicted_grades: true,
      rubric_grading: true,
      bulk_operations: true,
      api_access: false,
      custom_reports: true,
      audit_logs: true,
    },
  },
  enterprise: {
    max_students: -1, // unlimited
    max_teachers: -1,
    max_classes: -1,
    modules: ['core', 'gradebook', 'assignments', 'attendance', 'ib_core', 'behavior', 'messaging', 'timetable'],
    features: {
      parent_portal: true,
      timetable_integration: true,
      advanced_analytics: true,
      predicted_grades: true,
      rubric_grading: true,
      bulk_operations: true,
      api_access: true,
      custom_reports: true,
      audit_logs: true,
    },
  },
};

export const PLAN_NAMES = {
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
};

export const PLAN_DESCRIPTIONS = {
  starter: 'Up to 200 students',
  growth: '201–600 students',
  enterprise: '600+ students / multi-campus',
};

// Price IDs in Stripe (per student per year)
/* Stripe products predating the graduated model — one flat price ID per plan.
   They must be replaced with a single tiered price before billing is switched
   on, or Stripe will charge the old flat rates regardless of what this app
   computes. Left in place, and unused, so the migration is visible. */
export const STRIPE_PRICE_IDS_LEGACY_FLAT = {
  starter:    'price_1TCqN7BCrwoLhJNy0ZUAckNW',
  growth:     'price_1TCqN7BCrwoLhJNydURe3Oyz',
  enterprise: 'price_1TCqN7BCrwoLhJNyELaRhBGI',
};

// Calculate annual cost for a given plan + student count
/**
 * What a school pays for a year, from src/lib/pricing.js.
 *
 * This used to be `limits.price_per_student * studentCount`, with the rate
 * taken from the plan — €24, €20 or €16 depending on which band the school
 * fell in. That is the flat-rate scheme that made a 201-pupil school cheaper
 * than a 199-pupil one, and its rates were 14% above what the public site
 * advertised. The plan argument is ignored and kept only so the existing call
 * sites did not all have to change at once.
 */
export function calcAnnualCost(_plan, studentCount) {
  return annualCost(studentCount);
}

// Determine which plan applies for a given student count
export function getPlanForStudentCount(count) {
  if (count <= 200) return 'starter';
  if (count <= 600) return 'growth';
  return 'enterprise';
}

// Check if a school can access a specific feature
export function canAccessFeature(plan, feature) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
  return limits.features[feature] === true;
}

// Check if a school can access a specific module
export function canAccessModule(plan, module) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
  return limits.modules.includes(module);
}

// Get limit value for a plan
export function getPlanLimit(plan, limitKey) {
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
  return limits[limitKey];
}

// Check if school is within student limits
export function isWithinStudentLimit(plan, studentCount) {
  const limit = getPlanLimit(plan, 'max_students');
  if (limit === -1) return true;
  return studentCount <= limit;
}

// Get all available plans for upgrade from current
export function getUpgradePlans(currentPlan) {
  const planOrder = ['starter', 'growth', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);
  return planOrder.slice(currentIndex + 1);
}

// Legacy compat — keep PLAN_PRICES pointing to per-student rates
export const PLAN_PRICES = {
  starter: 24,
  growth: 20,
  enterprise: 16,
  // legacy keys
  professional: 20,
};