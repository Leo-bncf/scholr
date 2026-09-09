import { useQuery } from '@tanstack/react-query';
import * as gradebookPoliciesData from '@/data/gradebookPolicies';

export const DEFAULT_GRADEBOOK_POLICY = {
  grading_model: 'points_based',
  categories: [],
  allow_teacher_category_override: true,
  default_visible_to_student: false,
  default_visible_to_parent: false,
  feedback_only_mode: false,
  grade_release_mode: 'teacher_controlled',
  scheduled_release_date: null,
  allow_teacher_visibility_override: true,
  reporting_windows: [],
  lock_grades_after_deadline: false,
  require_justification_for_locked_edit: false,
  justification_min_chars: 20,
  admin_can_override_lock: true,
  predicted_grades_enabled: true,
  predicted_grade_entry_roles: ['teacher', 'ib_coordinator'],
  predicted_grades_require_rationale: true,
  coordinator_can_lock_predicted: true,
  predicted_grades_locked: false,
  predicted_grades_released_to_student: false,
  predicted_grades_released_to_parent: false,
};

export function useGradebookPolicy(schoolId) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['gradebook-policy', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const results = await gradebookPoliciesData.where({ school_id: schoolId });
      return results[0] || null;
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });

  const policy = data ? { ...DEFAULT_GRADEBOOK_POLICY, ...data } : { ...DEFAULT_GRADEBOOK_POLICY };

  // Derived helpers
  const isGradeLockedByWindow = (windowId) => {
    if (!policy.lock_grades_after_deadline) return false;
    const win = policy.reporting_windows?.find(w => w.id === windowId);
    if (!win) return false;
    return win.locked || (win.locks_at && new Date() > new Date(win.locks_at));
  };

  const canEditPredictedGrade = (userRole) => {
    if (!policy.predicted_grades_enabled) return false;
    if (policy.predicted_grades_locked) return false;
    return policy.predicted_grade_entry_roles?.includes(userRole);
  };

  return { policy, policyRecord: data, isLoading, refetch, isGradeLockedByWindow, canEditPredictedGrade };
}