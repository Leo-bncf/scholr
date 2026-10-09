/**
 * An in-memory stand-in for the Supabase client, for local UI work only.
 *
 *   npm run dev:fake
 *
 * There is one Supabase project and it is production, so `npm run dev` reads
 * and writes real school data. That makes it the wrong place to click through
 * a half-built screen. Under `--mode fake`, vite.config.js points
 * `@/lib/supabase` at this file instead, and the whole app — sign-in, RLS-free
 * reads, writes, uploads — runs against a seeded demo school held in
 * localStorage.
 *
 * It implements the slice of the PostgREST builder that src/data/ actually
 * uses, not the whole API. If a screen errors with "fake backend: unsupported",
 * add the operator here.
 *
 * Nothing here is a security boundary. There is no RLS: every row is visible.
 * Anything that depends on a policy must still be checked against the real
 * stack (`npm run verify`).
 *
 * Reset the data with ?reset-fake in the URL. Sign in as someone else with
 * ?as=<role> (teacher, student, school_admin, super_admin).
 */
import { seed, USERS } from './seed';

const STORE_KEY = 'scholr_fake_db_v1';
const AS_KEY = 'scholr_fake_as';

const params = new URLSearchParams(window.location.search);
if (params.has('reset-fake')) localStorage.removeItem(STORE_KEY);
if (params.get('as')) localStorage.setItem(AS_KEY, params.get('as'));

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* fall through to a fresh seed */ }
  const db = seed();
  localStorage.setItem(STORE_KEY, JSON.stringify(db));
  return db;
}

let db = load();
function persist() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); } catch { /* quota: keep in memory */ }
}
function table(name) {
  if (!db.tables[name]) db.tables[name] = [];
  return db.tables[name];
}

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
const now = () => new Date().toISOString();

function currentUser() {
  const as = localStorage.getItem(AS_KEY) || 'teacher';
  return USERS[as] || USERS.teacher;
}

/* ── select parsing ────────────────────────────────────────────────────── */

/** Split on top-level commas only, so `a, b:t(c, d)` is two fields. */
function splitTop(s) {
  const out = []; let depth = 0; let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function parseSelect(cols) {
  if (!cols || cols.trim() === '*') return { all: true, fields: [], embeds: [] };
  const fields = []; const embeds = []; let all = false;
  for (const part of splitTop(cols.replace(/\s+/g, ' '))) {
    const m = part.match(/^(?:(\w+):)?(\w+)(?:!\w+)?\s*\((.*)\)$/);
    if (m) embeds.push({ alias: m[1] || m[2], table: m[2], select: parseSelect(m[3]) });
    else if (part === '*') all = true;
    else fields.push(part.split(':').pop().trim());
  }
  return { all, fields, embeds };
}

/** The FK an embed follows. `profile` → user_id; otherwise `<alias>_id`. */
function embedKey(alias) {
  if (alias === 'profile') return 'user_id';
  return `${alias}_id`;
}

function project(row, sel) {
  const out = sel.all ? { ...row } : {};
  for (const f of sel.fields) out[f] = row[f] ?? null;
  for (const e of sel.embeds) {
    const fk = row[embedKey(e.alias)];
    const hit = fk == null ? null : table(e.table).find((r) => r.id === fk);
    out[e.alias] = hit ? project(hit, e.select) : null;
  }
  return out;
}

/* ── filters ───────────────────────────────────────────────────────────── */

const cmp = (a, b) => (a == null ? -1 : b == null ? 1 : a < b ? -1 : a > b ? 1 : 0);

function coerce(v) {
  if (v === 'null') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return v;
}

function test(row, col, op, val) {
  const v = row[col];
  switch (op) {
    case 'eq': return v === val || (v != null && val != null && String(v) === String(val));
    case 'neq': return !(v === val || String(v) === String(val));
    case 'is': return val === null ? v == null : v === val;
    case 'in': return (val || []).map(String).includes(String(v));
    case 'gt': return cmp(v, val) > 0;
    case 'gte': return cmp(v, val) >= 0;
    case 'lt': return cmp(v, val) < 0;
    case 'lte': return cmp(v, val) <= 0;
    case 'contains': return Array.isArray(v) && [].concat(val).every((x) => v.includes(x));
    case 'overlaps': return Array.isArray(v) && [].concat(val).some((x) => v.includes(x));
    case 'ilike': {
      const re = new RegExp(`^${String(val).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*')}$`, 'i');
      return v != null && re.test(String(v));
    }
    default: throw new Error(`fake backend: unsupported operator "${op}"`);
  }
}

/** PostgREST `or` syntax: "a.eq.1,b.is.null,c.in.(x,y)". */
function parseOr(expr) {
  return splitTop(expr).map((clause) => {
    const [col, op, ...rest] = clause.split('.');
    let raw = rest.join('.');
    let val;
    if (op === 'in') val = raw.replace(/^\(|\)$/g, '').split(',').map(coerce);
    else val = coerce(raw);
    return { col, op, val };
  });
}

/* ── the builder ───────────────────────────────────────────────────────── */

class Query {
  constructor(name) {
    this.name = name;
    this.filters = [];
    this.orders = [];
    this.sel = parseSelect('*');
    this.mode = 'select';
    this.wantRows = true;
  }

  select(cols = '*', opts = {}) {
    this.sel = parseSelect(cols);
    if (opts.count) this.countMode = true;
    if (opts.head) this.head = true;
    if (this.mode !== 'select') this.returning = true;
    return this;
  }

  eq(c, v) { this.filters.push((r) => test(r, c, 'eq', v)); return this; }
  neq(c, v) { this.filters.push((r) => test(r, c, 'neq', v)); return this; }
  is(c, v) { this.filters.push((r) => test(r, c, 'is', v)); return this; }
  in(c, v) { this.filters.push((r) => test(r, c, 'in', v)); return this; }
  gt(c, v) { this.filters.push((r) => test(r, c, 'gt', v)); return this; }
  gte(c, v) { this.filters.push((r) => test(r, c, 'gte', v)); return this; }
  lt(c, v) { this.filters.push((r) => test(r, c, 'lt', v)); return this; }
  lte(c, v) { this.filters.push((r) => test(r, c, 'lte', v)); return this; }
  contains(c, v) { this.filters.push((r) => test(r, c, 'contains', v)); return this; }
  overlaps(c, v) { this.filters.push((r) => test(r, c, 'overlaps', v)); return this; }
  ilike(c, v) { this.filters.push((r) => test(r, c, 'ilike', v)); return this; }
  match(obj) { for (const [c, v] of Object.entries(obj)) this.eq(c, v); return this; }
  not(c, op, v) { this.filters.push((r) => !test(r, c, op, v === 'null' ? null : v)); return this; }
  filter(c, op, v) {
    if (op === 'in' && typeof v === 'string') v = v.replace(/^\(|\)$/g, '').split(',').map(coerce);
    this.filters.push((r) => test(r, c, op, coerce(v)));
    return this;
  }
  or(expr) {
    const clauses = parseOr(expr);
    this.filters.push((r) => clauses.some((c) => test(r, c.col, c.op, c.val)));
    return this;
  }
  order(col, { ascending = true } = {}) { this.orders.push({ col, ascending }); return this; }
  limit(n) { this.lim = n; return this; }
  range(from, to) { this.from = from; this.lim = to - from + 1; return this; }
  single() { this.one = 'single'; return this; }
  maybeSingle() { this.one = 'maybe'; return this; }
  abortSignal() { return this; }

  insert(rows) { this.mode = 'insert'; this.payload = rows; return this; }
  update(patch) { this.mode = 'update'; this.payload = patch; return this; }
  upsert(rows, opts = {}) { this.mode = 'upsert'; this.payload = rows; this.onConflict = opts.onConflict; return this; }
  delete() { this.mode = 'delete'; return this; }

  matches() { return table(this.name).filter((r) => this.filters.every((f) => f(r))); }

  run() {
    const t = table(this.name);
    let out;
    if (this.mode === 'insert' || this.mode === 'upsert') {
      const list = [].concat(this.payload);
      const keys = this.onConflict ? this.onConflict.split(',').map((s) => s.trim()) : ['id'];
      out = list.map((row) => {
        const existing = this.mode === 'upsert'
          ? t.find((r) => keys.every((k) => row[k] != null && String(r[k]) === String(row[k])))
          : null;
        if (existing) { Object.assign(existing, row, { updated_at: now() }); return existing; }
        const created = { id: uuid(), created_at: now(), updated_at: now(), created_by: currentUser().id, ...row };
        t.push(created);
        return created;
      });
      persist();
    } else if (this.mode === 'update') {
      out = this.matches();
      out.forEach((r) => Object.assign(r, this.payload, { updated_at: now() }));
      persist();
    } else if (this.mode === 'delete') {
      out = this.matches();
      db.tables[this.name] = t.filter((r) => !out.includes(r));
      persist();
    } else {
      out = this.matches();
    }

    if (this.mode !== 'select' && !this.returning) return { data: null, error: null };

    let rows = [...out];
    for (const { col, ascending } of [...this.orders].reverse()) {
      rows.sort((a, b) => (ascending ? 1 : -1) * cmp(a[col], b[col]));
    }
    const total = rows.length;
    if (this.from) rows = rows.slice(this.from);
    if (this.lim != null) rows = rows.slice(0, this.lim);
    rows = rows.map((r) => project(r, this.sel));

    if (this.head) return { data: null, count: total, error: null };
    if (this.one) {
      if (rows.length === 0 && this.one === 'single') {
        return { data: null, error: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } };
      }
      return { data: rows[0] ?? null, error: null, count: this.countMode ? total : null };
    }
    return { data: rows, error: null, count: this.countMode ? total : null };
  }

  then(resolve, reject) {
    // A tick of latency, so loading states actually render during UI work.
    return new Promise((r) => setTimeout(r, 120))
      .then(() => {
        try { return this.run(); } catch (e) { return { data: null, error: { message: e.message } }; }
      })
      .then(resolve, reject);
  }
}

/* ── auth, storage, functions ──────────────────────────────────────────── */

const listeners = new Set();

const auth = {
  async getUser() {
    const u = currentUser();
    return { data: { user: {
      id: u.id, email: u.email, created_at: '2026-08-20T09:00:00Z', last_sign_in_at: new Date().toISOString(),
      identities: [{ provider: 'google' }],
    } }, error: null };
  },
  async getSession() {
    const u = currentUser();
    return { data: { session: { user: { id: u.id, email: u.email }, access_token: 'fake' } }, error: null };
  },
  onAuthStateChange(cb) {
    listeners.add(cb);
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
  async signInWithPassword() { return { data: {}, error: null }; },
  async signInWithOAuth() { return { data: {}, error: null }; },
  async signOut(opts) { if (opts?.scope !== 'others') localStorage.removeItem(AS_KEY); return { error: null }; },
  async updateUser() { return { data: {}, error: null }; },
  async resetPasswordForEmail() { return { data: {}, error: null }; },
};

/** Uploaded files live in memory as object URLs; they don't survive a reload. */
const files = new Map();
const storage = {
  from(bucket) {
    return {
      async upload(path, file) { files.set(`${bucket}/${path}`, URL.createObjectURL(file)); return { data: { path }, error: null }; },
      getPublicUrl(path) { return { data: { publicUrl: files.get(`${bucket}/${path}`) || '#' } }; },
      async createSignedUrl(path) {
        const url = files.get(`${bucket}/${path}`);
        return url ? { data: { signedUrl: url }, error: null } : { data: null, error: { message: 'Object not found (fake backend: uploads are lost on reload)' } };
      },
      async remove(paths) { paths.forEach((p) => files.delete(`${bucket}/${p}`)); return { data: [], error: null }; },
      async download(path) {
        const url = files.get(`${bucket}/${path}`);
        if (!url) return { data: null, error: { message: 'Object not found' } };
        return { data: await (await fetch(url)).blob(), error: null };
      },
    };
  },
};

const functions = {
  async invoke(name) {
    return { data: null, error: { message: `fake backend: edge function "${name}" is not simulated`, context: { status: 501 } } };
  },
};

function channel() {
  const ch = { on: () => ch, subscribe: () => ch, unsubscribe: () => {} };
  return ch;
}

export const supabase = {
  from: (name) => new Query(name),
  rpc: async (name) => ({ data: name === 'is_super_admin' ? currentUser().role === 'super_admin' : [], error: null }),
  auth,
  storage,
  functions,
  channel,
  removeChannel: () => {},
};

export default supabase;
