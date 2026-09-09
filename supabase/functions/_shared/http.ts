/**
 * Request/response plumbing shared by every handler.
 *
 * base44 handlers returned bare `Response.json(...)`, which worked because its
 * runtime added CORS. Ours doesn't, so browser calls fail without these headers
 * — and the preflight has to be answered explicitly.
 */

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://scholr.pro')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  // Echo the origin only when it's one of ours; otherwise send the canonical
  // one so a stray origin gets a CORS failure rather than silent access.
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Vary': 'Origin',
  };
}

/** Answer a CORS preflight, or null if this isn't one. */
export function preflight(req: Request): Response | null {
  if (req.method !== 'OPTIONS') return null;
  return new Response('ok', { headers: corsHeaders(req) });
}

export function json(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}

export const unauthorized = (req: Request, message = 'Unauthorized') =>
  json(req, { error: message }, 401);

export const forbidden = (req: Request, message = 'Forbidden') =>
  json(req, { error: message }, 403);

export const badRequest = (req: Request, message: string) =>
  json(req, { error: message }, 400);

/**
 * Wrap a handler so an unexpected throw becomes a 500 with CORS headers rather
 * than a naked runtime error the browser reports only as a CORS failure.
 */
export function handler(fn: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const pre = preflight(req);
    if (pre) return pre;
    try {
      return await fn(req);
    } catch (err) {
      console.error('Unhandled error:', err);
      return json(req, { error: (err as Error).message ?? 'Internal error' }, 500);
    }
  };
}
