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
          Dublin · school management software
        </p>
        <h1
          className="pub-display"
          style={{ margin: 'var(--space-xs) 0 0', fontSize: 'var(--text-3xl)', maxWidth: '22ch' }}
        >
          Your school teaches more than one curriculum. Your software should know that.
        </h1>
        <p className="pub-lede" style={{ margin: 'var(--space-sm) 0 0', maxWidth: '54ch', color: 'var(--muted)' }}>
          Scholr runs IB, IGCSE, A-Level and US programmes side by side in one school, on one set of
          records — different grading scales, different reporting, different rules about who sees
          what. Here is what that looks like on screen.
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
          n="Teacher"
          caption="The period you are about to teach, not a homepage"
          note="A teacher gets a few minutes between lessons. The dashboard opens on today's timetable with the current period marked, the room, and the work waiting to be marked — no navigating to find it."
          src="/marketing/teacher-dashboard.png"
          alt="A teacher's dashboard: today's timetable with the current period marked, twenty-three pieces of work waiting to be graded, and the term's deadlines."
          annotations={[{ text: 'the current period, marked', top: '30%', right: '1.25rem' }]}
          eager
        />

        <Bench
          n="Coordinator"
          caption="Predicted grades with the trend behind them"
          note="A coordinator signs off predictions for the whole cohort. Each one shows its history and its target, so a number you disagree with can be questioned rather than simply overwritten — and Extended Essay progress is tracked per student, not per spreadsheet."
          src="/marketing/coordinator-cohort.png"
          alt="A coordinator's cohort view: predicted mean against target per subject, Extended Essay progress across the year group, and the students who need a conversation."
          annotations={[{ text: 'the trend behind the number', top: '73%', right: '1.25rem' }]}
          layout="left"
        />

        <div ref={thirdBench}>
          <Bench
            n="Family"
            caption="A parent's own children, and only what has been released"
            note="Parents are linked to specific students and see nothing outside that link. Marks appear when the teacher publishes them; attendance visibility is a school-level setting; notes marked staff-only never leave the staff room."
            src="/marketing/parent-portal.png"
            alt="The family portal: attendance for the term, grades released by teachers, and what is due this week for one named child."
            annotations={[{ text: 'released by the teacher, not automatic', top: '76%', right: '1.25rem' }]}
            layout="right"
          />
        </div>

        <Bench
          n="Operations"
          caption="What is broken this morning, in order"
          note="Classes with no teacher assigned, students enrolled in nothing, attendance drifting, a reporting deadline approaching. The page is a ranked list of things that need a decision, not a wall of charts."
          src="/marketing/admin-operations.png"
          alt="The operations page: two classes without a teacher flagged critical, attendance at 87% flagged as a warning, and the term's reporting deadline nine days out."
          annotations={[{ text: 'ranked, not an inbox', top: '62%', right: '1.25rem' }]}
        />
      </div>

      <Section
        eyebrow="Curricula"
        title="Four frameworks, each behaving the way it actually works"
        lede="Not four labels on the same gradebook. A school sets its programmes once; the grading scales, the reporting shape and the vocabulary follow, and anything that doesn't apply is hidden rather than greyed out. An IGCSE school never sees a CAS tab; an IB school is never asked for a GPA."
        tint
      >
        <RuledList items={CURRICULA} />
      </Section>

      <Section
        eyebrow="What holds"
        title="One school cannot read another"
        lede="Separation is a row-level security policy in the database, not a filter in the interface — so it holds for anything that reaches the data, not only for the screens we remembered to guard. The same page lists what we have not built yet, because you are going to ask."
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
