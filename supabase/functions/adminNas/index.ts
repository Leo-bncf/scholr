// adminNas — the company NAS (ZimaOS, VM 100 on infra-pve-1) and its nightly
// encrypted off-site backup, for the console.
//
// This function never talks to the hypervisor. scripts/nas-status-collector.sh
// runs on infra-pve-1 and pushes a row into public.nas_status every 10 minutes;
// all this does is read the newest row and say what needs attention. Giving
// production a root path into a Proxmox host to draw a status card would be a
// far bigger hole than the card is worth.
//
// nas_status has no select policy for `authenticated`, so the router's
// super-admin + 2FA gate (SUPER_ADMIN_ONLY in main/index.ts) is the only way in.
//
//   {}  → { configured, status, alerts: [{ level, text }], open: { url | tunnel } }
import { fromRequest, serviceClient, isSuperAdmin } from '../_shared/client.ts';
import { corsHeaders, preflight } from '../_shared/http.ts';

/* Scholr's gate, not an email allow-list.
 *
 * Schedual compared the caller's address against SUPER_ADMIN_EMAILS, so the
 * list of privileged people lived in an environment variable that could drift
 * out of step with the database. Here the caller's own profile row decides,
 * read server-side from their verified token — the same `role` that
 * `public.is_super_admin()` checks for RLS, so these functions and the data
 * cannot disagree about who is privileged.
 */
async function gate(req: Request): Promise<{ email: string } | Response> {
  const caller = await fromRequest(req);
  if (!caller.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders(req) });
  }
  if (!isSuperAdmin(caller)) {
    return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders(req) });
  }
  return { email: (caller.user.email || '').toLowerCase() };
}

/* A privileged action that is not written down did not happen, as far as
   anyone reviewing the platform later is concerned. */
async function audit(entry: Record<string, unknown>) {
  try {
    await serviceClient().from('audit_logs').insert(entry);
  } catch { /* the action matters more than the log line */ }
}

// pve-1's disk is RAID 0: the backup is the only copy that survives a dead
// drive. Nightly at 02:30, so 36 h means one night was missed.
const BACKUP_MAX_AGE_H = 36;
// The collector runs every 10 min; three missed runs means it has stopped.
const COLLECTOR_MAX_AGE_MIN = 30;
const NAS_LAN = '192.168.2.25';

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    const who = await gate(req);
    if (who instanceof Response) return who;
    const email = who.email;

    const db = serviceClient();
    const { data: row, error } = await db.from('nas_status').select('*').order('ts', { ascending: false }).limit(1).maybeSingle();
    if (error) return Response.json({ configured: false, reason: error.message, setup: 'Apply infra/nas-status.sql on the database.' });
    if (!row) {
      return Response.json({
        configured: false,
        reason: 'No report from the NAS collector yet.',
        setup: 'Install scripts/nas-status-collector.sh + its systemd timer on infra-pve-1 (instructions at the top of the script).',
      });
    }

    const now = Date.now();
    const alerts: { level: 'red' | 'amber'; text: string }[] = [];
    const reportAgeMin = (now - new Date(row.ts).getTime()) / 60_000;
    if (reportAgeMin > COLLECTOR_MAX_AGE_MIN) {
      alerts.push({ level: 'amber', text: `No report from infra-pve-1 for ${Math.round(reportAgeMin)} min — the collector or the host is down. Everything below is stale.` });
    }
    if (row.vm_status !== 'running') alerts.push({ level: 'red', text: `The NAS VM is ${row.vm_status || 'in an unknown state'}.` });

    const backupAgeH = row.last_backup_at ? (now - new Date(row.last_backup_at).getTime()) / 3_600_000 : null;
    if (row.backup_count === null) {
      alerts.push({ level: 'red', text: 'infra-pve-1 could not list the backups on Backblaze — credentials or network.' });
    } else if (backupAgeH === null) {
      alerts.push({ level: 'red', text: 'There is no NAS backup on Backblaze at all.' });
    } else if (backupAgeH > BACKUP_MAX_AGE_H) {
      alerts.push({ level: 'red', text: `Last NAS backup is ${Math.round(backupAgeH)} h old (limit ${BACKUP_MAX_AGE_H} h). pve-1 is RAID 0 — a dead disk now loses everything since.` });
    }
    if (row.last_run_result && !['success', 'running'].includes(row.last_run_result)) {
      alerts.push({ level: 'red', text: `The last backup run ended with "${row.last_run_result}" — see the log below.` });
    }
    for (const d of row.disks || []) {
      if (Number(d.allocated_pct) >= 85) alerts.push({ level: 'amber', text: `NAS disk ${d.name} is ${Math.round(d.allocated_pct)} % full.` });
    }
    if (Number(row.pool_used_pct) >= 85) alerts.push({ level: 'amber', text: `infra-pve-1's storage pool is ${Math.round(row.pool_used_pct)} % full.` });

    return Response.json({
      configured: true,
      status: { ...row, report_age_min: Math.round(reportAgeMin), backup_age_h: backupAgeH === null ? null : Math.round(backupAgeH * 10) / 10 },
      alerts,
      limits: { backup_max_age_h: BACKUP_MAX_AGE_H },
      // ZimaOS is LAN-only until its Tailscale app is installed; until then the
      // way in is a tunnel through pve-1.
      open: row.web_url
        ? { url: row.web_url }
        : { tunnel: `ssh -N -L 8025:${NAS_LAN}:80 root@infra-pve-1`, then: 'http://localhost:8025' },
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message ?? 'Unexpected error' }, { status: 500 });
  }
});
