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
