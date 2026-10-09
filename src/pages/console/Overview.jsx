// Overview — the only question it answers is "does anything need me?".
//
// Deliberately not a summary of the other pages: a dashboard that repeats
// every number it links to is one nobody reads twice.
import React from 'react';
import { Link } from 'react-router-dom';
import { Head, Sec, Figs, St, Skel } from '@/components/console/kit';
import { useHeadline, useAudit, money, num, when, ago } from '@/components/console/useConsoleData';

const B = '/AdminConsole';

export default function Overview() {
  const h = useHeadline();
  const auditQ = useAudit(50);

  const attention = [];
  const add = (key, level, what, where, go, since) =>
    attention.push({ key, level, what, where, go, since });

  if (h.healthQ.isError) {
    add('health', 'bad', 'Platform health cannot be read — the database refused the check', `${B}/health`, 'Health');
  }
  if (h.tightConns) {
    add('conns', 'bad', `Connections at ${Math.round(h.connPct)}% of the ceiling`, `${B}/health`, 'Health');
  }
  if (h.coldCache) {
    add('cache', 'warn', `Cache hit ratio down to ${h.cacheRatio}% — reads are going to disk`, `${B}/database`, 'Database');
  }

  for (const s of h.suspended) {
    add(`su-${s.id}`, 'bad', `${s.name} is suspended — nobody there can sign in`, `${B}/schools/${s.id}`, 'School');
  }
  for (const s of h.schools) {
    if (s.billing_status === 'past_due' || s.billing_status === 'unpaid') {
      add(`pd-${s.id}`, 'bad', `${s.name} has not paid — billing is ${s.billing_status.replace('_', ' ')}`, `${B}/revenue`, 'Revenue');
    } else if (s.billing_status === 'incomplete') {
      add(`ic-${s.id}`, 'warn', `${s.name} never finished setting up billing`, `${B}/revenue`, 'Revenue');
    }
  }
  for (const s of h.overCap) {
    const members = h.byId[s.id]?.members ?? 0;
    add(`cap-${s.id}`, 'warn', `${s.name} has ${members} people on a contract that stops at ${s.max_students}`, `${B}/schools/${s.id}`, 'School');
  }
  if (h.waiting) {
    add('tk', 'warn', `${h.waiting} support ticket${h.waiting === 1 ? '' : 's'} nobody has answered`, `${B}/tickets`, 'Tickets');
  }

  const bad = attention.filter((a) => a.level === 'bad').length;
  const audit = [...(auditQ.data || [])]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const sys = [
    ['Postgres', h.health ? true : !h.healthQ.isError ? null : false,
      h.health?.database?.version || '—', 'health', 'Health'],
    ['Connections', h.connections ? !h.tightConns : null,
      h.connections ? `${h.connections.active} of ${h.connections.max}` : '—', 'health', 'Health'],
    ['Cache', h.cacheRatio != null ? !h.coldCache : null,
      h.cacheRatio != null ? `${h.cacheRatio}%` : '—', 'database', 'Database'],
    ['Audit trail', auditQ.isError ? false : (auditQ.data?.length ?? 0) > 0,
      `${num(auditQ.data?.length ?? 0)} recent`, 'trail', 'Trail'],
  ];

  return (
    <Head title={h.loading ? 'Checking'
      : attention.length === 0 ? 'Nothing needs you'
      : `${attention.length} thing${attention.length === 1 ? '' : 's'} need you`}>
      <Sec>
        <Figs items={[
          { label: 'Schools', value: h.loading ? '—' : h.schools.length,
            sub: `${h.live.length} live · ${h.trial.length} trial · ${h.onboarding.length} setting up` },
          { label: 'Contracted', value: h.loading ? '—' : money(h.contracted),
            sub: 'per year, list price' },
          { label: 'People', value: h.loading ? '—' : num(h.members), sub: 'active memberships' },
          { label: 'At risk', value: h.loading ? '—' : h.atRisk.length,
            sub: 'suspended, past due or cancelled',
            state: h.atRisk.length ? 'warn' : undefined },
          { label: 'Tickets', value: h.ticketsQ.isLoading ? '—' : h.waiting,
            sub: 'waiting on a reply', state: h.waiting ? 'warn' : undefined },
        ]} />
      </Sec>

      <Sec title="Needs you" meta={bad ? `${bad} cannot wait` : 'ranked, worst first'}>
        {h.loading ? <Skel /> : attention.length === 0 ? (
          <p className="cons__empty">
            Every school is live and paid, nothing is over its contracted roll, the database is
            answering, and no ticket is waiting.
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

      <Sec title="Systems" meta={h.health?.measured_at ? `checked ${ago(h.health.measured_at)} ago` : 'live'}
        action={
          <button type="button" className="cons__b" onClick={() => h.healthQ.refetch()}
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
                  {/* Up is the ordinary case: only "down" is coloured. */}
                  <td><St level={ok === false ? 'bad' : 'idle'}>
                    {ok === null ? 'unknown' : ok ? 'up' : 'down'}</St></td>
                  <td className="mono muted">{reading}</td>
                  <td><Link className="cons__link" to={`${B}/${to}`}>{go}</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sec>

      <Sec title="Last five privileged actions"
        action={<Link className="cons__b" to={`${B}/trail`}>Full trail</Link>}>
        {auditQ.isLoading ? <Skel /> : audit.length === 0 ? (
          <p className="cons__empty">Nothing logged.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>When</th><th>Who</th><th>Did</th><th>To</th></tr></thead>
              <tbody>
                {audit.slice(0, 5).map((l, i) => (
                  <tr key={l.id || i}>
                    <td className="mono muted">{when(l.created_at)}</td>
                    <td>{l.user_email || <span className="muted">—</span>}</td>
                    <td className="name">{l.action || '—'}</td>
                    <td className="muted">{l.entity_type || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sec>
    </Head>
  );
}
