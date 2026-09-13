import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Section } from '@/components/public/PublicShell';
import { getCurrentUser, isAuthenticated, redirectToLogin } from '@/data/session';
import * as fns from '@/data/functions';

/**
 * Pricing.
 *
 * The tiers differ in exactly one thing — how many students the school may
 * host — and the per-student rate falls as capacity rises. Every feature is on
 * every tier.
 *
 * So this is a price ladder plus ONE feature list, not three columns of
 * identical ticks. Three identical lists invite the reader to hunt for the
 * difference between them, which is the opposite of what the pricing model is
 * trying to say.
 */
const TIERS = [
  { id: 'tier1', name: 'Tier 1', cap: 'Up to 200 students',  capNum: '200',       price: '20.99', priceId: 'price_starter' },
  { id: 'tier2', name: 'Tier 2', cap: 'Up to 600 students',  capNum: '600',       price: '16.99', priceId: 'price_growth' },
  { id: 'tier3', name: 'Tier 3', cap: 'No student cap',      capNum: 'Unlimited', price: '13.99', priceId: 'price_enterprise' },
];

const INCLUDED = [
  'Every feature, on every tier — nothing is gated behind a higher plan',
  'IB Core: CAS, EE and TOK tracking',
  'Multi-curricular gradebooks and predicted grades',
  'Parent and student portals',
  'Timetable, attendance and behaviour',
  'PDF and Excel export',
  'Unlimited admin accounts',
  'Priority support',
];

export default function PricingTiersSection() {
  const [loadingTier, setLoadingTier] = useState(null);
  const [error, setError] = useState(null);

  const startCheckout = async (tier) => {
    setError(null);

    // The old version wrote `const isAuthenticated = await isAuthenticated()`,
    // which shadows the import and throws a ReferenceError before it can do
    // anything — every click on this button was dead.
    if (!(await isAuthenticated())) {
      redirectToLogin(window.location.href);
      return;
    }

    setLoadingTier(tier.id);
    try {
      const user = await getCurrentUser();
      const response = await fns.invoke('createCheckoutSession', {
        priceId: tier.priceId,
        tier: tier.id,
        userId: user.id,
        userEmail: user.email,
      });
      if (response?.url) {
        window.location.href = response.url;
        return;
      }
      setError("Checkout didn't return a payment link. Please try again or contact us.");
    } catch (err) {
      console.error('Checkout start failed:', err);
      setError("We couldn't start checkout. Please try again, or book a demo and we'll set it up with you.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <Section
      eyebrow="Pricing"
      title="Priced per student, per year"
      lead="The tier sets how many students your school can host. The rate per student falls as the tier rises. Everything else is identical."
    >
      <div
        className="scholr-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(15rem, 100%), 1fr))' }}
      >
        {TIERS.map(tier => (
          <div key={tier.id} className="px-5 py-6 flex flex-col gap-4">
            <div>
              <p className="scholr-label m-0">{tier.name}</p>
              <p
                className="m-0 mt-2 scholr-num leading-none"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.1rem',
                  fontWeight: 600,
                  letterSpacing: '-0.03em',
                  color: 'var(--ink)',
                }}
              >
                €{tier.price}
              </p>
              <p className="m-0 mt-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                per student, per year
              </p>
            </div>

            <div className="mt-auto">
              <p
                className="m-0 pt-3 text-sm"
                style={{ borderTop: '1px solid var(--rule-soft)', color: 'var(--body)' }}
              >
                {tier.cap}
              </p>
              <button
                type="button"
                onClick={() => startCheckout(tier)}
                disabled={loadingTier !== null}
                className="scholr-focus mt-4 w-full inline-flex items-center justify-center gap-2 text-sm font-medium"
                style={{
                  background: 'var(--brand)',
                  color: 'var(--brand-ink)',
                  border: 'none',
                  padding: '0.55rem 0.9rem',
                  borderRadius: 'var(--radius-control)',
                  cursor: loadingTier ? 'wait' : 'pointer',
                  opacity: loadingTier && loadingTier !== tier.id ? 0.5 : 1,
                }}
              >
                {loadingTier === tier.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Choose {tier.name}
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="m-0 mt-4 px-3 py-2 text-sm"
          style={{
            background: 'var(--crit-sf)',
            color: 'var(--crit)',
            border: '1px solid var(--crit)',
            borderRadius: 'var(--radius-control)',
          }}
        >
          {error}
        </p>
      )}

      <div className="mt-8">
        <h3 className="scholr-label m-0">Included on every tier</h3>
        <ul
          className="m-0 mt-3 p-0 list-none grid gap-x-8"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(19rem, 100%), 1fr))' }}
        >
          {INCLUDED.map(item => (
            <li
              key={item}
              className="py-2.5 text-sm"
              style={{ borderTop: '1px solid var(--rule-soft)', color: 'var(--body)' }}
            >
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="m-0 mt-6 text-xs" style={{ color: 'var(--faint)' }}>
        Billed yearly. Prices in euro, excluding VAT where applicable.
      </p>
    </Section>
  );
}
