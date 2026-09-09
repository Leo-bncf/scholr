// Lenient JSON request-body reader.
//
// Why this exists: under Cloudflare's keep-alive connection reuse, the
// supabase/edge-runtime v1.71.x request forwarding (main router →
// worker.fetch(req)) intermittently appends stray bytes from a pooled
// connection onto the request body. `await req.json()` then throws
// "Unexpected non-whitespace character after JSON at position N", which
// surfaced as random failures across the app (school settings not loading,
// log-absence doing nothing, batch delete failing, etc.).
//
// readJsonBody() reads the body as text and parses only the first complete
// JSON value, ignoring any trailing garbage — so a corrupted frame still
// yields the intended payload instead of a 500.

/** Extract the first balanced JSON object/array from text, ignoring trailing bytes. */
function firstJsonValue(text: string): string | null {
  const start = text.search(/[{[]/);
  if (start === -1) return null;
  const open = text[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export async function readJsonBody<T = Record<string, unknown>>(req: Request): Promise<T> {
  let text: string;
  try {
    text = await req.text();
  } catch {
    return {} as T;
  }
  if (!text || !text.trim()) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    // Trailing-byte corruption (see header): salvage the first JSON value.
    const salvaged = firstJsonValue(text);
    if (salvaged) {
      try {
        return JSON.parse(salvaged) as T;
      } catch {
        /* fall through */
      }
    }
    return {} as T;
  }
}
