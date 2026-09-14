#!/usr/bin/env node
/**
 * Refuse to ship a bundle built without real credentials.
 *
 * Vite inlines import.meta.env at build time. Build without .env.local and the
 * placeholders from .env.example get baked into the JavaScript — and because
 * they are non-empty strings, nothing throws. The app loads, looks perfectly
 * fine, and every single call to Supabase returns 401. Sign-in fails, the
 * dashboards are empty, the demo form drops leads, and the Google button
 * disappears because the provider check is one of the calls that 401s.
 *
 * That shipped to production twice on 14 September, from a machine whose
 * checkout had no .env.local. The person deploying had no way to notice: the
 * build succeeded and the site rendered.
 *
 * So the build checks its own output. This is not a lint rule anyone has to
 * remember — it is wired into `npm run build` and it fails the deploy.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const FORBIDDEN = [
  ['placeholder-anon-key', 'the anon key from .env.example'],
  ['your-project.supabase.co', 'the example Supabase URL'],
  ['placeholder-service-role', 'a service-role placeholder'],
];

// A real anon key is a JWT: three base64url segments. Its absence is as bad as
// a placeholder's presence.
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/;

function jsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...jsFiles(p));
    else if (entry.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = jsFiles(DIST);
const problems = [];
let sawKey = false;

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  if (JWT.test(src)) sawKey = true;
  for (const [needle, what] of FORBIDDEN) {
    if (src.includes(needle)) problems.push(`${f} contains ${needle} — ${what}`);
  }
}

if (!sawKey) problems.push('no anon key found in the bundle at all — VITE_SUPABASE_ANON_KEY was empty');

if (problems.length) {
  console.error('\n[check-env] This build would take the live site down.\n');
  for (const p of problems) console.error(`  ✗ ${p}`);
  console.error('\n  Every Supabase call would return 401: sign-in, dashboards, the demo form,');
  console.error('  and the Google button (which hides itself when the provider check fails).');
  console.error('\n  Fix: copy .env.example to .env.local and fill in the real values, then');
  console.error('  rebuild. Ask Leo for them — they are not in the repo.\n');
  process.exit(1);
}

console.log(`  [check-env] ${files.length} bundle file(s) carry real credentials`);
