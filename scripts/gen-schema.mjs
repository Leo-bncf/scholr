#!/usr/bin/env node
/**
 * Generate the Postgres schema for Scholr from the base44 entity definitions.
 *
 *   node scripts/base44-pull.mjs && node scripts/gen-schema.mjs
 *
 * Emits:
 *   supabase/migrations/0002_tables.sql   47 tables + indexes + updated_at triggers
 *   supabase/migrations/0003_rls.sql      RLS policies translated from base44's
 *                                         declarative `rls` blocks
 *
 * 0001_core.sql is hand-written (extensions, profiles, helper functions) because
 * it has no base44 counterpart — base44's User entity becomes auth.users +
 * public.profiles, which needs decisions a generator shouldn't be making.
 *
 * Regenerating is safe: both outputs are fully derived from scripts/.cache/app.json.
 * Hand-edits belong in a later migration, never in the generated files.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const app = JSON.parse(readFileSync(resolve(ROOT, 'scripts/.cache/app.json'), 'utf8'));

const entities = Object.fromEntries(
  Object.entries(app.entities).map(([k, v]) => [k, typeof v === 'string' ? JSON.parse(v) : v]),
);

// The User entity becomes auth.users + public.profiles, defined in 0001_core.sql.
delete entities.User;

// ---------------------------------------------------------------------------
// naming
// ---------------------------------------------------------------------------

// Entity -> table. Only the cases a naive pluraliser gets wrong are listed;
// everything else falls through to snake_case + 's'.
const TABLE_OVERRIDES = {
  CASExperience: 'cas_experiences',
  TOKTask: 'tok_tasks',
  EEMilestone: 'ee_milestones',
  Class: 'classes',
  AttendancePolicy: 'attendance_policies',
  BehaviorPolicy: 'behavior_policies',
  GovernancePolicy: 'governance_policies',
  GradebookPolicy: 'gradebook_policies',
  MessagingPolicy: 'messaging_policies',
  SubmissionPolicy: 'submission_policies',
  PlatformConfig: 'platform_config',
  TimetableSettings: 'timetable_settings',
  ScheduleEntry: 'schedule_entries',
};

const snake = (s) =>
  s
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z\d])([A-Z])/g, '$1_$2')
    .toLowerCase();

const tableOf = (entity) => TABLE_OVERRIDES[entity] ?? `${snake(entity)}s`;

// ---------------------------------------------------------------------------
// column typing
// ---------------------------------------------------------------------------

// *_id columns that reference another table. Anything not listed here but
// ending in _id is treated as an opaque identifier (see TEXT_IDS / polymorphic).
const FK = {
  school_id: 'schools',
  class_id: 'classes',
  subject_id: 'subjects',
  academic_year_id: 'academic_years',
  cohort_id: 'cohorts',
  term_id: 'terms',
  room_id: 'rooms',
  period_id: 'periods',
  assignment_id: 'assignments',
  assessment_id: 'assessments',
  parent_topic_id: 'curriculum_topics',
  previous_submission_id: 'submissions',
  // people — all resolve to profiles, which is 1:1 with auth.users
  user_id: 'profiles',
  student_id: 'profiles',
  teacher_id: 'profiles',
  primary_teacher_id: 'profiles',
  sender_id: 'profiles',
  parent_id: 'profiles',
  supervisor_id: 'profiles',
  subject_user_id: 'profiles',
  uploaded_by_id: 'profiles',
  created_by_id: 'profiles',
};

// uuid[] — array references. Postgres can't FK these; integrity is enforced
// in the data layer and by the check constraints below where it matters.
const UUID_ARRAYS = new Set(['teacher_ids', 'student_ids', 'recipient_ids', 'curriculum_topic_ids']);

// *_id columns that are NOT uuids: external system references and human labels.
const TEXT_IDS = new Set([
  'stripe_customer_id',
  'stripe_subscription_id',
  'external_sync_id',
  'external_school_id',
  'incident_type_id', // references an id inside BehaviorPolicy.incident_types (jsonb)
  'ticket_id', // human-readable, e.g. TKT-001
]);

// Polymorphic references — a uuid, but the target table varies by row.
const POLYMORPHIC = new Set(['entity_id', 'related_entity_id', 'thread_id']);

// Columns that hold a user id but aren't named *_id (e.g. Report.generated_by).
// Discovered rather than hardcoded: if a base44 rls rule compares a column to
// {{user.id}}, that column is a user reference, whatever it's called.
const USER_REFS = new Set();
(function discoverUserRefs() {
  const visit = (cond) => {
    if (!cond || typeof cond !== 'object') return;
    if (cond.$or) return cond.$or.forEach(visit);
    for (const [k, v] of Object.entries(cond)) {
      if (k.startsWith('data.') && typeof v === 'string' && v.includes('{{user.id}}')) {
        USER_REFS.add(k.slice(5));
      }
    }
  };
  for (const def of Object.values(entities)) Object.values(def.rls ?? {}).forEach(visit);
})();

const quote = (s) => `'${String(s).replace(/'/g, "''")}'`;

function columnType(name, spec) {
  if (UUID_ARRAYS.has(name)) return 'uuid[]';
  if (name.endsWith('_id') && !TEXT_IDS.has(name)) return 'uuid';
  if (USER_REFS.has(name) && spec.type === 'string' && !spec.enum) return 'uuid';

  switch (spec.type) {
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'numeric';
    case 'object':
      return 'jsonb';
    case 'array':
      return spec.items?.type === 'object' ? 'jsonb' : 'text[]';
    case 'string':
      if (spec.format === 'date-time') return 'timestamptz';
      if (spec.format === 'date') return 'date';
      return 'text';
    default:
      return 'jsonb';
  }
}

function defaultClause(name, spec, type) {
  if (spec.default === undefined) return '';
  const d = spec.default;
  if (type === 'jsonb') return ` default ${quote(JSON.stringify(d))}::jsonb`;
  if (type === 'text[]') {
    if (!Array.isArray(d)) return '';
    return d.length === 0
      ? " default '{}'::text[]"
      : ` default array[${d.map(quote).join(', ')}]::text[]`;
  }
  if (type === 'uuid[]') return " default '{}'::uuid[]";
  if (typeof d === 'boolean') return ` default ${d}`;
  if (typeof d === 'number') return ` default ${d}`;
  return ` default ${quote(d)}`;
}

// ---------------------------------------------------------------------------
// tables
// ---------------------------------------------------------------------------

const header = (title) => `-- ${'-'.repeat(74)}
-- ${title}
--
-- GENERATED by scripts/gen-schema.mjs from the base44 app definition.
-- Do not edit by hand — add a later migration instead.
-- ${'-'.repeat(74)}

`;

function buildTable(entity) {
  const def = entities[entity];
  const table = tableOf(entity);
  const props = def.properties ?? {};
  const required = new Set(def.required ?? []);

  const lines = ['  id uuid primary key default gen_random_uuid()'];
  const constraints = [];
  const indexes = [];

  for (const [name, spec] of Object.entries(props)) {
    const type = columnType(name, spec);
    let line = `  ${name} ${type}`;

    // FK — schools cascade (deleting a school removes its data); people are
    // set null so an audit trail survives a user deletion.
    const target = FK[name] ?? (USER_REFS.has(name) && type === 'uuid' ? 'profiles' : undefined);
    if (target && type === 'uuid' && !POLYMORPHIC.has(name)) {
      const onDelete = target === 'schools' ? 'cascade' : 'set null';
      // A required FK can't be "set null" on delete; restrict instead.
      const action = required.has(name) && onDelete === 'set null' ? 'restrict' : onDelete;
      line += ` references public.${target}(id) on delete ${action}`;
    }

    if (required.has(name)) line += ' not null';
    line += defaultClause(name, spec, type);
    lines.push(line);

    if (spec.enum) {
      constraints.push(
        `  constraint ${table}_${name}_check check (${name} is null or ${name} in (${spec.enum
          .map(quote)
          .join(', ')}))`,
      );
    }
    // Index every FK — these are all filtered on constantly by the app.
    if (target && type === 'uuid') indexes.push(`${table}_${name}_idx|${name}`);
  }

  lines.push('  created_at timestamptz not null default now()');
  lines.push('  updated_at timestamptz not null default now()');
  lines.push('  created_by uuid references auth.users(id) on delete set null');

  const body = [...lines, ...constraints].join(',\n');

  let sql = `create table public.${table} (\n${body}\n);\n\n`;
  for (const idx of indexes) {
    const [idxName, col] = idx.split('|');
    sql += `create index ${idxName} on public.${table} (${col});\n`;
  }
  // Composite index for the dominant access pattern: everything in this app is
  // read as "rows for my school, newest first".
  if (props.school_id) {
    sql += `create index ${table}_school_created_idx on public.${table} (school_id, created_at desc);\n`;
  }
  sql += `\ncreate trigger ${table}_set_updated_at before update on public.${table}\n  for each row execute function public.set_updated_at();\n`;

  return sql;
}

// Order tables so FK targets exist first.
const ORDER_FIRST = [
  'School',
  'AcademicYear',
  'Term',
  'Subject',
  'Cohort',
  'Room',
  'Period',
  'Class',
  'CurriculumTopic',
  'Assignment',
  'Assessment',
  'Submission',
];
const ordered = [
  ...ORDER_FIRST.filter((e) => entities[e]),
  ...Object.keys(entities).filter((e) => !ORDER_FIRST.includes(e)).sort(),
];

let tablesSql = header('0002 — tables');
for (const entity of ordered) tablesSql += `-- ${entity}\n${buildTable(entity)}\n`;

// Deferred from 0001 — profiles is created before schools exists.
tablesSql += `-- deferred FK from 0001
alter table public.profiles
  add constraint profiles_active_school_id_fkey
  foreign key (active_school_id) references public.schools(id) on delete set null;
`;

// ---------------------------------------------------------------------------
// RLS — translated from base44's declarative rls blocks
// ---------------------------------------------------------------------------

// base44 condition -> SQL predicate.
//   { "data.school_id": "{{user.data.school_id}}" }  -> caller is a member of the row's school
//   { "data.teacher_id": "{{user.id}}" }             -> caller owns the row
//   { "user_condition": { "role": "admin" } }        -> platform admin (our super_admin)
//   { "user_condition": { "role": { "$in": [...] } } } -> caller holds one of these school roles
//   { "$or": [ ... ] }                               -> disjunction of the above
const rlsWarnings = [];

/**
 * base44 conditions are an implicit AND of their keys, where `$or` is one such
 * key rather than a wrapper. Treating `$or` as the whole condition — as an
 * earlier version of this function did — silently discards its siblings,
 * including `data.school_id`, which turns a tenant-scoped read into a global
 * one. Every key must be collected and ANDed.
 *
 * `scoped` propagates down into $or branches: if the enclosing rule is
 * school-scoped, a role test inside a branch means "this role at THIS school",
 * so it maps to has_school_role rather than the global profile role.
 */
function translate(cond, table, columns, entity, scoped = false) {
  if (!cond) return null;

  // On the schools table itself, "the row's school" is the row: base44 writes
  // that as data.school_id, but the column is id.
  const scopeCol = table === 'schools' ? 'id' : 'school_id';
  const hasSchool = Object.prototype.hasOwnProperty.call(cond, 'data.school_id');
  const isScoped = scoped || hasSchool;

  const parts = [];
  if (hasSchool) parts.push(`public.is_member_of(${scopeCol})`);

  for (const [key, value] of Object.entries(cond)) {
    if (key === 'user_condition' || key === 'data.school_id' || key === '$or') continue;

    // base44 records the creator's email; our created_by is a uuid FK to
    // auth.users, so identity comparison is against auth.uid().
    if (key === 'created_by') {
      parts.push('created_by = auth.uid()');
      continue;
    }
    if (!key.startsWith('data.')) continue;

    const col = key.slice(5);
    // base44 lets a policy name a column the entity doesn't have; the rule is
    // then dead. Drop it rather than emitting SQL that won't compile.
    if (!columns.has(col)) {
      rlsWarnings.push(`${entity}: rls references unknown column "${col}" — dropped`);
      continue;
    }

    if (typeof value === 'string' && value.includes('{{user.id}}')) {
      // Array columns (teacher_ids, recipient_ids, …) are membership tests.
      parts.push(UUID_ARRAYS.has(col) ? `auth.uid() = any(${col})` : `${col} = auth.uid()`);
    } else if (typeof value === 'string' && value.includes('{{user.email}}')) {
      parts.push(`${col} = auth.uid()`);
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      // Literal gates such as visible_to_student = true. Dropping these is what
      // would expose unpublished grades to students.
      parts.push(`${col} = ${value}`);
    } else if (typeof value === 'string' && !value.includes('{{')) {
      parts.push(`${col} = ${quote(value)}`);
    } else {
      rlsWarnings.push(`${entity}: unhandled rls condition ${key} = ${JSON.stringify(value)}`);
    }
  }

  const uc = cond.user_condition;
  if (uc) {
    // base44 uses both `role` (platform) and `data.role` (app) for the same thing.
    const raw = uc.role ?? uc['data.role'];
    const roles = raw == null ? [] : raw.$in ? raw.$in : [raw];
    // base44's platform "admin" is our super_admin, granted globally by its own
    // policy — so an admin-only rule needs no predicate here.
    const appRoles = roles.filter((r) => r !== 'admin' && r !== 'user');
    if (appRoles.length) {
      parts.push(
        isScoped
          ? `public.has_school_role(${scopeCol}, array[${appRoles.map(quote).join(', ')}])`
          : `public.current_app_role() in (${appRoles.map(quote).join(', ')})`,
      );
    } else if (roles.includes('admin') && parts.length === 0) {
      parts.push('public.is_super_admin()');
    }
  }

  // $or is a sibling key, ANDed with everything above.
  if (cond.$or) {
    const branches = cond.$or
      .map((c) => translate(c, table, columns, entity, isScoped))
      .filter(Boolean);
    if (branches.length) parts.push(`(${branches.join('\n       or ')})`);
  }

  if (!parts.length) return null;
  // is_member_of is implied by has_school_role at the same level.
  const deduped = parts.filter(
    (p) =>
      !(
        p === `public.is_member_of(${scopeCol})` &&
        parts.some((q) => q.startsWith('public.has_school_role'))
      ),
  );
  return deduped.length > 1 ? `(${deduped.join('\n     and ')})` : deduped[0];
}

// The 7 entities base44 left unprotected. GoogleConnection holds OAuth refresh
// tokens and PrivacyRequest holds GDPR subject data — both were world-readable
// to any authenticated user on base44. These are deliberately tighter.
// Policies for the 7 entities base44 shipped with no rls at all.
//
// Each operation is declared separately and NEVER as FOR ALL. A permissive
// `for all ... using (true)` also grants SELECT, so a broad write rule silently
// hands out read access — which is how an early version of this file exposed
// the demo-request leads to anonymous visitors.
//
// `insertRoles` widens INSERT beyond `authenticated`: public forms are
// submitted by signed-out visitors, who reach Postgres as the `anon` role.
// Omitting update/delete is deliberate — the super-admin policy every table
// carries is what allows administrative edits.
const RLS_GAPS = {
  GoogleConnection: {
    note: 'OAuth access + refresh tokens — owner only. Server-side refresh uses the service role.',
    select: 'user_id = auth.uid()',
    insert: 'user_id = auth.uid()',
    update: 'user_id = auth.uid()',
    delete: 'user_id = auth.uid()',
  },
  PrivacyRequest: {
    note: 'GDPR requests — school admins manage them; the data subject can read and raise their own.',
    select: "(public.has_school_role(school_id, array['school_admin']) or subject_user_id = auth.uid())",
    insert: 'public.is_member_of(school_id)',
    update: "public.has_school_role(school_id, array['school_admin'])",
    delete: "public.has_school_role(school_id, array['school_admin'])",
  },
  ErrorLog: {
    note: 'Write-only for everyone including signed-out visitors; only super admins read.',
    select: 'public.is_super_admin()',
    insert: 'true',
    insertRoles: 'anon, authenticated',
  },
  TimetableSync: {
    note: null,
    select: 'public.is_member_of(school_id)',
    insert: "public.has_school_role(school_id, array['school_admin','ib_coordinator'])",
    update: "public.has_school_role(school_id, array['school_admin','ib_coordinator'])",
    delete: "public.has_school_role(school_id, array['school_admin','ib_coordinator'])",
  },
  DemoRequest: {
    note: 'Public lead-capture form, submitted while signed out. Write-only — leads are readable by super admins alone.',
    select: 'public.is_super_admin()',
    insert: 'true',
    insertRoles: 'anon, authenticated',
  },
  SupportTicket: {
    note: 'Raised from inside the app. Write-only; only super admins read.',
    select: 'public.is_super_admin()',
    insert: 'true',
  },
  PlatformConfig: {
    note: 'Readable by any signed-in user; writable by super admins only.',
    select: 'true',
    insert: 'public.is_super_admin()',
    update: 'public.is_super_admin()',
    delete: 'public.is_super_admin()',
  },
};

let rlsSql = header('0003 — row level security');
rlsSql += `-- Every policy below is additive to a global super-admin grant, which mirrors
-- base44's platform-admin bypass. Service-role connections bypass RLS entirely
-- and are what the edge functions use for privileged work.

`;

for (const entity of ordered) {
  const table = tableOf(entity);
  const def = entities[entity];
  rlsSql += `-- ${entity}\n`;
  rlsSql += `alter table public.${table} enable row level security;\n`;
  rlsSql += `create policy ${table}_super_admin on public.${table}\n  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());\n`;

  const gap = RLS_GAPS[entity];
  if (gap) {
    if (gap.note) rlsSql += `-- ${gap.note}\n`;
    rlsSql += `-- base44 had NO rls on this entity; policy written from scratch.\n`;
    if (gap.select) {
      rlsSql += `create policy ${table}_select on public.${table}\n  for select to authenticated using (${gap.select});\n`;
    }
    if (gap.insert) {
      const roles = gap.insertRoles ?? 'authenticated';
      rlsSql += `create policy ${table}_insert on public.${table}\n  for insert to ${roles} with check (${gap.insert});\n`;
    }
    if (gap.update) {
      rlsSql += `create policy ${table}_update on public.${table}\n  for update to authenticated using (${gap.update}) with check (${gap.update});\n`;
    }
    if (gap.delete) {
      rlsSql += `create policy ${table}_delete on public.${table}\n  for delete to authenticated using (${gap.delete});\n`;
    }
    rlsSql += '\n';
    continue;
  }

  const rls = def.rls ?? {};
  const columns = new Set(Object.keys(def.properties ?? {}));
  const ops = { read: 'select', create: 'insert', update: 'update', delete: 'delete' };
  for (const [op, sqlOp] of Object.entries(ops)) {
    const pred = translate(rls[op], table, columns, entity);
    if (!pred) {
      rlsSql += `-- ${op}: super-admin only (base44 declared no rule)\n`;
      continue;
    }
    if (sqlOp === 'insert') {
      rlsSql += `create policy ${table}_insert on public.${table}\n  for insert to authenticated with check (${pred});\n`;
    } else if (sqlOp === 'update') {
      rlsSql += `create policy ${table}_update on public.${table}\n  for update to authenticated using (${pred}) with check (${pred});\n`;
    } else {
      rlsSql += `create policy ${table}_${sqlOp} on public.${table}\n  for ${sqlOp} to authenticated using (${pred});\n`;
    }
  }
  rlsSql += '\n';
}

// ---------------------------------------------------------------------------

const dir = resolve(ROOT, 'supabase/migrations');
mkdirSync(dir, { recursive: true });
writeFileSync(resolve(dir, '0002_tables.sql'), tablesSql);
writeFileSync(resolve(dir, '0003_rls.sql'), rlsSql);

const cols = ordered.reduce((n, e) => n + Object.keys(entities[e].properties ?? {}).length, 0);
console.log(`0002_tables.sql  ${ordered.length} tables, ${cols} columns`);
console.log(`0003_rls.sql     ${ordered.length} tables, ${Object.keys(RLS_GAPS).length} written from scratch`);
if (rlsWarnings.length) {
  console.log(`\n${rlsWarnings.length} base44 rls rule(s) could not be translated:`);
  for (const w of new Set(rlsWarnings)) console.log(`  - ${w}`);
}
