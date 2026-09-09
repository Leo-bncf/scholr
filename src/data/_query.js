/**
 * Thin helpers shared by the domain modules in this directory.
 *
 * These are deliberately NOT a generic entity layer. base44 gave us
 * `entities.X.filter({...})` everywhere, which pushed joins and filtering into
 * the browser; the point of the rewrite is that each domain module exposes
 * named queries that say what they fetch and do the work in Postgres.
 */

/** PostgREST refuses to return more rows than this (PGRST_DB_MAX_ROWS). */
export const MAX_ROWS = 5000;

/**
 * Supabase returns { data, error } rather than rejecting. Domain functions are
 * consumed by TanStack Query, which wants a thrown error, so convert here.
 */
function raise(error, context) {
  const err = new Error(`${context}: ${error.message}`);
  err.code = error.code;
  err.details = error.details;
  err.hint = error.hint;
  // 42501 is Postgres "insufficient privilege" — with RLS on every table this
  // almost always means a policy rejected the row, not that the app is broken.
  err.isRlsDenial = error.code === '42501';
  throw err;
}

/**
 * Run a query expected to return many rows.
 *
 * Warns on hitting MAX_ROWS: PostgREST truncates silently, which on Schedual
 * caused big schools to render partial data with no error. If this fires, the
 * caller needs pagination or a narrower filter — not a bigger limit.
 */
export async function rows(builder, context) {
  const { data, error } = await builder;
  if (error) raise(error, context);
  if (data && data.length >= MAX_ROWS) {
    console.warn(
      `[data] ${context} returned ${data.length} rows and was probably truncated at PGRST_DB_MAX_ROWS. Paginate or filter further.`,
    );
  }
  return data ?? [];
}

/** Run a query expected to return one row, or null. */
export async function maybeOne(builder, context) {
  const { data, error } = await builder.maybeSingle();
  if (error) raise(error, context);
  return data ?? null;
}

/** Run a query that must return exactly one row (an insert, a lookup by id). */
export async function one(builder, context) {
  const { data, error } = await builder.single();
  if (error) raise(error, context);
  return data;
}

/** Run a statement whose result we don't need. */
export async function none(builder, context) {
  const { error } = await builder;
  if (error) raise(error, context);
}

/**
 * Count rows without transferring any.
 *
 * Pass a builder built with `.select('id', { count: 'exact', head: true })`.
 * Counting by fetching everything and reading `.length` is the single most
 * common performance mistake in the code this replaces.
 */
export async function count(builder, context) {
  const { count: n, error } = await builder;
  if (error) raise(error, context);
  return n ?? 0;
}
