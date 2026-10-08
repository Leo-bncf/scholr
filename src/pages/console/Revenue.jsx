// Revenue — what the platform is contracted for, and who has not paid.
//
// One price model, read from src/lib/pricing.js. There is no second set of
// figures here: a revenue screen that computes its own prices is a revenue
// screen that disagrees with the invoice.
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Head, Sec, Figs, St, Skel } from '@/components/console/kit';
import { useHeadline, money, num, when } from '@/components/console/useConsoleData';
import { getBillingStatusMeta, isPaidSchool } from '@/components/admin/super-admin/superAdminConfig';
import { annualCost, effectiveRate } from '@/lib/pricing';

const B = '/AdminConsole';

export default function Revenue() {
  const h = useHeadline();

  const rows = useMemo(() => h.schools
    .map((s) => {
      const cap = Number(s.max_students || 0);
      return {
        ...s,
        cap,
        annual: cap > 0 ? annualCost(cap) : 0,
        rate: cap > 0 ? effectiveRate(cap) : 0,
        members: h.byId[s.id]?.members ?? 0,
      };
    })
    .sort((a, b) => b.annual - a.annual), [h.schools, h.byId]);

  const unpaid = rows.filter((s) => ['past_due', 'unpaid', 'incomplete'].includes(s.billing_status));
  const atRiskValue = unpaid.reduce((sum, s) => sum + s.annual, 0);
  const trialValue = rows.filter((s) => s.billing_status === 'trial')
    .reduce((sum, s) => sum + s.annual, 0);
  const paidRows = rows.filter((s) => isPaidSchool(s));

  return (
    <Head title="Revenue">
      <Sec>
        <Figs items={[
          { label: 'Contracted', value: h.loading ? '—' : money(h.contracted), sub: 'per year, paid schools' },
          { label: 'Monthly', value: h.loading ? '—' : money(h.contracted / 12), sub: 'contracted ÷ 12' },
          { label: 'In trial', value: h.loading ? '—' : money(trialValue),
            sub: `${h.trial.length} school${h.trial.length === 1 ? '' : 's'} not yet paying` },
          { label: 'At risk', value: h.loading ? '—' : money(atRiskValue),
            sub: `${unpaid.length} not paying their invoice`,
            state: atRiskValue > 0 ? 'warn' : undefined },
          { label: 'Average', value: h.loading || !paidRows.length ? '—'
            : money(h.contracted / paidRows.length), sub: 'per paying school' },
        ]} />
      </Sec>

      {unpaid.length > 0 && (
        <Sec title="Not paying" meta="chase these first">
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>School</th><th>Billing</th><th className="num">Per year</th><th /></tr></thead>
              <tbody>
                {unpaid.map((s) => {
                  const bl = getBillingStatusMeta(s.billing_status);
                  return (
                    <tr key={s.id}>
                      <td className="name">{s.name}</td>
                      <td><St level={bl.tone === 'warn' ? 'warn' : 'bad'}>{bl.label}</St></td>
                      <td className="num">{money(s.annual)}</td>
                      <td><Link className="cons__link" to={`${B}/schools/${s.id}`}>Open</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Sec>
      )}

      <Sec title="Every school by value" meta={`${rows.length} schools`}>
        {h.loading ? <Skel /> : rows.length === 0 ? (
          <p className="cons__empty">No school on the platform yet.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr>
                  <th>School</th><th>Billing</th><th className="num">Contracted roll</th>
                  <th className="num">Per student</th><th className="num">Per year</th>
                  <th>Renews</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => {
                  const bl = getBillingStatusMeta(s.billing_status);
                  return (
                    <tr key={s.id}>
                      <td className="name">
                        <Link className="cons__link" to={`${B}/schools/${s.id}`}>{s.name}</Link>
                      </td>
                      <td>
                        {/* Paid is the ordinary case and takes no colour. */}
                        <St level={bl.tone === 'crit' ? 'bad' : bl.tone === 'warn' ? 'warn' : 'idle'}>
                          {bl.label}
                        </St>
                      </td>
                      <td className="num">{s.cap > 0 ? num(s.cap) : '—'}</td>
                      <td className="num">{s.rate ? money(s.rate) : '—'}</td>
                      <td className="num">{s.cap > 0 ? money(s.annual) : '—'}</td>
                      <td className="mono muted">
                        {when(s.subscription_current_period_end, false)}
                        {s.subscription_cancel_at_period_end && (
                          <span className="muted"> · cancelling</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="cons__note">
          Figures are list price for the contracted roll, from one pricing module. What Stripe
          actually collected is in Stripe.
        </p>
      </Sec>
    </Head>
  );
}
