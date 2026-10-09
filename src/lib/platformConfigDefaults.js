import { SCHOOL_TRIAL_DURATION_DAYS } from '@/components/admin/super-admin/superAdminConfig';

/**
 * What the platform behaves as when nothing has been configured, and what a
 * new platform_config row starts from.
 *
 * Shared by both settings pages so that creating the row from the console
 * can't silently switch anything off: the console reads a missing feature
 * flag as "off", so a row created with empty flags would have shown every
 * feature disabled.
 */
export const DEFAULT_PLATFORM_CONFIG = {
  name: 'default',
  default_trial_days: SCHOOL_TRIAL_DURATION_DAYS,
  default_notification_email: '',
  allow_school_brand_overrides: true,
  theme_mode: 'light',
  default_primary_color: '#4f46e5',
  default_accent_color: '#0f172a',
  default_logo_url: '',
  notifications: {
    billing_alerts: true,
    onboarding_alerts: true,
    security_alerts: true,
    weekly_digest: false,
  },
  integration_settings: {
    google_drive_enabled: true,
    stripe_billing_enabled: true,
  },
  global_feature_flags: {
    advanced_analytics: true,
    messaging: true,
    attendance: true,
    behavior_tracking: true,
    report_builder: true,
  },
  school_feature_overrides: [],
};
