import React from 'react';
import { useQuery } from '@tanstack/react-query';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import Meter from '@/components/app/Meter';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import * as admin from '@/data/admin';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Platform health.
 *
 * Every number on this page is read live from Postgres through
 * public.platform_health(), a SECURITY DEFINER function that refuses any
 * caller who is not a super admin. Nothing here is estimated and nothing is
 * decorative — if a figure cannot be measured it is absent, and the "not
 * measured yet" section says which ones and why.
 *
 * Refreshes every thirty seconds. That is often enough to notice a connection
 * leak and rare enough not to be its own load.
 */

function pretty(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m`;
}

const NOT_MEASURED = [
  ['CPU, memory and disk', 'The app talks to Postgres, not to the host. Exposing load, free memory and disk headroom needs a small collector writing to a table on a timer — a job for the box, not the browser.'],
  ['Temperature', 'Not readable from inside the VM at all: it is a Proxmox guest, and thermal zones belong to the hypervisor. It would have to come from the Proxmox host itself.'],
  ['Request latency and error rate', 'There is no APM and no third-party analytics in this product, deliberately. Getting these means logging timings ourselves at the edge.'],
  ['Backups', 'Scholr has no automated backup yet. That is the most serious gap on this list and it is not a monitoring problem — it is a missing job.'],
];

export default function SuperAdminHealth() {
  const navigate = useNavigate();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['platform-health'],
    queryFn: admin.platformHealth,
    enabled: !!currentUser,
    refetchInterval: 30_000,
    retry: false,
  });

  if (isChecking) return <SuperAdminLoadingState />;
  if (!currentUser) return null;

  const conn = data?.connections;
  const connPct = conn ? Math.round((conn.active / conn.max) * 100) : 0;
  const cache = data?.cache_hit_ratio != null ? Number(data.cache_hit_ratio) : null;
  const rollbackPct = data?.transactions
    ? (data.transactions.rolled_back / Math.max(1, data.transactions.committed + data.transactions.rolled_back)) * 100
    : null;

  // Thresholds, stated rather than implied. Connections are the one that
  // actually takes a site down; a cache ratio under 99 on a warm database
  // means something wants an index.
  const connTone = connPct >= 85 ? 'crit' : connPct >= 60 ? 'warn' : 'good';
  const cacheTone = cache == null ? 'mute' : cache >= 99 ? 'good' : cache >= 95 ? 'warn' : 'crit';

  return (
    <SuperAdminShell
      activeItem="health"
      currentUser={currentUser}
      title="Health"
      eyebrow={dataUpdatedAt ? `Read from Postgres · ${new Date(dataUpdatedAt).toLocaleTimeString()}` : 'Reading…'}
    >
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl) 0' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
        </div>
      )}

      {error && (
        <Group title="Couldn't read the database">
          <GroupEmpty>{error.message}</GroupEmpty>
        </Group>
      )}

      {data && (
        <>
          <StatRow>
            <StatCard label="Uptime" value={pretty(data.database.uptime_seconds)} hint={data.database.version} />
            <StatCard label="Database" value={data.database.size_pretty} hint={`${data.tenancy.schools} school${data.tenancy.schools === 1 ? '' : 's'}`} />
            <StatCard label="Connections" value={`${conn.active}/${conn.max}`} hint={`${connPct}% of the pool`} />
            <StatCard label="Cache hit" value={cache != null ? `${cache}%` : '—'} hint="reads served from memory" />
          </StatRow>

          <Group title="Pressure">
            <Row label="Connection pool" detail={`${conn.active} of ${conn.max} in use`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <StatusChip tone={connTone}>
                  {connTone === 'good' ? 'Headroom' : connTone === 'warn' ? 'Filling' : 'Near limit'}
                </StatusChip>
                <span style={{ display: 'block', width: '6rem' }}><Meter value={connPct} tone={connTone} height={4} /></span>
              </span>
            </Row>
            <Row label="Buffer cache" detail="below 99% on a warm database means a query wants an index">
              <span style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                <StatusChip tone={cacheTone}>{cacheTone === 'good' ? 'Warm' : cacheTone === 'warn' ? 'Cooling' : 'Cold'}</StatusChip>
                <span style={{ display: 'block', width: '6rem' }}><Meter value={cache ?? 0} tone={cacheTone} height={4} /></span>
              </span>
            </Row>
            <Row
              label="Rolled-back transactions"
              detail={`${data.transactions.rolled_back.toLocaleString()} of ${(data.transactions.committed + data.transactions.rolled_back).toLocaleString()} since boot`}
              value={rollbackPct != null ? `${rollbackPct.toFixed(3)}%` : '—'}
            />
          </Group>

          <Group title="Largest tables" action={<span className="scholr-label">by total size on disk</span>}>
            {data.largest_tables.length === 0 ? (
              <GroupEmpty>No user tables reporting statistics yet.</GroupEmpty>
            ) : (
              data.largest_tables.map(t => (
                <Row key={t.name} label={t.name} detail={`${Number(t.rows).toLocaleString()} rows`} value={t.size} />
              ))
            )}
          </Group>

          <Group title="Tenancy">
            <Row label="Schools" value={data.tenancy.schools} />
            <Row label="Accounts" value={data.tenancy.users} />
            <Row label="Active memberships" value={data.tenancy.members} />
          </Group>

          <Group title="Not measured yet" action={<StatusChip tone="warn">4 gaps</StatusChip>}>
            {NOT_MEASURED.map(([what, why]) => (
              <Row key={what} label={what} detail={why} />
            ))}
          </Group>
        </>
      )}
    </SuperAdminShell>
  );
}
