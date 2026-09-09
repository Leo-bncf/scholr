#!/usr/bin/env node
/**
 * Pull the base44 app definition (entity schemas, function list, auth config)
 * and cache it locally. This is the source of truth the schema generator reads.
 *
 *   BASE44_APP_ID=... BASE44_API_KEY=... node scripts/base44-pull.mjs
 *
 * The cached file is gitignored — it contains the full app definition including
 * settings we don't want in version control.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'scripts/.cache/app.json');

const appId = process.env.BASE44_APP_ID;
const apiKey = process.env.BASE44_API_KEY;

if (!appId || !apiKey) {
  console.error('Set BASE44_APP_ID and BASE44_API_KEY.');
  process.exit(1);
}

const res = await fetch(`https://app.base44.com/api/apps/${appId}`, {
  headers: { api_key: apiKey },
});

if (!res.ok) {
  console.error(`base44 returned ${res.status} ${res.statusText}`);
  process.exit(1);
}

const app = await res.json();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(app, null, 1));

console.log(`${app.name} (${app.slug})`);
console.log(`  entities  ${Object.keys(app.entities).length}`);
console.log(`  functions ${app.function_names.length}`);
console.log(`  pages     ${app.page_names.length}`);
console.log(`  -> ${OUT}`);
