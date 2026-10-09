// Schools — the tenant list, and the two columns that actually decide
// whether a tenant needs you: what state it is in, and whether its roll has
// outgrown what it is contracted for.
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Head, Sec, Figs, St, Skel, Meter, Field } from '@/components/console/kit';
import { useHeadline, money, num, when } from '@/components/console/useConsoleData';
import {
  getBillingStatusMeta, getSchoolStatusMeta, isAtRiskSchool,
} from '@/components/admin/super-admin/superAdminConfig';
import { annualCost } from '@/lib/pricing';
import PlatformConfigSection from '@/components/console/PlatformConfigSection';

const B = '/AdminConsole';

// The product's status vocabulary, mapped onto the console's states.
//
// "Active" and "Paid" deliberately carry no colour. They are the ordinary
// case, and a list where every row glows green is a list where the suspended
// school and the one that stopped paying are the hardest rows to find.
function tone(meta) {
  if (meta.tone === 'crit') return 'bad';
  if (meta.tone === 'warn') return 'warn';
  return 'idle';
}

export default function Schools() {
  const h = useHeadline();
  const [q, setQ] = useState('');
  const [view, setView] = useState('all');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return h.schools
      .filter((s) => {
        if (view === 'risk' && !isAtRiskSchool(s)) return false;
        if (view === 'trial' && s.billing_status !== 'trial') return false;
        if (view === 'live' && s.status !== 'active') return false;
        if (!needle) return true;
        return [s.name, s.city, s.country, s.email].filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle));
      })
      .map((s) => ({
        ...s,
        members: h.byId[s.id]?.members ?? 0,
        classes: h.byId[s.id]?.classes ?? 0,
        annual: annualCost(s.max_students || 0),
      }))
      .sort((a, b) => Number(isAtRiskSchool(b)) - Number(isAtRiskSchool(a))
        || a.name.localeCompare(b.name));
  }, [h.schools, h.byId, q, view]);

  return (
    <Head title="Schools">
      <Sec>
        <Figs items={[
          { label: 'Tenants', value: h.loading ? '—' : h.schools.length },
          { label: 'Live', value: h.loading ? '—' : h.live.length, sub: 'status active' },
          { label: 'Paid', value: h.loading ? '—' : h.paid.length, sub: `${h.trial.length} on trial` },
          { label: 'Over contract', value: h.loading ? '—' : h.overCap.length,
            sub: 'roll above max students', state: h.overCap.length ? 'warn' : undefined },
          { label: 'At risk', value: h.loading ? '—' : h.atRisk.length,
            state: h.atRisk.length ? 'warn' : undefined },
        ]} />
      </Sec>

      <Sec title="Every school" meta={`${rows.length} shown`}>
        <div className="cons__bar">
          <Field label="Find">
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Name, city, email" />
          </Field>
          <Field label="Show">
            <select value={view} onChange={(e) => setView(e.target.value)}>
              <option value="all">Everything</option>
              <option value="risk">Needs attention</option>
              <option value="trial">On trial</option>
              <option value="live">Live only</option>
            </select>
          </Field>
        </div>

        {h.loading ? <Skel /> : rows.length === 0 ? (
          <p className="cons__empty">No school matches that.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr>
                  <th>School</th><th>Status</th><th>Billing</th>
                  <th className="num">People</th><th>Of contract</th>
                  <th className="num">Per year</th><th>Joined</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const st = getSchoolStatusMeta(s.status);
                  const bl = getBillingStatusMeta(s.billing_status);
                  const cap = Number(s.max_students || 0);
                  const over = cap > 0 && s.members > cap;
                  return (
                    <tr key={s.id}>
                      <td className="name">
                        {s.name}
                        {(s.city || s.country) && (
                          <span className="muted"> · {[s.city, s.country].filter(Boolean).join(', ')}</span>
                        )}
                      </td>
                      <td><St level={tone(st)}>{st.label}</St></td>
                      <td><St level={tone(bl)}>{bl.label}</St></td>
                      <td className="num">{num(s.members)}</td>
                      <td>
                        {cap > 0 ? (
                          <>
                            <Meter value={s.members} max={cap} over={over} />
                            <span className="muted mono"> {s.members}/{cap}</span>
                          </>
                        ) : <span className="muted">no cap set</span>}
                      </td>
                      <td className="num">{cap > 0 ? money(s.annual) : '—'}</td>
                      <td className="mono muted">{when(s.created_at, false)}</td>
                      <td><Link className="cons__link" to={`${B}/schools/${s.id}`}>Open</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Sec>

      <PlatformConfigSection kind="defaults" />
    </Head>
  );
}
