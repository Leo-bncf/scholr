// The console's data layer.
//
// One set of queries, shared by every page through React Query's cache, so
// moving between tabs re-renders rather than re-fetches. The pages below are
// deliberately thin: everything that needs deriving is derived here, once.
import { useQuery } from '@tanstack/react-query';
import * as admin from '@/data/admin';
import * as schoolsData from '@/data/schools';
import * as supportTicketsData from '@/data/supportTickets';
import * as fns from '@/data/functions';
import { supabase } from '@/lib/supabase';
import { annualCost } from '@/lib/pricing';
import { isAtRiskSchool, isPaidSchool } from '@/components/admin/super-admin/superAdminConfig';

const FIVE_MIN = 5 * 60 * 1000;

/* ── The gate ────────────────────────────────────────────────────────
   Asks the database, not the session. A role read off the client's own
   user object is a claim; `is_super_admin()` is the same function the RLS
   policies and `platform_health()` enforce with, so the console and the
   data agree on who is privileged. */
export function useConsoleGate() {
  return useQuery({
    queryKey: ['console', 'gate'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_super_admin');
      if (error) throw error;
      return data === true;
    },
    staleTime: FIVE_MIN,
    retry: false,
  });
}

export function useSchools() {
  return useQuery({
    queryKey: ['console', 'schools'],
    queryFn: () => schoolsData.list(),
    staleTime: FIVE_MIN,
  });
}

export function useSchoolStats() {
  return useQuery({
    queryKey: ['console', 'school-stats'],
    queryFn: () => admin.listSchoolStats(),
    staleTime: FIVE_MIN,
  });
}

export function useHealth() {
  return useQuery({
    queryKey: ['console', 'health'],
    queryFn: () => admin.platformHealth(),
    staleTime: 60 * 1000,
  });
}

export function useAudit(limit = 500) {
  return useQuery({
    queryKey: ['console', 'audit', limit],
    queryFn: () => admin.listAuditLogs({ limit }),
    staleTime: 30 * 1000,
  });
}

export function useTickets() {
  return useQuery({
    queryKey: ['console', 'tickets'],
    queryFn: () => supportTicketsData.list(),
    staleTime: 60 * 1000,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['console', 'users'],
    queryFn: () => fns.invoke('listAllUsers'),
    staleTime: FIVE_MIN,
    retry: false,
  });
}

export function useConfig() {
  return useQuery({
    queryKey: ['console', 'config'],
    queryFn: () => admin.getPlatformConfig(),
    staleTime: FIVE_MIN,
  });
}

/* ── The room ────────────────────────────────────────────────────────
   The hardware Scholr runs on. Every one of these resolves even when the
   credentials are unset — each function answers `configured: false` with a
   reason, which the pages render as a setup note rather than an error. A
   missing Tuya key should not make the console look broken. */

const infra = (name, body) => async () => (await fns.invoke(name, body)) ?? {};

export function useIlo() {
  return useQuery({
    queryKey: ['console', 'ilo'],
    queryFn: infra('adminIlo', { action: 'status' }),
    refetchInterval: 45_000, retry: false,
  });
}

export function useClimate() {
  return useQuery({
    queryKey: ['console', 'climate'],
    queryFn: infra('adminClimate', { action: 'status' }),
    refetchInterval: 60_000, retry: false,
  });
}

// One frame every 10 s, and only while the tab is visible — React Query pauses
// refetchInterval in a background tab, which is what keeps this from pulling
// snapshots all night.
export function useCamera(enabled = true) {
  return useQuery({
    queryKey: ['console', 'camera'],
    queryFn: infra('adminCamera', { action: 'snapshot' }),
    refetchInterval: 10_000, retry: false, enabled,
  });
}

export function useNas() {
  return useQuery({
    queryKey: ['console', 'nas'],
    queryFn: infra('adminNas', {}),
    refetchInterval: 5 * 60_000, retry: false,
  });
}

/** Newest row per host, from the table the collectors push into. */
export function useMetrics() {
  return useQuery({
    queryKey: ['console', 'metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('server_metrics').select('*')
        .order('ts', { ascending: false }).limit(80);
      if (error) throw error;
      const latest = new Map();
      for (const row of data || []) if (!latest.has(row.server_id)) latest.set(row.server_id, row);
      return [...latest.values()];
    },
    refetchInterval: 30_000, retry: false,
  });
}

/** 24 hours of inlet readings, half-hourly, worst reading per bucket —
    because for a room it is the peak that matters, not the average. */
export function useInletHistory() {
  return useQuery({
    queryKey: ['console', 'inlet-history'],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data, error } = await supabase
        .from('server_metrics').select('ts, ambient_temp')
        .gte('ts', since).not('ambient_temp', 'is', null)
        .order('ts', { ascending: true });
      if (error) throw error;
      const buckets = new Map();
      for (const r of data || []) {
        const k = Math.floor(new Date(r.ts).getTime() / 1800_000);
        const v = Number(r.ambient_temp);
        if (!buckets.has(k) || v > buckets.get(k).c) buckets.set(k, { t: r.ts, c: v });
      }
      return [...buckets.values()];
    },
    refetchInterval: 5 * 60_000, retry: false,
  });
}

/* A CPU past 85 °C or inlet air past 32 °C is a call to act, not a colour to
   admire. Anything below is ink. */
export function tempState(c, ambient) {
  if (c == null) return 'idle';
  if (ambient) return c >= 32 ? 'bad' : c >= 28 ? 'warn' : 'idle';
  return c >= 85 ? 'bad' : c >= 75 ? 'warn' : 'idle';
}

/* ── The headline ────────────────────────────────────────────────────
   What the rail's dots and the Overview page both read. Derived once from
   the queries above rather than each page counting schools again. */
export function useHeadline() {
  const schoolsQ = useSchools();
  const statsQ = useSchoolStats();
  const healthQ = useHealth();
  const ticketsQ = useTickets();

  const schools = schoolsQ.data || [];
  const stats = statsQ.data || [];
  const byId = Object.fromEntries(stats.map((s) => [s.school_id, s]));

  const live = schools.filter((s) => s.status === 'active');
  const paid = schools.filter((s) => isPaidSchool(s));
  const trial = schools.filter((s) => s.billing_status === 'trial');
  const onboarding = schools.filter((s) => s.status === 'onboarding');
  const suspended = schools.filter((s) => s.status === 'suspended');
  const atRisk = schools.filter((s) => isAtRiskSchool(s));

  // A school over the roll it is contracted for is a billing conversation,
  // not an error: the product keeps working.
  const overCap = schools.filter((s) => {
    const members = byId[s.id]?.members ?? 0;
    return s.max_students > 0 && members > s.max_students;
  });

  const contracted = paid.reduce((sum, s) => sum + annualCost(s.max_students || 0), 0);

  const tickets = ticketsQ.data || [];
  const waiting = tickets.filter((t) => t.status === 'open').length;

  const health = healthQ.data || null;
  const cacheRatio = health?.cache_hit_ratio != null ? Number(health.cache_hit_ratio) : null;
  const connections = health?.connections || null;
  const connPct = connections?.max ? (connections.active / connections.max) * 100 : null;

  return {
    schoolsQ, statsQ, healthQ, ticketsQ,
    loading: schoolsQ.isLoading || statsQ.isLoading,
    schools, stats, byId,
    live, paid, trial, onboarding, suspended, atRisk, overCap,
    contracted,
    members: stats.reduce((sum, s) => sum + Number(s.members ?? 0), 0),
    waiting,
    health, cacheRatio, connections, connPct,
    // Below ~99% on a warm database, reads are hitting disk and something
    // wants an index. Above 85% of max_connections, a traffic spike starts
    // refusing connections.
    coldCache: cacheRatio != null && cacheRatio < 99,
    tightConns: connPct != null && connPct > 85,
  };
}

/** Error logs, newest first. The table exists and nothing has ever shown it. */
export function useErrors(limit = 300) {
  return useQuery({
    queryKey: ['console', 'errors', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_logs')
        .select('id, message, code, context, severity, school_id, user_id, stack_trace, timestamp, user_agent, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000, retry: false,
  });
}

/** Sign-in recency per account, through the definer function — auth.users is
    not readable directly, and should not be. */
export function useSignIns(limit = 200) {
  return useQuery({
    queryKey: ['console', 'sign-ins', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('recent_sign_ins', { limit_n: limit });
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000, retry: false,
  });
}

/** What the deployment is actually configured for: SMTP, Stripe, Google. */
export function useReadiness() {
  return useQuery({
    queryKey: ['console', 'readiness'],
    queryFn: () => fns.invoke('deploymentReady'),
    staleTime: 5 * 60 * 1000, retry: false,
  });
}

/** Outstanding invitations — the other half of the email story. */
export function useInvitations() {
  return useQuery({
    queryKey: ['console', 'invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_invitations')
        .select('id, email, role, school_id, status, created_at, expires_at, accepted_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 1000, retry: false,
  });
}

/* ── Formatting ──────────────────────────────────────────────────────── */

export function money(value, currency = 'EUR') {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(value || 0);
}

export function num(value) {
  return Number(value || 0).toLocaleString('en-IE');
}

export function when(ts, withTime = true) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IE', {
    day: '2-digit', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function ago(ts) {
  if (!ts) return '—';
  const then = new Date(ts).getTime();
  if (Number.isNaN(then)) return '—';
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h`;
  return `${Math.round(secs / 86400)}d`;
}

export function bytes(n) {
  if (!n) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = Number(n);
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

export function uptime(seconds) {
  if (!seconds) return '—';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
