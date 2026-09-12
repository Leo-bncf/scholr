import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Zap,
  School,
  Users,
  LifeBuoy,
  ArrowRight,
  Loader2,
  Monitor,
  Globe,
} from 'lucide-react';
import PricingTierSwitch from './PricingTierSwitch';
import { getCurrentUser, redirectToLogin } from '@/data/session';
import * as fns from '@/data/functions';

const SHARED_FEATURES = [
  'Full platform access — every feature included',
  'Complete IB Core suite (CAS, EE, TOK)',
  'Advanced multi-curricular gradebooks',
  'Parent & student portals',
  'Unlimited admin accounts',
  'PDF & Excel export',
  'Priority support',
];

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
      { icon: School, label: 'Student limit', value: '200' },
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
      { icon: School, label: 'Student limit', value: '600' },
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
      { icon: School, label: 'Student limit', value: 'Unlimited' },
    ],
    featured: false,
  },
};

const SYSTEM_RULES = [
  {
    icon: CheckCircle2,
    title: 'Same features on every tier',
    description: 'All schools get the full platform — no feature is gated behind a higher tier.',
  },
  {
    icon: School,
    title: 'Tiers = student capacity',
    description: 'The only thing that changes between tiers is how many students your school can host.',
  },
  {
    icon: Zap,
    title: 'Lower rate as you grow',
    description: 'The per‑student yearly price automatically drops at each higher tier.',
  },
  {
    icon: Globe,
    title: 'Full IB Core included',
    description: 'CAS, EE and TOK tracking ship with every plan, from Tier 1 to Tier 3.',
  },
  {
    icon: Users,
    title: 'Unlimited admins, always',
    description: 'Add as many school admin accounts as you need on any tier.',
  },
  {
    icon: LifeBuoy,
    title: 'Priority support included',
    description: 'Every school gets priority support — no paywalled help desk.',
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
    'Unlimited admin accounts and priority support on all tiers.',
    'Billed yearly. The per‑student rate decreases as your tier grows.',
  ];

  const handleCheckout = async (priceId, tierId) => {
    if (window.self !== window.top) {
      alert('Checkout works only from the published app, not inside the preview.');
      return;
    }

    const isAuthenticated = await isAuthenticated();
    if (!isAuthenticated) {
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
    <section id="pricing" className="relative overflow-hidden bg-sl-paper py-24 font-landingBody">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-landing text-4xl font-semibold tracking-tight text-sl-ink sm:text-5xl">
            One platform, every feature, three tiers.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-sl-neutral">
            All tiers include the full platform — same features, same support. The only difference is student capacity, and the per&#8209;student yearly price drops as your school grows.
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
                className={`rounded-sm border px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sl-focus ${
                  active
                    ? 'border-sl-accent bg-sl-accentSoft'
                    : 'border-sl-rule bg-sl-paper hover:border-sl-accent'
                }`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sl-neutral">
                  {tier.tierLabel}
                </div>
                <div className="mt-1 font-landing text-xl font-semibold text-sl-ink">{tier.price}</div>
                <div className="text-[11px] text-sl-neutral">/ student / year</div>
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={expandedTier}
              initial={{ opacity: 0, y: 28, scale: 0.985, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -18, scale: 0.985, filter: 'blur(8px)' }}
              transition={panelTransition}
              className="rounded-sm border border-sl-rule bg-sl-paper2 p-6 sm:p-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.06 }}
                className="border-b border-sl-rule pb-6"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-landing text-3xl font-semibold text-sl-ink">{selectedTier.name}</h3>
                </div>
                <p className="mt-3 max-w-2xl text-sl-neutral">{selectedTier.subtitle}</p>
              </motion.div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {selectedTier.highlights.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.1 + index * 0.05 }}
                    className="rounded-sm border border-sl-rule bg-sl-paper p-4"
                  >
                    <item.icon className="mb-3 h-5 w-5 text-sl-accent" />
                    <div className="font-landing text-xl font-semibold text-sl-ink">{item.value}</div>
                    <div className="text-sm text-sl-neutral">{item.label}</div>
                  </motion.div>
                ))}
              </div>

            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${expandedTier}-summary`}
              initial={{ opacity: 0, y: 28, scale: 0.985, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -18, scale: 0.985, filter: 'blur(8px)' }}
              transition={{ ...panelTransition, delay: 0.03 }}
              className="flex h-full flex-col rounded-sm border border-sl-ink bg-sl-ink p-6 text-sl-paper sm:p-8"
            >
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: 0.08 }}
                className="text-sm uppercase tracking-[0.2em] text-sl-paper/60"
              >
                What this controls
              </motion.p>
              <motion.h3
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.12 }}
                className="mt-3 font-landing text-2xl font-semibold"
              >
                {selectedTier.name} rules applied across your school
              </motion.h3>
              <div className="mt-6 space-y-3 text-sm text-sl-paper/85">
                {summaryLines.map((line, index) => (
                  <motion.p
                    key={line}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.24, delay: 0.16 + index * 0.05 }}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.34 }}
                className="mt-8 rounded-sm border border-sl-paper/15 bg-sl-paper/5 p-4"
              >
                <p className="text-sm text-sl-paper/85">Already have an account? You&rsquo;ll go straight to payment. New user? You&rsquo;ll create your account first.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: 0.4 }}
                className="mt-auto pt-8"
              >
                <div className="mb-4 rounded-sm border border-sl-paper/15 bg-sl-paper/5 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-[0.22em] text-sl-paper/60">
                      {selectedTier.tierLabel} · Per student / year
                    </div>
                    <Badge className="bg-sl-accent2/20 text-sl-paper border border-sl-paper/20 text-[10px] rounded-sm">
                      Tiered pricing
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="font-landing text-4xl font-semibold text-sl-paper">{selectedTier.price}</div>
                    <div className="text-sm text-sl-paper/70">per student, per year</div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-sl-paper/85 mb-3">
                      Billed yearly. The per&#8209;student rate drops automatically at each higher tier — you pay less per student as your school grows.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 rounded-sm border border-sl-paper/15 bg-sl-paper/10 px-3 py-2 text-sm font-medium text-sl-paper">
                        <Monitor className="h-4 w-4" />
                        Web app
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  className="h-14 text-base w-full rounded-sm bg-sl-paper text-sl-ink font-semibold hover:bg-sl-accentSoft transition-colors focus-visible:ring-sl-focus"
                  onClick={async () => {
                    await handleCheckout(selectedTier.priceId, expandedTier);
                  }}
                  disabled={loadingTier === expandedTier}
                >
                  {loadingTier === expandedTier ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <span>Choose {selectedTier.name} plan</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-20 border-t border-sl-rule pt-16">
          <div className="mb-10 max-w-2xl">
            <h3 className="font-landing text-3xl font-semibold text-sl-ink">How the tier system works in practice</h3>
            <p className="mt-3 text-sl-neutral">
              Every school gets the same full platform. Tiers only change how many students you can host and your per&#8209;student yearly rate.
            </p>
          </div>

          <div className="grid gap-px overflow-hidden rounded-sm border border-sl-rule bg-sl-rule md:grid-cols-2 lg:grid-cols-3">
            {SYSTEM_RULES.map((rule, i) => (
              <motion.div
                key={rule.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="bg-sl-paper p-6"
              >
                <rule.icon className="mb-4 h-5 w-5 text-sl-accent" />
                <h4 className="mb-2 font-landing text-lg font-semibold text-sl-ink">{rule.title}</h4>
                <p className="text-sm leading-relaxed text-sl-neutral">{rule.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}