// adminIlo — the three hypervisors' out-of-band management, through Redfish.
//
// The boxes are HP ProLiant DL380p Gen8, so the management processor is iLO 4
// and the API is Redfish over HTTPS with basic auth.
//
// WHAT THIS CAN AND CANNOT DO — read this before wiring a fan slider.
//
//   Reading is complete: every thermal sensor the chassis has (CPU, inlet,
//   PSU, drive cage, VRM), the real fan speeds as a percentage, and live power
//   draw in watts.
//
//   Writing is limited, and not by this code. iLO 4 does not expose fan
//   control — not in Redfish, not in the official SSH CLI. HP locked it
//   deliberately. The only route to a fan percentage is the unofficial patched
//   iLO 4 firmware (ilo4_unlock), which is a decision about flashing the
//   management processor of a box running production, not a feature to add.
//
//   So the supported levers here are: power on, graceful shutdown, hard reset,
//   and a power cap in watts. The cap is the honest way to influence heat —
//   less power drawn is less heat produced is less fan noise — and it is a
//   first-class, supported Redfish write on this generation.
//
// SETUP (docs/ILO.md):
//   ILO_HOSTS     comma-separated label=host pairs, e.g.
//                 "infra-pve-1=192.168.2.11,infra-pve-2=192.168.2.15"
//   ILO_USER      a Redfish account — read-only is enough for status
//   ILO_PASSWORD  its password
//
// The iLOs sit on the LAN behind Tailscale with self-signed certificates, so
// this runs from the edge runtime that already has that route. Unconfigured
// returns 200 with { configured: false } so a console section can say so
// without the page failing.
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

const ILO_USER = Deno.env.get('ILO_USER') || '';
const ILO_PASS = Deno.env.get('ILO_PASSWORD') || '';

/* Per-host credentials, because the fleet's iLOs do not share a password.
   Format: "192.168.2.15=Administrator:pw1,192.168.2.17=Administrator:pw2".
   A host not listed falls back to the global ILO_USER / ILO_PASSWORD. */
const ILO_CREDS: Record<string, { user: string; pass: string }> = Object.fromEntries(
  (Deno.env.get('ILO_CREDS') || '')
    .split(',').map((p) => p.trim()).filter(Boolean)
    .map((entry) => {
      const eq = entry.indexOf('=');
      const host = entry.slice(0, eq).trim();
      const rest = entry.slice(eq + 1);
      const colon = rest.indexOf(':');
      return [host, { user: rest.slice(0, colon).trim(), pass: rest.slice(colon + 1) }];
    }),
);

function credFor(host: string): { user: string; pass: string } {
  return ILO_CREDS[host] || { user: ILO_USER, pass: ILO_PASS };
}

function hosts(): Array<{ label: string; host: string }> {
  return (Deno.env.get('ILO_HOSTS') || '')
    .split(',')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [label, host] = pair.split('=').map((x) => x.trim());
      return host ? { label, host } : { label: pair, host: pair };
    });
}

function auth(host: string): string {
  const { user, pass } = credFor(host);
  return 'Basic ' + btoa(`${user}:${pass}`);
}

/* Where to send the request.
   
   The Supabase edge runtime compiles its root store in, so it will not trust
   a private CA no matter how DENO_CERT or SSL_CERT_FILE are set — an iLO with
   a perfectly good internally-signed certificate still comes back
   UnknownIssuer. Rather than switch verification off, which on an interface
   that can power a hypervisor down is not a trade worth making, a relay on
   the host does the TLS: it checks the iLO against our CA and hands this
   runtime plain HTTP on an address only the container bridge can reach.
   
   ILO_PROXY is that address. Without it, requests go straight to the iLO over
   HTTPS, which is correct wherever the runtime does trust the issuer. */
const ILO_PROXY = (Deno.env.get('ILO_PROXY') || '').replace(/\/$/, '');

/* Per-host relay map, because the fleet has more than one iLO and each one
   the runtime cannot trust directly needs its own verifying relay listener.
   Format: "192.168.2.15=http://10.0.2.1:8099,192.168.2.17=http://10.0.2.1:8100".
   A host not in the map falls back to the single ILO_PROXY, then to a direct
   HTTPS connection — which is correct wherever the runtime does trust the
   issuer. */
const ILO_PROXY_MAP: Record<string, string> = Object.fromEntries(
  (Deno.env.get('ILO_PROXY_MAP') || '')
    .split(',').map((p) => p.trim()).filter(Boolean)
    .map((p) => {
      const [h, base] = p.split('=').map((x) => x.trim());
      return [h, (base || '').replace(/\/$/, '')];
    }),
);

function urlFor(host: string, path: string): string {
  const base = ILO_PROXY_MAP[host] || ILO_PROXY;
  return base ? `${base}${path}` : `https://${host}${path}`;
}

async function rf(host: string, path: string, init?: RequestInit) {
  try {
    const res = await fetch(urlFor(host, path), {
      ...init,
      headers: {
        Authorization: auth(host),
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
      signal: AbortSignal.timeout(8000),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      return { ok: false, status: res.status, error: `iLO returned ${res.status}`, data: json };
    }
    return { ok: true, status: res.status, data: json };
  } catch (e) {
    const raw = (e as Error).message || 'iLO unreachable';
    // Report what actually happened. An earlier version replaced every
    // certificate error with one explanation — the factory-certificate case —
    // which meant a different TLS failure was described as a problem that had
    // already been fixed, and the real cause stayed invisible. The hint is
    // additional now, never a substitute.
    const hint = /BadEncoding/i.test(raw)
      ? 'This is what an iLO that has never had a certificate generated looks like: self-issued by "Default Issuer (Do not trust)", 1024-bit, expiring in 1905. Generate one on the iLO itself.'
      : /UnknownIssuer|InvalidCertificate|self.signed/i.test(raw)
      ? 'The certificate is well formed but its issuer is not trusted by this runtime. The CA has to be in the container trust store at /etc/ssl/certs/ca-certificates.crt.'
      : /NotValidForName|CertNotValidForName/i.test(raw)
      ? 'The certificate does not cover the address being used. It needs that IP in its subjectAltName.'
      : /Expired|NotValidYet/i.test(raw)
      ? 'The certificate is outside its validity window — check the clock on both ends as well as the dates.'
      : null;
    return { ok: false, status: 0, error: hint ? `${raw} — ${hint}` : raw, data: null };
  }
}

/* A DL380p reports dozens of sensors and a good half of them read 0 because
   the slot is empty. Those are noise on a dashboard, so they are dropped
   rather than shown as a healthy zero. */
function readThermal(data: Record<string, unknown> | null) {
  const temps = ((data?.Temperatures as Array<Record<string, unknown>>) || [])
    .filter((t) => typeof t.ReadingCelsius === 'number' && (t.ReadingCelsius as number) > 0)
    .map((t) => ({
      name: String(t.Name || '').replace(/^\d+-/, '').trim(),
      celsius: t.ReadingCelsius as number,
      // The chassis states its own thresholds; using them beats a number we
      // invented, because a PSU and an inlet do not share a safe range.
      warn: typeof t.UpperThresholdCritical === 'number' ? t.UpperThresholdCritical as number : null,
      health: (t.Status as Record<string, unknown>)?.Health ?? null,
    }));

  const fans = ((data?.Fans as Array<Record<string, unknown>>) || [])
    .filter((f) => (f.Status as Record<string, unknown>)?.State !== 'Absent')
    .map((f) => ({
      name: String(f.FanName || f.Name || '').trim(),
      percent: (f.CurrentReading ?? f.Reading ?? null) as number | null,
      units: String(f.Units || f.ReadingUnits || 'Percent'),
      health: (f.Status as Record<string, unknown>)?.Health ?? null,
    }));

  return { temps, fans };
}

/* RIBCL — the XML API iLO has spoken since long before Redfish existed.
   iLO 4 firmware below 2.30 has no Redfish at all, so a Gen8 left on its
   shipped firmware answers nothing at /redfish/* and would show as an
   unreachable server forever. Rather than force an EOL firmware flash on a
   production hypervisor, this speaks the API the board already has:
   GET_EMBEDDED_HEALTH returns every temperature and fan, and the values map
   onto the same shape readThermal produces from Redfish, so the page cannot
   tell which one answered. */
async function ribcl(host: string, body: string): Promise<string | null> {
  try {
    const res = await fetch(urlFor(host, '/ribcl'), {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: `<?xml version="1.0"?>\n<RIBCL VERSION="2.0">${body}</RIBCL>`,
      signal: AbortSignal.timeout(9000),
    });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

const attr = (block: string, tag: string): string | null => {
  const m = block.match(new RegExp(`<${tag}\\s+VALUE\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? m[1] : null;
};

async function ribclStatus(host: string, label: string) {
  const { user, pass } = credFor(host);
  const login = `<LOGIN USER_LOGIN="${user || 'Administrator'}" PASSWORD="${pass}">`;
  const xml = await ribcl(host,
    `${login}<SERVER_INFO MODE="read"><GET_EMBEDDED_HEALTH/><GET_HOST_POWER_STATUS/></SERVER_INFO></LOGIN>`);
  if (!xml) return { label, host, ok: false, error: 'iLO did not answer RIBCL either (Redfish absent, XML API silent).' };

  // If the login failed, iLO says so in a RESPONSE STATUS other than 0x0000.
  const fail = xml.match(/<RESPONSE[^>]*STATUS\s*=\s*"0x0(?!000)[0-9A-F]{3}"[^>]*MESSAGE\s*=\s*"([^"]*)"/i);
  if (fail) return { label, host, ok: false, error: `iLO rejected the credentials: ${fail[1]}` };

  const temps = (xml.match(/<TEMP>[\s\S]*?<\/TEMP>/gi) || [])
    .map((b) => ({
      name: (attr(b, 'LABEL') || '').replace(/^\d+-/, '').trim(),
      celsius: Number(attr(b, 'CURRENTREADING')) || 0,
      warn: attr(b, 'CRITICAL') ? Number(attr(b, 'CRITICAL')) : null,
      health: attr(b, 'STATUS'),
    }))
    .filter((t) => t.celsius > 0);

  const fans = (xml.match(/<FAN>[\s\S]*?<\/FAN>/gi) || [])
    .filter((b) => (attr(b, 'STATUS') || '').toLowerCase() !== 'absent')
    .map((b) => ({
      name: (attr(b, 'LABEL') || '').trim(),
      percent: attr(b, 'SPEED') != null ? Number(attr(b, 'SPEED')) : null,
      units: 'Percent',
      health: attr(b, 'STATUS'),
    }));

  const wattsM = xml.match(/PRESENT_POWER_READING\s+VALUE\s*=\s*"(\d+)/i);
  const powerM = xml.match(/HOST_POWER\s*=\s*"([^"]*)"/i);

  return {
    label, host, ok: true,
    via: 'ribcl',
    model: null,
    powerState: powerM ? (powerM[1].toUpperCase() === 'ON' ? 'On' : 'Off') : null,
    health: null,
    watts: wattsM ? Number(wattsM[1]) : null,
    powerCap: null,
    temps, fans,
  };
}

async function statusOf(host: string, label: string) {
  const [thermal, power, system] = await Promise.all([
    rf(host, '/redfish/v1/Chassis/1/Thermal/'),
    rf(host, '/redfish/v1/Chassis/1/Power/'),
    rf(host, '/redfish/v1/Systems/1/'),
  ]);

  // No Redfish (iLO 4 < 2.30 answers 404) — try the XML API instead of
  // reporting a working board as unreachable.
  const noRedfish = (thermal.status === 404 || system.status === 404)
    || /NOT_FOUND|returned 404/i.test(`${thermal.error || ''}${system.error || ''}`);
  if (!thermal.ok && !system.ok) {
    if (noRedfish) return ribclStatus(host, label);
    return { label, host, ok: false, error: thermal.error || system.error };
  }

  const p = power.data as Record<string, unknown> | null;
  const control = ((p?.PowerControl as Array<Record<string, unknown>>) || [])[0] || {};
  const sys = system.data as Record<string, unknown> | null;

  return {
    label,
    host,
    ok: true,
    model: sys?.Model ?? null,
    powerState: sys?.PowerState ?? null,
    health: ((sys?.Status as Record<string, unknown>)?.Health) ?? null,
    watts: (control.PowerConsumedWatts ?? null) as number | null,
    powerCap: ((control.PowerLimit as Record<string, unknown>)?.LimitInWatts ?? null) as number | null,
    // HP Power Regulator: Dynamic = the CPU-scaling energy-saving mode.
    regulator: (sys?.Oem as Record<string, unknown>)
      ? ((((sys?.Oem as Record<string, unknown>)?.Hp
        ?? (sys?.Oem as Record<string, unknown>)?.Hpe) as Record<string, unknown>)?.PowerRegulatorMode ?? null)
      : (sys?.PowerRegulatorMode ?? null),
    ...readThermal(thermal.data as Record<string, unknown> | null),
  };
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

    const list = hosts();
    if (!list.length || !ILO_USER || !ILO_PASS) {
      return Response.json({
        configured: false,
        reason: 'ILO_HOSTS, ILO_USER and ILO_PASSWORD are not all set on the edge runtime.',
        setup: 'ILO_HOSTS takes label=address pairs, e.g. "infra-pve-1=192.168.2.11,infra-pve-2=192.168.2.15". A read-only iLO account is enough for status; power actions need Virtual Power and Reset.',
      });
    }

    const body = await readJsonBody<Record<string, any>>(req).catch(() => ({} as Record<string, any>));
    const action = String(body?.action || 'status');

    if (action === 'status') {
      const rows = await Promise.all(list.map((h) => statusOf(h.host, h.label)));
      return Response.json({ configured: true, ok: true, servers: rows, ts: new Date().toISOString() });
    }

    // Everything past here changes the state of a physical machine.
    const target = list.find((h) => h.label === body?.server || h.host === body?.server);
    if (!target) {
      return Response.json({ error: `Unknown server "${body?.server}". Known: ${list.map((h) => h.label).join(', ')}` }, { status: 400 });
    }

    if (action === 'power') {
      // Only the three verbs worth exposing. Notably absent: ForceOff, which
      // pulls power from a running hypervisor with no warning to its guests.
      const ALLOWED: Record<string, string> = {
        on: 'On',
        shutdown: 'GracefulShutdown',
        reset: 'ForceRestart',
      };
      const verb = ALLOWED[String(body?.verb || '')];
      if (!verb) {
        return Response.json({ error: 'verb must be on, shutdown or reset' }, { status: 400 });
      }

      const r = await rf(target.host, '/redfish/v1/Systems/1/Actions/ComputerSystem.Reset/', {
        method: 'POST',
        body: JSON.stringify({ ResetType: verb }),
      });

      try {
        await audit({
          user_email: email,
          action: 'ilo_power',
          entity_type: 'server',
          entity_id: target.label,
          details: JSON.stringify({ verb, ok: r.ok, error: r.error ?? null }),
        });
      } catch { /* the action matters more than the log line */ }

      if (!r.ok) return Response.json({ ok: false, error: r.error }, { status: 502 });
      return Response.json({ ok: true, applied: verb, server: target.label });
    }

    if (action === 'cap') {
      // The supported lever on this generation: draw less power, make less
      // heat, and the fans follow. Not a fan slider, but an honest one.
      const watts = Number(body?.watts);
      if (!Number.isFinite(watts) || watts < 100 || watts > 1200) {
        return Response.json({ error: 'watts must be between 100 and 1200, or null to clear the cap' }, { status: 400 });
      }
      const r = await rf(target.host, '/redfish/v1/Chassis/1/Power/', {
        method: 'PATCH',
        body: JSON.stringify({ PowerControl: [{ PowerLimit: { LimitInWatts: watts } }] }),
      });

      try {
        await audit({
          user_email: email,
          action: 'ilo_power_cap',
          entity_type: 'server',
          entity_id: target.label,
          details: JSON.stringify({ watts, ok: r.ok, error: r.error ?? null }),
        });
      } catch { /* ignore */ }

      if (!r.ok) return Response.json({ ok: false, error: r.error }, { status: 502 });
      return Response.json({ ok: true, server: target.label, watts });
    }

    if (action === 'regulator') {
      // HP Power Regulator — the server's own energy mode.
      const MODES: Record<string, string> = {
        dynamic: 'DynamicPowerSavings',
        low: 'StaticLowPower',
        max: 'StaticHighPerformance',
        os: 'OSControl',
      };
      const mode = MODES[String(body?.mode || '')];
      if (!mode) {
        return Response.json({ error: 'mode must be dynamic, low, max or os' }, { status: 400 });
      }
      // iLO 4 puts this under Oem/Hp on Systems/1.
      const r = await rf(target.host, '/redfish/v1/Systems/1/', {
        method: 'PATCH',
        body: JSON.stringify({ Oem: { Hp: { PowerRegulatorMode: mode } } }),
      });
      // Some builds namespace it Hpe; retry once if the first shape is refused.
      const r2 = r.ok ? r : await rf(target.host, '/redfish/v1/Systems/1/', {
        method: 'PATCH',
        body: JSON.stringify({ Oem: { Hpe: { PowerRegulatorMode: mode } } }),
      });
      try {
        await audit({
          user_email: email, action: 'ilo_regulator', entity_type: 'server',
          entity_id: target.label, details: JSON.stringify({ mode, ok: r2.ok, error: r2.error ?? null }),
        });
      } catch { /* ignore */ }
      if (!r2.ok) return Response.json({ ok: false, error: r2.error }, { status: 502 });
      return Response.json({ ok: true, server: target.label, mode });
    }

    if (action === 'uid') {
      // The blue locator light — the one control that helps when someone IS
      // in front of the rack, telling them which box to touch.
      const on = body?.on !== false;
      const r = await rf(target.host, '/redfish/v1/Systems/1/', {
        method: 'PATCH',
        body: JSON.stringify({ IndicatorLED: on ? 'Lit' : 'Off' }),
      });
      try {
        await audit({
          user_email: email, action: 'ilo_uid', entity_type: 'server',
          entity_id: target.label, details: JSON.stringify({ on, ok: r.ok }),
        });
      } catch { /* ignore */ }
      if (!r.ok) return Response.json({ ok: false, error: r.error }, { status: 502 });
      return Response.json({ ok: true, server: target.label, uid: on });
    }

    if (action === 'ilo_reset') {
      // Restarts the management processor only — not the server. This is what
      // clears an iLO that has gone sluggish after a firmware jump.
      const r = await rf(target.host, '/redfish/v1/Managers/1/Actions/Manager.Reset/', {
        method: 'POST', body: JSON.stringify({ ResetType: 'ForceRestart' }),
      });
      try {
        await audit({
          user_email: email, action: 'ilo_reset', entity_type: 'server',
          entity_id: target.label, details: JSON.stringify({ ok: r.ok }),
        });
      } catch { /* ignore */ }
      // The iLO drops the connection as it restarts, so a non-ok here is
      // expected and not a failure.
      return Response.json({ ok: true, server: target.label, note: 'iLO restarting; back in ~30s' });
    }

    if (action === 'fan') {
      // Answered here rather than left to fail with a confusing Redfish error.
      return Response.json({
        ok: false,
        unsupported: true,
        error: 'iLO 4 does not expose fan control. HP locked it on this generation — it is absent from Redfish and from the official SSH CLI. The only route is the unofficial patched iLO 4 firmware, which is a decision about flashing the management processor of a production host. Use a power cap instead: less power drawn is less heat is less fan.',
      }, { status: 501 });
    }

    return Response.json({ error: `Unknown action "${action}"` }, { status: 400 });
  } catch (e) {
    return Response.json({ error: (e as Error).message ?? 'Unexpected error' }, { status: 500 });
  }
});
