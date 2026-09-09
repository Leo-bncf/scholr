#!/usr/bin/env node
/**
 * Audit the live database against base44's entity definitions.
 *
 *   SUPABASE_URL=... SERVICE_ROLE_KEY=... node scripts/audit-schema.mjs
 *
 * The schema was produced by a generator, and a generator is exactly the sort
 * of thing that is uniformly wrong. This compares, field by field, what base44
 * declared with what Postgres actually has:
 *
 *   - every entity has a table, every property has a column
 *   - declared `required` became NOT NULL
 *   - declared `default` became a column default
 *   - declared `enum` became a CHECK constraint
 *   - RLS covers every operation, or is deliberately absent
 *   - every foreign key is indexed
 *
 * Findings are graded. ERROR means the database disagrees with the product's
 * own model; WARN means it's defensible but worth a decision.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Schema metadata arrives on stdin as one JSON document, produced by
 * scripts/dump-schema.sql run through psql:
 *
 *   ssh leo@scholr-prod 'sudo docker exec -i supabase-db psql -U postgres \
 *     -d postgres -tAf -' < scripts/dump-schema.sql | node scripts/audit-schema.mjs
 *
 * Deliberately NOT an RPC. Exposing a function that executes arbitrary SQL —
 * even service-role only — is a backdoor, and one this very audit would flag.
 */
const meta = JSON.parse(readFileSync(0, 'utf8'));
const sql = (key) => meta[key] ?? [];

const app = JSON.parse(readFileSync(resolve(ROOT, 'scripts/.cache/app.json'), 'utf8'));
const entities = Object.fromEntries(
  Object.entries(app.entities).map(([k, v]) => [k, typeof v === 'string' ? JSON.parse(v) : v]),
);

// Mirrors the generator's naming.
const TABLE_OVERRIDES = {
  CASExperience: 'cas_experiences', TOKTask: 'tok_tasks', EEMilestone: 'ee_milestones',
  Class: 'classes', AttendancePolicy: 'attendance_policies', BehaviorPolicy: 'behavior_policies',
  GovernancePolicy: 'governance_policies', GradebookPolicy: 'gradebook_policies',
  MessagingPolicy: 'messaging_policies', SubmissionPolicy: 'submission_policies',
  PlatformConfig: 'platform_config', TimetableSettings: 'timetable_settings',
  ScheduleEntry: 'schedule_entries',
};
const snake = (s) => s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').replace(/([a-z\d])([A-Z])/g, '$1_$2').toLowerCase();
const tableOf = (e) => TABLE_OVERRIDES[e] ?? `${snake(e)}s`;

const findings = [];
const add = (level, table, message, detail) => findings.push({ level, table, message, detail });

// ---------------------------------------------------------------------------

const columns = sql('columns');
const byTable = new Map();
for (const c of columns) {
  if (!byTable.has(c.table_name)) byTable.set(c.table_name, new Map());
  byTable.get(c.table_name).set(c.column_name, c);
}

const checks = sql('checks');
const checksByTable = new Map();
for (const c of checks) {
  if (!checksByTable.has(c.table_name)) checksByTable.set(c.table_name, []);
  checksByTable.get(c.table_name).push(c);
}

const policies = sql('policies');
const policiesByTable = new Map();
for (const p of policies) {
  if (!policiesByTable.has(p.tablename)) policiesByTable.set(p.tablename, []);
  policiesByTable.get(p.tablename).push(p);
}

const indexes = sql('indexes');
const fks = sql('fks');

// ── 1. entities, columns, nullability, defaults, enums ─────────────────────

for (const [entity, def] of Object.entries(entities)) {
  const table = tableOf(entity);
  const cols = byTable.get(table);
  if (!cols) { add('ERROR', table, `entity ${entity} has no table`); continue; }

  const props = def.properties ?? {};
  const required = new Set(def.required ?? []);

  for (const [name, spec] of Object.entries(props)) {
    const col = cols.get(name);
    if (!col) { add('ERROR', table, `missing column "${name}"`, `declared by ${entity}`); continue; }

    // required -> NOT NULL
    if (required.has(name) && col.is_nullable === 'YES') {
      add('ERROR', table, `"${name}" is nullable but base44 marks it required`);
    }

    // default -> column default
    if (spec.default !== undefined && col.column_default === null) {
      add('WARN', table, `"${name}" has no default; base44 declared ${JSON.stringify(spec.default)}`);
    }

    // enum -> CHECK
    if (spec.enum) {
      const has = (checksByTable.get(table) ?? []).some(
        (c) => c.def.includes(`${name}`) && spec.enum.every((v) => c.def.includes(`'${v}'`)),
      );
      if (!has) add('ERROR', table, `"${name}" has no CHECK covering its ${spec.enum.length} allowed values`);
    }
  }
}

// ── 2. RLS coverage ────────────────────────────────────────────────────────

const rlsTables = sql('rls');

for (const t of rlsTables) {
  if (!t.enabled) { add('ERROR', t.table_name, 'RLS is not enabled'); continue; }
  const ps = policiesByTable.get(t.table_name) ?? [];
  if (ps.length === 0) { add('ERROR', t.table_name, 'RLS enabled with no policies — table is unreachable'); continue; }

  // ALL covers everything; otherwise look for each command.
  const cmds = new Set(ps.map((p) => p.cmd));
  if (cmds.has('ALL')) continue;
  for (const op of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
    if (!cmds.has(op)) {
      add('WARN', t.table_name, `no ${op} policy — only super admins can ${op.toLowerCase()}`);
    }
  }
}

// ── 3. unindexed foreign keys ──────────────────────────────────────────────

const indexedCols = new Set();
for (const i of indexes) {
  const m = i.indexdef.match(/\(([^)]+)\)/);
  if (m) indexedCols.add(`${i.tablename}.${m[1].split(',')[0].trim().replace(/"/g, '')}`);
}
for (const fk of fks) {
  if (!indexedCols.has(`${fk.table_name}.${fk.column_name}`)) {
    add('WARN', fk.table_name, `foreign key "${fk.column_name}" is not indexed`,
        'joins and cascading deletes will sequential-scan');
  }
}

// ── report ─────────────────────────────────────────────────────────────────

const errors = findings.filter((f) => f.level === 'ERROR');
const warns = findings.filter((f) => f.level === 'WARN');

for (const group of [errors, warns]) {
  if (!group.length) continue;
  console.log(`\n${group[0].level}  (${group.length})`);
  const byT = new Map();
  for (const f of group) {
    if (!byT.has(f.table)) byT.set(f.table, []);
    byT.get(f.table).push(f);
  }
  for (const [table, items] of [...byT].sort()) {
    console.log(`  ${table}`);
    for (const i of items) console.log(`     ${i.message}${i.detail ? `  (${i.detail})` : ''}`);
  }
}

console.log(`\n${errors.length} error(s), ${warns.length} warning(s) across ${byTable.size} tables`);
process.exit(errors.length ? 1 : 0);
