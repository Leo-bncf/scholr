// Backups — what exists if the disk dies tonight.
//
// This page reports only what something actually told it. It does not claim a
// backup is missing just because nothing reported one: "no reporter installed"
// and "no backup" are different states, and conflating them either panics you
// over a backup that is running fine, or reassures you about one that is not.
import React from 'react';
import { Link } from 'react-router-dom';
import { Head, Sec, Figs, St } from '@/components/console/kit';
import { useNas, useHeadline, bytes, num, when, ago } from '@/components/console/useConsoleData';

const B = '/AdminConsole';

export default function Backups() {
  const nas = useNas();
  const h = useHeadline();

  const nasData = nas.data || {};
  const s = nasData.status || {};
  const nasReporting = nasData.configured !== false;
  const maxAge = nasData.limits?.backup_max_age_h ?? 36;
  const nasLate = nasReporting && (s.backup_age_h == null || s.backup_age_h > maxAge);
  const db = h.health?.database;

  return (
    <Head title="Backups">
      <Sec>
        <Figs items={[
          { label: 'NAS off-site', value: !nasReporting ? 'unknown'
            : s.backup_age_h != null ? `${s.backup_age_h}` : 'none',
            unit: nasReporting && s.backup_age_h != null ? 'h ago' : '',
            sub: nasReporting ? (s.last_backup_at ? when(s.last_backup_at, false) : 'never') : 'no reporter',
            state: !nasReporting ? 'warn' : nasLate ? 'bad' : undefined },
          { label: 'Copies held', value: !nasReporting || s.backup_count == null ? '—' : num(s.backup_count),
            sub: 'off-site objects' },
          { label: 'Database', value: db?.size_pretty || '—',
            sub: 'what a dump would cover' },
          { label: 'Database backup', value: 'not reported',
            sub: 'nothing here checks it', state: 'warn' },
        ]} />
      </Sec>

      <Sec title="What is covered">
        <div className="cons__scroll">
          <table className="cons__t">
            <thead><tr><th>Thing</th><th>State</th><th>Evidence</th><th>Where</th></tr></thead>
            <tbody>
              <tr>
                <td className="name">The NAS, off-site</td>
                <td>
                  <St level={!nasReporting ? 'warn' : nasLate ? 'bad' : 'idle'}>
                    {!nasReporting ? 'unknown' : nasLate ? 'late' : 'current'}
                  </St>
                </td>
                <td className="muted">
                  {!nasReporting
                    ? 'No collector is reporting on this deployment.'
                    : s.last_backup_at
                      ? `${s.last_backup_object || 'object'} · ${bytes(s.last_backup_bytes)} · ${ago(s.last_backup_at)} ago`
                      : 'The collector reports no backup object at all.'}
                </td>
                <td className="muted">this page</td>
              </tr>
              <tr>
                <td className="name">The Scholr database</td>
                <td><St level="warn">not reported</St></td>
                <td className="muted">
                  Nothing on this deployment reports a Postgres dump. If one runs on the VM it
                  is not telling the console, which means nobody finds out the night it stops.
                </td>
                <td><Link className="cons__link" to={`${B}/database`}>Database</Link></td>
              </tr>
              <tr>
                <td className="name">Restore, actually tried</td>
                <td><St level="warn">never here</St></td>
                <td className="muted">
                  A backup nobody has restored is a hypothesis. Nothing on this deployment has
                  run a restore drill.
                </td>
                <td className="muted">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Sec>

      {nasReporting && (s.backups || []).length > 0 && (
        <Sec title="Recent off-site copies" meta={`${s.backups.length} listed`}>
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>When</th><th className="num">Size</th><th>Object</th></tr></thead>
              <tbody>
                {s.backups.slice(0, 12).map((b, i) => (
                  <tr key={i}>
                    <td className="mono muted">{when(b.at)}</td>
                    <td className="num muted">{bytes(b.bytes)}</td>
                    <td className="muted mono">{b.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sec>
      )}

      <Sec title="What this page cannot tell you">
        <p className="cons__note">
          Only the NAS reports here, and only because a collector pushes its state in. The
          database, the object storage and the edge functions have no reporter, so their rows
          above say "not reported" rather than "fine" — the one thing a backup page must never
          do is show green for something it never checked.
        </p>
      </Sec>
    </Head>
  );
}
