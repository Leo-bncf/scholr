import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicShell from '@/components/public/PublicShell';
import ConsentModal from '@/components/public/ConsentModal';
import WeekMap from '@/components/landing/WeekMap';
import PricingTiersSection from '@/components/landing/PricingTiersSection';
import SHOTS from '@/marketing/manifest.json';

/**
 * Hallmark · macrostructure: 19 Map / Diagram · genre: modern-minimal
 *
 * Every earlier Hallmark output in this project was Workbench — three
 * consecutive entries in .hallmark/log.json, a stack of framed product
 * captures each time. Reusing a structural fingerprint is what makes a site
 * read as generated, and recolouring cannot reach it. A memo (Long Document)
 * was tried and was wrong for a different reason: it is not a landing page.
 *
 * So: one spatial composition organises the page, and for a school that
 * composition can only be a week. A timetable is the artefact every person in
 * a school reads fluently, and laying the page out as one states the product's
 * claim structurally — four programmes, one building, the same Tuesday —
 * instead of asserting it in a sentence.
 *
 * Colour stays green and white. The four programmes are four tints of the one
 * brand green, never four hues, and every cell carries a written label so the
 * distinction does not depend on colour at all.
 *
 * Below the map, per the macrostructure: the four roles as compact evidence,
 * the price, and one CTA. The captures are supporting material here, not the
 * content — that difference is exactly what separates this from Workbench.
 */

const ROLES = [
  {
    key: 'teacher-dashboard',
    who: 'Teacher',
    line: 'Opens on the period about to be taught — room, class, and the work waiting to be marked.',
  },
  {
    key: 'coordinator-cohort',
    who: 'Coordinator',
    line: 'Predicted against target for the whole cohort, with the trend behind each number.',
  },
  {
    key: 'parent-portal',
    who: 'Parent',
    line: 'Their own children, and only the marks a teacher has chosen to release.',
  },
  {
    key: 'admin-operations',
    who: 'Operations',
    line: 'What is broken this morning, ranked — classes without a teacher, attendance drifting.',
  },
];

export default function Landing() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    try {
      setShowConsent(localStorage.getItem('scholr_consent_accepted') === null);
    } catch {
      setShowConsent(true);
    }
  }, []);

  return (
    <PublicShell>
      <WeekMap />

      <section
        aria-labelledby="roles-heading"
        style={{
          padding: 'clamp(2.5rem, 6vw, 4rem) var(--space-md)',
          borderTop: '1px solid var(--rule)',
          background: 'var(--surface)',
        }}
      >
        <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <h2
            id="roles-heading"
            style={{
              margin: '0 0 var(--space-md)', fontSize: '1.05rem', fontWeight: 650,
              letterSpacing: '-0.012em', color: 'var(--ink)',
            }}
          >
            The same week, from four desks.
          </h2>

          <div className="landing-roles">
            {ROLES.map((r) => (
              <figure key={r.key} style={{ margin: 0 }}>
                <img
                  src={SHOTS[r.key]}
                  alt={`${r.who} view in Scholr`}
                  width="1320"
                  height="840"
                  loading="lazy"
                  decoding="async"
                  style={{
                    width: '100%', height: 'auto', display: 'block',
                    border: '1px solid var(--rule)', borderRadius: '4px',
                  }}
                />
                <figcaption style={{ marginTop: '.5rem' }}>
                  <span
                    className="scholr-num"
                    style={{
                      display: 'block', fontFamily: 'var(--font-mono)', fontSize: '.64rem',
                      letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--brand)',
                    }}
                  >
                    {r.who}
                  </span>
                  <span style={{ display: 'block', marginTop: '.2rem', fontSize: '.84rem', lineHeight: 1.5, color: 'var(--muted)' }}>
                    {r.line}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          <p style={{ margin: 'var(--space-lg) 0 0', fontSize: '.9rem', color: 'var(--muted)', maxWidth: '58ch' }}>
            Separation is a row-level security policy in Postgres, not a filter in the
            interface — so it holds for anything that reaches the data.{' '}
            <Link to="/Security" className="scholr-focus" style={{ color: 'var(--brand)' }}>
              How isolation works, and what we have not built yet
            </Link>.
          </p>
        </div>
      </section>

      <PricingTiersSection />

      <section
        style={{
          padding: 'clamp(2.5rem, 6vw, 4rem) var(--space-md)',
          borderTop: '1px solid var(--rule)',
        }}
      >
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 'var(--space-md)' }}>
          <p style={{ margin: 0, fontSize: '1.15rem', letterSpacing: '-0.015em', color: 'var(--ink)', maxWidth: '34ch' }}>
            Bring us your own timetable and we will walk through it.
          </p>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/BookDemo" className="pub-btn pub-btn-primary scholr-focus">Book a demo</Link>
            <Link to="/demo" className="pub-btn pub-btn-line scholr-focus">Open the sandbox</Link>
          </div>
        </div>
      </section>

      <ConsentModal isOpen={showConsent} onClose={() => setShowConsent(false)} />
    </PublicShell>
  );
}
