import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { Button } from '@/components/ui/button';
import {
  MessageSquare, Lock, Moon, Shield, Loader2, Save, CheckCircle2,
} from 'lucide-react';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import { DEFAULT_MESSAGING_POLICY } from '@/hooks/useMessagingPolicy';
import PermissionRulesPanel from '@/components/messaging-policy/PermissionRulesPanel';
import AnnouncementsGovernancePanel from '@/components/messaging-policy/AnnouncementsGovernancePanel';
import QuietHoursPanel from '@/components/messaging-policy/QuietHoursPanel';
import CompliancePanel from '@/components/messaging-policy/CompliancePanel';
import { logAudit, AuditActions, AuditLevels } from '@/components/utils/auditLogger';
import * as messagingPoliciesData from '@/data/messagingPolicies';



const TABS = [
  { id: 'permissions',    label: 'Permission Rules',          icon: Lock,           desc: 'Control who can message whom' },
  { id: 'announcements',  label: 'Announcements Governance',  icon: MessageSquare,  desc: 'Broadcast rights & dashboard visibility' },
  { id: 'quiet',          label: 'Quiet Hours & Notifications', icon: Moon,         desc: 'Communication windows & notification defaults' },
  { id: 'compliance',     label: 'Compliance',                icon: Shield,         desc: 'Metadata retention & safeguarding controls' },
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
        details: `Messaging & Communication Policy updated by ${user?.full_name || user?.email}`,
        level: AuditLevels.INFO,
        schoolId,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleChange = (partial) => setForm(prev => ({ ...prev, ...partial }));

  return (
    <RoleGuard allowedRoles={['school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar
          links={SCHOOL_ADMIN_SIDEBAR_LINKS}
          role="school_admin"
          schoolName={school?.name}
          userName={user?.full_name}
          userId={user?.id}
          schoolId={schoolId}
        />

        <main className="md:ml-64 min-h-screen">
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Messaging & Communication Policy
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">{school?.name} · Govern communication across the platform</p>
              </div>
              <div className="flex items-center gap-3">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Saved
                  </span>
                )}
                <Button
                  onClick={() => form && saveMutation.mutate(form)}
                  disabled={saveMutation.isPending || !form}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Policy
                </Button>
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="bg-white border-b border-slate-200 px-6">
            <div className="max-w-5xl mx-auto flex gap-1 -mb-px overflow-x-auto">
              {TABS.map(t => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      active ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="max-w-5xl mx-auto p-6">
            {isLoading || !form ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : (
              <>
                {tab === 'permissions'   && <PermissionRulesPanel form={form} onChange={handleChange} />}
                {tab === 'announcements' && <AnnouncementsGovernancePanel form={form} onChange={handleChange} />}
                {tab === 'quiet'         && <QuietHoursPanel form={form} onChange={handleChange} />}
                {tab === 'compliance'    && <CompliancePanel form={form} onChange={handleChange} />}

                <div className="flex justify-end mt-8">
                  <Button
                    onClick={() => saveMutation.mutate(form)}
                    disabled={saveMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Policy
                  </Button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}