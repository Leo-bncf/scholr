import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as admin from '@/data/admin';
import * as schoolsData from '@/data/schools';
import * as membershipsData from '@/data/memberships';
import * as fns from '@/data/functions';
import {
  getPlanPrice,
  getSchoolHealthIssues,
  isAtRiskSchool,
  isPaidSchool,
} from '@/components/admin/super-admin/superAdminConfig';

const DEFAULT_STALE_TIME = 5 * 60 * 1000;

/**
 * Turn a school_stats row into the { progress, items } shape the onboarding
 * widgets already render.
 */
function buildOnboardingSummary(stats) {
  const items = [
    { label: 'School Profile', completed: true },
    { label: 'Academic Years', completed: (stats?.academic_years ?? 0) > 0 },
    { label: 'Terms', completed: (stats?.terms ?? 0) > 0 },
    { label: 'Subjects', completed: (stats?.subjects ?? 0) > 0 },
    { label: 'Classes', completed: (stats?.classes ?? 0) > 0 },
  ];
  const completed = items.filter((i) => i.completed).length;
  return { progress: (completed / items.length) * 100, items };
}

export function useSuperAdminSchoolsQuery(options = {}) {
  return useQuery({
    queryKey: ['super-admin', 'schools'],
    queryFn: () => schoolsData.list(),
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Schools plus their onboarding progress.
 *
 * One query against the school_stats view. This previously fetched every
 * academic year, term, subject and class on the platform (capped at 2000 each,
 * so it under-counted once there were more) purely to build count maps.
 */
export function useSuperAdminSchoolOverviewQuery(options = {}) {
  return useQuery({
    queryKey: ['super-admin', 'school-overview'],
    queryFn: async () => {
      const [schools, stats] = await Promise.all([schoolsData.list(), admin.listSchoolStats()]);
      const byId = Object.fromEntries(stats.map((s) => [s.school_id, s]));
      const onboardingBySchool = Object.fromEntries(
        schools.map((school) => [school.id, buildOnboardingSummary(byId[school.id])]),
      );
      return { schools, onboardingBySchool };
    },
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Every user on the platform.
 *
 * Goes through the `listAllUsers` edge function: profiles RLS only exposes
 * people you share a school with, so enumerating the platform needs the service
 * role. The function checks the caller is a super admin before doing so.
 */
export function useSuperAdminUsersQuery(options = {}) {
  return useQuery({
    queryKey: ['super-admin', 'users'],
    queryFn: async () => {
      const [schools, result] = await Promise.all([
        schoolsData.list(),
        fns.invoke('listAllUsers'),
      ]);

      const schoolNames = Object.fromEntries(schools.map((s) => [s.id, s.name]));
      const users = (result?.users ?? []).map((user) => ({
        ...user,
        school_name: user.active_school_id
          ? (schoolNames[user.active_school_id] ?? 'Unknown')
          : '—',
      }));

      return { schools, users };
    },
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

export function useSuperAdminAuditLogsQuery(options = {}) {
  return useQuery({
    queryKey: ['super-admin', 'audit-logs'],
    queryFn: () => admin.listAuditLogs({ limit: 500 }),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    ...options,
  });
}

export function useSuperAdminSchoolDetailQuery(schoolId, options = {}) {
  return useQuery({
    queryKey: ['super-admin', 'school-detail', schoolId],
    queryFn: async () => {
      const [school, stats, members] = await Promise.all([
        schoolsData.get(schoolId),
        admin.getSchoolStats(schoolId),
        membershipsData.listForSchool(schoolId, { status: null }),
      ]);

      return {
        school,
        stats: {
          academicYears: stats?.academic_years ?? 0,
          terms: stats?.terms ?? 0,
          subjects: stats?.subjects ?? 0,
          classes: stats?.classes ?? 0,
          staff: stats?.members ?? 0,
        },
        members,
      };
    },
    staleTime: DEFAULT_STALE_TIME,
    enabled: !!schoolId && (options.enabled ?? true),
    ...options,
  });
}

export function useSuperAdminConfigurationQuery(options = {}) {
  return useQuery({
    queryKey: ['super-admin', 'configuration'],
    queryFn: async () => {
      const [schools, config] = await Promise.all([
        schoolsData.list(),
        admin.getPlatformConfig(),
      ]);
      return { schools, config };
    },
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

/**
 * Platform analytics.
 *
 * Now sourced from the school_stats view plus a bounded audit-log window,
 * rather than pulling nine tables at 2000 rows each. Consumers that want
 * per-entity detail should query the relevant domain module for one school
 * instead of asking for the whole platform.
 */
export function useSuperAdminAnalyticsQuery(options = {}) {
  return useQuery({
    queryKey: ['super-admin', 'analytics'],
    queryFn: async () => {
      const [schools, stats, auditLogs, membershipDates] = await Promise.all([
        schoolsData.list(),
        admin.listSchoolStats(),
        admin.listAuditLogs({ limit: 1000 }),
        admin.listMembershipCreationDates(),
      ]);

      // Adoption is "does this school have any rows for that feature", which
      // the view already answers. Previously this fetched every message,
      // attendance record, behaviour note and CAS entry on the platform.
      const adoption = [
        { key: 'subjects', label: 'Curriculum Setup', column: 'subjects' },
        { key: 'classes', label: 'Classes', column: 'classes' },
        { key: 'messages', label: 'Messaging', column: 'messages' },
        { key: 'attendance', label: 'Attendance', column: 'attendance_records' },
        { key: 'behavior', label: 'Behavior', column: 'behavior_records' },
        { key: 'cas', label: 'CAS', column: 'cas_experiences' },
      ].map(({ label, column }) => {
        const adopted = stats.filter((s) => Number(s[column] ?? 0) > 0).length;
        return {
          feature: label,
          schools: adopted,
          adoptionRate: stats.length ? Math.round((adopted / stats.length) * 100) : 0,
        };
      });

      return { schools, stats, auditLogs, membershipDates, featureAdoption: adoption };
    },
    staleTime: DEFAULT_STALE_TIME,
    ...options,
  });
}

// ── Pure helpers, unchanged from the base44 version ─────────────────────────

export function usePaginatedItems(items, pageSize, page) {
  return useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;

    return {
      page: safePage,
      totalItems,
      totalPages,
      paginatedItems: items.slice(start, start + pageSize),
    };
  }, [items, page, pageSize]);
}

export function getSuperAdminPlatformMetrics(schools) {
  return {
    total: schools.length,
    active: schools.filter((school) => school.status === 'active').length,
    onboarding: schools.filter((school) => school.status === 'onboarding').length,
    trial: schools.filter((school) => school.billing_status === 'trial').length,
    paid: schools.filter((school) => isPaidSchool(school)).length,
    atRisk: schools.filter((school) => isAtRiskSchool(school)).length,
    suspended: schools.filter((school) => school.status === 'suspended').length,
  };
}

export function getSuperAdminBillingMetrics(schools) {
  const totalMRR = schools
    .filter((school) => school.billing_status === 'active')
    .reduce((sum, school) => sum + getPlanPrice(school.plan), 0);

  return {
    totalMRR,
    stats: {
      active: schools.filter((school) => school.billing_status === 'active').length,
      trial: schools.filter((school) => school.billing_status === 'trial').length,
      pastDue: schools.filter((school) => school.billing_status === 'past_due').length,
    },
  };
}

export function getSuperAdminPlanMetrics(schools) {
  const byPlan = {};
  const byBilling = {};

  schools.forEach((school) => {
    const plan = school.plan || 'unknown';
    const billing = school.billing_status || 'none';
    byPlan[plan] = (byPlan[plan] || 0) + 1;
    byBilling[billing] = (byBilling[billing] || 0) + 1;
  });

  const mrrEstimate = schools
    .filter((school) => school.billing_status === 'active')
    .reduce((sum, school) => sum + getPlanPrice(school.plan), 0);

  return {
    byPlan,
    byBilling,
    mrrEstimate,
    paidSchools: schools.filter((school) => school.billing_status === 'active').length,
    trialSchools: schools.filter((school) => school.billing_status === 'trial').length,
  };
}

export function getSuperAdminSchoolHealth(school) {
  const issues = getSchoolHealthIssues(school);
  return {
    issues,
    isAtRisk: issues.length > 0,
  };
}