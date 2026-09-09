import { useQuery } from '@tanstack/react-query';
import * as messagingPoliciesData from '@/data/messagingPolicies';

export const DEFAULT_MESSAGING_POLICY = {
  permission_rules: {
    student_to_teacher: true,
    teacher_to_student: true,
    parent_to_teacher: true,
    teacher_to_parent: true,
    student_to_student: false,
    parent_to_admin: true,
    admin_to_all: true,
    teacher_to_teacher: true,
    coordinator_to_all: true,
  },
  broadcast_rules: {
    roles_allowed_school_wide: ['school_admin', 'ib_coordinator'],
    roles_allowed_class_announcements: ['school_admin', 'ib_coordinator', 'teacher'],
    require_admin_approval_for_broadcast: false,
    max_broadcast_recipients_teacher: 0,
  },
  announcement_governance: {
    show_in_student_dashboard: true,
    show_in_parent_dashboard: true,
    show_in_teacher_dashboard: true,
    announcement_retention_days: 90,
    pin_duration_days: 7,
    allow_teacher_school_wide_announcements: false,
  },
  quiet_hours: {
    enabled: false,
    start_time: '18:00',
    end_time: '08:00',
    applies_to_roles: ['student', 'parent'],
    block_send_during_quiet: false,
    weekend_quiet_hours_enabled: false,
  },
  notification_defaults: {
    default_message_notifications: 'immediate',
    default_announcement_notifications: 'immediate',
    allow_user_notification_override: true,
  },
  compliance: {
    retain_message_metadata_days: 365,
    log_broadcast_events: true,
    log_message_events: false,
    flag_student_to_student: false,
    safeguarding_keywords_enabled: false,
    safeguarding_keywords: [],
    compliance_contact_email: '',
  },
};

/**
 * Returns the messaging policy for a school, merged with defaults.
 * canSend(senderRole, recipientRole) — checks if communication is permitted.
 * canBroadcast(senderRole, type) — checks if sender can send announcements of `type` ('school_wide'|'class').
 * isQuietHour() — returns true if current time is within school quiet hours.
 */
export function useMessagingPolicy(schoolId) {
  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['messaging-policy', schoolId],
    queryFn: () => messagingPoliciesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const raw = policies[0] || {};
  const policy = {
    ...DEFAULT_MESSAGING_POLICY,
    ...raw,
    permission_rules: { ...DEFAULT_MESSAGING_POLICY.permission_rules, ...(raw.permission_rules || {}) },
    broadcast_rules: { ...DEFAULT_MESSAGING_POLICY.broadcast_rules, ...(raw.broadcast_rules || {}) },
    announcement_governance: { ...DEFAULT_MESSAGING_POLICY.announcement_governance, ...(raw.announcement_governance || {}) },
    quiet_hours: { ...DEFAULT_MESSAGING_POLICY.quiet_hours, ...(raw.quiet_hours || {}) },
    notification_defaults: { ...DEFAULT_MESSAGING_POLICY.notification_defaults, ...(raw.notification_defaults || {}) },
    compliance: { ...DEFAULT_MESSAGING_POLICY.compliance, ...(raw.compliance || {}) },
  };

  function canSend(senderRole, recipientRole) {
    const pr = policy.permission_rules;
    if (senderRole === 'school_admin' || senderRole === 'super_admin' || senderRole === 'admin') return true;
    if (senderRole === 'ib_coordinator' && pr.coordinator_to_all) return true;
    if (senderRole === 'teacher' && recipientRole === 'student') return pr.teacher_to_student;
    if (senderRole === 'teacher' && recipientRole === 'parent') return pr.teacher_to_parent;
    if (senderRole === 'teacher' && recipientRole === 'teacher') return pr.teacher_to_teacher;
    if (senderRole === 'student' && recipientRole === 'teacher') return pr.student_to_teacher;
    if (senderRole === 'student' && recipientRole === 'student') return pr.student_to_student;
    if (senderRole === 'parent' && recipientRole === 'teacher') return pr.parent_to_teacher;
    if (senderRole === 'parent' && (recipientRole === 'school_admin' || recipientRole === 'ib_coordinator')) return pr.parent_to_admin;
    return false;
  }

  function canBroadcast(senderRole, type = 'school_wide') {
    const br = policy.broadcast_rules;
    if (type === 'school_wide') return br.roles_allowed_school_wide?.includes(senderRole);
    if (type === 'class') return br.roles_allowed_class_announcements?.includes(senderRole);
    return false;
  }

  function isQuietHour() {
    const qh = policy.quiet_hours;
    if (!qh.enabled) return false;
    const now = new Date();
    const [sh, sm] = qh.start_time.split(':').map(Number);
    const [eh, em] = qh.end_time.split(':').map(Number);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;
    if (startMinutes > endMinutes) {
      // overnight window e.g. 18:00 → 08:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }

  return { policy, policyRecord: policies[0] || null, isLoading, canSend, canBroadcast, isQuietHour };
}