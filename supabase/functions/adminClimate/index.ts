// adminClimate — read and control the data-centre air conditioning.
//
// The AC is a Tuya device, which is what the "Smart Life" app on the App Store
// actually talks to. Smart Life has no API of its own: you link the app's
// account to a Cloud project on the Tuya IoT platform (iot.tuya.com) and drive
// the device through Tuya's OpenAPI. That is what this does.
//
// WHY IT IS SERVER-SIDE. The Tuya access secret signs every request. Anything
// that reaches the browser is public, so the secret never leaves the edge and
// the browser only ever sees "is it on, how cold, how hot is the room".
//
// SETUP (four values, all from iot.tuya.com — see docs/CLIMATE.md):
//   TUYA_ACCESS_ID       Cloud project → Overview → Access ID / Client ID
//   TUYA_ACCESS_SECRET   same page, Access Secret / Client Secret
//   TUYA_REGION          eu | us | cn | in     (eu for a French account)
//   TUYA_DEVICE_ID       leave empty at first — action:"list" prints the ids
//
// Until those are set every action returns { configured: false } with a 200,
// so the console renders "not configured" rather than an error. Nothing here
// fails the page.
//
// Actions:
//   list    → every device on the linked Smart Life account, with its id
//   status  → the configured device: power, mode, set point, room temperature
//   set     → { power?: boolean, temperature?: number, lock?: boolean, fan?: boolean }
//             (fan = the outside-air fan on a smart plug, TUYA_FAN_DEVICE_ID)
//
// The installed unit is "Air Condition-A011_E", Tuya category kt — a real
// device, not an infrared blaster, so its state reads back and its commands
// are acknowledged. It accepts switch, temp_set (16–32 °C, whole degrees) and
// lock. It has no mode and no fan-speed control.
//
// Every write is audit-logged with the actor's email, because turning the
// cooling off in a room holding the production hypervisors is exactly the kind
// of action that must have a name attached to it.
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
import { isMachineCaller } from '../_shared/machineCaller.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const REGION_HOST: Record<string, string> = {
  eu: 'https://openapi.tuyaeu.com',
  us: 'https://openapi.tuyaus.com',
  cn: 'https://openapi.tuyacn.com',
  in: 'https://openapi.tuyain.com',
};

const ACCESS_ID     = Deno.env.get('TUYA_ACCESS_ID') || '';
const ACCESS_SECRET = Deno.env.get('TUYA_ACCESS_SECRET') || '';
const REGION        = (Deno.env.get('TUYA_REGION') || 'eu').toLowerCase();
const DEVICE_ID     = Deno.env.get('TUYA_DEVICE_ID') || '';
// Optional: a Tuya smart plug driving a fan that pulls outside air in. The AC
// itself has no fan-only mode, so night-time free cooling needs this.
const FAN_ID        = Deno.env.get('TUYA_FAN_DEVICE_ID') || '';
const HOST          = REGION_HOST[REGION] || REGION_HOST.eu;

/* Tuya signs with an uppercase hex HMAC-SHA256. The string that gets signed is
   client_id + [access_token] + t + nonce + stringToSign, where stringToSign is
   METHOD \n sha256(body) \n <signature headers> \n path-with-query. The token
   call omits the access_token, every other call includes it — getting that one
   detail wrong is the classic 1004 "sign invalid". */
async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function tuya(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown,
  accessToken?: string,
): Promise<{ ok: boolean; status: number; data: unknown; error?: string }> {
  const t = Date.now().toString();
  const nonce = crypto.randomUUID();
  const payload = body === undefined ? '' : JSON.stringify(body);
  const stringToSign = [method, await sha256Hex(payload), '', path].join('\n');
  const sign = await hmacHex(ACCESS_SECRET, ACCESS_ID + (accessToken ?? '') + t + nonce + stringToSign);

  const headers: Record<string, string> = {
    client_id: ACCESS_ID,
    sign,
    t,
    nonce,
    sign_method: 'HMAC-SHA256',
    'Content-Type': 'application/json',
  };
  if (accessToken) headers.access_token = accessToken;

  try {
    const res = await fetch(HOST + path, {
      method,
      headers,
      body: payload || undefined,
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json().catch(() => null);
    if (!json?.success) {
      // Tuya answers 200 with success:false, so the HTTP status alone lies.
      return { ok: false, status: res.status, data: json, error: json?.msg || `Tuya said no (code ${json?.code ?? '?'})` };
    }
    return { ok: true, status: res.status, data: json.result };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: (e as Error).message || 'Tuya unreachable' };
  }
}

async function getToken(): Promise<{ token?: string; error?: string }> {
  const r = await tuya('GET', '/v1.0/token?grant_type=1');
  if (!r.ok) return { error: r.error };
  const token = (r.data as { access_token?: string })?.access_token;
  return token ? { token } : { error: 'Tuya returned no access token' };
}

/* Two very different things answer to "the air conditioning" in Smart Life,
   and they need different APIs.

   A real Tuya AC or heat pump (categories kt, qt, ktkzq, rs) is a device with
   state: you can read whether it is on, its set point and the room
   temperature, and a command is acknowledged.

   An IR blaster (categories wnykq, infrared_ac, and anything under a wifi
   remote hub) only *emits* infrared at a dumb split unit. Infrared is one-way,
   so there is no state to read: no room temperature, no confirmation that the
   unit received anything, and if someone used the physical remote the blaster
   has no idea. Its commands live under a different endpoint entirely.

   Telling the two apart up front is the difference between "it works" and an
   afternoon wondering why status is empty. */
const AC_DEVICE = new Set(['kt', 'qt', 'ktkzq', 'rs', 'ktzj']);
const IR_HUB = new Set(['wnykq', 'infrared_ac', 'hwyj', 'qt_ir']);

function kindOf(category: string | undefined): 'device' | 'infrared' | 'unknown' {
  const c = String(category || '').toLowerCase();
  if (AC_DEVICE.has(c)) return 'device';
  if (IR_HUB.has(c)) return 'infrared';
  return 'unknown';
}

/* A Tuya device is a bag of "data points" whose codes vary by manufacturer.
   These are the ones every AC and portable cooler we have seen uses; anything
   unrecognised is passed through untouched so nothing is silently dropped. */
function readStatus(status: Array<{ code: string; value: unknown }>) {
  const by: Record<string, unknown> = {};
  for (const s of status || []) by[s.code] = s.value;

  const num = (v: unknown) => (typeof v === 'number' ? v : undefined);
  // Some units report tenths of a degree, ours reports whole degrees (the
  // device specification says scale 0). Nothing sane reads above 60 °C in
  // either a set point or a room, so that is the dividing line.
  const scale = (v: number | undefined) => (v === undefined ? undefined : v > 60 ? v / 10 : v);

  return {
    power:      typeof by.switch === 'boolean' ? by.switch
              : typeof by.Power === 'boolean' ? by.Power
              : undefined,
    mode:       typeof by.mode === 'string' ? by.mode : undefined,
    setPoint:   scale(num(by.temp_set) ?? num(by.temp_set_f) ?? num(by.TempSet)),
    roomTemp:   scale(num(by.temp_current) ?? num(by.va_temperature) ?? num(by.TempCurrent)),
    humidity:   num(by.humidity_value) ?? num(by.va_humidity),
    fan:        typeof by.fan_speed_enum === 'string' ? by.fan_speed_enum : undefined,
    // The panel lock and the unit's own fault register. A locked panel means
    // nobody can correct things by hand at the wall, which matters when the
    // room is overheating.
    locked:     typeof by.lock === 'boolean' ? by.lock : undefined,
    fault:      num(by.fault),
    raw: by,
  };
}

/* The fan plug: plugs call their relay switch_1 (multi-socket) or switch. */
async function fanState(token: string) {
  if (!FAN_ID) return { configured: false };
  const r = await tuya('GET', `/v1.0/iot-03/devices/${FAN_ID}/status`, undefined, token);
  if (!r.ok) return { configured: true, ok: false, error: r.error };
  const by: Record<string, unknown> = {};
  for (const x of (r.data as Array<{ code: string; value: unknown }>) || []) by[x.code] = x.value;
  const code = 'switch_1' in by ? 'switch_1' : 'switch';
  return { configured: true, ok: true, on: by[code] === true, code };
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  try {
    // Either a signed-in super admin, or the unattended autopilot presenting
    // the shared secret. Nothing else reaches this endpoint.
    const machine = isMachineCaller(req);
    let email = 'autopilot';
    if (!machine) {
      const who = await gate(req);
      if (who instanceof Response) return who;
      email = who.email;
    }

    const body = await readJsonBody<Record<string, any>>(req).catch(() => ({} as Record<string, any>));
    // The evidence table is service-role only (RLS denies everyone), so the
    // browser reading it directly silently got zero rows. Serve it from here.
    if (body?.action === 'samples') {
      const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
      const since = new Date(Date.now() - 14 * 864e5).toISOString();
      const { data, error } = await db.from('climate_samples')
        .select('inlet_c, outdoor_c, set_point_c, watts, fan_pct, mode, created_at')
        .gte('created_at', since).order('created_at', { ascending: false }).limit(3000);
      if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
      return Response.json({ ok: true, samples: data || [] });
    }

    // Not configured is a normal state, not an error: the console shows a
    // setup note and every other section keeps working.
    if (!ACCESS_ID || !ACCESS_SECRET) {
      return Response.json({
        configured: false,
        reason: 'TUYA_ACCESS_ID and TUYA_ACCESS_SECRET are not set on the edge runtime.',
        setup: 'iot.tuya.com → Cloud → your project → Overview. Link the Smart Life account under Devices → Link App Account first.',
      });
    }

    const action = String(body?.action || 'status');

    const { token, error: tokenErr } = await getToken();
    if (!token) {
      return Response.json({ configured: true, ok: false, error: tokenErr }, { status: 502 });
    }

    if (action === 'list') {
      // Devices are listed per linked app user, so resolve the user first.
      const users = await tuya('GET', `/v1.0/apps/schema/users?page_no=1&page_size=20`, undefined, token);
      const uid = (users.data as { records?: Array<{ uid?: string }> })?.records?.[0]?.uid;
      if (!uid) {
        return Response.json({
          configured: true, ok: false,
          error: 'No linked Smart Life account. On iot.tuya.com: Cloud → your project → Devices → Link App Account, and scan the QR code from the Smart Life app.',
        });
      }
      const devices = await tuya('GET', `/v1.0/users/${uid}/devices`, undefined, token);
      if (!devices.ok) return Response.json({ configured: true, ok: false, error: devices.error });
      const rows = (devices.data as Array<Record<string, unknown>>) || [];
      return Response.json({
        configured: true, ok: true,
        devices: rows.map((d) => ({
          id: d.id, name: d.name, category: d.category,
          kind: kindOf(d.category as string),
          online: d.online, product: d.product_name,
        })),
        note: 'kind "device" is a real AC with readable state. kind "infrared" is an IR blaster: one-way, no state to read, and its commands use a different endpoint — say so and this function gets the infrared path.',
      });
    }

    if (!DEVICE_ID) {
      return Response.json({
        configured: false,
        reason: 'TUYA_DEVICE_ID is not set.',
        setup: 'Call this function with {"action":"list"} to print the ids of every device on the linked account, then set the one for the AC.',
      });
    }

    if (action === 'status') {
      const r = await tuya('GET', `/v1.0/iot-03/devices/${DEVICE_ID}/status`, undefined, token);
      if (!r.ok) return Response.json({ configured: true, ok: false, error: r.error });
      const info = await tuya('GET', `/v1.0/iot-03/devices/${DEVICE_ID}`, undefined, token);
      const device = (info.data as Record<string, unknown>) || {};

      // An IR blaster reports no thermostat state at all, so say why rather
      // than rendering a row of dashes that looks like a bug.
      if (kindOf(device.category as string) === 'infrared') {
        return Response.json({
          configured: true, ok: false, infrared: true,
          device: { id: DEVICE_ID, name: device.name ?? 'IR blaster', online: device.online ?? null },
          error: 'This device is an infrared blaster, not a controllable AC. Infrared is one-way: there is no set point or room temperature to read back, and commands go through the infrared remote endpoint. Tell me and I will wire that path — but be aware the console can then only send commands, never confirm the unit obeyed.',
        });
      }
      return Response.json({
        configured: true, ok: true,
        device: { id: DEVICE_ID, name: device.name ?? 'Air conditioning', online: device.online ?? null },
        state: readStatus(r.data as Array<{ code: string; value: unknown }>),
        fan: await fanState(token),
        ts: new Date().toISOString(),
      });
    }

    if (action === 'set') {
      const commands: Array<{ code: string; value: unknown }> = [];
      if (typeof body.power === 'boolean') commands.push({ code: 'switch', value: body.power });
      if (typeof body.temperature === 'number') {
        // Refuse a set point outside what a server room can survive. A typo
        // that cools to 5 °C or heats to 35 °C is not a command worth relaying.
        const temp = Math.round(body.temperature);
        // 30 is the top: it is the autopilot's "compressor rests" set point
        // while the outside-air fan does the work on cool nights.
        if (temp < 16 || temp > 30) {
          return Response.json({ configured: true, ok: false, error: `Set point ${temp} °C is outside the 16–30 °C range this endpoint will relay.` }, { status: 400 });
        }
        commands.push({ code: 'temp_set', value: temp });
      }
      // No `mode` and no fan-speed command here on purpose. The unit in the
      // server room (Air Condition-A011_E, category kt) advertises exactly
      // four functions — switch, temp_set, lock and the Fahrenheit twin of
      // temp_set. Sending a `mode` it does not implement is rejected by Tuya
      // with an opaque error, so it is not offered.
      if (typeof body.lock === 'boolean') commands.push({ code: 'lock', value: body.lock });

      let fanApplied: unknown = null;
      if (typeof body.fan === 'boolean') {
        const f = await fanState(token) as { configured: boolean; code?: string };
        if (!f.configured) return Response.json({ configured: true, ok: false, error: 'No outside-air fan configured (TUYA_FAN_DEVICE_ID).' }, { status: 400 });
        const fr = await tuya('POST', `/v1.0/iot-03/devices/${FAN_ID}/commands`, { commands: [{ code: f.code || 'switch_1', value: body.fan }] }, token);
        try {
          await audit({
            user_email: email, action: 'climate_fan', entity_type: 'Device', entity_id: FAN_ID,
            details: JSON.stringify({ on: body.fan, ok: fr.ok, error: fr.error ?? null }),
        });
        } catch { /* the command matters more than the log line */ }
        if (!fr.ok) return Response.json({ configured: true, ok: false, error: `Fan: ${fr.error}` }, { status: 502 });
        fanApplied = { fan: body.fan };
        if (!commands.length) return Response.json({ configured: true, ok: true, applied: [fanApplied] });
      }

      if (!commands.length) {
        return Response.json({ configured: true, ok: false, error: 'Nothing to set. Send power or temperature.' }, { status: 400 });
      }

      const r = await tuya('POST', `/v1.0/iot-03/devices/${DEVICE_ID}/commands`, { commands }, token);

      // Log it whether it worked or not — a failed attempt to cut the cooling
      // is as interesting after the fact as a successful one.
      try {
        await audit({
          user_email: email,
          action: 'climate_set',
          entity_type: 'Device',
          entity_id: DEVICE_ID,
          details: JSON.stringify({ commands, ok: r.ok, error: r.error ?? null }),
        });
      } catch { /* the command matters more than the log line */ }

      if (!r.ok) return Response.json({ configured: true, ok: false, error: r.error }, { status: 502 });
      return Response.json({ configured: true, ok: true, applied: fanApplied ? [...commands, fanApplied] : commands });
    }

    return Response.json({ error: `Unknown action "${action}"` }, { status: 400 });
  } catch (e) {
    return Response.json({ error: (e as Error).message ?? 'Unexpected error' }, { status: 500 });
  }
});
