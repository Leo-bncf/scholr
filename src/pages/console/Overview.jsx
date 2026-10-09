// Overview — the only question it answers is "does anything need me?".
//
// Deliberately not a summary of the other pages: a dashboard that repeats
// every number it links to is one nobody reads twice. What earns a place here
// is a thing you would act on, and the handful of figures that tell you
// whether the platform is healthy without opening anything.
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Head, Sec, Figs, St, Skel, Meter, Bars } from '@/components/console/kit';
import {
  useHeadline, useAudit, useIlo, useClimate, useReadiness, readinessChecks,
  tempState, num, when, ago,
} from '@/components/console/useConsoleData';

const B = '/AdminConsole';
const DAY = 24 * 3600_000;

/* Privileged actions per day for the last fortnight.
 *
 * Buckets are built from a fixed calendar window rather than from the rows, so
 * a quiet day is a zero in the line instead of a gap the eye reads as "no
 * data". That distinction is the whole point of drawing it. */
function activityByDay(rows, days = 14) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const start = today.getTime() - i * DAY;
    out.push({
      t: start,
      v: rows.filter((r) => {
        const ts = new Date(r.created_at).getTime();
        return ts >= start && ts < start + DAY;
      }).length,
      label: new Date(start).toLocaleDateString('en-IE', { day: '2-digit', month: 'short' }),
    });
  }
  return out;
}

export default function Overview() {
  const h = useHeadline();
  const auditQ = useAudit(500);
  const ilo = useIlo();
  const climate = useClimate();
  const readiness = useReadiness();

  const audit = useMemo(
    () => [...(auditQ.data || [])].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [auditQ.data],
  );
  const activity = useMemo(() => activityByDay(auditQ.data || []), [auditQ.data]);

  const machines = ilo.data?.servers || [];
  const roomWired = ilo.data?.configured !== false && !ilo.isError;
  const acWired = climate.data?.configured !== false && !climate.isError;
  const unit = climate.data?.state || {};
  const temps = machines.filter((m) => m.temp != null).map((m) => Number(m.temp));
  const hottest = temps.length ? Math.max(...temps) : null;
  const checks = readinessChecks(readiness.data);

  // ── What needs a person ────────────────────────────────────────────────
  const attention = [];
  const add = (key, level, what, where, go) => attention.push({ key, level, what, where, go });

  if (h.healthQ.isError) add('health', 'bad', 'Platform health cannot be read — the database refused the check', `${B}/health`, 'Health');
  if (h.tightConns) add('conns', 'bad', `Connections at ${Math.round(h.connPct)}% of the ceiling`, `${B}/health`, 'Health');
  if (h.coldCache) add('cache', 'warn', `Cache hit ratio down to ${h.cacheRatio}% — reads are going to disk`, `${B}/database`, 'Database');

  for (const m of machines) {
    if (!m.ok) add(`ilo-${m.label}`, 'bad', `${m.label}'s controller is not answering`, `${B}/servers`, 'Servers');
    else if (m.powerState && m.powerState !== 'On') add(`pw-${m.label}`, 'bad', `${m.label} is powered ${String(m.powerState).toLowerCase()}`, `${B}/servers`, 'Servers');
    else if (tempState(m.temp) !== 'idle') add(`t-${m.label}`, tempState(m.temp), `${m.label} is running at ${Math.round(m.temp)} °C`, `${B}/room`, 'Room');
  }
  if (acWired && unit.power === false) add('ac', 'warn', 'The air conditioning is off', `${B}/room`, 'Room');
  if (acWired && climate.data?.device?.online === false) add('ac-off', 'warn', 'The air conditioning is offline — it cannot be commanded', `${B}/room`, 'Room');

  for (const s of h.suspended) add(`su-${s.id}`, 'bad', `${s.name} is suspended — nobody there can sign in`, `${B}/schools/${s.id}`, 'School');
  for (const s of h.schools) {
    if (['past_due', 'unpaid'].includes(s.billing_status)) add(`pd-${s.id}`, 'bad', `${s.name} has not paid — billing is ${s.billing_status.replace('_', ' ')}`, `${B}/revenue`, 'Revenue');
    else if (s.billing_status === 'incomplete') add(`ic-${s.id}`, 'warn', `${s.name} never finished setting up billing`, `${B}/revenue`, 'Revenue');
  }
  for (const s of h.overCap) {
    add(`cap-${s.id}`, 'warn', `${s.name} has ${h.byId[s.id]?.members ?? 0} people on a contract that stops at ${s.max_students}`, `${B}/schools/${s.id}`, 'School');
  }
  if (h.waiting) add('tk', 'warn', `${h.waiting} support ticket${h.waiting === 1 ? '' : 's'} nobody has answered`, `${B}/tickets`, 'Tickets');

  // The rail puts a dot on Email when outbound mail is dead. This page used to
  // say "nothing needs you" at the same time, which is the kind of
  // contradiction that teaches people to stop believing the dashboard.
  const smtp = checks.find((c) => /smtp|email/i.test(c.name));
  if (smtp && smtp.status !== 'pass') {
    add('smtp', 'warn', 'No email can be sent — every invitation is waiting on somebody passing the link on by hand', `${B}/email`, 'Email');
  }

  const bad = attention.filter((a) => a.level === 'bad').length;
  const loading = h.loading || auditQ.isLoading;

  const sys = [
    ['Postgres', h.health ? true : h.healthQ.isError ? false : null, h.health?.database?.version || '—', 'health', 'Health'],
    ['Connections', h.connections ? !h.tightConns : null, h.connections ? `${h.connections.active} of ${h.connections.max}` : '—', 'health', 'Health'],
    ['Cache', h.cacheRatio != null ? !h.coldCache : null, h.cacheRatio != null ? `${h.cacheRatio}%` : '—', 'database', 'Database'],
    ['Controllers', roomWired ? machines.every((m) => m.ok) : null,
      roomWired ? `${machines.filter((m) => m.ok).length} of ${machines.length} answering` : 'not configured', 'servers', 'Servers'],
    ['Air conditioning', acWired ? unit.power !== false : null,
      acWired ? (unit.set_point != null ? `set to ${unit.set_point} °C` : 'on') : 'not configured', 'room', 'Room'],
    // A failing Google integration is not a dead database. `blocking` carries
    // the distinction the readiness function already makes.
    ...checks.map((c) => [c.name,
      c.status === 'pass' ? true : (c.blocking ? false : 'warn'),
      (c.missing || []).length ? `missing ${c.missing.length}` : '—',
      /smtp|email/i.test(c.name) ? 'email' : 'settings',
      /smtp|email/i.test(c.name) ? 'Email' : 'Settings']),
  ];

  return (
    <Head title={loading ? 'Checking'
      : attention.length === 0 ? 'Nothing needs you'
      : `${attention.length} thing${attention.length === 1 ? ' needs' : 's need'} you`}>
      <Sec>
        <Figs items={[
          { label: 'Schools', value: h.loading ? '—' : h.schools.length,
            sub: `${h.live.length} live · ${h.trial.length} trial · ${h.onboarding.length} setting up` },
          { label: 'People', value: h.loading ? '—' : num(h.members),
            sub: `${num(h.stats.reduce((n, s) => n + Number(s.students ?? 0), 0))} students · ${num(h.stats.reduce((n, s) => n + Number(s.teachers ?? 0), 0))} teachers` },
          { label: 'Warmest machine', value: hottest != null ? Math.round(hottest) : '—',
            unit: hottest != null ? '°C' : '',
            sub: hottest != null ? (machines.find((m) => Number(m.temp) === hottest)?.label || '') : 'no controller',
            state: tempState(hottest) === 'idle' ? undefined : tempState(hottest) },
          { label: 'Database', value: h.health?.database?.size_pretty || '—',
            sub: h.cacheRatio != null ? `${h.cacheRatio}% from memory` : 'size on disk',
            state: h.coldCache ? 'warn' : undefined },
          { label: 'Needs you', value: loading ? '—' : attention.length,
            sub: bad ? `${bad} cannot wait` : attention.length ? 'none urgent' : 'all clear',
            state: bad ? 'bad' : attention.length ? 'warn' : undefined },
        ]} />
      </Sec>

      <Sec title="Needs you" meta={bad ? `${bad} cannot wait` : 'ranked, worst first'}>
        {loading ? <Skel /> : attention.length === 0 ? (
          <p className="cons__empty">
            Every school is live and paid, nothing is over its contracted roll, the database is
            answering, every machine is on and cool, and no ticket is waiting.
          </p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>What</th><th>Level</th><th>Where</th></tr></thead>
              <tbody>
                {attention
                  .sort((a, b) => (a.level === 'bad' ? 0 : 1) - (b.level === 'bad' ? 0 : 1))
                  .map((a) => (
                    <tr key={a.key}>
                      <td className="name">{a.what}</td>
                      <td><St level={a.level}>{a.level === 'bad' ? 'act now' : 'look'}</St></td>
                      <td><Link className="cons__link" to={a.where}>{a.go} →</Link></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </Sec>

      {/* The room runs the product. It used to be absent from this page
          entirely, which meant the one thing that takes everything down with
          it was the one thing the Overview never mentioned. */}
      <Sec title="The room" meta={acWired && unit.current_temp != null ? `${unit.current_temp} °C in the room` : undefined}
        action={<Link className="cons__b" to={`${B}/room`}>Room</Link>}>
        {ilo.isLoading ? <Skel /> : !roomWired ? (
          <p className="cons__empty">
            No out-of-band controllers are configured, so the machines cannot be read from here.
          </p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr>
                  <th>Machine</th><th>Power</th><th className="num">Temp</th>
                  <th>Against 85 °C</th><th className="num">Draw</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((m) => (
                  <tr key={m.label}>
                    <td className="name mono">{m.label}</td>
                    <td>
                      <St level={!m.ok ? 'bad' : m.powerState === 'On' ? 'idle' : 'bad'}>
                        {m.ok ? String(m.powerState || 'unknown').toLowerCase() : 'unreachable'}
                      </St>
                    </td>
                    <td className="num">
                      <St level={tempState(m.temp)}>{m.temp != null ? `${Math.round(m.temp)} °C` : '—'}</St>
                    </td>
                    <td>
                      {/* A ratio against a known ceiling is a meter, not a
                          number you have to hold the limit in your head for. */}
                      {m.temp != null
                        ? <Meter value={m.temp} max={85} over={tempState(m.temp) !== 'idle'} />
                        : <span className="muted">—</span>}
                    </td>
                    <td className="num muted">{m.watts != null ? `${Math.round(m.watts)} W` : '—'}</td>
                  </tr>
                ))}
                {acWired && (
                  <tr>
                    <td className="name">Air conditioning</td>
                    <td>
                      <St level={unit.power === false ? 'warn' : 'idle'}>
                        {unit.power === false ? 'off' : unit.mode || 'on'}
                      </St>
                    </td>
                    <td className="num">{unit.set_point != null ? `${unit.set_point} °C` : '—'}</td>
                    <td className="muted">set point</td>
                    <td className="num muted">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Sec>

      <Sec title="Systems" meta={h.health?.measured_at ? `checked ${ago(h.health.measured_at)} ago` : 'live'}
        action={
          <button type="button" className="cons__b"
            onClick={() => { h.healthQ.refetch(); ilo.refetch(); climate.refetch(); readiness.refetch(); }}
            disabled={h.healthQ.isFetching}>
            {h.healthQ.isFetching ? 'Checking…' : 'Re-check'}
          </button>
        }>
        <div className="cons__scroll">
          <table className="cons__t">
            <thead><tr><th>Subsystem</th><th>State</th><th>Reading</th><th>Where</th></tr></thead>
            <tbody>
              {sys.map(([label, ok, reading, to, go]) => (
                <tr key={label}>
                  <td className="name">{label}</td>
                  {/* Up is the ordinary case: only a failure is coloured. */}
                  <td>
                    <St level={ok === false ? 'bad' : ok === 'warn' ? 'warn' : 'idle'}>
                      {ok === null ? 'unknown' : ok === true ? 'up'
                        : ok === 'warn' ? 'not set up' : 'down'}
                    </St>
                  </td>
                  <td className="mono muted">{reading}</td>
                  <td><Link className="cons__link" to={`${B}/${to}`}>{go}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sec>

      <Sec title="Privileged actions" meta="per day, last fortnight"
        action={<Link className="cons__b" to={`${B}/trail`}>Full trail</Link>}>
        {auditQ.isLoading ? <Skel /> : audit.length === 0 ? (
          <p className="cons__empty">Nothing logged.</p>
        ) : (
          <>
            <Bars points={activity} empty="nothing logged"
              format={(v) => `${v} action${v === 1 ? '' : 's'}`} />
            <div className="cons__scroll" style={{ marginTop: 12 }}>
              <table className="cons__t">
                <thead><tr><th>When</th><th>Who</th><th>Did</th><th>To</th></tr></thead>
                <tbody>
                  {audit.slice(0, 6).map((l, i) => (
                    <tr key={l.id || i}>
                      <td className="mono muted">{when(l.created_at)}</td>
                      <td>{l.user_email || <span className="muted">a machine</span>}</td>
                      <td className="name">{l.action || '—'}</td>
                      <td className="muted">{l.entity_type || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Sec>
    </Head>
  );
}
