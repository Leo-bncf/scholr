import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicShell, { Section, CTA, RuledList } from '@/components/public/PublicShell';
import ConsentModal from '@/components/public/ConsentModal';
import PricingTiersSection from '@/components/landing/PricingTiersSection';
import { isAuthenticated } from '@/data/session';
import { ArrowRight } from 'lucide-react';

/**
 * The landing page.
 *
 * The version before this was broken in production — every section below the
 * hero set `text-white` over a background that only painted the top, so five
 * thousand pixels of copy rendered white on white.
 *
 * The version after that was legible and looked machine-made: everything
 * centred, three cards with circular avatar initials, a strip of round numbers
 * that were a pattern rather than a fact, and one structural idea (a rounded
 * card with a soft shadow) repeated down the page. This one is left-aligned,
 * asymmetric, and its sections are built out of rules and indents instead.
 *
 * There are no testimonials, because there are no customers to quote yet.
 */

function Hero() {
  const signIn = async () => {
    if (await isAuthenticated()) window.location.href = '/AppHome';
    else window.location.href = `/Login?next=${encodeURIComponent('/AppHome')}`;
  };

  return (
    <section className="pub-wash pub-ruled" style={{ overflow: 'hidden', paddingBottom: '3.5rem' }}>
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '2.5rem 1.5rem 0' }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 30rem) minmax(0, 1fr)', gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <p className="scholr-label" style={{ margin: 0, color: 'var(--brand)' }}>
              Made in Ireland · for international schools
            </p>
            <h1 className="pub-display" style={{ margin: '1rem 0 0', fontSize: 'clamp(2.3rem, 5.4vw, 3.6rem)' }}>
              Every curriculum your school runs, in one place.
            </h1>
            <p className="pub-lede" style={{ margin: '1.1rem 0 0', maxWidth: '40ch' }}>
              IB, IGCSE, A-Level and US frameworks, each behaving the way it actually works — over one
              set of records. Timetables, gradebooks, attendance, reports, and a portal families
              understand.
            </p>
            <div style={{ display: 'flex', gap: '.7rem', marginTop: '1.8rem', flexWrap: 'wrap' }}>
              <CTA to="/BookDemo">Book a demo <ArrowRight className="w-4 h-4" /></CTA>
              <button type="button" onClick={signIn} className="pub-btn pub-btn-line pub-btn-lg scholr-focus">
                Sign in
              </button>
            </div>
            <p className="scholr-label" style={{ margin: '1.2rem 0 0', color: 'var(--faint)' }}>
              Thirty minutes · your timetable · no slide deck
            </p>
          </div>

          {/* The product, oversized and running off the right edge. A screenshot
              sitting neatly inside its column looks like a stock photo of
              software; one that overflows looks like a window onto it. */}
          <div className="hero-shot" style={{ position: 'relative', minWidth: 0 }}>
            <img
              src="/marketing/teacher-dashboard.png"
              width="1320" height="840"
              alt="A teacher's dashboard in Scholr: today's timetable with the current period marked, work waiting to be graded, and what is coming up."
              className="pub-shot"
              style={{ width: 'min(62rem, 148%)', maxWidth: 'none' }}
              loading="eager"
            />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 62rem) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-shot img { width: 100% !important; }
        }
      `}</style>
    </section>
  );
}

const CURRICULA = [
  ['IB', 'DP, MYP and PYP. The 1–7 scale, predicted grades with their history, and CAS, EE and TOK as modules rather than a folder of uploads.'],
  ['IGCSE / GCSE', 'A*–G and 9–1, tiered entry, and coursework tracked against the syllabus rather than against a generic assignment.'],
  ['A-Level', 'AS and A2 units, UMS-style aggregation, and predicted grades in the shape UCAS wants them.'],
  ['US / AP', 'GPA, letter grades and credits, with reporting that comes out looking like a transcript.'],
];

const ROLES = [
  ['Teachers', 'The class in front of them. Register, stream, gradebook, and what is on next — four minutes between periods is the whole design brief.'],
  ['Students', 'Today, what is due, and the marks their teachers have actually released. Nothing they are not meant to see yet.'],
  ['Parents', 'Their own children only, and a line to the teacher that follows the school’s messaging policy.'],
  ['Coordinators', 'The cohort: predicted grades with the trend behind them, IB Core progress, and who is behind on what.'],
  ['Admins', 'Users, terms, policies, timetable, billing, and an audit log of everything that mattered.'],
  ['Heads', 'The school on one page — attendance, missing work, and the handful of things that need a decision.'],
];

function Proof() {
  return (
    <Section
      eyebrow="How it holds up"
      title="The parts a procurement committee asks about"
      lede="Every line here is something you can check rather than a badge we bought."
    >
      <div className="proof-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(21rem, 100%), 1fr))', gap: '0 3rem' }}>
        {[
          ['One school cannot read another', 'Separation is a row-level security policy in Postgres, not a filter in the interface. There is no request a signed-in user can craft that returns another school’s rows.', 'Enforced per query'],
          ['A grade is invisible until released', 'Marks stay with the teacher until published, separately to students and to families. Pastoral notes marked staff-only override both and never leave the staff room.', 'Two flags, checked in the policy'],
          ['Access follows the class', 'A teacher who takes over a class sees its history; one who leaves it stops seeing anything, including work they graded themselves.', 'Not authorship'],
          ['Isolation is covered by tests', 'The suite asserts the negative cases — that a classmate cannot read another student’s grades, and that a teacher outside a class sees nothing.', 'Failures, not just successes'],
        ].map(([h, body, proof]) => (
          <div key={h} style={{ padding: '1.2rem 0', borderTop: '1px solid var(--rule)' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.02rem', letterSpacing: '-0.02em', color: 'var(--ink)' }}>{h}</h3>
            <p style={{ margin: '.55rem 0 0', fontSize: '.94rem', lineHeight: 1.55, color: 'var(--muted)', maxWidth: '46ch' }}>{body}</p>
            <p className="scholr-label" style={{ margin: '.7rem 0 0', color: 'var(--brand)' }}>{proof}</p>
          </div>
        ))}
      </div>
      <p style={{ margin: '1.8rem 0 0', fontSize: '.95rem' }}>
        <Link to="/Security" className="scholr-focus" style={{ color: 'var(--brand)' }}>
          How isolation actually works →
        </Link>
      </p>
    </Section>
  );
}

function Close() {
  return (
    <Section>
      <div
        className="pub-ruled"
        style={{
          borderRadius: 'var(--radius-large)',
          border: '1px solid var(--rule)',
          background: 'radial-gradient(70% 140% at 8% -30%, var(--wash) 0%, transparent 70%), var(--surface)',
          padding: '2.6rem 2rem',
          boxShadow: 'var(--lift-sm)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 0 }}>
            <p className="scholr-label" style={{ margin: 0, color: 'var(--brand)' }}>Next</p>
            <h2 className="pub-display" style={{ margin: '.6rem 0 0', fontSize: 'clamp(1.6rem, 3.4vw, 2.2rem)', maxWidth: '16ch' }}>
              Bring a timetable and a mark scheme
            </h2>
            <p className="pub-lede" style={{ margin: '.8rem 0 0', maxWidth: '42ch', color: 'var(--muted)' }}>
              We’ll show you the parts that apply to your curriculum and skip everything else. If it
              isn’t a fit we’ll say so.
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '.7rem', flexWrap: 'wrap' }}>
            <CTA to="/BookDemo">Book a demo <ArrowRight className="w-4 h-4" /></CTA>
            <CTA to="/Contact" tone="line">Email us instead</CTA>
          </div>
        </div>
      </div>
    </Section>
  );
}

export default function Landing() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    try {
      // Either answer counts as answered — declining used to store nothing, so
      // the notice came back on every visit.
      setShowConsent(localStorage.getItem('scholr_consent_accepted') === null);
    } catch {
      setShowConsent(true);
    }
  }, []);

  return (
    <PublicShell>
      <Hero />

      <Section
        eyebrow="Curricula"
        title="The framework changes what the software does, not just what it’s called"
        lede="A school picks its curriculum at setup and everything that doesn’t apply disappears — an IGCSE school never sees a CAS tab, and an IB school is never asked for a GPA."
        tint
      >
        <RuledList items={CURRICULA} />
      </Section>

      <Section
        eyebrow="Roles"
        title="Six people who never open the same page"
        lede="A teacher between periods and a head of school on a Sunday night are not looking for the same thing, so nobody gets a general-purpose dashboard with everything on it."
      >
        <RuledList items={ROLES} termWidth="9rem" />
      </Section>

      <Proof />
      <PricingTiersSection />
      <Close />

      <ConsentModal isOpen={showConsent} onClose={() => setShowConsent(false)} />
    </PublicShell>
  );
}
