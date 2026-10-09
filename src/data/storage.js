import { supabase } from '@/lib/supabase';

/**
 * File uploads.
 *
 * Replaces `base44.integrations.Core.UploadFile({ file })`, which returned
 * `{ file_url }`. Supabase Storage needs a bucket and an explicit path, so this
 * module owns the naming convention rather than scattering it across
 * components.
 *
 * Paths are always prefixed with the school id. Storage policies key off that
 * first path segment, so a file physically cannot be written into another
 * school's prefix.
 */

/** Buckets, created by 0009_storage_buckets.sql. */
export const BUCKETS = {
  /** Assignment briefs, class materials — readable by the school. */
  materials: 'materials',
  /** Student work. Readable by the owner and their teachers. */
  submissions: 'submissions',
  /** Avatars, school logos. Public. */
  public: 'public-assets',
};

/** Strip anything that would make a messy or ambiguous object key. */
function safeName(filename) {
  const cleaned = filename
    .normalize('NFKD')
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, '-')
    .slice(-120);
  return cleaned || 'file';
}

/**
 * Upload a file and return its storage path plus a URL for rendering.
 *
 * For private buckets the URL is a signed link that expires — don't persist it.
 * Persist `path` and call `signedUrl()` when you need to show the file again.
 */
export async function upload(file, { bucket = BUCKETS.materials, schoolId, prefix = '' } = {}) {
  if (!schoolId) throw new Error('storage.upload: schoolId is required');
  if (!file) throw new Error('storage.upload: no file given');

  const stamp = Date.now().toString(36);
  const segments = [schoolId, prefix, `${stamp}-${safeName(file.name)}`].filter(Boolean);
  const path = segments.join('/');

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw new Error(`storage.upload: ${error.message}`);

  const url = bucket === BUCKETS.public ? publicUrl(bucket, path) : await signedUrl(bucket, path);
  // `ref` is what to persist. `url` is for showing the file right now — for a
  // private bucket it is signed and dies after an hour.
  return { bucket, path, ref: toRef(bucket, path), url, name: file.name, size: file.size, type: file.type };
}

/**
 * Upload student work.
 *
 * Separate from `upload` because the submissions bucket policy requires the
 * uploader's id as the second path segment (`<school>/<user>/<file>`) — that's
 * what lets "a student may read their own submission" be expressed without a
 * database lookup. Getting the prefix wrong here means the write is refused,
 * so the convention lives in code rather than in a call site's memory.
 */
export function uploadSubmission(file, { schoolId, userId, assignmentId }) {
  if (!userId) throw new Error('storage.uploadSubmission: userId is required');
  return upload(file, {
    bucket: BUCKETS.submissions,
    schoolId,
    prefix: [userId, assignmentId].filter(Boolean).join('/'),
  });
}

export function publicUrl(bucket, path) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** A time-limited URL for a private object. Default one hour. */
export async function signedUrl(bucket, path, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw new Error(`storage.signedUrl: ${error.message}`);
  return data.signedUrl;
}

export async function remove(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`storage.remove: ${error.message}`);
}

export async function download(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(`storage.download: ${error.message}`);
  return data;
}

/* ── Stored references ───────────────────────────────────────────────────
 *
 * Every upload site used to persist `uploaded.url` — a signed link that
 * expires an hour later. So every material, assignment attachment and piece
 * of student work became a dead link the same afternoon it was uploaded.
 *
 * Persist `ref` instead (`storage:<bucket>/<path>`) and resolve it with
 * resolveUrl() or openStored() when someone actually opens the file.
 *
 * Rows written before this change hold expired signed URLs. Those still carry
 * the bucket and path, so parseStored() recovers them and they re-sign like
 * any other ref — the old links repair themselves without a data migration.
 */

const REF_PREFIX = 'storage:';

export function toRef(bucket, path) {
  return `${REF_PREFIX}${bucket}/${path}`;
}

/** { bucket, path } for a ref or a Supabase storage URL; null for anything else. */
export function parseStored(value) {
  if (typeof value !== 'string' || !value) return null;
  if (value.startsWith(REF_PREFIX)) {
    const rest = value.slice(REF_PREFIX.length);
    const slash = rest.indexOf('/');
    if (slash < 1) return null;
    return { bucket: rest.slice(0, slash), path: rest.slice(slash + 1) };
  }
  const m = value.match(/\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/?#]+)\/([^?#]+)/);
  if (!m) return null;
  return { bucket: m[1], path: decodeURIComponent(m[2]) };
}

/** A URL that works now: re-signed for stored files, unchanged for ordinary links. */
export async function resolveUrl(value) {
  const stored = parseStored(value);
  if (!stored) return value;
  if (stored.bucket === BUCKETS.public) return publicUrl(stored.bucket, stored.path);
  return signedUrl(stored.bucket, stored.path);
}

/**
 * Open a stored file or link in a new tab.
 *
 * The tab is opened before the await: a window.open() that happens after an
 * async gap is no longer tied to the click, and browsers block it as a popup.
 */
export async function openStored(value) {
  const win = window.open('', '_blank');
  try {
    const url = await resolveUrl(value);
    if (win) win.location.href = url; else window.location.href = url;
  } catch (err) {
    if (win) win.close();
    throw err;
  }
}
