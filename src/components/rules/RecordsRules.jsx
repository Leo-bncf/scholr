import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
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

export default function RecordsRules() {
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
    <div className="space-y-4">
      {!isLoading && (
        <>
          <ChangeReasonEnforcement
            policy={policyForm}
            onChange={handleChange}
            onSave={handleSave}
            saving={saveMutation.isPending}
          />
          <DataRetentionPanel
            policy={policyForm}
            onChange={handleChange}
            onSave={handleSave}
            saving={saveMutation.isPending}
            schoolId={schoolId}
          />
          <PrivacyRequestsPanel
            policy={policyForm}
            onChange={handleChange}
            onSave={handleSave}
            saving={saveMutation.isPending}
            schoolId={schoolId}
            user={user}
          />
        </>
      )}
      {/* The audit log is long and is a record rather than a setting, so it
          sits last — you scroll to it deliberately. */}
      <AuditLogViewer schoolId={schoolId} />
    </div>
  );
}
