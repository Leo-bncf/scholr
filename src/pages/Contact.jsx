import React from 'react';
import { Link } from 'react-router-dom';
import PublicShell, { Section, CTA } from '@/components/public/PublicShell';
import { ArrowRight } from 'lucide-react';

/**
 * Contact.
 *
 * This page used to advertise hello@scholr.app and support@scholr.app — the
 * wrong domain, the site is scholr.pro — alongside +1 (555) 123-4567, which is
 * the reserved fictional US exchange, and a Geneva office. Three placeholders
 * on the page a head of school visits to decide whether you are a real
 * company.
 *
 * One address that works beats three that don't.
 */
const EMAIL = 'hello@scholr.pro';

export default function Contact() {
  return (
    <PublicShell>
      <Section>
        <p className="scholr-label m-0">Contact</p>
        <h1 className="scholr-h1 m-0 mt-2 text-3xl md:text-4xl" style={{ maxWidth: '16ch' }}>
          Talk to the people who build it
        </h1>
        <p className="m-0 mt-4 text-lg leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '50ch' }}>
          Scholr is a small team. Whoever answers will know the answer.
        </p>

        <div className="mt-9 scholr-panel px-6 py-7" style={{ maxWidth: '34rem' }}>
          <p className="scholr-label m-0">Email</p>
          <p className="m-0 mt-2">
            <a
              href={`mailto:${EMAIL}`}
              className="scholr-focus"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: 'var(--brand)',
                textDecoration: 'none',
                overflowWrap: 'anywhere',
              }}
            >
              {EMAIL}
            </a>
          </p>
          <p className="m-0 mt-3 text-sm" style={{ color: 'var(--muted)' }}>
            We reply within one working day. Security questionnaires and procurement paperwork are
            welcome — send them straight here.
          </p>
        </div>
      </Section>

      <Section>
        <div className="scholr-band px-6 py-9 md:px-9 flex flex-wrap items-center gap-5">
          <div className="min-w-0">
            <h2 className="scholr-h1 m-0 text-xl md:text-2xl">Would a walkthrough be faster?</h2>
            <p className="m-0 mt-2 text-sm" style={{ color: 'var(--muted)', maxWidth: '44ch' }}>
              Thirty minutes against your own timetable, with the parts that don't apply to your
              curriculum left out.
            </p>
          </div>
          <span className="ml-auto shrink-0">
            <CTA to="/Demo">Book a demo <ArrowRight className="w-4 h-4" /></CTA>
          </span>
        </div>
        <p className="m-0 mt-4 text-sm">
          <Link to="/Pricing" className="scholr-focus" style={{ color: 'var(--brand)' }}>
            Or check the price first →
          </Link>
        </p>
      </Section>
    </PublicShell>
  );
}
