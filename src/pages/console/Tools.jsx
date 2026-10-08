// Tools — read-only checks you run when something smells wrong, and the
// exports you take away.
//
// Every check here only reads. Nothing on this page writes to a school, so it
// is safe to run on production while someone is teaching.
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Head, Sec, Figs, St, Skel, useToast } from '@/components/console/kit';
import { useHeadline, useAudit, num } from '@/components/console/useConsoleData';
import { annualCost } from '@/lib/pricing';

const B = '/AdminConsole';

function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const cell = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n');
}

function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Tools() {
  const h = useHeadline();
  const auditQ = useAudit(500);
  const toast = useToast();
  const [ran, setRan] = useState(false);

  // Each check is a question with a yes/no answer about data already loaded,
  // so running them costs nothing and cannot time out.
  const checks = useMemo(() => {
    const stats = h.stats;
    const byId = h.byId;
    const list = [
      {
        id: 'no-stats',
        label: 'Schools with no stats row',
        why: 'the school_stats view should cover every school',
        hits: h.schools.filter((s) => !byId[s.id]).map((s) => s.name),
        level: 'bad',
      },
      {
        id: 'no-members',
        label: 'Schools with nobody in them',
        why: 'a school nobody can sign into',
        hits: stats.filter((s) => Number(s.members ?? 0) === 0)
          .map((s) => s.name || s.school_id),
        level: 'warn',
      },
      {
        id: 'no-year',
        label: 'Schools with no academic year',
        why: 'nothing can be timetabled or reported on',
        hits: stats.filter((s) => Number(s.academic_years ?? 0) === 0)
          .map((s) => s.name || s.school_id),
        level: 'warn',
      },
      {
        id: 'no-cap',
        label: 'Paid schools with no contracted roll',
        why: 'nothing to bill against',
        hits: h.paid.filter((s) => !Number(s.max_students)).map((s) => s.name),
        level: 'warn',
      },
      {
        id: 'over-cap',
        label: 'Schools past their contracted roll',
        why: 'a billing conversation, not a fault',
        hits: h.overCap.map((s) => s.name),
        level: 'warn',
      },
      {
        id: 'students-no-classes',
        label: 'Schools with students but no classes',
        why: 'people were imported and then nothing was built',
        hits: stats.filter((s) => Number(s.students ?? 0) > 0 && Number(s.classes ?? 0) === 0)
          .map((s) => s.name || s.school_id),
        level: 'warn',
      },
      {
        id: 'trial-expired',
        label: 'Trials that ended and never converted',
        why: 'still on trial billing with the date behind us',
        hits: h.schools.filter((s) => s.billing_status === 'trial' && s.trial_end_date
          && new Date(s.trial_end_date) < new Date()).map((s) => s.name),
        level: 'warn',
      },
    ];
    return list;
  }, [h.schools, h.stats, h.byId, h.paid, h.overCap]);

  const failing = checks.filter((c) => c.hits.length > 0);
  const worst = failing.filter((c) => c.level === 'bad').length;

  const exportSchools = () => {
    const rows = h.schools.map((s) => ({
      name: s.name,
      status: s.status || '',
      billing_status: s.billing_status || '',
      country: s.country || '',
      city: s.city || '',
      contracted_roll: s.max_students ?? '',
      annual_list_price_eur: s.max_students ? annualCost(s.max_students) : '',
      members: h.byId[s.id]?.members ?? 0,
      students: h.byId[s.id]?.students ?? 0,
      teachers: h.byId[s.id]?.teachers ?? 0,
      classes: h.byId[s.id]?.classes ?? 0,
      subjects: h.byId[s.id]?.subjects ?? 0,
      created_at: s.created_at || '',
    }));
    download(`scholr-schools-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
    toast(`Exported ${rows.length} schools`);
  };

  const exportTrail = () => {
    const rows = (auditQ.data || []).map((l) => ({
      created_at: l.created_at || '',
      level: l.level || 'info',
      user_email: l.user_email || '',
      action: l.action || '',
      entity_type: l.entity_type || '',
      entity_id: l.entity_id || '',
      details: l.details || '',
    }));
    if (!rows.length) { toast('Nothing in the trail to export', 'bad'); return; }
    download(`scholr-trail-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
    toast(`Exported ${rows.length} entries`);
  };

  return (
    <Head title="Tools">
      <Sec>
        <Figs items={[
          { label: 'Checks', value: checks.length, sub: 'all read-only' },
          { label: 'Flagged', value: h.loading ? '—' : failing.length,
            sub: 'found something', state: failing.length ? 'warn' : undefined },
          { label: 'Serious', value: h.loading ? '—' : worst,
            sub: 'should not be possible', state: worst ? 'bad' : undefined },
          { label: 'Schools scanned', value: h.loading ? '—' : h.schools.length },
        ]} />
      </Sec>

      <Sec title="Integrity" meta="run against production, writes nothing"
        action={
          <button type="button" className="cons__b" onClick={() => setRan(true)} disabled={h.loading}>
            {ran ? 'Re-run' : 'Run checks'}
          </button>
        }>
        {h.loading ? <Skel /> : !ran ? (
          <p className="cons__empty">
            {checks.length} checks, each one a question about data the console has already
            loaded. Nothing is written and nothing is sent.
          </p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr><th>Check</th><th>Result</th><th className="num">Hits</th><th>Which, and why it matters</th></tr>
              </thead>
              <tbody>
                {checks.map((c) => (
                  <tr key={c.id}>
                    <td className="name">{c.label}</td>
                    <td>
                      <St level={c.hits.length === 0 ? 'ok' : c.level}>
                        {c.hits.length === 0 ? 'clean' : c.level === 'bad' ? 'wrong' : 'look'}
                      </St>
                    </td>
                    <td className="num">{c.hits.length}</td>
                    <td className="muted">
                      {c.hits.length === 0 ? c.why : (
                        <>
                          {c.hits.slice(0, 4).join(', ')}
                          {c.hits.length > 4 && ` +${c.hits.length - 4} more`}
                          {' · '}{c.why}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sec>

      <Sec title="Exports" meta="generated here, from what is already on screen">
        <div className="cons__scroll">
          <table className="cons__t">
            <thead><tr><th>Export</th><th className="num">Rows</th><th>Contains</th><th /></tr></thead>
            <tbody>
              <tr>
                <td className="name">Schools and their stats</td>
                <td className="num">{h.loading ? '—' : h.schools.length}</td>
                <td className="muted">status, billing, roll, list price, counts</td>
                <td>
                  <button type="button" className="cons__b" onClick={exportSchools}
                    disabled={h.loading || !h.schools.length}>CSV</button>
                </td>
              </tr>
              <tr>
                <td className="name">Audit trail</td>
                <td className="num">{auditQ.isLoading ? '—' : num(auditQ.data?.length ?? 0)}</td>
                <td className="muted">the most recent 500 privileged actions</td>
                <td>
                  <button type="button" className="cons__b" onClick={exportTrail}
                    disabled={auditQ.isLoading}>CSV</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="cons__note">
          A CSV of schools and a CSV of the trail both leave the platform the moment you save
          them. They carry school names and staff emails, so treat the file the way you would
          treat the database.
        </p>
      </Sec>

      <Sec title="Not here" meta="deliberately">
        <div className="cons__scroll">
          <table className="cons__t">
            <thead><tr><th>Thing</th><th>Where it is</th><th>Why not here</th></tr></thead>
            <tbody>
              <tr>
                <td className="name">Erasing a person (GDPR)</td>
                <td><Link className="cons__link" to="/SuperAdminSettings">Old settings page</Link></td>
                <td className="muted">irreversible; it keeps its own confirmation flow</td>
              </tr>
              <tr>
                <td className="name">Bulk import</td>
                <td className="muted">each school's own Users page</td>
                <td className="muted">an import belongs to the school that owns the people</td>
              </tr>
              <tr>
                <td className="name">Suspending a school</td>
                <td><Link className="cons__link" to={`${B}/schools`}>Schools</Link></td>
                <td className="muted">it belongs next to the school it affects</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Sec>
    </Head>
  );
}
