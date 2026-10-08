// Health — is the platform answering, and is it under strain.
//
// Everything here comes from one SECURITY DEFINER function that returns
// aggregates only: sizes, counts, ratios. No row contents, so this page
// cannot leak one school's data to whoever is reading it.
import React from 'react';
import { Link } from 'react-router-dom';
import { Head, Sec, Figs, St, Skel, Meter } from '@/components/console/kit';
import { useHeadline, num, uptime, when } from '@/components/console/useConsoleData';

const B = '/AdminConsole';

export default function Health() {
  const h = useHeadline();
  const db = h.health?.database;
  const conns = h.connections;
  const tx = h.health?.transactions;

  const rollbackRate = tx && Number(tx.committed) > 0
    ? (Number(tx.rolled_back) / (Number(tx.committed) + Number(tx.rolled_back))) * 100
    : null;

  if (h.healthQ.isError) {
    return (
      <Head title="Health">
        <Sec>
          <p className="cons__empty">
            The health check was refused. `platform_health()` only answers a super admin, so
            either this account is not one or the function is not deployed on this database.
          </p>
          <p className="cons__note">{h.healthQ.error?.message}</p>
        </Sec>
      </Head>
    );
  }

  return (
    <Head title="Health">
      <Sec meta={h.health?.measured_at ? `measured ${when(h.health.measured_at)}` : undefined}
        action={
          <button type="button" className="cons__b" onClick={() => h.healthQ.refetch()}
            disabled={h.healthQ.isFetching}>
            {h.healthQ.isFetching ? 'Checking…' : 'Re-check'}
          </button>
        }>
        <Figs items={[
          { label: 'Database', value: db?.size_pretty || '—', sub: db?.version || 'Postgres' },
          { label: 'Up for', value: uptime(db?.uptime_seconds), sub: 'since last restart' },
          { label: 'Connections', value: conns ? `${conns.active}` : '—',
            sub: conns ? `of ${conns.max} allowed` : '', state: h.tightConns ? 'bad' : undefined },
          { label: 'Cache hits', value: h.cacheRatio != null ? `${h.cacheRatio}%` : '—',
            sub: 'reads served from memory', state: h.coldCache ? 'warn' : undefined },
          { label: 'Rollbacks', value: rollbackRate != null ? `${rollbackRate.toFixed(2)}%` : '—',
            sub: 'of all transactions',
            state: rollbackRate != null && rollbackRate > 5 ? 'warn' : undefined },
        ]} />
      </Sec>

      <Sec title="Checks" meta="what each reading has to be before it is a problem">
        {h.healthQ.isLoading ? <Skel /> : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>Check</th><th>State</th><th>Reading</th><th>Threshold</th></tr></thead>
              <tbody>
                <tr>
                  <td className="name">Database answering</td>
                  <td><St level={h.health ? 'idle' : 'bad'}>{h.health ? 'up' : 'down'}</St></td>
                  <td className="mono muted">{db?.version || '—'}</td>
                  <td className="muted">must answer</td>
                </tr>
                <tr>
                  <td className="name">Connection headroom</td>
                  <td><St level={h.tightConns ? 'bad' : 'idle'}>
                    {h.tightConns ? 'tight' : conns ? 'fine' : 'unknown'}</St></td>
                  <td>
                    {conns ? (
                      <>
                        <Meter value={conns.active} max={conns.max} over={h.tightConns} />
                        <span className="muted mono"> {conns.active}/{conns.max}</span>
                      </>
                    ) : <span className="muted">—</span>}
                  </td>
                  <td className="muted">under 85% of max</td>
                </tr>
                <tr>
                  <td className="name">Cache hit ratio</td>
                  <td><St level={h.coldCache ? 'warn' : 'idle'}>
                    {h.coldCache ? 'cold' : h.cacheRatio != null ? 'warm' : 'unknown'}</St></td>
                  <td className="mono muted">{h.cacheRatio != null ? `${h.cacheRatio}%` : '—'}</td>
                  <td className="muted">99% or better</td>
                </tr>
                <tr>
                  <td className="name">Transaction rollbacks</td>
                  <td><St level={rollbackRate != null && rollbackRate > 5 ? 'warn' : 'idle'}>
                    {rollbackRate != null && rollbackRate > 5 ? 'high'
                      : rollbackRate != null ? 'normal' : 'unknown'}</St></td>
                  <td className="mono muted">
                    {tx ? `${num(tx.rolled_back)} of ${num(Number(tx.committed) + Number(tx.rolled_back))}` : '—'}
                  </td>
                  <td className="muted">under 5%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Sec>

      <Sec title="Tenancy" meta="what the database itself says it is holding"
        action={<Link className="cons__b" to={`${B}/database`}>Tables</Link>}>
        {h.healthQ.isLoading ? <Skel /> : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>Thing</th><th className="num">Count</th><th>Note</th></tr></thead>
              <tbody>
                <tr>
                  <td className="name">Schools</td>
                  <td className="num">{num(h.health?.tenancy?.schools)}</td>
                  <td className="muted">rows in schools</td>
                </tr>
                <tr>
                  <td className="name">Accounts</td>
                  <td className="num">{num(h.health?.tenancy?.users)}</td>
                  <td className="muted">rows in auth.users</td>
                </tr>
                <tr>
                  <td className="name">Active memberships</td>
                  <td className="num">{num(h.health?.tenancy?.members)}</td>
                  <td className="muted">somebody who can sign in and see a school</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="cons__note">
          Accounts exceeding memberships is normal: an account with no active membership is
          someone invited, removed, or a super admin who belongs to no school.
        </p>
      </Sec>
    </Head>
  );
}
