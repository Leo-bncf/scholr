#!/usr/bin/env node
/**
 * Apply the tailnet policy, then rename and re-tag every device.
 *
 *   TS_TOKEN=tskey-api-... node infra/tailscale-apply.mjs --dry-run
 *   TS_TOKEN=tskey-api-... node infra/tailscale-apply.mjs
 *
 * Needs an API access token with acl:write and devices:write
 * (login.tailscale.com/admin/settings/keys). Revoke it afterwards.
 *
 * Order matters: the policy defines tag:infra / tag:schedual / tag:scholr and
 * their tagOwners, so it must land before any device can be tagged with them.
 *
 * Safe to re-run — renaming a device to the name it already has, or applying
 * tags it already carries, is a no-op.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TAILNET = '-'; // "-" means "the tailnet this token belongs to"
const API = 'https://api.tailscale.com/api/v2';

const token = process.env.TS_TOKEN;
const dryRun = process.argv.includes('--dry-run');

// Which policy to apply. Defaults to the real isolating one; pass
// --policy=tailscale-acl-interim.hujson to do renaming/tagging ahead of the
// per-person accounts the real policy requires.
const policyArg = process.argv.find((a) => a.startsWith('--policy='));
const policyFile = policyArg ? policyArg.slice('--policy='.length) : 'tailscale-acl.hujson';

if (!token) {
  console.error('Set TS_TOKEN to a Tailscale API access token (acl:write + devices:write).');
  process.exit(1);
}

// old hostname -> [new name, tag]
const PLAN = {
  'schedual-proxmox-1':   ['infra-pve-1',   'tag:infra'],
  'schedual-proxmox-2':   ['infra-pve-2',   'tag:infra'],
  'schedual-proxmox-ai':  ['infra-pve-ai',  'tag:infra'],
  'schedual-prod':        ['sched-prod',    'tag:schedual'],
  'schedual-ionos':       ['sched-standby', 'tag:schedual'],
  'schedual-optaplanner': ['sched-solver',  'tag:schedual'],
  'schedual-vm-ai':       ['sched-ai',      'tag:schedual'],
  'schedual-vm-db':       ['sched-ai-db',   'tag:schedual'],
  'scholr-prod':          ['scholr-prod',   'tag:scholr'],
};

async function api(method, path, body, contentType = 'application/json') {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': contentType } : {}),
    },
    body: body ?? undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}\n${text}`);
  if (!text) return null;
  // The ACL endpoints echo the policy back as HuJSON (comments, trailing
  // commas), which JSON.parse rejects. Only the device endpoints return real
  // JSON, and those are the only responses we read.
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ---------------------------------------------------------------------------
// 1. policy
// ---------------------------------------------------------------------------

const policy = readFileSync(resolve(HERE, policyFile), 'utf8');
console.log(`policy file: ${policyFile}`);

if (policy.includes('REPLACE-')) {
  console.error(`${policyFile} still contains REPLACE- placeholders.`);
  console.error('Fill in the real account emails for group:owners and group:scholr first.');
  process.exit(1);
}

// Validate first — this runs the "tests" block, which is what actually proves
// Conor and Alec cannot reach Schedual. A failing test aborts before anything
// is written.
console.log('validating policy…');
await api('POST', `/tailnet/${TAILNET}/acl/validate`, policy, 'application/hujson');
console.log('  policy valid, isolation tests pass');

if (dryRun) {
  console.log('\n--dry-run: policy not applied, no devices touched\n');
} else {
  await api('POST', `/tailnet/${TAILNET}/acl`, policy, 'application/hujson');
  console.log('  policy applied');
}

// ---------------------------------------------------------------------------
// 2. devices
// ---------------------------------------------------------------------------

const { devices } = await api('GET', `/tailnet/${TAILNET}/devices`);
console.log(`\n${devices.length} devices in tailnet\n`);

for (const d of devices) {
  // hostname is the machine's own name; d.name is the full MagicDNS name.
  const current = d.name.split('.')[0];
  const entry = PLAN[current] ?? PLAN[d.hostname];

  if (!entry) {
    console.log(`  ${current.padEnd(22)} skipped (personal device — left alone)`);
    continue;
  }

  const [newName, tag] = entry;
  const hasTag = (d.tags ?? []).includes(tag);
  const needsRename = current !== newName;

  if (!needsRename && hasTag) {
    console.log(`  ${current.padEnd(22)} already correct`);
    continue;
  }

  const actions = [
    needsRename ? `rename -> ${newName}` : null,
    hasTag ? null : `tag -> ${tag}`,
  ].filter(Boolean).join(', ');

  if (dryRun) {
    console.log(`  ${current.padEnd(22)} WOULD ${actions}`);
    continue;
  }

  if (needsRename) {
    await api('POST', `/device/${d.id}/name`, JSON.stringify({ name: newName }));
  }
  if (!hasTag) {
    // Replaces the whole tag set — drops the old generic tag:server, which is
    // the point: a device carrying both tag:server and tag:schedual would still
    // match any lingering tag:server rule.
    await api('POST', `/device/${d.id}/tags`, JSON.stringify({ tags: [tag] }));
  }
  console.log(`  ${current.padEnd(22)} ${actions}`);
}

console.log(`\n${dryRun ? 'dry run complete' : 'done'} — revoke the API token now.`);
