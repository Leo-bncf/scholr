#!/usr/bin/env node
/**
 * Check every data-layer call resolves to a function that exists.
 *
 *   node scripts/verify-data-calls.mjs
 *
 * Components reach the database through namespace imports:
 *
 *     import * as submissionsData from '@/data/submissions';
 *     submissionsData.update(id, patch);
 *
 * If `update` is not exported, that is not a build error. Rollup emits a
 * warning nobody reads, the property is `undefined`, and the call throws
 * "submissionsData.update is not a function" the first time a real user
 * reaches the screen. No lint rule catches it and no test covers it.
 *
 * That is not hypothetical: the base44 migration replaced the generic
 * update/create with named functions (submit, grade) and missed seven call
 * sites in submissions. The result was that no student could submit an
 * assignment and no teacher could save a review — for the whole time the
 * product had been live.
 *
 * This walks src/, resolves each namespace import that points at src/data,
 * and asserts every property accessed on it is actually exported.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const DATA = join(SRC, 'data');

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Exported function and const names of a data module. */
function exportsOf(file) {
  const src = readFileSync(file, 'utf8');
  const names = new Set();
  const re = /^export\s+(?:async\s+)?(?:function\s+([A-Za-z0-9_$]+)|(?:const|let|var)\s+([A-Za-z0-9_$]+))/gm;
  let m;
  while ((m = re.exec(src))) names.add(m[1] || m[2]);
  // `export { a, b as c }`
  const re2 = /^export\s*\{([^}]*)\}/gm;
  while ((m = re2.exec(src))) {
    for (const part of m[1].split(',')) {
      const bits = part.trim().split(/\s+as\s+/);
      const name = (bits[1] || bits[0] || '').trim();
      if (name) names.add(name);
    }
  }
  return names;
}

const moduleExports = new Map();
for (const f of readdirSync(DATA)) {
  if (!/\.(js|jsx)$/.test(f)) continue;
  moduleExports.set(basename(f).replace(/\.jsx?$/, ''), exportsOf(join(DATA, f)));
}

const rel = (f) => f.replace(`${ROOT}/`, '');
const problems = [];

for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8');

  // import * as fooData from '@/data/foo'  (or a relative path into data/)
  const importRe = /import\s+\*\s+as\s+([A-Za-z0-9_$]+)\s+from\s+['"](?:@\/data\/|\.{1,2}\/(?:\.\.\/)*data\/)([A-Za-z0-9_$]+)['"]/g;
  let m;
  const aliases = new Map();
  while ((m = importRe.exec(src))) aliases.set(m[1], m[2]);
  if (aliases.size === 0) continue;

  for (const [alias, mod] of aliases) {
    const known = moduleExports.get(mod);
    if (!known) {
      problems.push({ file, detail: `imports @/data/${mod}, which does not exist` });
      continue;
    }
    // The lookbehind matters: `\b` also matches after a dot, so a plain \b
    // turned `form.email.trim()` into a claim that @/data/email exports no
    // "trim". Only a bare identifier counts as the namespace.
    const useRe = new RegExp(`(?<![\\w.$])${alias}\\.([A-Za-z0-9_$]+)\\s*\\(`, 'g');

    // A local binding of the same name wins over the import, and resolving
    // that properly needs scope analysis. Say so and skip rather than
    // reporting something false.
    if (new RegExp(`(?:const|let|var|function)\\s+${alias}\\b|\\(\\s*${alias}\\s*[,)]`).test(src)) {
      console.warn(`[verify-data-calls] ${rel(file)}: "${alias}" is also bound locally — skipped`);
      continue;
    }
    let u;
    while ((u = useRe.exec(src))) {
      const fn = u[1];
      if (known.has(fn)) continue;
      const line = src.slice(0, u.index).split('\n').length;
      problems.push({
        file,
        line,
        detail: `${alias}.${fn}() — @/data/${mod} exports no "${fn}"`,
      });
    }
  }
}

if (problems.length) {
  console.error(`\n[verify-data-calls] ${problems.length} call(s) point at a function that does not exist:\n`);
  for (const p of problems) {
    console.error(`  ${rel(p.file)}${p.line ? `:${p.line}` : ''}\n    ${p.detail}`);
  }
  console.error('\nAdd a named function to the data module, or call the one that already does this.\n');
  process.exit(1);
}

console.log(`[verify-data-calls] ok — every data-layer call resolves (${moduleExports.size} modules)`);
