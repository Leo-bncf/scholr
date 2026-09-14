#!/usr/bin/env node
/**
 * Mint single-use, tagged Tailscale auth keys for the Scholr-only people.
 *
 *   TS_TOKEN=tskey-api-... node infra/tailscale-mint-keys.mjs --dry-run
 *   TS_TOKEN=tskey-api-... node infra/tailscale-mint-keys.mjs
 *   TS_TOKEN=tskey-api-... node infra/tailscale-mint-keys.mjs --days=14 --who=conor
 *
 * Needs an API access token with auth_keys:write
 * (login.tailscale.com/admin/settings/keys). Revoke it afterwards — same
 * convention as infra/tailscale-apply.mjs.
 *
 * WHY THE TAG IS NOT OPTIONAL
 * An auth key joins a device to the TAILNET, not to a host. What fences Conor
 * and Alec into Scholr is the policy in infra/tailscale-acl-tagged.hujson:
 * tag:scholr may reach tag:scholr and nothing else, and there is no rule from
 * tag:scholr to tag:schedual or tag:infra. That fence only applies to a device
 * that actually carries the tag. An untagged key produces a device owned by
 * support@ — which is Leo's identity, which reaches everything, including
 * Schedual's VM and both Proxmox hosts.
 *
 * So: no tag, no isolation. The tag is set below and is not configurable.
 *
 * WHAT THIS DOES NOT DO
 * It does not touch the policy. The policy is already applied and carries a
 * tests block that makes Tailscale refuse any future edit opening a path from
 * tag:scholr to Schedual. Run infra/tailscale-apply.mjs if that ever needs
 * re-asserting.
 */
import process from 'node:process';

const API = 'https://api.tailscale.com/api/v2';
const TAILNET = '-'; // "-" = the tailnet this token belongs to
const TAG = 'tag:scholr';

const token = process.env.TS_TOKEN;
const dryRun = process.argv.includes('--dry-run');

const daysArg = process.argv.find((a) => a.startsWith('--days='));
const days = daysArg ? Number(daysArg.slice('--days='.length)) : 7;

const whoArg = process.argv.find((a) => a.startsWith('--who='));
const only = whoArg ? whoArg.slice('--who='.length).toLowerCase() : null;

const PEOPLE = ['Conor', 'Alec'];

if (!token) {
  console.error('Set TS_TOKEN to a Tailscale API access token with auth_keys:write.');
  process.exit(1);
}
if (!Number.isFinite(days) || days < 1 || days > 90) {
  console.error(`--days must be between 1 and 90 (got ${days}).`);
  process.exit(1);
}

const targets = only ? PEOPLE.filter((p) => p.toLowerCase() === only) : PEOPLE;
if (targets.length === 0) {
  console.error(`--who must be one of: ${PEOPLE.join(', ').toLowerCase()}`);
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}\n${text}`);
  return text ? JSON.parse(text) : null;
}

function keyRequest(person) {
  return {
    description: `${person} — Scholr only (${new Date().toISOString().slice(0, 10)})`,
    capabilities: {
      devices: {
        create: {
          // Single-use. A reusable key that leaks lets anyone put a machine
          // inside the tailnet under this tag.
          reusable: false,
          // The device survives a reboot; ephemeral nodes vanish and they
          // would have to re-enrol constantly.
          ephemeral: false,
          // Skips manual approval in the console so they can self-enrol.
          preauthorized: true,
          tags: [TAG],
        },
      },
    },
    expirySeconds: days * 24 * 60 * 60,
  };
}

const results = [];
for (const person of targets) {
  const body = keyRequest(person);
  if (dryRun) {
    console.log(`[dry-run] would create for ${person}:`, JSON.stringify(body.capabilities.devices.create), `expires in ${days}d`);
    continue;
  }
  const created = await api('POST', `/tailnet/${TAILNET}/keys`, body);
  results.push({ person, id: created.id, key: created.key, expires: created.expires });
}

if (dryRun) {
  console.log('\nDry run only. Re-run without --dry-run to actually create them.');
  process.exit(0);
}

console.log('\n──────────────────────────────────────────────────────────────');
console.log('These are shown ONCE. Tailscale does not display them again.');
console.log('Send each person THEIR key over a password manager or Signal —');
console.log('not email, not chat, not a shared doc.');
console.log('──────────────────────────────────────────────────────────────\n');

for (const r of results) {
  console.log(`${r.person}`);
  console.log(`  key id  ${r.id}          <- record this; it is how you revoke`);
  console.log(`  expires ${r.expires}`);
  console.log(`  key     ${r.key}\n`);
}

console.log('They each run, once, on their own machine:');
console.log('  macOS / Linux    sudo tailscale up --authkey=<their key>');
console.log('  Windows (admin)  tailscale up --authkey=<their key>\n');
console.log('Then revoke the TS_TOKEN you used for this.\n');
console.log('Note: a TAGGED node does not expire the way a user node does —');
console.log('the key expiry above limits how long they have to enrol, not how');
console.log('long the machine stays on the tailnet. Remove the device in the');
console.log('console when someone leaves.');
