// adminCamera — the server-room camera, through the Imou cloud.
//
// Same shape as adminClimate: the camera is an Imou Life device, Imou Life has
// no API of its own, and the Imou Open Platform (open.imoulife.com) is how a
// server talks to it. The app secret signs every request, so it stays on the
// edge; the browser only ever receives a JPEG, never an Imou URL or token.
//
// WHY SNAPSHOTS, NOT A LIVE STREAM. A live HLS address from Imou is a bearer
// link — anyone holding it can watch the room, and it does not expire on its
// own. A snapshot fetched here and handed over as image bytes leaks nothing.
// One frame every few seconds is plenty to see a blinking fault light, an
// open door or water on the floor.
//
// SETUP (see scripts/setup-camera.sh):
//   IMOU_APP_ID       open.imoulife.com → Console → My App → AppId
//   IMOU_APP_SECRET   same page, AppSecret
//   IMOU_REGION       fk (Central Europe) | sg | or
//   IMOU_DEVICE_ID    leave empty at first — action:"list" prints the serials
//   IMOU_CHANNEL_ID   optional, defaults to 0
//
// The camera has to be visible to the developer app: either log in to the
// Open Platform with the same Imou account the app uses (the device is then
// "bind"), or share it from the Imou Life app to the developer ("share").
//
// Actions:
//   status    → configured? which device, online or not
//   list      → every device and channel the app can see
//   snapshot  → { image: "data:image/jpeg;base64,…", at }   (fresh: true skips the 5 s cache)
//   move      → { direction: up|down|left|right } — pans/tilts ~0.6 s, audit-logged
//
// The Ranger 2C has no light to switch and no night-vision setting over the
// API (getNightVisionMode answers DV1026): it goes infrared on its own.
import { fromRequest, serviceClient, isSuperAdmin } from '../_shared/client.ts';
import { corsHeaders, preflight } from '../_shared/http.ts';

/* Scholr's gate, not an email allow-list.
 *
 * Schedual compared the caller's address against SUPER_ADMIN_EMAILS, so the
 * list of privileged people lived in an environment variable that could drift
 * out of step with the database. Here the caller's own profile row decides,
 * read server-side from their verified token — the same `role` that
 * `public.is_super_admin()` checks for RLS, so these functions and the data
 * cannot disagree about who is privileged.
 */
async function gate(req: Request): Promise<{ email: string } | Response> {
  const caller = await fromRequest(req);
  if (!caller.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders(req) });
  }
  if (!isSuperAdmin(caller)) {
    return Response.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders(req) });
  }
  return { email: (caller.user.email || '').toLowerCase() };
}

/* A privileged action that is not written down did not happen, as far as
   anyone reviewing the platform later is concerned. */
async function audit(entry: Record<string, unknown>) {
  try {
    await serviceClient().from('audit_logs').insert(entry);
  } catch { /* the action matters more than the log line */ }
}
import { readJsonBody } from '../_shared/readBody.ts';

const REGION_HOST: Record<string, string> = {
  fk: 'https://openapi-fk.easy4ip.com',
  sg: 'https://openapi-sg.easy4ip.com',
  or: 'https://openapi-or.easy4ip.com',
};
const APP_ID     = Deno.env.get('IMOU_APP_ID') || '';
const APP_SECRET = Deno.env.get('IMOU_APP_SECRET') || '';
const HOST       = REGION_HOST[(Deno.env.get('IMOU_REGION') || 'fk').toLowerCase()] || REGION_HOST.fk;
const DEVICE_ID  = Deno.env.get('IMOU_DEVICE_ID') || '';
const CHANNEL_ID = Deno.env.get('IMOU_CHANNEL_ID') || '0';

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');

/* Imou's current signature (Development specification):
     source   = "time:{t},nonce:{n},appSecret:{secret}"
     password = lowercase hex SHA-256 of the secret
     sign     = Base64(HMAC-SHA256(key = password, message = source))
   Checked against the worked example in their docs. */
async function sign(time: number, nonce: string): Promise<string> {
  const enc = new TextEncoder();
  const password = hex(await crypto.subtle.digest('SHA-256', enc.encode(APP_SECRET)));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`time:${time},nonce:${nonce},appSecret:${APP_SECRET}`));
  return btoa(String.fromCharCode(...new Uint8Array(mac)));
}

async function imou(method: string, params: Record<string, unknown>): Promise<{ ok: boolean; data?: any; error?: string; code?: string }> {
  const time = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID().replace(/-/g, '');
  try {
    const res = await fetch(`${HOST}/openapi/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: { ver: '1.0', appId: APP_ID, sign: await sign(time, nonce), time, nonce }, id: nonce, params }),
      signal: AbortSignal.timeout(10000),
    });
    const json = await res.json().catch(() => null);
    const r = json?.result;
    // Like Tuya, Imou answers HTTP 200 with a failure code inside.
    if (r?.code !== '0') return { ok: false, code: r?.code, error: r?.msg || `Imou said no (code ${r?.code ?? res.status})` };
    return { ok: true, data: r.data };
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'Imou unreachable' };
  }
}

/* The admin token lasts days; keep it for the life of the worker and fetch a
   new one only when it is missing, near expiry, or rejected. */
let cached: { token: string; until: number } | null = null;
async function token(force = false): Promise<{ token?: string; error?: string }> {
  if (!force && cached && cached.until > Date.now()) return { token: cached.token };
  const r = await imou('accessToken', {});
  if (!r.ok || !r.data?.accessToken) return { error: r.error || 'Imou returned no access token' };
  const life = Number(r.data.expireTime) || 3600;
  cached = { token: r.data.accessToken, until: Date.now() + (life - 300) * 1000 };
  return { token: cached.token };
}

/* Call with the cached token; on a token error refresh once and retry. */
async function withToken(method: string, params: Record<string, unknown>) {
  let t = await token();
  if (!t.token) return { ok: false, error: t.error };
  let r = await imou(method, { ...params, token: t.token });
  if (!r.ok && /token/i.test(r.error || '')) {
    t = await token(true);
    if (!t.token) return { ok: false, error: t.error };
    r = await imou(method, { ...params, token: t.token });
  }
  return r;
}

async function listDevices() {
  const r = await withToken('listDeviceDetailsByPage', { page: 1, pageSize: 50, source: 'bindAndShare' });
  if (!r.ok) return r;
  return {
    ok: true,
    devices: (r.data?.deviceList || []).map((d: any) => ({
      id: d.deviceId, name: d.deviceName, status: d.deviceStatus,
      channels: (d.channelList || []).map((c: any) => ({ id: c.channelId, name: c.channelName, status: c.channelStatus })),
    })),
  };
}

// One frame is shared by everyone looking within this window, so a console
// left open in two tabs cannot run the camera's snapshot quota down.
let lastFrame: { image: string; at: string; t: number } | null = null;
const FRAME_TTL_MS = 5000;

async function snapshot() {
  if (lastFrame && Date.now() - lastFrame.t < FRAME_TTL_MS) return { ok: true, image: lastFrame.image, at: lastFrame.at, cached: true };
  const r = await withToken('setDeviceSnapEnhanced', { deviceId: DEVICE_ID, channelId: CHANNEL_ID });
  if (!r.ok || !r.data?.url) return { ok: false, error: r.error || 'No snapshot address returned' };
  // The frame is uploaded by the camera just after the call returns, so the
  // address can 404 for a second or two. Try briefly, then give up honestly.
  for (let i = 0; i < 5; i++) {
    try {
      const img = await fetch(r.data.url, { signal: AbortSignal.timeout(6000) });
      if (img.ok && /image/.test(img.headers.get('content-type') || 'image/jpeg')) {
        const bytes = new Uint8Array(await img.arrayBuffer());
        let bin = '';
        for (let j = 0; j < bytes.length; j += 0x8000) bin += String.fromCharCode(...bytes.subarray(j, j + 0x8000));
        const at = new Date().toISOString();
        lastFrame = { image: `data:image/jpeg;base64,${btoa(bin)}`, at, t: Date.now() };
        return { ok: true, image: lastFrame.image, at };
      }
    } catch { /* retry */ }
    await new Promise((res) => setTimeout(res, 1000));
  }
  return { ok: false, error: 'The camera took the picture but it never became available — is it online?' };
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    // Super admins only. A picture of the room holding production hardware is
    // not something a tenant, a seller or a script gets.
    const who = await gate(req);
    if (who instanceof Response) return who;
    const email = who.email;

    if (!APP_ID || !APP_SECRET) {
      return Response.json({
        configured: false,
        reason: 'IMOU_APP_ID and IMOU_APP_SECRET are not set on the edge runtime.',
        setup: 'open.imoulife.com → sign in with the Imou Life account → Console → My App → create an app, then run scripts/setup-camera.sh.',
      });
    }

    const body = await readJsonBody<Record<string, any>>(req).catch(() => ({} as Record<string, any>));
    const action = String(body?.action || 'status');

    if (action === 'list') return Response.json({ configured: true, ...(await listDevices()) });

    if (!DEVICE_ID) {
      return Response.json({
        configured: false,
        reason: 'IMOU_DEVICE_ID is not set.',
        setup: 'Call this function with {"action":"list"} to print the serial of every camera the app can see, then set the one in the server room.',
      });
    }

    if (action === 'status') {
      const l = await listDevices() as any;
      if (!l.ok) return Response.json({ configured: true, ok: false, error: l.error });
      const d = (l.devices || []).find((x: any) => x.id === DEVICE_ID);
      if (!d) return Response.json({ configured: true, ok: false, error: `Camera ${DEVICE_ID} is not visible to this app — bind it or share it from Imou Life.` });
      return Response.json({ configured: true, ok: true, device: { id: d.id, name: d.name, online: d.status === 'online', status: d.status } });
    }

    if (action === 'move') {
      const OPS: Record<string, string> = { up: '0', down: '1', left: '2', right: '3' };
      const op = OPS[String(body?.direction)];
      if (!op) return Response.json({ configured: true, ok: false, error: 'direction must be up, down, left or right' }, { status: 400 });
      const r = await withToken('controlMovePTZ', { deviceId: DEVICE_ID, channelId: CHANNEL_ID, operation: op, duration: 600 });
      try {
        await audit({
          user_email: email, action: 'camera_move', entity_type: 'camera', entity_id: DEVICE_ID,
          details: JSON.stringify({ direction: body.direction, ok: r.ok, error: r.error ?? null }),
        });
      } catch { /* the move matters more than the log line */ }
      lastFrame = null;   // the old frame no longer shows where it points
      return Response.json({ configured: true, ok: r.ok, error: r.error ?? null }, { status: r.ok ? 200 : 502 });
    }

    if (action === 'snapshot') {
      if (body?.fresh === true) lastFrame = null;
      const s = await snapshot();
      return Response.json({ configured: true, ...s }, { status: s.ok ? 200 : 502 });
    }

    return Response.json({ error: `Unknown action "${action}"` }, { status: 400 });
  } catch (e) {
    return Response.json({ error: (e as Error).message ?? 'Unexpected error' }, { status: 500 });
  }
});
