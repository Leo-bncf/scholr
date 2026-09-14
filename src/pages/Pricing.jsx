import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/public/Seo';
import PublicShell, { Section, CTA } from '@/components/public/PublicShell';
import PricingTiersSection from '@/components/landing/PricingTiersSection';
import { ArrowRight } from 'lucide-react';

/**
 * Pricing, as its own page.
 *
 * The nav and the footer had both linked to /Pricing for months and there was
 * no such route — the link 404'd. The section already existed on the landing
 * page, so this is mostly a matter of giving it an address.
 */
const QUESTIONS = [
  ['What counts as a student?', 'An enrolled student with an active account at the point the year is billed. Staff, parents and admin accounts are free and unlimited.'],
  ['What happens if we grow past the cap?', "You move up a tier and the per-student rate drops. We'll tell you before it happens rather than after."],
  ['Is there a setup fee?', 'No. Migration from your current system is part of onboarding.'],
  ['Can we try it first?', 'Yes — a demo against your own timetable, and a trial before any commitment.'],
];

export default function Pricing() {
  return (
    <PublicShell>
      <Seo
        title="Pricing"
        description="One rate per enrolled student per year, from €13.99 to €20.99 by capacity band. Staff, admin and parent accounts are free and uncounted. No setup fee."
        canonical="/Pricing"
      />
      <Section>
        <p className="scholr-label m-0">Pricing</p>
        <h1 className="scholr-h1 m-0 mt-2 text-3xl md:text-4xl" style={{ maxWidth: '18ch' }}>
          One price, per student, per year
        </h1>
        <p className="m-0 mt-4 text-lg leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '52ch' }}>
          No feature tiers, no per-module upsell, no charge for parent or teacher accounts.
        </p>
      </Section>

      <PricingTiersSection />

      <Section eyebrow="Questions" title="The ones schools actually ask">
        <div style={{ maxWidth: '46rem' }}>
          {QUESTIONS.map(([q, a]) => (
            <div key={q} className="py-4" style={{ borderTop: '1px solid var(--rule)' }}>
              <h3 className="m-0 text-base font-medium" style={{ color: 'var(--ink)' }}>{q}</h3>
              <p className="m-0 mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{a}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="scholr-band px-6 py-9 md:px-9 flex flex-wrap items-center gap-5">
          <div className="min-w-0">
            <h2 className="scholr-h1 m-0 text-xl md:text-2xl">Not sure which tier you're in?</h2>
            <p className="m-0 mt-2 text-sm" style={{ color: 'var(--muted)', maxWidth: '46ch' }}>
              Tell us your roll and we'll tell you the number. No sales call required to get a price.
            </p>
          </div>
          <span className="ml-auto shrink-0">
            <CTA to="/BookDemo">Book a demo <ArrowRight className="w-4 h-4" /></CTA>
          </span>
        </div>
        <p className="m-0 mt-4 text-sm">
          <Link to="/Contact" className="scholr-focus" style={{ color: 'var(--brand)' }}>
            Or just email us →
          </Link>
        </p>
      </Section>
    </PublicShell>
  );
}
