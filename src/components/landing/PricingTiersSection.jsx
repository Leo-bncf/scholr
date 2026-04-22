import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Zap,
  School,
  Users,
  Calendar,
  LifeBuoy,
  FileSpreadsheet,
  Wrench,
  ArrowRight,
  Loader2,
  Monitor,
  Globe,
} from 'lucide-react';
import PricingTierSwitch from './PricingTierSwitch';

const TIERS = {
  tier1: {
    name: 'Up to 200 Students',
    tierLabel: 'Tier 1',
    price: '€20.99',
    priceId: 'price_starter',
    subtitle: 'Best for smaller schools starting with a unified LMS platform',
    rules: [
      'Up to 200 students',
      'Core academic workflows',
      'Basic gradebook functionality',
      'PDF & Excel export',
      '1 admin account',
      'Standard email support',
    ],
    highlights: [
      { icon: School, label: 'Student limit', value: '200' },
      { icon: Calendar, label: 'Workflows', value: 'Core' },
      { icon: Users, label: 'Admin accounts', value: '1' },
    ],
    featured: false,
  },
  tier2: {
    name: 'Up to 600 Students',
    tierLabel: 'Tier 2',
    price: '€16.99',
    priceId: 'price_growth',
    subtitle: 'Best for growing schools that need advanced IB tracking, multiple admins, and extended tools',
    rules: [
      'Up to 600 students',
      'Full IB Core (CAS, EE, TOK)',
      'Advanced multi-curricular gradebooks',
      'Parent portal access',
      '3 admin accounts',
      'Priority support',
    ],
    highlights: [
      { icon: School, label: 'Student limit', value: '600' },
      { icon: Globe, label: 'IB Core tools', value: 'Included' },
      { icon: Users, label: 'Admin accounts', value: '3' },
    ],
    featured: true,
  },
  tier3: {
    name: 'Unlimited Students',
    tierLabel: 'Tier 3',
    price: '€13.99',
    priceId: 'price_enterprise',
    subtitle: 'Best for large schools that need scale, comprehensive reporting, and dedicated support',
    rules: [
      'Unlimited students',
      'Full platform access',
      'Custom API integrations',
      'White-label reporting',
      'Unlimited admin accounts',
      '24/7 dedicated support',
      'Onboarding call included',
    ],
    highlights: [
      { icon: School, label: 'Student limit', value: 'Unlimited' },
      { icon: Wrench, label: 'Integrations', value: 'Custom' },
      { icon: Users, label: 'Admin accounts', value: 'Unlimited' },
    ],
    featured: false,
  },
};

const SYSTEM_RULES = [
  {
    icon: School,
    title: 'Student cap by tier',
    description: 'Each school is limited by the number of students allowed in its tier.',
  },
  {
    icon: Globe,
    title: 'Curriculum tools',
    description: 'Advanced curriculum features like IB Core tracking depend on the tier.',
  },
  {
    icon: Users,
    title: 'Admin access rules',
    description: 'Admin account limits are enforced per school based on its tier.',
  },
  {
    icon: Wrench,
    title: 'Same core academic tools',
    description: 'All tiers include assignment lifecycles, grading, and basic reporting.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Exports included',
    description: 'Schools can export gradebooks and reports in PDF and Excel across all tiers.',
  },
  {
    icon: LifeBuoy,
    title: 'Support by tier',
    description: 'Response time and onboarding level improve with higher tiers.',
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
    'The school can only operate within the limits of this tier.',
    'Student capacity is capped by the selected plan.',
    selectedTier.name === 'Unlimited Students' ? 'Platform capabilities are fully unlocked on this plan.' : 'Advanced features follow the plan allowance.',
    'Access is available on web from any desktop or mobile device.',
    selectedTier.name === 'Unlimited Students' ? 'Admin accounts are unlimited on this plan.' : 'Admin accounts are limited by the plan.',
    'Support response level follows the selected plan.',
  ];

  const handleCheckout = async (priceId, tierId) => {
    if (window.self !== window.top) {
      alert('Checkout works only from the published app, not inside the preview.');
      return;
    }

    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    const user = await base44.auth.me();
    setLoadingTier(tierId);

    try {
      const response = await base44.functions.invoke('createStripeCheckout', {
        priceId,
        tier: tierId,
        userId: user.id,
        userEmail: user.email,
      });

      if (response?.data?.url) {
        window.location.href = response.data.url;
        return;
      }
    } catch (error) {
      console.error('Checkout start failed:', error);
    }

    alert('Unable to start checkout right now.');
    setLoadingTier(null);
  };

  return (
    <section id="pricing" className="relative overflow-hidden bg-transparent py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 backdrop-blur-sm px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm">
            <Zap className="h-4 w-4 fill-current" />
            Simple, Transparent Pricing
          </div>
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Invest in Smarter Academic Workflows
          </h2>
          <p className="mt-4 text-lg text-white">
            Tiered per‑student pricing, billed yearly. The more students you have, the lower the per‑student rate — automatically.
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
                className={`rounded-2xl border px-3 py-3 transition-all ${
                  active
                    ? 'border-emerald-300 bg-white/15 shadow-lg'
                    : 'border-white/15 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  {tier.tierLabel}
                </div>
                <div className="mt-1 text-xl font-bold text-white">{tier.price}</div>
                <div className="text-[11px] text-emerald-100/80">/ student / year</div>
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
              className="rounded-[2rem] border border-slate-200 bg-white/90 backdrop-blur-md p-6 shadow-xl sm:p-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.06 }}
                className="border-b border-slate-100 pb-6"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-3xl font-bold text-slate-900">{selectedTier.name}</h3>
                  {selectedTier.featured ? <Badge className="bg-yellow-400 text-slate-900 border-none shadow-sm">Most Popular</Badge> : null}
                </div>
                <p className="mt-3 max-w-2xl text-slate-600">{selectedTier.subtitle}</p>
              </motion.div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {selectedTier.highlights.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.1 + index * 0.05 }}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                  >
                    <item.icon className="mb-3 h-5 w-5 text-emerald-700" />
                    <div className="text-xl font-bold text-slate-900">{item.value}</div>
                    <div className="text-sm text-slate-500">{item.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {selectedTier.rules.map((rule, index) => (
                  <motion.div
                    key={rule}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.26, delay: 0.18 + index * 0.035 }}
                    className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mt-0.5 rounded-full bg-emerald-100 p-1 flex-shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-slate-700">{rule}</span>
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
              className="flex h-full flex-col rounded-[2rem] border border-emerald-800/40 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 p-6 text-white shadow-2xl sm:p-8"
            >
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.24, delay: 0.08 }}
                className="text-sm uppercase tracking-[0.2em] text-emerald-200"
              >
                What this controls
              </motion.p>
              <motion.h3
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, delay: 0.12 }}
                className="mt-3 text-2xl font-bold"
              >
                {selectedTier.name} rules applied across your school
              </motion.h3>
              <div className="mt-6 space-y-3 text-sm text-emerald-100/90">
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
                className="mt-8 rounded-2xl border border-emerald-300/20 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="text-sm text-emerald-100">Already have an account? You’ll go straight to payment. New user? You’ll create your account first.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, delay: 0.4 }}
                className="mt-auto pt-8"
              >
                <div className="mb-4 rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-white/10 to-emerald-300/5 p-5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-[0.22em] text-emerald-200">
                      {selectedTier.tierLabel} · Per Student / Year
                    </div>
                    <Badge className="bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 text-[10px]">
                      Tiered pricing
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-4xl font-bold text-emerald-50">{selectedTier.price}</div>
                    <div className="text-sm text-emerald-200">per student, per year</div>
                  </div>
                  <div className="mt-4">
                    <div className="text-sm text-emerald-100 mb-3">
                      Billed yearly. The per‑student rate drops automatically at each higher tier — you pay less per student as your school grows.
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-medium text-white">
                        <Monitor className="h-4 w-4" />
                        Web App
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  className="h-14 text-base w-full rounded-full bg-white text-emerald-950 font-semibold hover:bg-emerald-50 shadow-lg transition-all"
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

        <div className="mt-20">
          <div className="mb-10 text-center">
            <h3 className="text-3xl font-bold text-white">How the tier system works in practice</h3>
            <p className="mx-auto mt-3 max-w-2xl text-white">
              The same core learning management platform is available across tiers, but each school is governed by the rules of its plan.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SYSTEM_RULES.map((rule, i) => (
              <motion.div 
                key={rule.title} 
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur-sm p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <rule.icon className="mb-4 h-6 w-6 text-emerald-600" />
                <h4 className="mb-2 text-lg font-semibold text-slate-900">{rule.title}</h4>
                <p className="text-sm leading-relaxed text-slate-600">{rule.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}