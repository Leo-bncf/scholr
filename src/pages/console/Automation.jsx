// Automation — what runs without anyone pressing anything.
//
// Scholr has very little of this today, and the page says so rather than
// drawing an empty dashboard for machinery that does not exist. What it can
// show is real: every audit entry written by something other than a person.
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Head, Sec, Figs, St, Skel } from '@/components/console/kit';
import { useAudit, num, when, ago } from '@/components/console/useConsoleData';

const B = '/AdminConsole';

// An entry with no human address behind it was written by a machine.
const MACHINE = /autopilot|cron|system|scheduler|webhook|collector/i;

export default function Automation() {
  const auditQ = useAudit(500);
  const all = auditQ.data || [];

  const runs = useMemo(() => all.filter((l) =>
    !l.user_email || MACHINE.test(l.user_email) || MACHINE.test(l.action || '')), [all]);

  const byAction = useMemo(() => {
    const by = new Map();
    for (const r of runs) {
      const g = by.get(r.action) || { action: r.action, count: 0, last: r.created_at, fails: 0 };
      g.count += 1;
      if (new Date(r.created_at) > new Date(g.last)) g.last = r.created_at;
      if (r.level === 'critical' || r.level === 'warning') g.fails += 1;
      by.set(r.action, g);
    }
    return [...by.values()].sort((a, b) => b.count - a.count);
  }, [runs]);

  // What Scholr has wired up, stated plainly rather than implied by an empty
  // table. Each row is either carrying real traffic or it is not.
  const wired = [
    {
      name: 'Stripe webhook', state: all.some((l) => /stripe|webhook/i.test(l.action || ''))
        ? 'running' : 'quiet',
      note: 'Billing events arriving from Stripe. Quiet means nothing has billed recently.',
    },
    {
      name: 'Cooling autopilot', state: runs.some((r) => /autopilot/i.test(r.action || ''))
        ? 'running' : 'not wired',
      note: 'Schedual runs one against this hardware. Nothing points it at Scholr.',
    },
    {
      name: 'Metrics collectors', state: 'see Room',
      note: 'Push host temperature and load every 30 s into server_metrics.',
    },
    {
      name: 'Scheduled reports', state: 'not wired',
      note: 'No job generates or sends anything on a schedule.',
    },
    {
      name: 'AI agents', state: 'not wired',
      note: 'Schedual has an agent mesh; Scholr has no equivalent.',
    },
  ];

  return (
    <Head title="Automation">
      <Sec>
        <Figs items={[
          { label: 'Machine entries', value: auditQ.isLoading ? '—' : num(runs.length),
            sub: 'of the last 500 logged' },
          { label: 'Distinct jobs', value: auditQ.isLoading ? '—' : byAction.length },
          { label: 'Last run', value: runs[0] ? ago(runs[0].created_at) : '—', sub: 'ago' },
          { label: 'Wired up', value: wired.filter((w) => w.state === 'running').length,
            sub: `of ${wired.length} possible` },
        ]} />
      </Sec>

      <Sec title="What is wired up" meta="stated, not implied by an empty table">
        <div className="cons__scroll">
          <table className="cons__t">
            <thead><tr><th>Job</th><th>State</th><th>What it does</th></tr></thead>
            <tbody>
              {wired.map((w) => (
                <tr key={w.name}>
                  <td className="name">{w.name}</td>
                  <td>
                    <St level={w.state === 'not wired' ? 'warn' : 'idle'}>{w.state}</St>
                  </td>
                  <td className="muted">{w.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sec>

      <Sec title="Runs" meta={runs.length ? `${runs.length} machine-written entries` : undefined}
        action={<Link className="cons__b" to={`${B}/trail`}>Full trail</Link>}>
        {auditQ.isLoading ? <Skel /> : byAction.length === 0 ? (
          <p className="cons__empty">
            Nothing automated has written to the audit trail. Every entry in the last 500 has a
            person behind it.
          </p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr><th>Job</th><th className="num">Runs</th><th className="num">Not clean</th><th>Last</th></tr>
              </thead>
              <tbody>
                {byAction.map((g) => (
                  <tr key={g.action}>
                    <td className="name">{g.action}</td>
                    <td className="num">{g.count}</td>
                    <td className="num">
                      {g.fails ? <St level="warn">{g.fails}</St> : <span className="muted">0</span>}
                    </td>
                    <td className="mono muted" title={when(g.last)}>{ago(g.last)} ago</td>
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
