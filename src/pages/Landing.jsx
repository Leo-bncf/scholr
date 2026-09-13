import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicShell, { Section, CTA, RuledList } from '@/components/public/PublicShell';
import { Bench, StickyCTA } from '@/components/public/Workbench';
import ConsentModal from '@/components/public/ConsentModal';
import PricingTiersSection from '@/components/landing/PricingTiersSection';
import { isAuthenticated } from '@/data/session';

/* eslint-disable react/no-unescaped-entities */

/**
 * Macrostructure 05 · Workbench.
 *
 * The captures are the page. Four screens in sequence — a teacher's morning, a
 * coordinator's cohort, a family's view, a school's operations — each with a
 * short caption and an annotation, separated by gap and frame rather than by
 * rules or coloured bands. The ask arrives as a sticky bar after the third,
 * once there is enough context for it to mean anything.
 *
 * Workbench specifies small, functional headings: the page doesn't shout,
 * because the software is doing the talking. That is the opposite of the three
 * previous attempts, all of which opened on a large marketing headline and
 * then explained the product in prose.
 */

const CURRICULA = [
  ['IB', 'DP, MYP and PYP. The 1–7 scale, predicted grades with their history, and CAS, EE and TOK as modules rather than a folder of uploads.'],
  ['IGCSE / GCSE', 'A*–G and 9–1, tiered entry, and coursework tracked against the syllabus rather than against a generic assignment.'],
  ['A-Level', 'AS and A2 units, UMS-style aggregation, and predicted grades in the shape UCAS wants them.'],
  ['US / AP', 'GPA, letter grades and credits, with reporting that comes out looking like a transcript.'],
];

function Masthead() {
  const signIn = async () => {
    if (await isAuthenticated()) window.location.href = '/AppHome';
    else window.location.href = `/Login?next=${encodeURIComponent('/AppHome')}`;
  };

  return (
    <section className="pub-wash" style={{ paddingTop: '1.5rem', paddingBottom: '3rem' }}>
      <div style={{ maxWidth: '76rem', margin: '0 auto', padding: '0 1.5rem' }}>
        <p className="scholr-label" style={{ margin: 0, color: 'var(--brand)' }}>
          Dublin · school management for international schools
        </p>
        <h1
          className="pub-display"
          style={{ margin: '.9rem 0 0', fontSize: 'clamp(1.7rem, 3.4vw, 2.5rem)', maxWidth: '24ch' }}
        >
          Four curricula. Six roles. One set of records.
        </h1>
        <p className="pub-lede" style={{ margin: '1rem 0 0', maxWidth: '52ch', color: 'var(--muted)' }}>
          Below is the software, screen by screen, as four different people at the same school use it
          on the same Monday morning.
        </p>
        <div style={{ display: 'flex', gap: '.7rem', marginTop: '1.6rem', flexWrap: 'wrap' }}>
          <CTA to="/BookDemo">Book a demo</CTA>
          <button type="button" onClick={signIn} className="pub-btn pub-btn-line pub-btn-lg scholr-focus">
            Sign in
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const [showConsent, setShowConsent] = useState(false);
  const thirdBench = useRef(null);

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
      <Masthead />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(3.5rem, 7vw, 6rem)', paddingBottom: '4rem' }}>
        <Bench
          n="08:30"
          caption="Aoife has four minutes before period one"
          note="So the register, the room and what's on next are the page — not a homepage she has to navigate out of."
          src="/marketing/teacher-dashboard.png"
          alt="A teacher's dashboard: today's timetable with the current period marked, twenty-three pieces of work waiting to be graded, and the term's deadlines."
          annotations={[{ text: 'the current period, marked', top: '30%', right: '1.25rem' }]}
          eager
        />

        <Bench
          n="11:15"
          caption="Cormac is signing his name to 44 predicted grades in October"
          note="Predictions carry the trend behind them, so a number he disagrees with can be argued with rather than just overwritten."
          src="/marketing/coordinator-cohort.png"
          alt="A coordinator's cohort view: predicted mean against target per subject, Extended Essay progress across the year group, and the students who need a conversation."
          annotations={[{ text: 'the trend behind the number', top: '73%', right: '1.25rem' }]}
        />

        <div ref={thirdBench}>
          <Bench
            n="16:40"
            caption="A parent wants to know how her daughter is doing, without ringing the office"
            note="She sees her own two children and nothing else, and only the marks a teacher has chosen to release."
            src="/marketing/parent-portal.png"
            alt="The family portal: attendance for the term, grades released by teachers, and what is due this week for one named child."
            annotations={[{ text: 'released by the teacher, not automatic', top: '76%', right: '1.25rem' }]}
          />
        </div>

        <Bench
          n="17:05"
          caption="And someone has to notice the two classes with no teacher on them"
          note="Attendance, enrolment gaps, billing and the timetable are checked continuously; the page shows what is actually broken."
          src="/marketing/admin-operations.png"
          alt="The operations page: two classes without a teacher flagged critical, attendance at 87% flagged as a warning, and the term's reporting deadline nine days out."
          annotations={[{ text: 'ranked, not an inbox', top: '62%', right: '1.25rem' }]}
        />
      </div>

      <Section
        eyebrow="Curricula"
        title="The framework changes what the software does"
        lede="Not just what it's called. A school picks its curriculum at setup and everything that doesn't apply disappears — an IGCSE school never sees a CAS tab, and an IB school is never asked for a GPA."
        tint
      >
        <RuledList items={CURRICULA} />
      </Section>

      <Section
        eyebrow="What holds"
        title="One school cannot read another"
        lede="Separation is a row-level security policy in Postgres rather than a filter in the interface, so it holds for the API and for exports too — not only for the screens we remembered to guard."
      >
        <p style={{ margin: 0, fontSize: '.95rem' }}>
          <Link to="/Security" className="scholr-focus" style={{ color: 'var(--brand)' }}>
            How isolation works, and what we haven't done yet →
          </Link>
        </p>
      </Section>

      <PricingTiersSection />

      <StickyCTA afterRef={thirdBench} suppressed={showConsent} />
      <ConsentModal isOpen={showConsent} onClose={() => setShowConsent(false)} />
    </PublicShell>
  );
}
