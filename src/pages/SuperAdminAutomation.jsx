import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  BellRing,
  CheckCircle2,
  CreditCard,
  Info,
  Loader2,
  Mail,
  Plus,
  Save,
  Shield,
  Trash2,
  Workflow,
} from 'lucide-react';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminPageHeader from '@/components/admin/super-admin/SuperAdminPageHeader';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';

// ─── Default configs ─────────────────────────────────────────────────────────

const DEFAULT_ONBOARDING_STEPS = [
  { id: 'welcome_email', label: 'Send welcome email to school admin', enabled: true, delay_hours: 0 },
  { id: 'activate_features', label: 'Auto-activate default feature modules', enabled: true, delay_hours: 0 },
  { id: 'reminder_48h', label: 'Send 48h setup reminder if onboarding incomplete', enabled: true, delay_hours: 48 },
  { id: 'kickoff_call', label: 'Flag school for kickoff call scheduling', enabled: false, delay_hours: 24 },
  { id: 'trial_midpoint', label: 'Send trial midpoint check-in email', enabled: true, delay_hours: 360 },
];

const DEFAULT_ALERT_RULES = [
  { id: 'billing_failure', label: 'Billing payment failure', icon: CreditCard, severity: 'critical', enabled: true, notify_email: true, notify_dashboard: true },
  { id: 'trial_expiring', label: 'Trial expiring within 3 days', icon: Bell, severity: 'warning', enabled: true, notify_email: true, notify_dashboard: true },
  { id: 'school_suspended', label: 'School manually suspended', icon: Shield, severity: 'warning', enabled: true, notify_email: false, notify_dashboard: true },
  { id: 'security_incident', label: 'Security incident detected', icon: Shield, severity: 'critical', enabled: true, notify_email: true, notify_dashboard: true },
  { id: 'onboarding_stalled', label: 'School stalled in onboarding > 7 days', icon: Workflow, severity: 'info', enabled: false, notify_email: true, notify_dashboard: true },
  { id: 'high_error_rate', label: 'Backend error rate spike (> 5%)', icon: BellRing, severity: 'critical', enabled: true, notify_email: true, notify_dashboard: true },
];

const SEVERITY_META = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' },
  warning: { label: 'Warning', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  info: { label: 'Info', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, description, icon: Icon, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function OnboardingStepRow({ step, onChange, onDelete }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <Switch checked={step.enabled} onCheckedChange={(v) => onChange(step.id, 'enabled', v)} />
      <span className={`flex-1 text-sm ${step.enabled ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{step.label}</span>
      <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-shrink-0">
        <span>Delay:</span>
        <input
          type="number"
          min={0}
          value={step.delay_hours}
          onChange={(e) => onChange(step.id, 'delay_hours', Number(e.target.value))}
          className="w-14 border border-slate-200 rounded px-1.5 py-0.5 text-center text-xs"
        />
        <span>hrs</span>
      </div>
      <button onClick={() => onDelete(step.id)} className="text-slate-300 hover:text-red-500 transition-colors ml-1">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function AlertRuleRow({ rule, onChange }) {
  const Icon = rule.icon;
  const meta = SEVERITY_META[rule.severity] || SEVERITY_META.info;
  return (
    <div className={`flex items-center gap-3 py-3 border-b border-slate-100 last:border-0 ${!rule.enabled ? 'opacity-50' : ''}`}>
      <Switch checked={rule.enabled} onCheckedChange={(v) => onChange(rule.id, 'enabled', v)} />
      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <span className="flex-1 text-sm text-slate-800">{rule.label}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${meta.color}`}>{meta.label}</span>
      <div className="flex items-center gap-3 flex-shrink-0 text-xs text-slate-500">
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={rule.notify_email} onChange={(e) => onChange(rule.id, 'notify_email', e.target.checked)} className="w-3 h-3" />
          Email
        </label>
        <label className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={rule.notify_dashboard} onChange={(e) => onChange(rule.id, 'notify_dashboard', e.target.checked)} className="w-3 h-3" />
          Dashboard
        </label>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuperAdminAutomation() {
  const navigate = useNavigate();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);

  const [onboardingSteps, setOnboardingSteps] = useState(DEFAULT_ONBOARDING_STEPS);
  const [alertRules, setAlertRules] = useState(DEFAULT_ALERT_RULES);
  const [alertEmail, setAlertEmail] = useState('');
  const [newStepLabel, setNewStepLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleStepChange = (id, field, value) => {
    setOnboardingSteps((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleStepDelete = (id) => {
    setOnboardingSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddStep = () => {
    if (!newStepLabel.trim()) return;
    setOnboardingSteps((prev) => [
      ...prev,
      { id: `custom_${Date.now()}`, label: newStepLabel.trim(), enabled: true, delay_hours: 0 },
    ]);
    setNewStepLabel('');
  };

  const handleAlertChange = (id, field, value) => {
    setAlertRules((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    // Persist to PlatformConfig or similar — for now simulate save
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (isChecking) return <SuperAdminLoadingState />;
  if (!currentUser) return null;

  const enabledAlerts = alertRules.filter((r) => r.enabled).length;
  const enabledSteps = onboardingSteps.filter((s) => s.enabled).length;

  return (
    <SuperAdminShell activeItem="automation" currentUser={currentUser}>
      <SuperAdminPageHeader
        title="Advanced Automation"
        subtitle="Configure automated onboarding workflows and proactive alert rules"
        actions={
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Configuration
          </Button>
        }
      />

      {saved && (
        <Alert className="mb-5 bg-green-50 border-green-200">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800 ml-3 text-sm">Automation configuration saved successfully.</AlertDescription>
        </Alert>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Onboarding Steps', value: onboardingSteps.length, sub: `${enabledSteps} active`, color: 'text-indigo-600' },
          { label: 'Alert Rules', value: alertRules.length, sub: `${enabledAlerts} active`, color: 'text-amber-600' },
          { label: 'Email Notifications', value: alertRules.filter((r) => r.enabled && r.notify_email).length, sub: 'active alerts', color: 'text-blue-600' },
          { label: 'Dashboard Alerts', value: alertRules.filter((r) => r.enabled && r.notify_dashboard).length, sub: 'active alerts', color: 'text-emerald-600' },
        ].map((m) => (
          <div key={m.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs text-slate-500">{m.label}</p>
            <p className={`text-2xl font-bold mt-1 ${m.color}`}>{m.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Onboarding Workflow */}
        <SectionCard
          icon={Workflow}
          title="Automated Onboarding Workflow"
          description="Steps executed automatically when a new school is created. Drag to reorder (coming soon)."
        >
          <div className="mb-4">
            {onboardingSteps.map((step) => (
              <OnboardingStepRow key={step.id} step={step} onChange={handleStepChange} onDelete={handleStepDelete} />
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            <Input
              placeholder="New step description..."
              value={newStepLabel}
              onChange={(e) => setNewStepLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
              className="text-sm"
            />
            <Button variant="outline" size="sm" onClick={handleAddStep} disabled={!newStepLabel.trim()} className="flex-shrink-0 gap-1">
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          </div>

          <p className="text-xs text-slate-400 mt-3 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            Steps with a delay &gt; 0 hrs are scheduled relative to school creation time.
          </p>
        </SectionCard>

        {/* Alert Rules */}
        <SectionCard
          icon={BellRing}
          title="Proactive Alert Rules"
          description="Get notified the moment critical events occur across the platform."
        >
          <div className="mb-5">
            {alertRules.map((rule) => (
              <AlertRuleRow key={rule.id} rule={rule} onChange={handleAlertChange} />
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <Label className="text-xs font-medium text-slate-700">Alert notification email</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                type="email"
                placeholder="ops@yourplatform.com"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="text-sm"
              />
              <Button variant="outline" size="sm" className="flex-shrink-0 gap-1">
                <Mail className="w-3.5 h-3.5" />
                Set
              </Button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">All enabled email alerts will be sent to this address.</p>
          </div>
        </SectionCard>
      </div>
    </SuperAdminShell>
  );
}