import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  ShieldAlert, CheckCircle, Loader2, UserX, RefreshCw, Trash2, Info, Wand2
} from 'lucide-react';
import { ROLE_CONFIG } from './userConstants';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';

export default function MembershipHealthTab({ schoolId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // { id, title, description, confirmLabel } — null when closed
  const [pendingDelete, setPendingDelete] = useState(null);
  const [fixAllOpen, setFixAllOpen] = useState(false);
  const [fixingAll, setFixingAll] = useState(false);

  const { data: memberships = [], isLoading: loadingMemberships } = useQuery({
    queryKey: ['school-memberships', schoolId],
    queryFn: () => base44.entities.SchoolMembership.filter({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: allSchoolMemberships = [], isLoading: loadingAll } = useQuery({
    queryKey: ['all-school-memberships'],
    queryFn: () => base44.entities.SchoolMembership.list(),
    enabled: !!schoolId,
  });

  const isLoading = loadingMemberships || loadingAll;

  // --- Health checks ---

  // 1. Orphan memberships: school_id missing or blank
  const orphans = allSchoolMemberships.filter(m => !m.school_id);

  // 2. Duplicate memberships: same user_email in same school.
  // Keep the most-recently-created record and flag the others as removable extras.
  // So 3 copies of the same account = 2 duplicates (not 3).
  const emailGroups = {};
  memberships.forEach(m => {
    const key = m.user_email?.toLowerCase();
    if (!key) return;
    emailGroups[key] = (emailGroups[key] || []).concat(m);
  });
  const duplicates = Object.values(emailGroups)
    .filter(arr => arr.length > 1)
    .flatMap(arr => {
      const sorted = [...arr].sort(
        (a, b) => new Date(b.created_date) - new Date(a.created_date)
      );
      return sorted.slice(1); // drop the newest, flag the rest
    });

  // 3. Missing email
  const missingEmail = memberships.filter(m => !m.user_email);

  // 4. Invalid roles
  const validRoles = Object.keys(ROLE_CONFIG);
  const invalidRoles = memberships.filter(m => m.role && !validRoles.includes(m.role));

  // 5. Long-pending (pending > 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const stalePending = memberships.filter(m =>
    m.status === 'pending' && new Date(m.created_date) < thirtyDaysAgo
  );

  const totalIssues = orphans.length + duplicates.length + missingEmail.length + invalidRoles.length;

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await base44.functions.invoke('removeSchoolMember', { membershipId: id });
      const errMsg = res?.data?.error || res?.error;
      if (errMsg) throw new Error(errMsg);
      return res?.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['school-memberships', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['all-school-memberships'] });
      toast({
        title: data?.note === 'already gone' ? 'Stale record cleared' : 'Membership removed',
      });
    },
    onError: (err) => {
      toast({
        title: 'Could not remove membership',
        description: err?.message || 'Unknown error — please try again.',
        variant: 'destructive',
      });
    },
  });

  const fixStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.SchoolMembership.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['school-memberships', schoolId] }),
  });

  // Fix everything: delete orphans, duplicates, missing-email rows; suspend invalid-role rows.
  // Stale-pending rows are intentionally NOT touched (they require a human call on activate vs remove).
  const runFixEverything = async () => {
    setFixingAll(true);
    const toDelete = [...orphans, ...duplicates, ...missingEmail];
    const toSuspend = invalidRoles;
    let fixed = 0;
    const failures = [];

    for (const m of toDelete) {
      try {
        const res = await base44.functions.invoke('removeSchoolMember', { membershipId: m.id });
        const errMsg = res?.data?.error || res?.error;
        if (errMsg) throw new Error(errMsg);
        fixed++;
      } catch (e) {
        failures.push({ id: m.id, error: e?.message || 'delete failed' });
      }
    }

    for (const m of toSuspend) {
      try {
        await base44.entities.SchoolMembership.update(m.id, { status: 'inactive' });
        fixed++;
      } catch (e) {
        failures.push({ id: m.id, error: e?.message || 'update failed' });
      }
    }

    queryClient.invalidateQueries({ queryKey: ['school-memberships', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['all-school-memberships'] });
    setFixingAll(false);
    setFixAllOpen(false);

    if (failures.length === 0) {
      toast({ title: `Fixed ${fixed} issue${fixed !== 1 ? 's' : ''}` });
    } else {
      toast({
        title: `Fixed ${fixed}, failed ${failures.length}`,
        description: failures.slice(0, 3).map(f => f.error).join(' · ') + (failures.length > 3 ? '…' : ''),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
      </div>
    );
  }

  if (totalIssues === 0 && stalePending.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">All memberships look healthy</h3>
        <p className="text-sm text-slate-500">
          No orphan accounts, no duplicates, no missing data. {memberships.length} active memberships in good shape.
        </p>
        <Alert className="border-blue-200 bg-blue-50 text-left">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-700">
            This check runs on your school's memberships. It detects orphan accounts (no school), duplicates, missing emails, invalid roles, and long-pending (30+ day) invitations.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const IssueSection = ({ title, description, severity, items, renderItem }) => {
    if (!items || items.length === 0) return null;
    const colors = {
      high:   'bg-red-50 border-red-200 text-red-700',
      medium: 'bg-amber-50 border-amber-200 text-amber-700',
      low:    'bg-slate-50 border-slate-200 text-slate-600',
    };
    const dotColors = { high: 'bg-red-500', medium: 'bg-amber-400', low: 'bg-slate-400' };
    return (
      <div className={`rounded-xl border p-4 ${colors[severity]}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${dotColors[severity]} mt-1 flex-shrink-0`} />
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs opacity-80 mt-0.5">{description}</p>
            </div>
          </div>
          <Badge className={`${colors[severity]} border text-xs flex-shrink-0`}>{items.length}</Badge>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => renderItem(item, i))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Membership Health Check</h3>
        <p className="text-xs text-slate-500">
          Detects and helps fix orphan accounts, duplicates, invalid data, and multi-school isolation issues.
        </p>
      </div>

      {totalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <AlertDescription className="text-xs text-red-700">
                Found <strong>{totalIssues} issue{totalIssues !== 1 ? 's' : ''}</strong> across your school memberships that require attention.
              </AlertDescription>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white gap-1 flex-shrink-0"
              onClick={() => setFixAllOpen(true)}
              disabled={fixingAll}
            >
              {fixingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
              Fix everything
            </Button>
          </div>
        </Alert>
      )}

      <IssueSection
        title="Orphan Accounts (No School)"
        description="These memberships have no school_id and cannot function correctly. They should be deleted."
        severity="high"
        items={orphans}
        renderItem={(m, i) => (
          <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
            <div>
              <p className="text-xs font-medium text-slate-800">{m.user_name || m.user_email || `ID: ${m.id}`}</p>
              <p className="text-[11px] text-slate-500">role: {m.role} · status: {m.status}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
              onClick={() => setPendingDelete({
                id: m.id,
                title: 'Delete orphan membership?',
                description: `This membership has no school assigned and cannot function. Deleting it permanently removes the record (the user account itself is not affected). This cannot be undone.`,
                confirmLabel: 'Delete orphan',
              })}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </Button>
          </div>
        )}
      />

      <IssueSection
        title="Duplicate Memberships"
        description="Multiple memberships for the same email in this school. Keep the most recent and remove extras."
        severity="high"
        items={duplicates}
        renderItem={(m, i) => (
          <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
            <div>
              <p className="text-xs font-medium text-slate-800">{m.user_email}</p>
              <p className="text-[11px] text-slate-500">role: {ROLE_CONFIG[m.role]?.label || m.role} · id: {m.id?.slice(-8)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
              onClick={() => setPendingDelete({
                id: m.id,
                title: 'Remove duplicate membership?',
                description: `${m.user_email} has more than one membership in this school. Removing this entry (id …${m.id?.slice(-8)}) will not affect the user's other membership(s) or their account. This cannot be undone.`,
                confirmLabel: 'Remove duplicate',
              })}
            >
              <Trash2 className="w-3 h-3" /> Remove
            </Button>
          </div>
        )}
      />

      <IssueSection
        title="Missing Email Address"
        description="These memberships have no email and cannot receive invitations or be identified correctly."
        severity="medium"
        items={missingEmail}
        renderItem={(m, i) => (
          <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
            <div>
              <p className="text-xs font-medium text-slate-800">{m.user_name || `ID: ${m.id}`}</p>
              <p className="text-[11px] text-slate-500">role: {m.role} · created: {new Date(m.created_date).toLocaleDateString()}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
              onClick={() => setPendingDelete({
                id: m.id,
                title: 'Delete incomplete membership?',
                description: `This membership has no email address, so it cannot receive invitations or be linked to a real user. Deleting it permanently removes the record. This cannot be undone.`,
                confirmLabel: 'Delete record',
              })}
            >
              <Trash2 className="w-3 h-3" /> Delete
            </Button>
          </div>
        )}
      />

      <IssueSection
        title="Invalid Roles"
        description="These memberships have roles not recognized by the platform."
        severity="medium"
        items={invalidRoles}
        renderItem={(m, i) => (
          <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
            <div>
              <p className="text-xs font-medium text-slate-800">{m.user_email || m.user_name}</p>
              <p className="text-[11px] text-slate-500">current role: "{m.role}"</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 gap-1"
              onClick={() => fixStatusMutation.mutate({ id: m.id, status: 'inactive' })}
            >
              <UserX className="w-3 h-3" /> Suspend
            </Button>
          </div>
        )}
      />

      <IssueSection
        title="Long-Pending Accounts (30+ days)"
        description="These users have been in pending status for over 30 days and may need a nudge or removal."
        severity="low"
        items={stalePending}
        renderItem={(m, i) => (
          <div key={i} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
            <div>
              <p className="text-xs font-medium text-slate-800">{m.user_email || m.user_name}</p>
              <p className="text-[11px] text-slate-500">
                pending since {new Date(m.created_date).toLocaleDateString()} ·
                {ROLE_CONFIG[m.role]?.label || m.role}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1"
                onClick={() => fixStatusMutation.mutate({ id: m.id, status: 'active' })}
              >
                <RefreshCw className="w-3 h-3" /> Activate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 gap-1"
                onClick={() => setPendingDelete({
                  id: m.id,
                  title: 'Remove long-pending invitation?',
                  description: `${m.user_email || m.user_name || 'This user'} has been pending since ${new Date(m.created_date).toLocaleDateString()}. Removing them clears the membership; they would need a fresh invitation to rejoin. This cannot be undone.`,
                  confirmLabel: 'Remove member',
                })}
              >
                <Trash2 className="w-3 h-3" /> Remove
              </Button>
            </div>
          </div>
        )}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        title={pendingDelete?.title || 'Delete membership?'}
        description={pendingDelete?.description || ''}
        confirmLabel={deleteMutation.isPending ? 'Removing…' : (pendingDelete?.confirmLabel || 'Delete')}
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteMutation.mutate(pendingDelete.id, {
            onSettled: () => setPendingDelete(null),
          });
        }}
        onCancel={() => !deleteMutation.isPending && setPendingDelete(null)}
      />

      <ConfirmDialog
        open={fixAllOpen}
        title="Fix everything?"
        description={
          `This will automatically resolve ${totalIssues} issue${totalIssues !== 1 ? 's' : ''}:\n` +
          `• Delete ${orphans.length} orphan membership${orphans.length !== 1 ? 's' : ''}\n` +
          `• Remove ${duplicates.length} duplicate${duplicates.length !== 1 ? 's' : ''} (keeps the most recent copy per user)\n` +
          `• Delete ${missingEmail.length} record${missingEmail.length !== 1 ? 's' : ''} missing an email\n` +
          `• Suspend ${invalidRoles.length} user${invalidRoles.length !== 1 ? 's' : ''} with invalid roles\n\n` +
          `Long-pending invitations are left alone — review them manually. This cannot be undone.`
        }
        confirmLabel={fixingAll ? 'Fixing…' : 'Fix everything'}
        cancelLabel="Cancel"
        isDestructive
        onConfirm={runFixEverything}
        onCancel={() => !fixingAll && setFixAllOpen(false)}
      />
    </div>
  );
}