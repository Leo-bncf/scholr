import React, { useState, useEffect } from 'react';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2, CheckCircle2, AlertCircle, Building2, Globe, Bell, BookOpen
} from 'lucide-react';
import { DEFAULT_POLICY } from '@/hooks/useSubmissionPolicy';
import { CURRICULUM_OPTIONS } from '@/lib/curriculumConfig';
import SubmissionRulesPanel from '@/components/settings/SubmissionRulesPanel';
import FileSecurityPanel from '@/components/settings/FileSecurityPanel';
import AcademicIntegrityPanel from '@/components/settings/AcademicIntegrityPanel';
import * as schoolsData from '@/data/schools';
import * as submissionPoliciesData from '@/data/submissionPolicies';

const TABS = [
  { value: 'school', label: 'School profile' },
  { value: 'submissions', label: 'Submissions' },
  { value: 'files', label: 'Files' },
  { value: 'integrity', label: 'Integrity' },
  { value: 'curriculum', label: 'Curriculum' },
];


const TIMEZONES = [
  'UTC', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid',
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney', 'Africa/Cairo',
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function SchoolAdminSettings() {
  const { user, school: contextSchool, schoolId } = useUser();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState(null);
  const [settingsTab, setSettingsTab] = useState('school');

  // ── School profile ──────────────────────────────────────────────────────────
  const { data: school, isLoading } = useQuery({
    queryKey: ['school-settings', schoolId],
    queryFn: async () => {
      const results = await schoolsData.where({ id: schoolId });
      return results[0];
    },
    enabled: !!schoolId,
  });

  const [profileForm, setProfileForm] = useState(null);

  useEffect(() => {
    if (school && !profileForm) {
      setProfileForm({
        name: school.name || '',
        email: school.email || '',
        phone: school.phone || '',
        city: school.city || '',
        country: school.country || '',
        address: school.address || '',
        timezone: school.timezone || 'UTC',
        academic_year_start_month: school.academic_year_start_month || 9,
        billing_email: school.billing_email || '',
      });
    }
  }, [school]);

  const updateSchoolMutation = useMutation({
    mutationFn: (data) => schoolsData.update(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-settings'] });
      queryClient.invalidateQueries({ queryKey: ['school', schoolId] });
      showMessage('success', 'School settings saved.');
    },
    onError: () => showMessage('error', 'Failed to save settings.'),
  });

  // ── Submission policy ───────────────────────────────────────────────────────
  const { data: policyRecord, isLoading: policyLoading } = useQuery({
    queryKey: ['submission-policy', schoolId],
    queryFn: async () => {
      const results = await submissionPoliciesData.where({ school_id: schoolId });
      return results[0] || null;
    },
    enabled: !!schoolId,
  });

  const [policyForm, setPolicyForm] = useState({ ...DEFAULT_POLICY });

  useEffect(() => {
    if (policyRecord) {
      setPolicyForm({ ...DEFAULT_POLICY, ...policyRecord });
    }
  }, [policyRecord?.id]);

  const updatePolicyMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, school_id: schoolId };
      return policyRecord
        ? submissionPoliciesData.update(policyRecord.id, payload)
        : submissionPoliciesData.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission-policy', schoolId] });
      showMessage('success', 'Governance policy saved.');
    },
    onError: () => showMessage('error', 'Failed to save policy.'),
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const policyOnChange = (partial) => setPolicyForm(prev => ({ ...prev, ...partial }));

  return (
    <SchoolAdminPage
      title="Settings"
      eyebrow="Profile, preferences and policy"
      tabs={TABS}
      activeTab={settingsTab}
      onTabChange={setSettingsTab}
      related={[["SchoolAdminGovernance","Governance"],["SchoolAdminGradebookGovernance","Gradebook rules"],["SchoolAdminBilling","Billing"]]}
    >          {message && (
            <div className="mx-6 mt-4">
              <Alert className={message.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
                {message.type === 'success'
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  : <AlertCircle className="w-4 h-4 text-red-600" />}
                <AlertDescription className={message.type === 'success' ? 'text-emerald-800' : 'text-red-800'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex-1 p-6 max-w-4xl">

              {/* ── SCHOOL PROFILE TAB ── */}
              {settingsTab === 'school' && <div>
                {isLoading || !profileForm ? (
                  <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin scholr-faint" /></div>
                ) : (
                  <form onSubmit={e => { e.preventDefault(); updateSchoolMutation.mutate(profileForm); }} className="space-y-5 max-w-2xl">
                    <Card className="shadow-none scholr-rule">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 scholr-muted" />
                          <CardTitle className="text-sm">School Profile</CardTitle>
                        </div>
                        <CardDescription className="text-xs">Basic information about your school</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-xs font-semibold">School Name *</Label>
                          <Input required value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className="mt-1" placeholder="e.g. International School of Paris" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-semibold">Contact Email</Label>
                            <Input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="mt-1" placeholder="admin@school.edu" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold">Phone</Label>
                            <Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="mt-1" placeholder="+1 234 567 890" />
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Address</Label>
                          <Input value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} className="mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-semibold">City</Label>
                            <Input value={profileForm.city} onChange={e => setProfileForm({ ...profileForm, city: e.target.value })} className="mt-1" />
                          </div>
                          <div>
                            <Label className="text-xs font-semibold">Country</Label>
                            <Input value={profileForm.country} onChange={e => setProfileForm({ ...profileForm, country: e.target.value })} className="mt-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-none scholr-rule">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 scholr-muted" />
                          <CardTitle className="text-sm">Academic Configuration</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-xs font-semibold">Timezone</Label>
                          <Select value={profileForm.timezone} onValueChange={v => setProfileForm({ ...profileForm, timezone: v })}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Academic Year Start Month</Label>
                          <Select value={String(profileForm.academic_year_start_month)} onValueChange={v => setProfileForm({ ...profileForm, academic_year_start_month: Number(v) })}>
                            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-none scholr-rule">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 scholr-muted" />
                          <CardTitle className="text-sm">Billing Contact</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Label className="text-xs font-semibold">Billing Email</Label>
                        <Input type="email" value={profileForm.billing_email} onChange={e => setProfileForm({ ...profileForm, billing_email: e.target.value })} className="mt-1" placeholder="billing@school.edu" />
                      </CardContent>
                    </Card>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateSchoolMutation.isPending} className="pub-btn pub-btn-primary">
                        {updateSchoolMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                        Save School Settings
                      </Button>
                    </div>
                  </form>
                )}
              </div>}

              {/* ── SUBMISSION RULES TAB ── */}
              {settingsTab === 'submissions' && (
                <div>
                  {policyLoading ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin scholr-faint" /></div>
                  ) : (
                    <div className="max-w-2xl space-y-5">
                      <div className="app-group p-5">
                        <SubmissionRulesPanel form={policyForm} onChange={policyOnChange} />
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => updatePolicyMutation.mutate(policyForm)} disabled={updatePolicyMutation.isPending} className="pub-btn pub-btn-primary">
                          {updatePolicyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                          Save Submission Policy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── FILE & STORAGE TAB ── */}
              {settingsTab === 'files' && (
                <div>
                  {policyLoading ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin scholr-faint" /></div>
                  ) : (
                    <div className="max-w-2xl space-y-5">
                      <div className="app-group p-5">
                        <FileSecurityPanel form={policyForm} onChange={policyOnChange} schoolId={schoolId} plan={school?.plan} />
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => updatePolicyMutation.mutate(policyForm)} disabled={updatePolicyMutation.isPending} className="pub-btn pub-btn-primary">
                          {updatePolicyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                          Save File Policy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── ACADEMIC INTEGRITY TAB ── */}
              {settingsTab === 'integrity' && (
                <div>
                  {policyLoading ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin scholr-faint" /></div>
                  ) : (
                    <div className="max-w-2xl space-y-5">
                      <div className="app-group p-5">
                        <AcademicIntegrityPanel form={policyForm} onChange={policyOnChange} />
                      </div>
                      <div className="flex justify-end">
                        <Button onClick={() => updatePolicyMutation.mutate(policyForm)} disabled={updatePolicyMutation.isPending} className="pub-btn pub-btn-primary">
                          {updatePolicyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                          Save Integrity Policy
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── CURRICULUM TAB ── */}
              {settingsTab === 'curriculum' && (
                <div>
                  {isLoading || !school ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin scholr-faint" /></div>
                  ) : (
                    <div className="max-w-2xl space-y-5">
                      <Card className="shadow-none scholr-rule">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 scholr-muted" />
                            <CardTitle className="text-sm">Curriculum System</CardTitle>
                          </div>
                          <CardDescription className="text-xs">
                            Changing the curriculum affects sidebar navigation, grading scales, coordinator roles, and feature availability across the platform.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            {CURRICULUM_OPTIONS.map(opt => (
                              <label
                                key={opt.value}
                                className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                                  school.curriculum === opt.value
                                    ? 'scholr-accent-rule scholr-accent-sf'
                                    : 'scholr-rule bg-white hover:scholr-sunk'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name="curriculum"
                                  value={opt.value}
                                  checked={school.curriculum === opt.value}
                                  onChange={() => updateSchoolMutation.mutate({ curriculum: opt.value })}
                                  className="mt-0.5 accent-indigo-600"
                                />
                                <div>
                                  <p className={`text-sm font-semibold ${school.curriculum === opt.value ? 'scholr-accent' : 'scholr-ink'}`}>{opt.label}</p>
                                  <p className="text-xs scholr-muted mt-0.5">{opt.description}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                          {updateSchoolMutation.isPending && (
                            <div className="flex items-center gap-2 text-sm scholr-muted">
                              <Loader2 className="w-4 h-4 animate-spin" /> Saving…
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              )}
          </div>
    </SchoolAdminPage>
  );
}