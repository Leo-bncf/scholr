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
  return { bucket, path, url, name: file.name, size: file.size, type: file.type };
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
