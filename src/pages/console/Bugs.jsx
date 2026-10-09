// Bugs — what broke for real people.
//
// error_logs has been collecting rows since the app shipped and nothing has
// ever displayed them, so this is the first page in the product that admits a
// user hit an error. Grouped by message, because one broken query hit forty
// times is one bug, not forty.
import React, { useMemo, useState } from 'react';
import { Head, Sec, Figs, St, Skel, Field, Dialog } from '@/components/console/kit';
import { useErrors, useSchools, num, when, ago } from '@/components/console/useConsoleData';

const SEVERITY = { critical: 'bad', error: 'bad', warning: 'warn', info: 'idle' };

export default function Bugs() {
  const errorsQ = useErrors(300);
  const schoolsQ = useSchools();
  const [q, setQ] = useState('');
  const [sev, setSev] = useState('all');
  const [open, setOpen] = useState(null);

  const schoolNames = useMemo(
    () => Object.fromEntries((schoolsQ.data || []).map((s) => [s.id, s.name])),
    [schoolsQ.data],
  );

  const all = errorsQ.data || [];

  // One message hit forty times is one bug. Group, count, and sort by what is
  // happening most — then by what happened last.
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const by = new Map();
    for (const e of all) {
      if (sev !== 'all' && (e.severity || 'error') !== sev) continue;
      if (needle && ![e.message, e.code, e.context].filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle))) continue;
      const key = `${e.code || '—'}::${e.message}`;
      const g = by.get(key) || {
        key, code: e.code, message: e.message, severity: e.severity || 'error',
        count: 0, last: e.created_at, schools: new Set(), sample: e,
      };
      g.count += 1;
      if (new Date(e.created_at) > new Date(g.last)) { g.last = e.created_at; g.sample = e; }
      if (e.school_id) g.schools.add(e.school_id);
      by.set(key, g);
    }
    return [...by.values()].sort((a, b) => b.count - a.count
      || new Date(b.last) - new Date(a.last));
  }, [all, q, sev]);

  const day = Date.now() - 24 * 3600_000;
  const last24 = all.filter((e) => new Date(e.created_at).getTime() > day).length;
  const critical = all.filter((e) => e.severity === 'critical').length;

  if (errorsQ.isError) {
    return (
      <Head title="Bugs">
        <Sec>
          <p className="cons__empty">
            The error log could not be read: {errorsQ.error?.message}
          </p>
        </Sec>
      </Head>
    );
  }

  return (
    <Head title="Bugs">
      <Sec action={
        <button type="button" className="cons__b" onClick={() => errorsQ.refetch()}
          disabled={errorsQ.isFetching}>
          {errorsQ.isFetching ? 'Reading…' : 'Re-read'}
        </button>
      }>
        <Figs items={[
          { label: 'Logged', value: errorsQ.isLoading ? '—' : num(all.length),
            sub: 'most recent 300' },
          { label: 'Distinct', value: errorsQ.isLoading ? '—' : groups.length,
            sub: 'actual bugs, grouped' },
          { label: 'Last 24 hours', value: errorsQ.isLoading ? '—' : last24,
            state: last24 ? 'warn' : undefined },
          { label: 'Critical', value: errorsQ.isLoading ? '—' : critical,
            state: critical ? 'bad' : undefined },
          { label: 'Newest', value: all[0] ? ago(all[0].created_at) : '—', sub: 'ago' },
        ]} />
      </Sec>

      <Sec title="What is breaking" meta={`${groups.length} distinct`}>
        <div className="cons__bar">
          <Field label="Find">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Message or code" />
          </Field>
          <Field label="Severity">
            <select value={sev} onChange={(e) => setSev(e.target.value)}>
              <option value="all">Everything</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </Field>
        </div>

        {errorsQ.isLoading ? <Skel /> : groups.length === 0 ? (
          <p className="cons__empty">
            {all.length === 0
              ? 'Nothing has been logged. Either the app is behaving or nothing is reporting.'
              : 'No error matches that.'}
          </p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr>
                  <th>What</th><th>Severity</th><th className="num">Hits</th>
                  <th className="num">Schools</th><th>Last</th><th />
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <tr key={g.key}>
                    <td className="name">
                      {g.message}
                      {g.code && <span className="muted mono"> · {g.code}</span>}
                    </td>
                    <td><St level={SEVERITY[g.severity] || 'idle'}>{g.severity}</St></td>
                    <td className="num">{g.count}</td>
                    <td className="num muted">{g.schools.size || '—'}</td>
                    <td className="mono muted" title={when(g.last)}>{ago(g.last)}</td>
                    <td>
                      <button type="button" className="cons__b" onClick={() => setOpen(g)}>
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sec>

      {open && (
        <Dialog wide title={open.message} meta={open.code || undefined}
          onClose={() => setOpen(null)}
          footer={<button type="button" className="cons__b" onClick={() => setOpen(null)}>Close</button>}>
          <div className="cons__scroll">
            <table className="cons__t">
              <tbody>
                <tr><td className="name">Hits</td><td>{open.count}</td></tr>
                <tr><td className="name">Severity</td><td>{open.severity}</td></tr>
                <tr><td className="name">Last seen</td><td className="mono">{when(open.last)}</td></tr>
                <tr><td className="name">Context</td><td className="muted">{open.sample.context || '—'}</td></tr>
                <tr>
                  <td className="name">School</td>
                  <td className="muted">
                    {open.sample.school_id ? (schoolNames[open.sample.school_id] || 'Unknown') : '—'}
                  </td>
                </tr>
                <tr><td className="name">Browser</td><td className="muted">{open.sample.user_agent || '—'}</td></tr>
              </tbody>
            </table>
          </div>
          {open.sample.stack_trace && (
            <pre style={{
              whiteSpace: 'pre-wrap', fontFamily: 'var(--mono)', fontSize: '.75rem',
              maxHeight: 260, overflow: 'auto', margin: 0, color: 'var(--ink-soft)',
            }}>{open.sample.stack_trace}</pre>
          )}
        </Dialog>
      )}
    </Head>
  );
}
