import { useQuery } from '@tanstack/react-query';
import * as submissionPoliciesData from '@/data/submissionPolicies';

export const DEFAULT_POLICY = {
  allowed_formats: ['file_upload', 'link', 'google_doc', 'google_slides', 'google_sheet'],
  default_primary_format: null,
  allow_teacher_format_override: true,
  late_submission_default: 'allowed',
  late_penalty_percent: 0,
  late_window_hours: 0,
  allow_teacher_late_override: true,
  allowed_file_extensions: [],
  max_file_size_mb: 50,
  max_files_per_submission: 10,
  retention_days_submissions: 1825,
  retention_days_attachments: 1825,
  plagiarism_flag_enabled: false,
  resubmission_limit: 0,
  show_submission_history_to_student: true,
  show_submission_history_to_teacher: true,
  require_submission_acknowledgement: false,
  acknowledgement_text: 'I confirm this is my own original work and I have not plagiarised any content.',
};

export function useSubmissionPolicy(schoolId) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['submission-policy', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const results = await submissionPoliciesData.where({ school_id: schoolId });
      return results[0] || null;
    },
    enabled: !!schoolId,
    staleTime: 5 * 60 * 1000,
  });

  const policy = data ? { ...DEFAULT_POLICY, ...data } : DEFAULT_POLICY;

  return { policy, policyRecord: data, isLoading, refetch };
}

export function validateFileForPolicy(file, policy) {
  const errors = [];

  if (policy.max_file_size_mb && file.size > policy.max_file_size_mb * 1024 * 1024) {
    errors.push(`File "${file.name}" exceeds the ${policy.max_file_size_mb}MB limit.`);
  }

  if (policy.allowed_file_extensions && policy.allowed_file_extensions.length > 0) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!policy.allowed_file_extensions.map(e => e.toLowerCase()).includes(ext)) {
      errors.push(`File type "${ext}" is not allowed. Allowed types: ${policy.allowed_file_extensions.join(', ')}`);
    }
  }

  return errors;
}

export function isFormatAllowedByPolicy(format, policy) {
  if (!policy.allowed_formats || policy.allowed_formats.length === 0) return true;
  return policy.allowed_formats.includes(format);
}

export function getLateSubmissionStatus(dueDate, policy) {
  const now = new Date();
  const due = new Date(dueDate);
  if (now <= due) return 'on_time';

  const hoursLate = (now - due) / (1000 * 60 * 60);

  if (policy.late_submission_default === 'blocked') return 'blocked';
  if (policy.late_window_hours > 0 && hoursLate > policy.late_window_hours) return 'blocked';

  return 'late';
}