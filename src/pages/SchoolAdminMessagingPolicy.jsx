import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import { Loader2,
} from 'lucide-react';
import { DEFAULT_MESSAGING_POLICY } from '@/hooks/useMessagingPolicy';
import PermissionRulesPanel from '@/components/messaging-policy/PermissionRulesPanel';
import AnnouncementsGovernancePanel from '@/components/messaging-policy/AnnouncementsGovernancePanel';
import QuietHoursPanel from '@/components/messaging-policy/QuietHoursPanel';
import CompliancePanel from '@/components/messaging-policy/CompliancePanel';
import { logAudit, AuditActions, AuditLevels } from '@/components/utils/auditLogger';
import * as messagingPoliciesData from '@/data/messagingPolicies';



const TABS = [
  { value: 'permissions', label: 'Permissions' },
  { value: 'announcements', label: 'Announcements' },
  { value: 'quiet', label: 'Quiet hours' },
  { value: 'compliance', label: 'Compliance' },
];

function mergeDeep(defaults, saved) {
  const result = { ...defaults };
  if (!saved) return result;
  for (const key of Object.keys(defaults)) {
    if (saved[key] !== undefined && saved[key] !== null && typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
      result[key] = { ...defaults[key], ...saved[key] };
    } else if (saved[key] !== undefined) {
      result[key] = saved[key];
    }
  }
  return result;
}

export default function SchoolAdminMessagingPolicy() {
  const { user, school, schoolId } = useUser();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('permissions');
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['messaging-policy', schoolId],
    queryFn: () => messagingPoliciesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });
  const policyRecord = policies[0] || null;

  useEffect(() => {
    if (!isLoading) {
      setForm(mergeDeep(DEFAULT_MESSAGING_POLICY, policyRecord));
    }
  }, [isLoading, policyRecord?.id]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, school_id: schoolId };
      return policyRecord
        ? messagingPoliciesData.update(policyRecord.id, payload)
        : messagingPoliciesData.create(payload);
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['messaging-policy', schoolId] });
      await logAudit({
        action: AuditActions.SCHOOL_SETTINGS_CHANGED,
        entityType: 'MessagingPolicy',
        entityId: schoolId,
        details: `Messaging rules updated by ${user?.full_name || user?.email}`,
        level: AuditLevels.INFO,
        schoolId,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleChange = (partial) => setForm(prev => ({ ...prev, ...partial }));

  return (
    <SchoolAdminPage
      title="Messaging rules"
      eyebrow="Who may message whom, and when"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      actions={
        <button
          type="button"
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending || !form}
          className="pub-btn pub-btn-primary scholr-focus"
        >
          {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save rules
        </button>
      }
      related={[['Messages', 'Messages'], ['SchoolAdminUsers', 'Users'], ['SchoolAdminSettings', 'Settings']]}
    >
            {isLoading || !form ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin scholr-accent" />
              </div>
            ) : (
              <>
                {tab === 'permissions'   && <PermissionRulesPanel form={form} onChange={handleChange} />}
                {tab === 'announcements' && <AnnouncementsGovernancePanel form={form} onChange={handleChange} />}
                {tab === 'quiet'         && <QuietHoursPanel form={form} onChange={handleChange} />}
                {tab === 'compliance'    && <CompliancePanel form={form} onChange={handleChange} />}
              </>
            )}
    </SchoolAdminPage>
  );
}