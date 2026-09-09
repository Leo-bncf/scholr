#!/usr/bin/env node
/**
 * Export every base44 entity's rows to scripts/.cache/data/<Entity>.json.
 *
 *   BASE44_APP_ID=... BASE44_API_KEY=... node scripts/base44-export.mjs
 *
 * base44 rate-limits hard: fanning out across entities in parallel earns a
 * sustained 403 on the data endpoints (the app-definition endpoint keeps
 * working, which is how you tell throttling from a bad key). So this runs
 * strictly serially, with backoff, and resumes — already-exported entities are
 * skipped unless --force.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'scripts/.cache/data');
const force = process.argv.includes('--force');

const appId = process.env.BASE44_APP_ID;
const apiKey = process.env.BASE44_API_KEY;
if (!appId || !apiKey) {
  console.error('Set BASE44_APP_ID and BASE44_API_KEY.');
  process.exit(1);
}

const app = JSON.parse(readFileSync(resolve(ROOT, 'scripts/.cache/app.json'), 'utf8'));
const entities = Object.keys(app.entities).sort();
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchEntity(name) {
  // Page rather than asking for everything at once — a large limit is itself
  // a throttling trigger, and we don't know the row counts up front.
  const rows = [];
  const pageSize = 100;
  let skip = 0;

  for (;;) {
    const url = `https://app.base44.com/api/apps/${appId}/entities/${name}?limit=${pageSize}&skip=${skip}`;
    let page = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch(url, { headers: { api_key: apiKey } });
      if (res.ok) {
        page = await res.json();
        break;
      }
      if (res.status === 403 || res.status === 429) {
        const wait = 5000 * 2 ** attempt; // 5s, 10s, 20s, 40s, 80s
        process.stdout.write(` [${res.status}, retry in ${wait / 1000}s]`);
        await sleep(wait);
        continue;
      }
      throw new Error(`${name}: HTTP ${res.status}`);
    }

    if (page === null) throw new Error(`${name}: still throttled after 5 attempts`);
    if (!Array.isArray(page)) throw new Error(`${name}: unexpected payload`);

    rows.push(...page);
    if (page.length < pageSize) break;
    skip += pageSize;
    await sleep(1200);
  }
  return rows;
}

let total = 0;
const summary = [];

for (const name of entities) {
  const dest = resolve(OUT, `${name}.json`);
  if (!force && existsSync(dest)) {
    const n = JSON.parse(readFileSync(dest, 'utf8')).length;
    console.log(`  ${name.padEnd(26)} ${String(n).padStart(5)}  (cached)`);
    total += n;
    summary.push([name, n]);
    continue;
  }

  process.stdout.write(`  ${name.padEnd(26)}`);
  try {
    const rows = await fetchEntity(name);
    writeFileSync(dest, JSON.stringify(rows, null, 1));
    console.log(` ${String(rows.length).padStart(5)}`);
    total += rows.length;
    summary.push([name, rows.length]);
  } catch (err) {
    console.log(`  FAILED — ${err.message}`);
    summary.push([name, null]);
  }
  await sleep(1200);
}

const failed = summary.filter(([, n]) => n === null).map(([e]) => e);
const nonEmpty = summary.filter(([, n]) => n > 0);

console.log(`\n${total} rows across ${nonEmpty.length} non-empty entities`);
if (nonEmpty.length) {
  console.log('non-empty:');
  for (const [e, n] of nonEmpty.sort((a, b) => b[1] - a[1])) console.log(`  ${e.padEnd(26)} ${n}`);
}
if (failed.length) {
  console.log(`\nfailed (${failed.length}): ${failed.join(', ')}`);
  console.log('re-run to resume — successful entities are cached.');
  process.exit(1);
}
