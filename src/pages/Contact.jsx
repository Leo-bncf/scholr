import React from 'react';
import { Link } from 'react-router-dom';
import { Section, CTA, RuledList } from '@/components/public/PublicShell';
import Seo from '@/components/public/Seo';
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
const EMAIL = 'support@scholr.pro';

/**
 * What to send where. One address, but a school arrives with one of about four
 * errands, and saying so up front saves a round trip asking which team handles
 * what — the answer being that there are no teams.
 */
const ERRANDS = [
  ['Evaluating Scholr', 'Tell us your curricula and roll and we will send a price and a demo slot in the same reply.'],
  ['Security or procurement', 'Questionnaires, data-processing agreements and sub-processor lists. Send the document rather than asking whether you may.'],
  ['Already a customer', 'Same address. There is no separate support queue and no ticket portal to log into.'],
  ['Data protection', 'Access, correction and deletion requests. The privacy policy sets out the full process and the statutory deadline.'],
];

export default function Contact() {
  return (
    <>
      <Seo
        title="Contact"
        description="One address, read by the two people who build Scholr: support@scholr.pro. Evaluations, security questionnaires, procurement paperwork and data-protection requests."
        canonical="/Contact"
      />
      <Section>
        <p className="scholr-label m-0">Contact</p>
        <h1 className="scholr-h1 m-0 mt-2 text-3xl md:text-4xl" style={{ maxWidth: '16ch' }}>
          Talk to the people who build it
        </h1>
        <p className="m-0 mt-4 text-lg leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '50ch' }}>
          Two people build Scholr. Whoever replies wrote the part you are asking about.
        </p>
        <p className="m-0 mt-4 text-base leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '54ch' }}>
          Scholr is a record system for international and independent schools that teach more than
          one curriculum — IB Diploma and MYP, IGCSE, A&#8209;Level, a US diploma — in the same
          building. Enrolment, a gradebook that marks on each programme&rsquo;s own scale, attendance,
          behaviour, the timetable as taught, messaging, and portals for students and families, with
          CAS, the Extended Essay and TOK included rather than sold as a module. It is built and
          hosted in Europe by a small company in Dublin.
        </p>
        <p className="m-0 mt-3 text-base leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '54ch' }}>
          There is no switchboard and no sales team, which cuts both ways: you will get a straight
          answer about what the software does and does not do, and you will sometimes wait a day for
          it. If the question is urgent, say so in the subject line.
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
          <p className="m-0 mt-3 text-sm" style={{ color: 'var(--muted)', lineHeight: 'var(--lh-body)' }}>
            One address, read by the two people who build it. We aim to reply within one working
            day; if something needs a lawyer or a migration plan it may take longer, and we will
            say so rather than going quiet.
          </p>
        </div>
      </Section>

      <Section eyebrow="What to send" title="Four things schools usually write about" tint>
        <RuledList items={ERRANDS} termWidth="14rem" />
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
            <CTA to="/BookDemo">Book a demo <ArrowRight className="w-4 h-4" /></CTA>
          </span>
        </div>
        <p className="m-0 mt-4 text-sm">
          <Link to="/Pricing" className="scholr-focus" style={{ color: 'var(--brand)' }}>
            Or check the price first →
          </Link>
        </p>
      </Section>
    </>
  );
}
