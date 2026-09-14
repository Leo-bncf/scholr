#!/usr/bin/env node
/**
 * Flag unbounded reads of tables that grow with the school.
 *
 *   node scripts/verify-query-bounds.mjs            # fail on anything new
 *   node scripts/verify-query-bounds.mjs --update   # accept the current set
 *
 * `where({ school_id: schoolId })` with no limit fetches the entire table for
 * that school. On a policy table that is one row. On submissions it is
 * students x assignments — a 900-pupil school a year in is six figures of rows
 * transferred into a browser tab, usually to compute a handful of numbers that
 * Postgres could have aggregated.
 *
 * Nothing here is wrong today: the platform holds three assignments and zero
 * submissions, so every one of these is instant. That is exactly why it needs
 * a guard — the failure arrives with the first real school, long after the
 * code was written.
 *
 * The baseline in scripts/query-bounds-baseline.json records what already
 * exists. This fails only on additions, so the debt is visible and bounded
 * rather than quietly growing. Fixing one means aggregating in SQL (see
 * supabase/migrations/0014_coordinator_completion.sql for the shape) or
 * paginating, then re-running with --update.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const BASELINE = join(ROOT, 'scripts/query-bounds-baseline.json');

/**
 * Tables whose row count scales with pupils, days or assignments. Everything
 * else in src/data is bounded by how a school is configured — a couple of
 * dozen rooms, one policy row — and fetching all of it is correct.
 */
const UNBOUNDED_RISK = [
  'submissions',
  'assignments',
  'attendance',
  'attendanceRecords',
  'messages',
  'behaviorRecords',
  'scheduleEntries',
  'gradebook',
  'casExperiences',
  'auditLogs',
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
  }
  return out;
}

const rel = (f) => f.replace(`${ROOT}/`, '');
const found = [];

for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8');
  for (const mod of UNBOUNDED_RISK) {
    // Only school-wide reads. `where({ assignment_id, student_id })` is
    // already bounded by the pupil or the class; it is the filter that says
    // nothing but "this school" that scales with the roll.
    const re = new RegExp(`(?<![\\w.$])${mod}Data\\.where\\(\\{([^}]*)\\}\\s*\\)`, 'g');
    let m;
    while ((m = re.exec(src))) {
      const keys = m[1]
        .split(',')
        .map((k) => k.split(':')[0].trim())
        .filter(Boolean);
      const narrowing = keys.filter((k) => !['school_id', 'status'].includes(k));
      if (narrowing.length === 0) found.push(`${rel(file)}::${mod}`);
    }
  }
}

const current = [...new Set(found)].sort();

if (process.argv.includes('--update')) {
  writeFileSync(BASELINE, `${JSON.stringify(current, null, 2)}\n`);
  console.log(`[verify-query-bounds] baseline updated — ${current.length} known unbounded read(s)`);
  process.exit(0);
}

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : [];
const added = current.filter((c) => !baseline.includes(c));
const fixed = baseline.filter((b) => !current.includes(b));

if (added.length) {
  console.error(`\n[verify-query-bounds] ${added.length} new unbounded read(s) of a table that grows:\n`);
  for (const a of added) {
    const [file, mod] = a.split('::');
    console.error(`  ${file}\n    ${mod}Data.where({ ... }) with no limit`);
  }
  console.error('\nAggregate it in Postgres, or pass a limit. If it is genuinely');
  console.error('bounded, run with --update to accept it.\n');
  process.exit(1);
}

if (fixed.length) {
  console.log(`[verify-query-bounds] ${fixed.length} fixed since the baseline — run --update to record it`);
}
console.log(`[verify-query-bounds] ok — ${current.length} known, 0 new`);
