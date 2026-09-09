import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CheckCircle2, Loader2, Palette, Settings } from 'lucide-react';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminPageHeader from '@/components/admin/super-admin/SuperAdminPageHeader';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import ConfigSectionCard from '@/components/admin/super-admin/settings/ConfigSectionCard';
import FeatureFlagToggleGroup from '@/components/admin/super-admin/settings/FeatureFlagToggleGroup';
import SchoolOverridesTable from '@/components/admin/super-admin/settings/SchoolOverridesTable';
import IntegrationStatusCard from '@/components/admin/super-admin/operational/IntegrationStatusCard';
import AnnouncementsPanel from '@/components/admin/super-admin/operational/AnnouncementsPanel';
import MaintenanceModePanel from '@/components/admin/super-admin/operational/MaintenanceModePanel';
import SystemHealthPanel from '@/components/admin/super-admin/operational/SystemHealthPanel';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import { useSuperAdminConfigurationQuery } from '@/components/hooks/useSuperAdminData';
import { DEFAULT_SCHOOL_PLAN, SCHOOL_PLAN_OPTIONS, SCHOOL_TRIAL_DURATION_DAYS } from '@/components/admin/super-admin/superAdminConfig';
import DataExportImport from '@/components/admin/super-admin/data/DataExportImport';
import DataIntegrityChecker from '@/components/admin/super-admin/data/DataIntegrityChecker';
import GdprPrivacyTools from '@/components/admin/super-admin/data/GdprPrivacyTools';
import * as admin from '@/data/admin';

const DEFAULT_CONFIG = {
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

const NOTIFICATION_FLAGS = [
  { key: 'billing_alerts', label: 'Billing alerts', description: 'Notify for failed payments and past-due schools.' },
  { key: 'onboarding_alerts', label: 'Onboarding alerts', description: 'Notify when schools stall during setup.' },
  { key: 'security_alerts', label: 'Security alerts', description: 'Notify for account locks and unusual activity.' },
  { key: 'weekly_digest', label: 'Weekly digest', description: 'Send a platform summary every week.' },
];

const INTEGRATION_FLAGS = [
  { key: 'google_drive_enabled', label: 'Google Drive integrations', description: 'Allow Drive-connected workflows platform-wide.' },
  { key: 'stripe_billing_enabled', label: 'Stripe billing', description: 'Enable subscription billing and billing management tools.' },
];

const FEATURE_FLAGS = [
  { key: 'advanced_analytics', label: 'Advanced Analytics', shortLabel: 'Analytics', description: 'Enable analytics dashboards and forecasting.' },
  { key: 'messaging', label: 'Messaging', shortLabel: 'Messaging', description: 'Enable messaging and announcement features.' },
  { key: 'attendance', label: 'Attendance', shortLabel: 'Attendance', description: 'Enable attendance tracking features.' },
  { key: 'behavior_tracking', label: 'Behavior Tracking', shortLabel: 'Behavior', description: 'Enable behavior records and interventions.' },
  { key: 'report_builder', label: 'Report Builder', shortLabel: 'Reports', description: 'Enable reporting and report publishing tools.' },
];

function mergeConfig(config) {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    notifications: { ...DEFAULT_CONFIG.notifications, ...(config?.notifications || {}) },
    integration_settings: { ...DEFAULT_CONFIG.integration_settings, ...(config?.integration_settings || {}) },
    global_feature_flags: { ...DEFAULT_CONFIG.global_feature_flags, ...(config?.global_feature_flags || {}) },
    school_feature_overrides: config?.school_feature_overrides || [],
  };
}

const TABS = [
  { key: 'config', label: 'Configuration' },
  { key: 'operational', label: 'Operational Tools' },
  { key: 'data', label: 'Data Management' },
];

export default function SuperAdminSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);
  const { data, isLoading } = useSuperAdminConfigurationQuery({ enabled: !!currentUser });
  const [formData, setFormData] = useState(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('config');

  const schools = data?.schools || [];
  const existingConfig = data?.config || null;

  useEffect(() => {
    if (!data) return;
    setFormData(mergeConfig(existingConfig));
  }, [data, existingConfig]);

  const overridesMap = useMemo(() => {
    return Object.fromEntries((formData.school_feature_overrides || []).map((item) => [item.school_id, item]));
  }, [formData.school_feature_overrides]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanedOverrides = (formData.school_feature_overrides || []).filter((item) =>
        FEATURE_FLAGS.some((flag) => item[flag.key] !== undefined)
      );

      const payload = {
        ...formData,
        school_feature_overrides: cleanedOverrides,
      };

      if (existingConfig?.id) {
        return admin.updatePlatformConfig(existingConfig.id, payload);
      }
      return admin.createPlatformConfig(payload);
    },
    onSuccess: async () => {
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: ['super-admin', 'configuration'] });
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const updateNested = (section, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const updateFeatureFlag = (key, value) => {
    updateNested('global_feature_flags', key, value);
  };

  const updateSchoolOverride = (school, key, value) => {
    setFormData((prev) => {
      const current = prev.school_feature_overrides || [];
      const existing = current.find((item) => item.school_id === school.id);
      const next = existing
        ? current.map((item) => item.school_id === school.id ? { ...item, [key]: value } : item)
        : [...current, { school_id: school.id, school_name: school.name, [key]: value }];

      return {
        ...prev,
        school_feature_overrides: next,
      };
    });
  };

  const resetSchoolOverride = (schoolId) => {
    setFormData((prev) => ({
      ...prev,
      school_feature_overrides: (prev.school_feature_overrides || []).filter((item) => item.school_id !== schoolId),
    }));
  };

  if (isChecking || isLoading) {
    return <SuperAdminLoadingState />;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <SuperAdminShell activeItem="settings" currentUser={currentUser}>
      <SuperAdminPageHeader
        title="Platform Settings"
        subtitle="Configuration, customization, and operational tools"
        actions={
          activeTab === 'config' ? (
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
              Save Changes
            </Button>
          ) : null
        }
      />

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {saved && (
        <Alert className="mb-5 bg-green-50 border-green-200">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800 ml-3 text-sm">Platform settings saved successfully.</AlertDescription>
        </Alert>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <ConfigSectionCard
          title="Global Settings"
          description="Control platform-wide defaults for new schools and notifications."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-sm font-medium text-slate-900">Default Trial Days</Label>
              <Input
                type="number"
                value={formData.default_trial_days}
                onChange={(e) => setFormData((prev) => ({ ...prev, default_trial_days: Number(e.target.value || 0) }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-900">Default School Plan</Label>
              <select
                value={DEFAULT_SCHOOL_PLAN}
                disabled
                className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm text-slate-500"
              >
                {SCHOOL_PLAN_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-slate-900">Notification Email</Label>
              <Input
                type="email"
                value={formData.default_notification_email}
                onChange={(e) => setFormData((prev) => ({ ...prev, default_notification_email: e.target.value }))}
                placeholder="ops@yourplatform.com"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-900">Theme Mode</Label>
              <select
                value={formData.theme_mode}
                onChange={(e) => setFormData((prev) => ({ ...prev, theme_mode: e.target.value }))}
                className="w-full mt-1.5 px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm text-slate-700"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="flex items-center justify-between border border-slate-200 rounded-lg px-3 py-2 mt-7 md:mt-0">
              <div>
                <p className="text-sm font-medium text-slate-900">Allow School Branding Overrides</p>
                <p className="text-xs text-slate-500">Schools can customize their own branding.</p>
              </div>
              <Switch
                checked={!!formData.allow_school_brand_overrides}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, allow_school_brand_overrides: checked }))}
              />
            </div>
          </div>

          <FeatureFlagToggleGroup
            title="Notification Preferences"
            items={NOTIFICATION_FLAGS}
            values={formData.notifications}
            onChange={(key, value) => updateNested('notifications', key, value)}
          />
        </ConfigSectionCard>

        <ConfigSectionCard
          title="Theming & Branding"
          description="Define the baseline brand style that schools inherit by default."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="text-sm font-medium text-slate-900">Primary Color</Label>
              <Input
                value={formData.default_primary_color}
                onChange={(e) => setFormData((prev) => ({ ...prev, default_primary_color: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-900">Accent Color</Label>
              <Input
                value={formData.default_accent_color}
                onChange={(e) => setFormData((prev) => ({ ...prev, default_accent_color: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium text-slate-900">Logo URL</Label>
              <Input
                value={formData.default_logo_url}
                onChange={(e) => setFormData((prev) => ({ ...prev, default_logo_url: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="mt-1.5"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-5 bg-slate-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: formData.default_primary_color }}>
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Brand Preview</p>
                <p className="text-xs text-slate-500">Inherited baseline style for schools</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="px-3 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: formData.default_primary_color }}>
                Primary Action
              </div>
              <div className="px-3 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: formData.default_accent_color, color: formData.default_accent_color }}>
                Accent Outline
              </div>
            </div>
          </div>
        </ConfigSectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <ConfigSectionCard
          title="Integration Settings"
          description="Enable or disable platform-wide integration surfaces."
        >
          <FeatureFlagToggleGroup
            items={INTEGRATION_FLAGS}
            values={formData.integration_settings}
            onChange={(key, value) => updateNested('integration_settings', key, value)}
          />
        </ConfigSectionCard>

        <ConfigSectionCard
          title="Global Feature Flags"
          description="Use feature flags for gradual rollout, A/B tests, and controlled launches."
        >
          <FeatureFlagToggleGroup
            items={FEATURE_FLAGS}
            values={formData.global_feature_flags}
            onChange={updateFeatureFlag}
          />
        </ConfigSectionCard>
      </div>

      <ConfigSectionCard
        title="School Feature Overrides"
        description="Override global feature flags for individual schools when needed."
      >
        <SchoolOverridesTable
          schools={schools}
          flags={FEATURE_FLAGS}
          overridesMap={overridesMap}
          onToggle={updateSchoolOverride}
          onReset={resetSchoolOverride}
        />

        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Use this for staged rollouts, pilot groups, and temporary school-specific experiments.
        </div>
      </ConfigSectionCard>
        </div>
      )}

      {activeTab === 'operational' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ConfigSectionCard
            title="Integration Management"
            description="Monitor external integrations across the platform."
          >
            <IntegrationStatusCard />
          </ConfigSectionCard>

          <ConfigSectionCard
            title="System Health"
            description="Live metrics for API performance, errors, and uptime."
          >
            <SystemHealthPanel />
          </ConfigSectionCard>

          <ConfigSectionCard
            title="Announcements & Communications"
            description="Send platform-wide or targeted messages to school admins."
          >
            <AnnouncementsPanel schools={schools} />
          </ConfigSectionCard>

          <ConfigSectionCard
            title="Maintenance Mode"
            description="Put the platform or individual schools into maintenance mode."
          >
            <MaintenanceModePanel schools={schools} />
          </ConfigSectionCard>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6">
          <ConfigSectionCard
            title="Export / Import"
            description="Download entity data as JSON for backups or migrations, or re-import from a previous export."
          >
            <DataExportImport />
          </ConfigSectionCard>

          <ConfigSectionCard
            title="Data Integrity Checks"
            description="Run automated scans to identify orphaned records, missing references, and other inconsistencies."
          >
            <DataIntegrityChecker />
          </ConfigSectionCard>

          <ConfigSectionCard
            title="GDPR / Privacy Tools"
            description="Look up a user by email to view, anonymize, or permanently delete all their personal data across the platform."
          >
            <GdprPrivacyTools />
          </ConfigSectionCard>
        </div>
      )}
    </SuperAdminShell>
  );
}