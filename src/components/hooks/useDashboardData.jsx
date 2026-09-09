import { useQuery } from '@tanstack/react-query';
import * as schools from '@/data/schools';

/**
 * Dashboard queries.
 *
 * These are all cached with a generous staleTime — dashboards are re-entered
 * constantly and none of this changes minute to minute.
 */

/**
 * Counts behind the onboarding checklist.
 *
 * Resolved as five head-only counts in Postgres. This previously fetched
 * academic years, terms, subjects, classes and memberships in full and called
 * `.length` on each, which pulled thousands of rows to render five numbers.
 */
export function useSchoolMetrics(schoolId) {
  return useQuery({
    queryKey: ['school-metrics', schoolId],
    queryFn: () => schools.getSetupMetrics(schoolId),
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSchoolData(schoolId) {
  return useQuery({
    queryKey: ['school', schoolId],
    queryFn: () => schools.get(schoolId),
    enabled: !!schoolId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Every school the caller can see.
 *
 * For a super admin that's all of them; for anyone else RLS narrows it to their
 * own, so this is safe to call from shared components.
 */
export function useAllSchools(options = {}) {
  return useQuery({
    queryKey: ['schools'],
    queryFn: () => schools.list(),
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function usePlatformMetrics(schools = []) {
  return {
    total: schools.length,
    active: schools.filter((s) => s.status === 'active').length,
    onboarding: schools.filter((s) => s.status === 'onboarding').length,
    trial: schools.filter((s) => s.billing_status === 'trial').length,
    paid: schools.filter((s) => ['active', 'past_due'].includes(s.billing_status)).length,
    atRisk: schools.filter((s) => ['past_due', 'canceled'].includes(s.billing_status)).length,
    suspended: schools.filter((s) => s.status === 'suspended').length,
  };
}
