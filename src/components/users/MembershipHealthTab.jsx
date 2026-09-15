import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import Notice from '@/components/app/Notice';
import StatusChip from '@/components/app/StatusChip';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, UserX, RefreshCw, Trash2
} from 'lucide-react';
import { ROLE_CONFIG } from './userConstants';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import * as membershipsData from '@/data/memberships';
import * as fns from '@/data/functions';

export default function MembershipHealthTab({ schoolId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  // { id, title, description, confirmLabel } — null when closed
  const [pendingDelete, setPendingDelete] = useState(null);
  const [fixAllOpen, setFixAllOpen] = useState(false);
  const [fixingAll, setFixingAll] = useState(false);

  const { data: memberships = [], isLoading: loadingMemberships } = useQuery({
    queryKey: ['school-memberships', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: allSchoolMemberships = [], isLoading: loadingAll } = useQuery({
    queryKey: ['all-school-memberships'],
    queryFn: () => membershipsData.where({}),
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
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
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
    m.status === 'pending' && new Date(m.created_at) < thirtyDaysAgo
  );

  const totalIssues = orphans.length + duplicates.length + missingEmail.length + invalidRoles.length;

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fns.invoke('removeSchoolMember', { membershipId: id });
      const errMsg = res?.error || res?.error;
      if (errMsg) throw new Error(errMsg);
      return res;
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
    mutationFn: ({ id, status }) => membershipsData.update(id, { status }),
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
        const res = await fns.invoke('removeSchoolMember', { membershipId: m.id });
        const errMsg = res?.error || res?.error;
        if (errMsg) throw new Error(errMsg);
        fixed++;
      } catch (e) {
        failures.push({ id: m.id, error: e?.message || 'delete failed' });
      }
    }

    for (const m of toSuspend) {
      try {
        await membershipsData.update(m.id, { status: 'inactive' });
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
        <Loader2 className="w-6 h-6 animate-spin scholr-faint mx-auto" />
      </div>
    );
  }

  if (totalIssues === 0 && stalePending.length === 0) {
    return (
      /* Nothing wrong is the ordinary case, so it reads like the rest of the
         product rather than a centred green medal. What the check looks for
         belongs here, where it answers "how do I know it actually ran". */
      <div className="space-y-4">
        <Group title="Membership health" action={<StatusChip tone="good">All clear</StatusChip>}>
          <GroupEmpty>
            Nothing to fix. All {memberships.length} memberships have a school, an email address and a
            valid role, and none has been left pending.
          </GroupEmpty>
        </Group>

        <Group title="What this checks">
          {[
            ['Orphan accounts', 'A membership with no school attached.'],
            ['Duplicates', 'The same email holding more than one membership here.'],
            ['Missing email', 'Nobody to send an invitation to.'],
            ['Invalid roles', 'A role the platform does not recognise.'],
            ['Long-pending', 'Invited over 30 days ago and never accepted.'],
          ].map(([label, detail]) => (
            <Row key={label} label={label} detail={detail} />
          ))}
        </Group>
      </div>
    );
  }

  /* Each issue is a group, not a fully tinted card.
   *
   * Five tinted slabs — two red, two amber, one grey — meant a school with one
   * duplicate membership and one stale invitation saw the same wall of colour
   * as a school with two hundred broken records. The severity now rides on one
   * chip, the count sits in the group header, and the rows underneath are the
   * same hairline rows as everywhere else in the product. */
  const SEVERITY_TONE = { high: 'crit', medium: 'warn', low: 'mute' };
  const SEVERITY_LABEL = { high: 'Fix now', medium: 'Should fix', low: 'Worth a look' };

  const IssueSection = ({ title, description, severity, items, renderItem }) => {
    if (!items || items.length === 0) return null;
    return (
      <Group
        title={title}
        action={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.45rem' }}>
            <StatusChip tone={SEVERITY_TONE[severity]}>{SEVERITY_LABEL[severity]}</StatusChip>
            <span className="scholr-label">{items.length}</span>
          </span>
        }
      >
        <p style={{ margin: 0, padding: '.6rem .9rem 0', fontSize: '.8rem', color: 'var(--muted)' }}>
          {description}
        </p>
        {items.map((item, i) => renderItem(item, i))}
      </Group>
    );
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold scholr-ink mb-1">Membership Health Check</h3>
        <p className="text-xs scholr-muted">
          Detects and helps fix orphan accounts, duplicates, invalid data, and multi-school isolation issues.
        </p>
      </div>

      {totalIssues > 0 && (
        <Notice tone="crit">
          Found <strong>{totalIssues} issue{totalIssues !== 1 ? 's' : ''}</strong> across your school memberships that require attention.
        </Notice>
      )}

      <IssueSection
        title="Orphan Accounts (No School)"
        description="These memberships have no school_id and cannot function correctly. They should be deleted."
        severity="high"
        items={orphans}
        renderItem={(m, i) => (
          <Row key={i} label={<>{m.user_name || m.user_email || `ID: ${m.id}`}</>} detail={<>role: {m.role} · status: {m.status}</>}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1" style={{ color: 'var(--crit)' }}
            onClick={() => setPendingDelete({
              id: m.id,
              title: 'Delete orphan membership?',
              description: `This membership has no school assigned and cannot function. Deleting it permanently removes the record (the user account itself is not affected). This cannot be undone.`,
              confirmLabel: 'Delete orphan',
            })}
          >
            <Trash2 className="w-3 h-3" /> Delete
          </Button>
          </Row>
        )}
      />

      <IssueSection
        title="Duplicate Memberships"
        description="Multiple memberships for the same email in this school. Keep the most recent and remove extras."
        severity="high"
        items={duplicates}
        renderItem={(m, i) => (
          <Row key={i} label={<>{m.user_email}</>} detail={<>role: {ROLE_CONFIG[m.role]?.label || m.role} · id: {m.id?.slice(-8)}</>}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1" style={{ color: 'var(--crit)' }}
            onClick={() => setPendingDelete({
              id: m.id,
              title: 'Remove duplicate membership?',
              description: `${m.user_email} has more than one membership in this school. Removing this entry (id …${m.id?.slice(-8)}) will not affect the user's other membership(s) or their account. This cannot be undone.`,
              confirmLabel: 'Remove duplicate',
            })}
          >
            <Trash2 className="w-3 h-3" /> Remove
          </Button>
          </Row>
        )}
      />

      <IssueSection
        title="Missing Email Address"
        description="These memberships have no email and cannot receive invitations or be identified correctly."
        severity="medium"
        items={missingEmail}
        renderItem={(m, i) => (
          <Row key={i} label={<>{m.user_name || `ID: ${m.id}`}</>} detail={<>role: {m.role} · created: {new Date(m.created_at).toLocaleDateString()}</>}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1" style={{ color: 'var(--crit)' }}
            onClick={() => setPendingDelete({
              id: m.id,
              title: 'Delete incomplete membership?',
              description: `This membership has no email address, so it cannot receive invitations or be linked to a real user. Deleting it permanently removes the record. This cannot be undone.`,
              confirmLabel: 'Delete record',
            })}
          >
            <Trash2 className="w-3 h-3" /> Delete
          </Button>
          </Row>
        )}
      />

      <IssueSection
        title="Invalid Roles"
        description="These memberships have roles not recognized by the platform."
        severity="medium"
        items={invalidRoles}
        renderItem={(m, i) => (
          <Row key={i} label={<>{m.user_email || m.user_name}</>} detail={<>current role: "{m.role}"</>}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => fixStatusMutation.mutate({ id: m.id, status: 'inactive' })}
          >
            <UserX className="w-3 h-3" /> Suspend
          </Button>
          </Row>
        )}
      />

      <IssueSection
        title="Long-Pending Accounts (30+ days)"
        description="These users have been in pending status for over 30 days and may need a nudge or removal."
        severity="low"
        items={stalePending}
        renderItem={(m, i) => (
          <Row key={i} label={<>{m.user_email || m.user_name}</>} detail={<>pending since {new Date(m.created_at).toLocaleDateString()} ·
                {ROLE_CONFIG[m.role]?.label || m.role}</>}>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => fixStatusMutation.mutate({ id: m.id, status: 'active' })}
            >
              <RefreshCw className="w-3 h-3" /> Activate
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1" style={{ color: 'var(--crit)' }}
              onClick={() => setPendingDelete({
                id: m.id,
                title: 'Remove long-pending invitation?',
                description: `${m.user_email || m.user_name || 'This user'} has been pending since ${new Date(m.created_at).toLocaleDateString()}. Removing them clears the membership; they would need a fresh invitation to rejoin. This cannot be undone.`,
                confirmLabel: 'Remove member',
              })}
            >
              <Trash2 className="w-3 h-3" /> Remove
            </Button>
          </div>
          </Row>
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