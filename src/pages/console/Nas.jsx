// NAS — the file server, and the only copy of it that survives a dead disk.
//
// The host holding this VM is RAID 0, so the off-site backup is not a belt to
// the braces: it is the braces. That is why a late backup is red here and not
// amber.
import React from 'react';
import { Head, Sec, Figs, St, Skel, Meter } from '@/components/console/kit';
import { useNas, bytes, num, when, ago } from '@/components/console/useConsoleData';

export default function Nas() {
  const nas = useNas();
  const data = nas.data || {};
  const s = data.status || {};
  const alerts = data.alerts || [];

  if (nas.isLoading) return <Head title="NAS"><Sec><Skel /></Sec></Head>;

  if (data.configured === false) {
    return (
      <Head title="NAS">
        <Sec>
          <p className="cons__empty">{data.reason || 'The NAS collector has not reported.'}</p>
          {data.setup && <p className="cons__note">{data.setup}</p>}
          <p className="cons__note">
            Nothing here talks to the hypervisor. A collector running on the Proxmox host
            pushes a row in every ten minutes; production never gets a path into the
            hypervisor, which is worth more than the status card it would buy.
          </p>
        </Sec>
      </Head>
    );
  }

  const red = alerts.filter((a) => a.level === 'red').length;

  return (
    <Head title="NAS">
      <Sec meta={s.ts ? `reported ${ago(s.ts)} ago` : undefined}
        action={
          <button type="button" className="cons__b" onClick={() => nas.refetch()}
            disabled={nas.isFetching}>{nas.isFetching ? 'Reading…' : 'Re-read'}</button>
        }>
        <Figs items={[
          { label: 'The VM', value: s.vm_status || 'unknown',
            sub: s.vm_name || `vmid ${s.vmid ?? '—'}`,
            state: s.vm_status !== 'running' ? 'bad' : undefined },
          { label: 'Last backup', value: s.backup_age_h != null ? `${s.backup_age_h}` : '—',
            unit: s.backup_age_h != null ? 'h ago' : '',
            sub: s.last_backup_at ? when(s.last_backup_at, false) : 'never',
            state: s.backup_age_h == null || s.backup_age_h > (data.limits?.backup_max_age_h ?? 36)
              ? 'bad' : undefined },
          { label: 'Backups held', value: s.backup_count == null ? '—' : num(s.backup_count),
            sub: 'off-site', state: s.backup_count == null ? 'bad' : undefined },
          { label: 'Pool used', value: s.pool_used_pct != null ? `${Math.round(s.pool_used_pct)}%` : '—',
            sub: 'host storage',
            state: s.pool_used_pct >= 85 ? 'warn' : undefined },
          { label: 'Needs you', value: alerts.length,
            sub: red ? `${red} cannot wait` : 'nothing urgent',
            state: red ? 'bad' : alerts.length ? 'warn' : undefined },
        ]} />
      </Sec>

      {alerts.length > 0 && (
        <Sec title="Needs you">
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>What</th><th>Level</th></tr></thead>
              <tbody>
                {alerts.map((a, i) => (
                  <tr key={i}>
                    <td className="name">{a.text}</td>
                    <td><St level={a.level === 'red' ? 'bad' : 'warn'}>
                      {a.level === 'red' ? 'act now' : 'look'}</St></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sec>
      )}

      <Sec title="Disks">
        {!(s.disks || []).length ? (
          <p className="cons__empty">The collector reported no disks.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr><th>Disk</th><th className="num">Size</th><th>Allocated</th><th className="num">%</th></tr>
              </thead>
              <tbody>
                {s.disks.map((d) => (
                  <tr key={d.name}>
                    <td className="name mono">{d.name}</td>
                    <td className="num muted">{bytes(d.size_bytes)}</td>
                    <td><Meter value={d.allocated_pct || 0} max={100}
                      over={Number(d.allocated_pct) >= 85} /></td>
                    <td className="num">{d.allocated_pct != null ? `${Math.round(d.allocated_pct)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sec>

      <Sec title="Recent backups" meta={s.last_run_result ? `last run: ${s.last_run_result}` : undefined}>
        {!(s.backups || []).length ? (
          <p className="cons__empty">No backup objects were listed.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>When</th><th className="num">Size</th><th>Object</th></tr></thead>
              <tbody>
                {s.backups.slice(0, 10).map((b, i) => (
                  <tr key={i}>
                    <td className="mono muted">{when(b.at)}</td>
                    <td className="num muted">{bytes(b.bytes)}</td>
                    <td className="muted mono">{b.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {s.log_tail && (
          <pre className="cons__note" style={{
            whiteSpace: 'pre-wrap', fontFamily: 'var(--mono)', marginTop: 10,
            maxHeight: 180, overflow: 'auto',
          }}>{s.log_tail}</pre>
        )}
      </Sec>

      {data.open && (
        <Sec title="Getting in">
          <p className="cons__note">
            {data.open.url
              ? <>The NAS is at <a className="cons__link" href={data.open.url} target="_blank" rel="noreferrer">{data.open.url}</a>.</>
              : <>LAN-only. Tunnel in with <code>{data.open.tunnel}</code>, then open <code>{data.open.then}</code>.</>}
          </p>
        </Sec>
      )}
    </Head>
  );
}
