import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicShell, { Section, CTA } from '@/components/public/PublicShell';
import Seo from '@/components/public/Seo';
import { ArrowRight } from 'lucide-react';

/**
 * The questions schools actually ask on the first call, answered the way we
 * answer them on the first call. Anything we cannot answer honestly is not
 * here; the security page carries the "not yet" list.
 */
const GROUPS = [
  {
    heading: 'Buying it',
    items: [
      ['What does it cost?', 'Between €13.99 and €20.99 per enrolled student per year, depending on your roll. Staff, admin and parent accounts are free and uncounted. There is no setup fee and migration is part of onboarding.'],
      ['Is there a minimum contract?', 'A year, billed yearly, because that is how a school year works and how school budgets are approved.'],
      ['Can we trial it?', 'Yes — with your own subjects and grading set up, not a demo school. Ask on the demo call.'],
      ['Do you do purchase orders?', 'Yes. Self-serve card checkout is not switched on yet, so at the moment every school is invoiced.'],
    ],
  },
  {
    heading: 'Running it',
    items: [
      ['Can we run two curricula at once?', 'That is the reason the product exists. Grading scales, reporting shape and vocabulary are set per programme, and tools that do not apply to a programme are hidden from it rather than greyed out.'],
      ['What about our timetable?', 'Scholr holds and displays a timetable. It does not build one — that is our other product, Schedual. The automatic sync between them is not live yet; today you would import.'],
      ['How do parents get access?', 'A parent account is linked to specific students and sees only those. Marks appear when a teacher releases them, and attendance visibility is a school-level setting rather than a per-row one.'],
      ['Does it send email?', 'Yes — invitations and notifications send. Reports are generated in the product; PDF export is not ported yet, which is listed on the security page.'],
    ],
  },
  {
    heading: 'Leaving it',
    items: [
      ['Can we get our data out?', 'Yes, on request, in full, as structured files. We would rather be easy to leave than hold a school hostage with an export fee.'],
      ['What if you stop trading?', 'Fair question for a two-person company. Scholr is self-hosted on infrastructure we control, and an escrow arrangement for the database and the deployment scripts is something we will write into a contract if a school asks.'],
      ['Where is the data?', 'On our own servers in Europe. No third-party analytics on the site or in the product.'],
    ],
  },
];

/**
 * One question.
 *
 * A button and a grid rather than <details>/<summary>: the native element
 * cannot animate open, because it toggles `display` on the content. This keeps
 * the same keyboard behaviour and the same aria contract, and adds the only
 * thing <details> can't do.
 */
function Question({ q, a }) {
  const [open, setOpen] = useState(false);
  const id = React.useId();

  return (
    <div className="faq-item" data-open={open}>
      <button
        type="button"
        className="faq-q scholr-focus"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(o => !o)}
      >
        {q}
        <span className="faq-mark" aria-hidden="true" />
      </button>
      <div className="faq-a" id={id} role="region" hidden={undefined}>
        <div><p>{a}</p></div>
      </div>
    </div>
  );
}

export default function FAQ() {
  return (
    <PublicShell>
      <Seo
        title="Questions"
        description="What Scholr costs, whether it runs two curricula at once, how parent access works, how the Schedual timetable fits, and how to get your data out."
        canonical="/FAQ"
      />

      <Section>
        <p className="scholr-label" style={{ margin: 0, color: 'var(--brand)' }}>Questions</p>
        <h1 className="pub-display" style={{ margin: 'var(--space-xs) 0 0', fontSize: 'var(--text-3xl)', maxWidth: '20ch' }}>
          The things schools ask on the first call
        </h1>
        <p className="pub-lede" style={{ margin: 'var(--space-sm) 0 0', maxWidth: '52ch', color: 'var(--muted)' }}>
          Including the ones where the answer is “not yet”.
        </p>
      </Section>

      {GROUPS.map((g, gi) => (
        <Section key={g.heading} eyebrow={gi === 0 ? 'Answers' : undefined} title={g.heading} tint={gi % 2 === 1}>
          <div style={{ maxWidth: '62ch' }}>
            {g.items.map(([q, a]) => <Question key={q} q={q} a={a} />)}
          </div>
        </Section>
      ))}

      <Section>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
          <Link to="/Security" className="scholr-focus" style={{ color: 'var(--brand)' }}>
            What we haven’t built yet, in full →
          </Link>
        </p>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <CTA to="/BookDemo">Ask us something else <ArrowRight className="w-4 h-4" /></CTA>
        </div>
      </Section>
    </PublicShell>
  );
}
