import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import * as fns from '@/data/functions';
import {
  ANNUAL_FLOOR,
  TALK_TO_US_ABOVE,
  annualCost,
  bandSummary,
  costBreakdown,
  effectiveRate,
  formatMoney,
  formatRate,
  monthsRemaining,
  proratedCost,
} from '@/lib/pricing';

/**
 * Buy more student seats.
 *
 * This used to be a plan picker: three cards, Starter / Growth / Enterprise,
 * each printing its own flat per-student rate. There are no plans any more —
 * one product, priced on graduated bands — so there is nothing to pick between
 * and the only question is how many seats the school wants.
 *
 * The bands are shown as the working rather than as options, and the figure
 * updates as the number changes. A bursar approving this needs to see how it
 * was reached, not a marketing tile.
 */
export default function StudentPricingUpgrade({ schoolId, currentStudents }) {
  const [seats, setSeats] = useState(() => Math.max(currentStudents || 0, 50));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const count = Math.max(0, Math.min(5000, parseInt(seats, 10) || 0));
  const beyondPublished = count > TALK_TO_US_ABOVE;
  const { lines, floorTopUp } = costBreakdown(count);
  const months = monthsRemaining();
  const changed = count !== (currentStudents || 0);

  const handleCheckout = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fns.invoke('createCheckoutSession', {
        schoolId,
        studentCount: count,
      });
      if (response?.url) {
        window.location.href = response.url;
        return;
      }
      throw new Error('No checkout URL was returned.');
    } catch (err) {
      // Stripe is not configured on the server, so this returns 503 today. Say
      // so plainly instead of leaving a spinner running — a school that has
      // decided to pay should not be met with silence.
      setError(
        err?.status === 503
          ? 'Card payment is not switched on yet. Email support@scholr.pro and we will invoice you.'
          : err?.message || 'That could not be started. Try again, or email support@scholr.pro.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border scholr-rule p-6">
      <p className="text-xs scholr-faint uppercase tracking-wide font-semibold mb-4">
        Change your seat count
      </p>

      <div className="flex flex-wrap items-end gap-5">
        <label className="flex flex-col gap-1.5" htmlFor="seat-count">
          <span className="text-xs scholr-faint font-medium">Student seats</span>
          <input
            id="seat-count"
            type="number"
            min="0"
            max="5000"
            step="10"
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
            className="app-input scholr-focus"
            style={{ width: '9rem', fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}
          />
        </label>

        <div>
          <p className="text-xs scholr-faint font-medium">Per year</p>
          <p className="text-3xl font-black scholr-ink" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {beyondPublished ? '—' : formatMoney(annualCost(count))}
          </p>
        </div>

        {!beyondPublished && count > 0 && (
          <div>
            <p className="text-xs scholr-faint font-medium">Per student</p>
            <p className="text-lg font-bold scholr-body">{formatRate(effectiveRate(count))}</p>
          </div>
        )}
      </div>

      {beyondPublished ? (
        <p className="text-sm scholr-muted mt-4">
          Above {TALK_TO_US_ABOVE.toLocaleString('en-IE')} seats the hosting and support
          model change, so we quote rather than calculate. Email{' '}
          <a href="mailto:support@scholr.pro" className="scholr-accent">support@scholr.pro</a>.
        </p>
      ) : (
        count > 0 && (
          <>
            <table className="w-full mt-5 text-sm">
              <tbody>
                {lines.map((l) => (
                  <tr key={l.from}>
                    <td className="py-1.5 border-t scholr-rule-soft scholr-muted">
                      Seats {l.from}–{l.to}
                    </td>
                    <td className="py-1.5 border-t scholr-rule-soft text-right scholr-muted" style={{ fontFamily: 'var(--font-mono)' }}>
                      {l.students} × €{l.rate}
                    </td>
                    <td className="py-1.5 border-t scholr-rule-soft text-right scholr-ink font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                      {formatMoney(l.subtotal)}
                    </td>
                  </tr>
                ))}
                {floorTopUp > 0 && (
                  <tr>
                    <td className="py-1.5 border-t scholr-rule-soft scholr-muted">Minimum annual fee</td>
                    <td className="py-1.5 border-t scholr-rule-soft text-right scholr-muted" style={{ fontFamily: 'var(--font-mono)' }}>
                      floor {formatMoney(ANNUAL_FLOOR)}
                    </td>
                    <td className="py-1.5 border-t scholr-rule-soft text-right scholr-ink font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                      +{formatMoney(floorTopUp)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <p className="text-xs scholr-faint mt-3">
              {months} month{months === 1 ? '' : 's'} left in this academic year, so a change
              today is charged at {formatMoney(proratedCost(count))}. Bands:{' '}
              {bandSummary().map((b, i) => (
                <span key={b.label}>{i > 0 ? ' · ' : ''}{b.label} €{b.rate}</span>
              ))}.
            </p>
          </>
        )
      )}

      {error && <p className="text-sm mt-4" style={{ color: 'var(--crit)' }}>{error}</p>}

      <div className="mt-5">
        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading || !changed || beyondPublished || count === 0}
          className="pub-btn pub-btn-primary scholr-focus"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {changed ? `Change to ${count.toLocaleString('en-IE')} seats` : 'No change'}
        </button>
      </div>
    </div>
  );
}
