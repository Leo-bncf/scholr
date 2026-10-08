// Trail — every privileged action, newest first.
//
// This is the page that answers "who changed that". It is read-only by
// design: an audit trail somebody can edit is not an audit trail.
import React, { useMemo, useState } from 'react';
import { Head, Sec, Figs, St, Skel, Field } from '@/components/console/kit';
import { useAudit, useSchools, num, when } from '@/components/console/useConsoleData';

const LEVEL = { critical: 'bad', warning: 'warn', info: 'idle' };

export default function Trail() {
  const auditQ = useAudit(500);
  const schoolsQ = useSchools();
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('all');

  const schoolNames = useMemo(
    () => Object.fromEntries((schoolsQ.data || []).map((s) => [s.id, s.name])),
    [schoolsQ.data],
  );

  const all = auditQ.data || [];
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all
      .filter((l) => {
        if (level !== 'all' && (l.level || 'info') !== level) return false;
        if (!needle) return true;
        return [l.action, l.user_email, l.entity_type, l.details]
          .filter(Boolean).some((v) => String(v).toLowerCase().includes(needle));
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [all, q, level]);

  const counts = useMemo(() => ({
    critical: all.filter((l) => l.level === 'critical').length,
    warning: all.filter((l) => l.level === 'warning').length,
    actors: new Set(all.map((l) => l.user_email).filter(Boolean)).size,
  }), [all]);

  return (
    <Head title="Trail">
      <Sec>
        <Figs items={[
          { label: 'Entries', value: auditQ.isLoading ? '—' : num(all.length),
            sub: 'most recent 500' },
          { label: 'Critical', value: auditQ.isLoading ? '—' : counts.critical,
            state: counts.critical ? 'bad' : undefined },
          { label: 'Warnings', value: auditQ.isLoading ? '—' : counts.warning,
            state: counts.warning ? 'warn' : undefined },
          { label: 'People', value: auditQ.isLoading ? '—' : counts.actors, sub: 'distinct actors' },
          { label: 'Newest', value: all[0] ? when(all[0].created_at, false) : '—' },
        ]} />
      </Sec>

      <Sec title="Actions" meta={`${rows.length} shown`}>
        <div className="cons__bar">
          <Field label="Find">
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Action, person, thing" />
          </Field>
          <Field label="Level">
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="all">Every level</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </Field>
        </div>

        {auditQ.isLoading ? <Skel /> : rows.length === 0 ? (
          <p className="cons__empty">Nothing logged that matches.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr>
                  <th>When</th><th>Level</th><th>Who</th><th>Did</th>
                  <th>To</th><th>School</th><th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 300).map((l) => (
                  <tr key={l.id}>
                    <td className="mono muted">{when(l.created_at)}</td>
                    <td><St level={LEVEL[l.level] || 'idle'}>{l.level || 'info'}</St></td>
                    <td className="muted">{l.user_email || '—'}</td>
                    <td className="name">{l.action}</td>
                    <td className="muted">{l.entity_type || '—'}</td>
                    <td className="muted">
                      {l.school_id ? (schoolNames[l.school_id] || 'Unknown') : '—'}
                    </td>
                    <td className="muted">{l.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 300 && (
              <p className="cons__note">Showing the first 300 of {num(rows.length)}. Narrow with the filters.</p>
            )}
          </div>
        )}
      </Sec>
    </Head>
  );
}
