import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicShell from '@/components/public/PublicShell';
import ConsentModal from '@/components/public/ConsentModal';
import Rise from '@/components/public/Rise';
import WeekMap from '@/components/landing/WeekMap';
import PricingTiersSection from '@/components/landing/PricingTiersSection';
import ZoomableShot from '@/components/landing/ZoomableShot';
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
      {/* Background glow now lives in PublicShell — every public page gets
          it, not just this one. See that file for the implementation. */}
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

          {/* Each screenshot is click-to-zoom (ZoomableShot) — a real
              1320x840 capture is illegible at this grid width, and the
              zoom is the only way to actually read one without leaving
              the page. Staggered <Rise from="right"> per card: entrance
              only, same IntersectionObserver/reveal-once mechanism as
              every other Rise on the site — no layout, spacing or design
              changed, just the direction and timing they arrive in. */}
          <div className="landing-roles">
            {ROLES.map((r, i) => (
              <Rise as="figure" from="right" delay={i * 90} key={r.key} style={{ margin: 0 }}>
                <ZoomableShot
                  src={SHOTS[r.key]}
                  alt={`${r.who} view in Scholr`}
                  width="1320"
                  height="840"
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
              </Rise>
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

      {/* Explanation sits BELOW the map, never inside it. The macrostructure is
          a single spatial composition; prose poured into it would turn it back
          into a scroll of sections. */}
      <section
        aria-labelledby="what-it-is-heading"
        style={{ padding: 'clamp(2.5rem, 6vw, 4rem) var(--space-md)', borderTop: '1px solid var(--rule)' }}
      >
        <div style={{ maxWidth: '72rem', margin: '0 auto', display: 'grid', gap: 'var(--space-lg) var(--space-2xl)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(26rem, 100%), 1fr))' }}>
          <Rise from="right">
            <h2
              id="what-it-is-heading"
              style={{ margin: '0 0 var(--space-sm)', fontSize: '1.05rem', fontWeight: 650, letterSpacing: '-0.012em', color: 'var(--ink)' }}
            >
              What the software actually is
            </h2>
            <p style={{ margin: '0 0 var(--space-sm)', fontSize: '.96rem', lineHeight: 1.65, color: 'var(--muted)' }}>
              Scholr is the system a school keeps its records in. Enrolment and class lists, a
              gradebook, attendance, behaviour notes, the timetable as it is taught, messaging, and
              portals for students and families. For IB schools it also carries CAS, the Extended
              Essay and TOK, which are usually the first things to fall back into a spreadsheet.
            </p>
            <p style={{ margin: 0, fontSize: '.96rem', lineHeight: 1.65, color: 'var(--muted)' }}>
              All of it sits in one database, so a mark a teacher enters is the same mark a parent
              eventually sees and the same mark a report is built from. Nothing is re-keyed between
              a gradebook and a report, because there is only one place the number lives.
            </p>
          </Rise>

          <Rise from="right" delay={90}>
            <h2 style={{ margin: '0 0 var(--space-sm)', fontSize: '1.05rem', fontWeight: 650, letterSpacing: '-0.012em', color: 'var(--ink)' }}>
              What a second programme costs you elsewhere
            </h2>
            <p style={{ margin: '0 0 var(--space-sm)', fontSize: '.96rem', lineHeight: 1.65, color: 'var(--muted)' }}>
              Not the timetable — that is the easy part. It is everything downstream of a mark. A
              Diploma class is marked 1&ndash;7 against published criteria, MYP on four criteria
              A&ndash;D, IGCSE in letters, A&#8209;Level in A*&ndash;E, a US class in a percentage that
              rolls into a GPA. Reports differ, release rules differ, and the vocabulary differs.
            </p>
            <p style={{ margin: 0, fontSize: '.96rem', lineHeight: 1.65, color: 'var(--muted)' }}>
              Software that offers &ldquo;multi-curriculum support&rdquo; usually means one gradebook
              with a dropdown on top. Here a school declares its programmes once and the software
              stores each mark in the shape its programme expects — which is why the reports come out
              right in July rather than needing a spreadsheet to fix.
            </p>
          </Rise>

          <Rise from="right" delay={180}>
            <h2 style={{ margin: '0 0 var(--space-sm)', fontSize: '1.05rem', fontWeight: 650, letterSpacing: '-0.012em', color: 'var(--ink)' }}>
              What it does not do yet
            </h2>
            <p style={{ margin: '0 0 var(--space-sm)', fontSize: '.96rem', lineHeight: 1.65, color: 'var(--muted)' }}>
              PDF and Excel export are not finished. The Google Drive and Docs integrations are not
              connected. Report generation exists as a screen, not as a document you can hand to a
              parent. Card payment is not switched on — schools are invoiced, with a purchase-order
              reference and thirty days.
            </p>
            <p style={{ margin: 0, fontSize: '.96rem', lineHeight: 1.65, color: 'var(--muted)' }}>
              Scholr holds and displays a timetable but does not build one; that is{' '}
              <Link to="/Schedual" className="scholr-focus" style={{ color: 'var(--brand)' }}>Schedual</Link>,
              our other product, and the automatic sync between them is not live. We would rather you
              found this here than in week three.
            </p>
          </Rise>
        </div>
      </section>

      <PricingTiersSection />

      <section
        style={{
          padding: 'clamp(2.5rem, 6vw, 4rem) var(--space-md)',
          borderTop: '1px solid var(--rule)',
        }}
      >
        <Rise from="right" style={{ maxWidth: '72rem', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 'var(--space-md)' }}>
          <p style={{ margin: 0, fontSize: '1.15rem', letterSpacing: '-0.015em', color: 'var(--ink)', maxWidth: '34ch' }}>
            Bring us your own timetable and we will walk through it.
          </p>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '.7rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <Link to="/BookDemo" className="pub-btn pub-btn-primary scholr-focus">Book a demo</Link>
            <Link to="/demo" className="pub-btn pub-btn-line scholr-focus">Open the sandbox</Link>
          </div>
        </Rise>
      </section>

      <ConsentModal isOpen={showConsent} onClose={() => setShowConsent(false)} />
    </PublicShell>
  );
}
