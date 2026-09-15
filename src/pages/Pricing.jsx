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
  ['What happens as we grow?', 'Nothing sudden. There are no caps and no tier to move up into — each band applies only to the students inside it, so student 201 is charged at €17 while the first two hundred stay at €22. The bill rises by the cost of the child you enrolled, never more, and the blended rate per student keeps falling.'],
  ['Why not one flat rate per student?', 'Because a school of nine hundred would be subsidising nothing and paying the same as a school of ninety. The bands are how a volume discount works without creating a cliff: the old scheme applied one falling rate to the whole roll, which meant a school of 201 paid less than a school of 199. That is indefensible, so it is gone.'],
  ['Is the price on the website the price?', 'Yes. There is no list price and a real price. iSAMS, Veracross and ManageBac all answer the cost question with “contact sales”; we would rather you could shortlist us without an email.'],
  ['What if we join in February?', 'You pay for the months left in the academic year, which runs 1 August to 31 July. A four-hundred-student school signing in January pays seven twelfths — €4,550 rather than €7,800.'],
  ['How do we actually pay?', 'By invoice, with a purchase-order reference and thirty days. Card checkout is not switched on, and for a commitment of this size most bursars would not use it anyway.'],
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
