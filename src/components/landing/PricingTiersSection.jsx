import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, Monitor } from 'lucide-react';
import PricingTierSwitch from './PricingTierSwitch';
import { getCurrentUser, isAuthenticated, redirectToLogin } from '@/data/session';
import * as fns from '@/data/functions';

/**
 * Every line here is a thing the software does today.
 *
 * "PDF & Excel export" and "Priority support" were removed: exportReportPDF
 * isn't ported yet (it throws FunctionNotPortedError), and there is no
 * support tier — inventing one on a pricing page is a claim a school's
 * procurement team will hold you to.
 */
const SHARED_FEATURES = [
  'Full platform access — every feature included',
  'Complete IB Core suite (CAS, EE, TOK)',
  'Advanced multi-curricular gradebooks',
  'Parent & student portals',
  'Unlimited admin accounts',
  'Migration from your current system as part of onboarding',
];

/**
 * Self-serve checkout is off until Stripe is configured on the server — the
 * keys aren't set on production, so createCheckoutSession returns a 503 and
 * the buyer hits a dead end at the exact moment they decided to pay. Until
 * then, the tier action starts a conversation instead. Flip this to true
 * once STRIPE_SECRET_KEY is live; handleCheckout below is intact and tested.
 */
const CHECKOUT_ENABLED = false;

const TIERS = {
  tier1: {
    name: 'Tier 1',
    capacityLabel: 'Up to 200 Students',
    tierLabel: 'Tier 1',
    price: '€20.99',
    priceId: 'price_starter',
    subtitle: 'For smaller schools — full platform, capped at 200 students.',
    rules: SHARED_FEATURES,
    highlights: [
      { label: 'Student limit', value: '200' },
    ],
    featured: false,
  },
  tier2: {
    name: 'Tier 2',
    capacityLabel: 'Up to 600 Students',
    tierLabel: 'Tier 2',
    price: '€16.99',
    priceId: 'price_growth',
    subtitle: 'For growing schools — full platform, capped at 600 students.',
    rules: SHARED_FEATURES,
    highlights: [
      { label: 'Student limit', value: '600' },
    ],
    featured: true,
  },
  tier3: {
    name: 'Tier 3',
    capacityLabel: 'Unlimited Students',
    tierLabel: 'Tier 3',
    price: '€13.99',
    priceId: 'price_enterprise',
    subtitle: 'For large schools — full platform, no student cap.',
    rules: SHARED_FEATURES,
    highlights: [
      { label: 'Student limit', value: 'Unlimited' },
    ],
    featured: false,
  },
};

const SYSTEM_RULES = [
  {
    title: 'Same features on every tier',
    description: 'All schools get the full platform — no feature is gated behind a higher tier.',
  },
  {
    title: 'Tiers = student capacity',
    description: 'The only thing that changes between tiers is how many students your school can host.',
  },
  {
    title: 'Lower rate as you grow',
    description: 'The per‑student yearly price automatically drops at each higher tier.',
  },
  {
    title: 'Full IB Core included',
    description: 'CAS, EE and TOK tracking ship with every plan, from Tier 1 to Tier 3.',
  },
  {
    title: 'Unlimited admins, always',
    description: 'Add as many school admin accounts as you need on any tier.',
  },
];

const panelTransition = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1],
};

export default function PricingTiersSection() {
  const [expandedTier, setExpandedTier] = useState('tier2');
  const [loadingTier, setLoadingTier] = useState(null);

  const tierOptions = useMemo(
    () => Object.entries(TIERS).map(([value, tier]) => ({ value, label: tier.name })),
    []
  );

  const selectedTier = TIERS[expandedTier];
  const summaryLines = [
    'Every feature of scholr.pro is included — same platform on every tier.',
    selectedTier.capacityLabel === 'Unlimited Students'
      ? 'No cap on student enrollment.'
      : `Student capacity is capped at ${selectedTier.capacityLabel.replace('Up to ', '')}.`,
    'IB Core (CAS, EE, TOK), gradebooks, reports and parent portal are always on.',
    'Unlimited admin accounts on all tiers.',
    'Billed yearly. The per‑student rate decreases as your tier grows.',
  ];

  const handleCheckout = async (priceId, tierId) => {
    if (window.self !== window.top) {
      alert('Checkout works only from the published app, not inside the preview.');
      return;
    }

    // The previous version wrote `const isAuthenticated = await isAuthenticated()`,
    // which shadows the imported function and throws a ReferenceError before
    // it can do anything — every click on this button was dead.
    if (!(await isAuthenticated())) {
      redirectToLogin(window.location.href);
      return;
    }

    const user = await getCurrentUser();
    setLoadingTier(tierId);

    try {
      const response = await fns.invoke('createCheckoutSession', {
        priceId,
        tier: tierId,
        userId: user.id,
        userEmail: user.email,
      });

      if (response?.url) {
        window.location.href = response.url;
        return;
      }
    } catch (error) {
      console.error('Checkout start failed:', error);
    }

    alert('Unable to start checkout right now.');
    setLoadingTier(null);
  };

  return (
    <section id="pricing" className="relative overflow-hidden bg-[var(--mkt-paper)] py-20 sm:py-24">
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-[1.75rem] font-semibold tracking-[-0.02em] text-[var(--mkt-ink)]">
            One platform. Every feature. Tiers by student count.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-[var(--mkt-ink-2)]">
            All tiers include the full platform — same features, same support. The only
            difference is student capacity and the per&#8209;student yearly price, which drops as your school grows.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <PricingTierSwitch options={tierOptions} value={expandedTier} onChange={setExpandedTier} />
        </div>

        {/* Tier ladder — makes the decreasing per-student price obvious at a glance */}
        <div className="mx-auto mt-6 max-w-3xl grid grid-cols-3 gap-3 text-center">
          {Object.entries(TIERS).map(([key, tier]) => {
            const active = key === expandedTier;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setExpandedTier(key)}
                className={`rounded-xl border px-3 py-3 transition-colors ${
                  active
                    ? 'border-[var(--mkt-ink)] bg-[var(--mkt-paper-2)]'
                    : 'border-[var(--mkt-rule)] hover:bg-[var(--mkt-paper-2)]'
                }`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--mkt-ink-3)]">
                  {tier.tierLabel}
                </div>
                <div className="mt-1 text-xl font-bold text-[var(--mkt-ink)] [font-variant-numeric:tabular-nums]" style={{ fontFamily: 'var(--mkt-font-mono)' }}>{tier.price}</div>
                <div className="text-[11px] text-[var(--mkt-ink-3)]">/ student / year</div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={expandedTier}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={panelTransition}
              className="rounded-2xl border border-[var(--mkt-rule)] bg-[var(--mkt-paper)] p-6 sm:p-8"
            >
              <div className="border-b border-[var(--mkt-rule)] pb-6">
                <h3 className="text-2xl font-semibold text-[var(--mkt-ink)]">{selectedTier.name}</h3>
                <p className="mt-3 max-w-2xl text-[var(--mkt-ink-2)]">{selectedTier.subtitle}</p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {selectedTier.highlights.map((item) => (
                  <div key={item.label} className="rounded-xl border border-[var(--mkt-rule)] p-4">
                    <div className="text-xl font-bold text-[var(--mkt-ink)] [font-variant-numeric:tabular-nums]" style={{ fontFamily: 'var(--mkt-font-mono)' }}>{item.value}</div>
                    <div className="text-sm text-[var(--mkt-ink-3)]">{item.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${expandedTier}-summary`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ ...panelTransition, delay: 0.03 }}
              className="flex h-full flex-col rounded-2xl border border-[var(--mkt-rule)] bg-[var(--mkt-dark)] p-6 text-[var(--mkt-dark-ink)] sm:p-8"
            >
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--mkt-dark-ink-2)]">What this controls</p>
              <h3 className="mt-3 text-xl font-semibold">{selectedTier.name} rules applied across your school</h3>
              <div className="mt-6 space-y-3 text-sm text-[var(--mkt-dark-ink-2)]">
                {summaryLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-[var(--mkt-dark-ink-2)]">We set this up with you directly — most schools buy on a purchase order, not a card.</p>
              </div>

              <div className="mt-auto pt-8">
                <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-[0.14em] text-[var(--mkt-dark-ink-2)]">
                      {selectedTier.tierLabel} · per student / year
                    </div>
                    <Badge className="bg-white/10 text-[var(--mkt-dark-ink)] border border-white/15 text-[10px]">
                      Tiered pricing
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-3xl font-bold [font-variant-numeric:tabular-nums]" style={{ fontFamily: 'var(--mkt-font-mono)' }}>{selectedTier.price}</div>
                    <div className="text-sm text-[var(--mkt-dark-ink-2)]">per student, per year</div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-[var(--mkt-dark-ink-2)] mb-3">
                      Billed yearly. The per&#8209;student rate drops automatically at each higher tier — you pay less per student as your school grows.
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium">
                      <Monitor className="h-4 w-4" />
                      Web app
                    </div>
                  </div>
                </div>

                {CHECKOUT_ENABLED ? (
                  <Button
                    type="button"
                    className="h-12 text-base w-full rounded-lg bg-[var(--mkt-paper)] text-[var(--mkt-dark)] font-medium hover:bg-[var(--mkt-paper)]/90 shadow-none transition-colors whitespace-nowrap"
                    onClick={async () => {
                      await handleCheckout(selectedTier.priceId, expandedTier);
                    }}
                    disabled={loadingTier === expandedTier}
                  >
                    {loadingTier === expandedTier ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Redirecting…
                      </>
                    ) : (
                      <>
                        <span>Choose {selectedTier.name} plan</span>
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                ) : (
                  <a href="/BookDemo">
                    <Button
                      type="button"
                      className="h-12 text-base w-full rounded-lg bg-[var(--mkt-paper)] text-[var(--mkt-dark)] font-medium hover:bg-[var(--mkt-paper)]/90 shadow-none transition-colors whitespace-nowrap"
                    >
                      <span>Talk to us about {selectedTier.name}</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </a>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-20">
          <div className="mb-10">
            <h3 className="text-xl font-semibold text-[var(--mkt-ink)]">How the tier system works in practice</h3>
            <p className="mt-3 max-w-2xl text-[var(--mkt-ink-2)]">
              Every school gets the same full platform. Tiers only change how many students you can host and your per&#8209;student yearly rate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 border-t border-[var(--mkt-rule)] pt-6">
            {SYSTEM_RULES.map((rule) => (
              <div key={rule.title}>
                <h4 className="text-[15px] font-medium text-[var(--mkt-ink)]">{rule.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--mkt-ink-2)]">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}