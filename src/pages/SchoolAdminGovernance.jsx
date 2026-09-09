import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Shield, ScrollText, Lock, Database, UserX } from 'lucide-react';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import AuditLogViewer from '@/components/governance/AuditLogViewer';
import ChangeReasonEnforcement from '@/components/governance/ChangeReasonEnforcement';
import DataRetentionPanel from '@/components/governance/DataRetentionPanel';
import PrivacyRequestsPanel from '@/components/governance/PrivacyRequestsPanel';
import * as governancePoliciesData from '@/data/governancePolicies';



const DEFAULT_POLICY = {
  reason_enforcement: {
    grade_edit_after_lock: true,
    attendance_correction: true,
    behavior_record_delete: true,
    role_change: true,
    class_structure_change: false,
    parent_student_link_change: true,
    grade_visibility_override: false,
    predicted_grade_edit: true,
  },
  retention: {
    archived_class_data_days: 1825,
    submission_files_days: 1825,
    audit_log_days: 730,
    behavior_records_days: 1825,
    attendance_records_days: 2555,
    message_metadata_days: 365,
    purge_inactive_accounts_days: 0,
  },
  privacy: {
    privacy_requests_enabled: true,
    gdpr_jurisdiction: 'none',
    require_identity_verification: true,
    auto_acknowledge_requests_days: 3,
  },
  audit: {
    log_grade_edits: true,
    log_attendance_edits: true,
    log_behavior_edits: true,
    log_role_changes: true,
    log_data_exports: true,
    log_login_events: false,
  },
};

export default function SchoolAdminGovernance() {
  const { user, school: contextSchool, schoolId } = useUser();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState(null);
  const [policyForm, setPolicyForm] = useState(DEFAULT_POLICY);

  const { data: policyRecord, isLoading } = useQuery({
    queryKey: ['governance-policy', schoolId],
    queryFn: async () => {
      const results = await governancePoliciesData.where({ school_id: schoolId });
      return results[0] || null;
    },
    enabled: !!schoolId,
  });

  useEffect(() => {
    if (policyRecord) {
      setPolicyForm({
        ...DEFAULT_POLICY,
        ...policyRecord,
        reason_enforcement: { ...DEFAULT_POLICY.reason_enforcement, ...(policyRecord.reason_enforcement || {}) },
        retention: { ...DEFAULT_POLICY.retention, ...(policyRecord.retention || {}) },
        privacy: { ...DEFAULT_POLICY.privacy, ...(policyRecord.privacy || {}) },
        audit: { ...DEFAULT_POLICY.audit, ...(policyRecord.audit || {}) },
      });
    }
  }, [policyRecord?.id]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, school_id: schoolId };
      return policyRecord
        ? governancePoliciesData.update(policyRecord.id, payload)
        : governancePoliciesData.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['governance-policy', schoolId] });
      showMessage('success', 'Governance policy saved.');
    },
    onError: () => showMessage('error', 'Failed to save policy.'),
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const handleChange = (partial) => {
    setPolicyForm(prev => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(partial)) {
        if (typeof v === 'object' && !Array.isArray(v)) {
          next[k] = { ...(prev[k] || {}), ...v };
        } else {
          next[k] = v;
        }
      }
      return next;
    });
  };

  const handleSave = () => saveMutation.mutate(policyForm);

  return (
    <RoleGuard allowedRoles={['school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar
          links={SCHOOL_ADMIN_SIDEBAR_LINKS}
          role="school_admin"
          schoolName={contextSchool?.name}
          userName={user?.full_name}
          userId={user?.id}
          schoolId={schoolId}
        />

        <main className="md:ml-64">
          <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-100 rounded-lg p-1.5">
                <Shield className="w-4 h-4 text-indigo-700" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight">Audit, Compliance & Data Governance</h1>
                <p className="text-xs text-slate-400 mt-0.5">School-scoped audit trail, change controls, retention policy, and privacy request management</p>
              </div>
            </div>
          </div>

          {message && (
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

          <div className="p-6 max-w-6xl">
            <Tabs defaultValue="audit">
              <TabsList className="bg-white border border-slate-200 h-auto mb-6 flex-wrap">
                <TabsTrigger value="audit" className="text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                  <ScrollText className="w-3.5 h-3.5" /> Audit Log
                </TabsTrigger>
                <TabsTrigger value="reasons" className="text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                  <Lock className="w-3.5 h-3.5" /> Reason Enforcement
                </TabsTrigger>
                <TabsTrigger value="retention" className="text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                  <Database className="w-3.5 h-3.5" /> Data Retention
                </TabsTrigger>
                <TabsTrigger value="privacy" className="text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                  <UserX className="w-3.5 h-3.5" /> Privacy Requests
                </TabsTrigger>
              </TabsList>

              <TabsContent value="audit">
                <AuditLogViewer schoolId={schoolId} />
              </TabsContent>

              <TabsContent value="reasons">
                {!isLoading && (
                  <ChangeReasonEnforcement
                    policy={policyForm}
                    onChange={handleChange}
                    onSave={handleSave}
                    saving={saveMutation.isPending}
                  />
                )}
              </TabsContent>

              <TabsContent value="retention">
                {!isLoading && (
                  <DataRetentionPanel
                    policy={policyForm}
                    onChange={handleChange}
                    onSave={handleSave}
                    saving={saveMutation.isPending}
                    schoolId={schoolId}
                  />
                )}
              </TabsContent>

              <TabsContent value="privacy">
                {!isLoading && (
                  <PrivacyRequestsPanel
                    policy={policyForm}
                    onChange={handleChange}
                    onSave={handleSave}
                    saving={saveMutation.isPending}
                    schoolId={schoolId}
                    user={user}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}