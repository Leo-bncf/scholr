import React, { useState } from 'react';
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
 * What Scholr costs, with the arithmetic shown.
 *
 * This was three tier cards — Tier 1 / 2 / 3 at €20.99, €16.99 and €13.99 per
 * student per year, each rate applied to the whole roll. That scheme billed a
 * 201-pupil school €783 LESS than a 200-pupil one, because crossing a
 * threshold re-rated every student. It also disagreed with the Stripe prices
 * the app was configured to charge, which were €24 / €20 / €16.
 *
 * One product now, priced on graduated bands from src/lib/pricing.js. Because
 * the bands are graduated the bill only ever rises, so the honest way to
 * present it is a calculator: type your roll, see your number. The bands are
 * underneath as the working, not as a menu of things to choose between.
 *
 * iSAMS, Veracross and ManageBac all answer this question with "contact
 * sales". Publishing an exact figure is the point.
 */

const SHARED_FEATURES = [
  'Full platform access — every feature included',
  'Complete IB Core suite (CAS, EE, TOK)',
  'Advanced multi-curricular gradebooks',
  'Parent & student portals',
  'Unlimited admin and teacher accounts',
  'Migration from your current system as part of onboarding',
];

/**
 * Self-serve checkout is off until Stripe is configured on the server — the
 * keys aren't set on production, so createCheckoutSession returns a 503 and
 * the buyer hits a dead end at the exact moment they decided to pay.
 */
const CHECKOUT_ENABLED = false;

const PRESETS = [120, 250, 450, 800, 1200];

export default function PricingTiersSection() {
  const [roll, setRoll] = useState(450);

  const students = Math.max(0, Math.min(3000, roll || 0));
  const beyondPublished = students > TALK_TO_US_ABOVE;
  const { lines, floorTopUp } = costBreakdown(students);
  const months = monthsRemaining();

  return (
    <section
      style={{ background: 'var(--mkt-paper)', color: 'var(--mkt-ink)', padding: 'clamp(3.5rem, 8vw, 6rem) 0' }}
      aria-labelledby="pricing-heading"
    >
      <div style={{ maxWidth: '68rem', margin: '0 auto', padding: '0 1.25rem' }}>
        {/* Dropped the "PRICING" eyebrow that used to sit here: it repeated
            the nav's own "Pricing" link and the heading right below it, and
            was the fourth uppercase-mono-label on this page (hero, this one,
            "How that is made up", "Included, on every roll") — the same
            device stamped four times reads as templated even though each
            use was individually fine. The other three stay: they label a
            timetable, a table and a list, which is a different job than
            announcing a section that's already self-evident. */}
        <h2
          id="pricing-heading"
          style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.4rem)', lineHeight: 1.1, letterSpacing: '-0.028em', margin: '0 0 .7rem', textWrap: 'balance', color: 'var(--brand)' }}
        >
          One price, published, and it falls as you grow.
        </h2>
        <p style={{ maxWidth: '52ch', margin: '0 0 2.2rem', color: 'var(--mkt-ink-2)', fontSize: '1.02rem' }}>
          Every school gets the whole platform. What you pay depends only on how many
          students you have — and each band applies just to the students inside it, the
          way tax brackets do, so your bill never jumps when you enrol one more child.
        </p>

        <div className="pricing-calc">
          {/* ── The calculator ── */}
          <div className="pricing-calc__input">
            <label
              htmlFor="roll"
              style={{ display: 'block', fontFamily: 'var(--mkt-font-mono)', fontSize: '.68rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mkt-ink-3)', marginBottom: '.5rem' }}
            >
              Students in your school
            </label>

            <input
              id="roll"
              type="number"
              min="0"
              max="3000"
              step="10"
              value={roll}
              onChange={(e) => setRoll(parseInt(e.target.value, 10) || 0)}
              className="pricing-calc__number"
            />

            <input
              type="range"
              min="0"
              max="1600"
              step="10"
              value={Math.min(students, 1600)}
              onChange={(e) => setRoll(parseInt(e.target.value, 10))}
              aria-label="Students in your school"
              className="pricing-calc__range"
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginTop: '.8rem' }}>
              {PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRoll(n)}
                  aria-pressed={students === n}
                  className="pricing-calc__preset"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* ── The answer ── */}
          <div className="pricing-calc__answer">
            {beyondPublished ? (
              <>
                <p style={{ fontSize: '1.5rem', lineHeight: 1.2, margin: '0 0 .5rem', letterSpacing: '-0.02em' }}>
                  Above {TALK_TO_US_ABOVE.toLocaleString('en-IE')} students, let&rsquo;s talk.
                </p>
                <p style={{ margin: 0, color: 'var(--mkt-ink-2)', fontSize: '.94rem' }}>
                  Not a sales tactic — at that size the hosting and the support model
                  genuinely change, and quoting you a number from a slider would be
                  guessing.
                </p>
              </>
            ) : (
              <>
                <p className="pricing-calc__total">{formatMoney(annualCost(students))}</p>
                <p style={{ margin: '.1rem 0 0', color: 'var(--mkt-ink-2)', fontSize: '.94rem' }}>
                  a year · {formatRate(effectiveRate(students || 1))} per student
                </p>
                <p style={{ margin: '.75rem 0 0', color: 'var(--mkt-ink-3)', fontSize: '.84rem' }}>
                  Signing today, you would pay {formatMoney(proratedCost(students))} for the{' '}
                  {months} month{months === 1 ? '' : 's'} left in this academic year.
                </p>
              </>
            )}
          </div>
        </div>

        {/* ── The working ── */}
        {!beyondPublished && students > 0 && (
          <div className="pricing-work">
            <p className="pricing-work__label">How that is made up</p>
            <table className="pricing-work__table">
              <tbody>
                {lines.map((l) => (
                  <tr key={l.from}>
                    <td>Students {l.from}–{l.to}</td>
                    <td className="n">{l.students.toLocaleString('en-IE')} × €{l.rate}</td>
                    <td className="n">{formatMoney(l.subtotal)}</td>
                  </tr>
                ))}
                {floorTopUp > 0 && (
                  <tr>
                    <td>Minimum annual fee</td>
                    <td className="n">floor {formatMoney(ANNUAL_FLOOR)}</td>
                    <td className="n">+{formatMoney(floorTopUp)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── The bands, as reference ── */}
        <div className="pricing-bands">
          {bandSummary().map((b) => (
            <div key={b.label} className="pricing-bands__item">
              <span>{b.label}</span>
              <strong>€{b.rate}</strong>
            </div>
          ))}
          <div className="pricing-bands__item">
            <span>Minimum a year</span>
            <strong>{formatMoney(ANNUAL_FLOOR)}</strong>
          </div>
        </div>

        {/* ── What you get ── */}
        <div className="pricing-included">
          <p className="pricing-work__label">Included, on every roll</p>
          <ul>
            {SHARED_FEATURES.map((f) => <li key={f}>{f}</li>)}
          </ul>
          <p style={{ margin: '1rem 0 0', color: 'var(--mkt-ink-3)', fontSize: '.84rem' }}>
            Billed for the academic year, 1 August to 31 July, invoiced in advance.
            Join mid-year and you pay only the months remaining.
          </p>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <a href="/BookDemo" className="pub-btn pub-btn-primary scholr-focus">
            Book a demo
          </a>
          {!CHECKOUT_ENABLED && (
            <span style={{ color: 'var(--mkt-ink-3)', fontSize: '.86rem' }}>
              We invoice schools directly — no card needed to start.
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
