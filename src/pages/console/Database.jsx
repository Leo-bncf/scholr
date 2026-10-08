// Database — what is actually taking up the disk, and how fast it is growing
// per school. The eight biggest tables, which is what the health function
// returns, and which is enough to spot the one that is running away.
import React from 'react';
import { Head, Sec, Figs, St, Skel, Meter } from '@/components/console/kit';
import { useHeadline, bytes, num, when } from '@/components/console/useConsoleData';

export default function Database() {
  const h = useHeadline();
  const db = h.health?.database;
  const tables = h.health?.largest_tables || [];
  const biggest = tables[0]?.size_bytes || 0;
  const schools = h.health?.tenancy?.schools || 0;

  if (h.healthQ.isError) {
    return (
      <Head title="Database">
        <Sec>
          <p className="cons__empty">
            The database read was refused — `platform_health()` only answers a super admin.
          </p>
        </Sec>
      </Head>
    );
  }

  return (
    <Head title="Database">
      <Sec meta={h.health?.measured_at ? `measured ${when(h.health.measured_at)}` : undefined}
        action={
          <button type="button" className="cons__b" onClick={() => h.healthQ.refetch()}
            disabled={h.healthQ.isFetching}>
            {h.healthQ.isFetching ? 'Reading…' : 'Re-read'}
          </button>
        }>
        <Figs items={[
          { label: 'On disk', value: db?.size_pretty || '—', sub: 'whole database' },
          { label: 'Per school', value: db?.size_bytes && schools
            ? bytes(db.size_bytes / schools) : '—', sub: `across ${schools} schools` },
          { label: 'Biggest table', value: tables[0]?.size || '—', sub: tables[0]?.name || '' },
          { label: 'Cache hits', value: h.cacheRatio != null ? `${h.cacheRatio}%` : '—',
            sub: 'below 99% means disk reads', state: h.coldCache ? 'warn' : undefined },
          { label: 'Started', value: db?.started_at ? when(db.started_at, false) : '—',
            sub: 'last restart' },
        ]} />
      </Sec>

      <Sec title="Largest tables" meta="eight biggest, by total size including indexes">
        {h.healthQ.isLoading ? <Skel /> : tables.length === 0 ? (
          <p className="cons__empty">The health function returned no table sizes.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr>
                  <th>Table</th><th className="num">Live rows</th>
                  <th>Share of the biggest</th><th className="num">Size</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t) => (
                  <tr key={t.name}>
                    <td className="name mono">{t.name}</td>
                    <td className="num">{num(t.rows)}</td>
                    <td><Meter value={t.size_bytes} max={biggest} /></td>
                    <td className="num">{t.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="cons__note">
          Live rows are Postgres's own estimate from the statistics collector, not a count — on a
          table that has just been written to heavily it lags behind the truth.
        </p>
      </Sec>

      <Sec title="Cache" meta="the one number that predicts a slow app before anyone reports it">
        <div className="cons__scroll">
          <table className="cons__t">
            <thead><tr><th>Reading</th><th>State</th><th className="num">Value</th><th>Means</th></tr></thead>
            <tbody>
              <tr>
                <td className="name">Buffer cache hit ratio</td>
                <td><St level={h.coldCache ? 'warn' : 'idle'}>
                  {h.coldCache ? 'cold' : h.cacheRatio != null ? 'warm' : 'unknown'}</St></td>
                <td className="num">{h.cacheRatio != null ? `${h.cacheRatio}%` : '—'}</td>
                <td className="muted">
                  {h.coldCache
                    ? 'reads are hitting disk — something wants an index'
                    : 'reads are being served from memory'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Sec>
    </Head>
  );
}
