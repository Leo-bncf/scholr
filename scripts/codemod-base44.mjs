#!/usr/bin/env node
/**
 * Rewrite the remaining base44 call sites onto src/data.
 *
 *   node scripts/codemod-base44.mjs --dry-run
 *   node scripts/codemod-base44.mjs
 *
 * Handles the mechanical shapes:
 *
 *   base44.entities.X.filter({...})        -> mod.where({...})
 *   base44.entities.X.filter({...}, s, n)  -> mod.where({...}, { order, ascending, limit })
 *   base44.entities.X.list('-created_at', n) -> mod.where({}, { order:'created_at', ascending:false, limit:n })
 *   base44.entities.X.get(id)              -> mod.get(id)
 *   base44.entities.X.create(o)            -> mod.create(o)
 *   base44.entities.X.update(id, o)        -> mod.update(id, o)
 *   base44.entities.X.delete(id)           -> mod.remove(id)
 *   base44.auth.me()                       -> getCurrentUser()
 *   base44.functions.invoke(n, b)          -> fns.invoke(n, b)
 *
 * Anything it can't map is left alone and reported, so the remaining work is
 * always visible rather than silently half-done.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'src');
const dryRun = process.argv.includes('--dry-run');

// entity -> { module, import alias, and the function names to use }
const M = (mod, alias, fns = {}) => ({ mod, alias, fns });
const D = { where: 'where', get: 'get', create: 'create', update: 'update', remove: 'remove' };

const ENTITIES = {
  School:               M('schools', 'schoolsData'),
  SchoolMembership:     M('memberships', 'membershipsData'),
  Class:                M('classes', 'classesData'),
  Assignment:           M('assignments', 'assignmentsData'),
  Submission:           M('submissions', 'submissionsData'),
  AttendanceRecord:     M('attendance', 'attendanceData', {
    where: 'whereRecords', get: null, create: 'create', update: 'update', remove: 'remove',
  }),
  GradeItem:            M('gradebook', 'gradebookData', {
    where: 'whereGradeItems', get: null, create: 'create', update: 'update', remove: 'remove',
  }),
  PredictedGrade:       M('gradebook', 'gradebookData', {
    where: 'wherePredictedGrades', get: null, create: 'createPredicted', update: 'updatePredicted', remove: null,
  }),
  Subject:              M('academics', 'academics', {
    where: 'whereSubjects', get: 'getSubject', create: 'createSubject', update: 'updateSubject', remove: 'removeSubject',
  }),
  AcademicYear:         M('academics', 'academics', {
    where: 'whereAcademicYears', get: null, create: 'createAcademicYear',
    update: 'updateAcademicYear', remove: 'removeAcademicYear',
  }),
  Term:                 M('academics', 'academics', {
    where: 'whereTerms', get: null, create: 'createTerm', update: 'updateTerm', remove: 'removeTerm',
  }),
  Cohort:               M('academics', 'academics', {
    where: 'whereCohorts', get: null, create: 'createCohort', update: 'updateCohort', remove: 'removeCohort',
  }),
  AuditLog:             M('admin', 'admin', {
    where: 'whereAuditLogs', get: null, create: 'recordAuditLog', update: null, remove: null,
  }),
  PlatformConfig:       M('admin', 'admin', {
    where: 'wherePlatformConfig', get: null, create: 'createPlatformConfig',
    update: 'updatePlatformConfig', remove: null,
  }),
  DemoRequest:          M('demoRequests', 'demoRequests'),
  User:                 M('users', 'usersData'),
};

// The generated long-tail modules all share the default surface.
const GENERATED = {
  Assessment: 'assessments', AssessmentSubmission: 'assessmentSubmissions',
  AccountState: 'accountStates', AttendancePolicy: 'attendancePolicies',
  BehaviorPolicy: 'behaviorPolicies', BehaviorRecord: 'behaviorRecords',
  CASExperience: 'casExperiences', ClassMaterial: 'classMaterials',
  CurriculumTopic: 'curriculumTopics', EEMilestone: 'eeMilestones',
  ErrorLog: 'errorLogs', GoogleConnection: 'googleConnections',
  GovernancePolicy: 'governancePolicies', GradebookPolicy: 'gradebookPolicies',
  LessonPlan: 'lessonPlans', Message: 'messages', MessagingPolicy: 'messagingPolicies',
  Notification: 'notifications', ParentStudentLink: 'parentStudentLinks',
  Period: 'periods', PrivacyRequest: 'privacyRequests', Report: 'reports',
  ReportTemplate: 'reportTemplates', Room: 'rooms', RubricTemplate: 'rubricTemplates',
  ScheduleEntry: 'scheduleEntries', SubmissionPolicy: 'submissionPolicies',
  SupportTicket: 'supportTickets', TOKTask: 'tokTasks', TimetableSettings: 'timetableSettings',
  TimetableSync: 'timetableSyncs', UnifiedCalendarEvent: 'unifiedCalendarEvents',
  UserInvitation: 'userInvitations',
};
for (const [entity, mod] of Object.entries(GENERATED)) {
  if (!ENTITIES[entity]) ENTITIES[entity] = M(mod, `${mod}Data`);
}

/** Split a call's argument list on top-level commas. */
function splitArgs(s) {
  const out = [];
  let depth = 0, start = 0, quote = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quote) {
      if (c === quote && s[i - 1] !== '\\') quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') quote = c;
    else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) { out.push(s.slice(start, i).trim()); start = i + 1; }
  }
  const last = s.slice(start).trim();
  if (last) out.push(last);
  return out;
}

/** Find the matching ')' for the '(' at `open`. */
function matchParen(s, open) {
  let depth = 0, quote = null;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (quote) { if (c === quote && s[i - 1] !== '\\') quote = null; continue; }
    if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

/** base44 sort strings: '-created_at' desc, 'name' asc. */
function sortOpts(sortArg, limitArg) {
  const parts = [];
  if (sortArg) {
    const lit = sortArg.match(/^['"](-?)([\w.]+)['"]$/);
    if (lit) {
      parts.push(`order: '${lit[2]}'`);
      parts.push(`ascending: ${lit[1] ? 'false' : 'true'}`);
    } else {
      return null; // dynamic sort — leave for a human
    }
  }
  if (limitArg) parts.push(`limit: ${limitArg}`);
  return parts.length ? `{ ${parts.join(', ')} }` : null;
}

const unmapped = [];
const touched = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(jsx?|tsx?)$/.test(entry)) convert(p);
  }
}

function convert(path) {
  // src/data IS the replacement layer — its modules mention base44 only in
  // comments, and rewriting them produces self-imports.
  if (path.includes('/src/data/')) return;

  let src = readFileSync(path, 'utf8');
  if (!src.includes('base44')) return;
  const before = src;
  const needed = new Map(); // module -> alias
  let usesSession = new Set();
  let usesFns = false;

  // --- entity calls -------------------------------------------------------
  let guard = 0;
  for (;;) {
    if (guard++ > 500) break;
    const m = src.match(/base44\.entities\.([A-Za-z]+)\.([a-zA-Z]+)\s*\(/);
    if (!m) break;

    const [, entity, method] = m;
    const open = m.index + m[0].length - 1;
    const close = matchParen(src, open);
    if (close === -1) break;

    const argsRaw = src.slice(open + 1, close);
    const args = splitArgs(argsRaw);
    const spec = ENTITIES[entity];

    let replacement = null;
    if (spec) {
      const fn = { ...D, ...spec.fns };
      if (method === 'filter') {
        const opts = sortOpts(args[1], args[2]);
        if (fn.where) replacement = `${spec.alias}.${fn.where}(${args[0] ?? '{}'}${opts ? `, ${opts}` : ''})`;
      } else if (method === 'list') {
        const opts = sortOpts(args[0], args[1]);
        if (fn.where) replacement = `${spec.alias}.${fn.where}({}${opts ? `, ${opts}` : ''})`;
      } else if (method === 'get' && fn.get) {
        replacement = `${spec.alias}.${fn.get}(${args.join(', ')})`;
      } else if (method === 'create' && fn.create) {
        replacement = `${spec.alias}.${fn.create}(${args.join(', ')})`;
      } else if (method === 'update' && fn.update) {
        replacement = `${spec.alias}.${fn.update}(${args.join(', ')})`;
      } else if (method === 'delete' && fn.remove) {
        replacement = `${spec.alias}.${fn.remove}(${args.join(', ')})`;
      } else if (method === 'bulkCreate') {
        replacement = `Promise.all((${args[0]}).map((r) => ${spec.alias}.${fn.create}(r)))`;
      }
    }

    if (!replacement) {
      unmapped.push(`${path}: base44.entities.${entity}.${method}`);
      // Neutralise so the loop can continue past it.
      src = src.slice(0, m.index) + '__B44_TODO__' + src.slice(m.index + 'base44.entities.'.length);
      continue;
    }

    needed.set(spec.mod, spec.alias);
    src = src.slice(0, m.index) + replacement + src.slice(close + 1);
  }
  src = src.replaceAll('__B44_TODO__', 'base44.entities.');

  // --- auth ---------------------------------------------------------------
  if (/base44\.auth\.me\s*\(\s*\)/.test(src)) { src = src.replace(/base44\.auth\.me\s*\(\s*\)/g, 'getCurrentUser()'); usesSession.add('getCurrentUser'); }
  if (/base44\.auth\.isAuthenticated\s*\(\s*\)/.test(src)) { src = src.replace(/base44\.auth\.isAuthenticated\s*\(\s*\)/g, 'isAuthenticated()'); usesSession.add('isAuthenticated'); }
  if (/base44\.auth\.logout\s*\(\s*\)/.test(src)) { src = src.replace(/base44\.auth\.logout\s*\(\s*\)/g, 'signOut()'); usesSession.add('signOut'); }
  if (/base44\.auth\.updateMe\s*\(/.test(src)) { src = src.replace(/base44\.auth\.updateMe\s*\(/g, 'updateMyProfile('); usesSession.add('updateMyProfile'); }
  // There is no hosted login page to redirect to; the app renders its own.
  src = src.replace(/base44\.auth\.redirectToLogin\s*\(([^)]*)\)/g, (_, arg) => {
    usesSession.add('redirectToLogin');
    return `redirectToLogin(${arg.trim()})`;
  });

  // --- functions & integrations ------------------------------------------
  if (/base44\.functions\.invoke\s*\(/.test(src)) { src = src.replace(/base44\.functions\.invoke\s*\(/g, 'fns.invoke('); usesFns = true; }
  if (/base44\.integrations\.Core\./.test(src)) {
    unmapped.push(`${path}: base44.integrations.Core (UploadFile/SendEmail — needs a per-site decision)`);
  }

  if (src === before) return;

  // --- imports ------------------------------------------------------------
  const imports = [];
  for (const [mod, alias] of needed) imports.push(`import * as ${alias} from '@/data/${mod}';`);
  if (usesSession.size) imports.push(`import { ${[...usesSession].sort().join(', ')} } from '@/data/session';`);
  if (usesFns) imports.push(`import * as fns from '@/data/functions';`);

  const stillUsesBase44 = /base44\./.test(src);
  if (!stillUsesBase44) {
    src = src.replace(/^import \{ base44 \} from '@\/api\/base44Client';\n/m, '');
  }
  if (imports.length) {
    // Place after the last existing import so hoisting stays tidy.
    const lastImport = [...src.matchAll(/^import .*;$/gm)].pop();
    if (lastImport) {
      const at = lastImport.index + lastImport[0].length;
      src = src.slice(0, at) + '\n' + imports.join('\n') + src.slice(at);
    } else {
      src = imports.join('\n') + '\n' + src;
    }
  }

  touched.push(path);
  if (!dryRun) writeFileSync(path, src);
}

walk(SRC);

console.log(`${touched.length} files ${dryRun ? 'would be ' : ''}rewritten`);
if (unmapped.length) {
  console.log(`\n${unmapped.length} call site(s) left for a human:`);
  for (const u of [...new Set(unmapped)]) console.log(`  ${u.replace(ROOT + '/', '')}`);
}
