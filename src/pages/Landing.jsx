import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicShell, { Section, CTA, Claim } from '@/components/public/PublicShell';
import ConsentModal from '@/components/public/ConsentModal';
import WeekGrid from '@/components/public/WeekGrid';
import PricingTiersSection from '@/components/landing/PricingTiersSection';
import { isAuthenticated } from '@/data/session';
import { ArrowRight } from 'lucide-react';

/**
 * The landing page.
 *
 * The previous version was broken in production: every section below the hero
 * set `text-white`, but the animated background only painted the top of the
 * page, so roughly five thousand pixels of copy rendered white on white and
 * was simply invisible. It also opened with a 145vh parallax of the word
 * "Scholr" in 18rem type before saying anything about the product.
 *
 * What replaced it: the artefact this audience actually reads — a timetable —
 * and claims that carry their evidence with them. No animated background, no
 * parallax, no marquee. A head of school evaluating where to put their entire
 * academic record is not persuaded by motion.
 */

function Hero() {
  const signIn = async () => {
    if (await isAuthenticated()) {
      window.location.href = '/AppHome';
    } else {
      window.location.href = `/Login?next=${encodeURIComponent('/AppHome')}`;
    }
  };

  return (
    <section className="pt-14 pb-12 md:pt-20 md:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid gap-10 lg:gap-14 items-center" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(20rem, 100%), 1fr))' }}>
          <div>
            <p className="scholr-label m-0">For international schools</p>
            <h1 className="scholr-h1 m-0 mt-3 text-4xl md:text-5xl lg:text-[3.4rem]" style={{ lineHeight: 1.06 }}>
              One system for a school that runs more than one curriculum.
            </h1>
            <p className="m-0 mt-5 text-lg leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '38ch' }}>
              Timetables, gradebooks, attendance, reports and the parent portal — with IB, IGCSE,
              A-Level and US frameworks each behaving the way they actually work.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <CTA to="/BookDemo">Book a demo <ArrowRight className="w-4 h-4" /></CTA>
              <button
                type="button"
                onClick={signIn}
                className="scholr-focus inline-flex items-center gap-2 text-sm font-medium"
                style={{
                  background: 'transparent',
                  color: 'var(--body)',
                  border: '1px solid var(--rule)',
                  padding: '0.6rem 1.05rem',
                  borderRadius: 'var(--radius-control)',
                  cursor: 'pointer',
                }}
              >
                Sign in
              </button>
            </div>

            <p className="m-0 mt-5 text-sm" style={{ color: 'var(--faint)' }}>
              Priced per student, per year. No setup fee.
            </p>
          </div>

          <WeekGrid />
        </div>
      </div>
    </section>
  );
}

/**
 * The curricula, stated plainly.
 *
 * This is the single claim the whole product rests on, so it gets the page's
 * one dark band rather than a row of logos we don't have permission to use.
 */
function Curricula() {
  const rows = [
    ['IB', 'DP, MYP and PYP. 1–7 grading, predicted grades, and CAS, EE and TOK as first-class modules.'],
    ['IGCSE / GCSE', 'A*–G and 9–1 scales, tiered entry, and coursework tracked against the syllabus.'],
    ['A-Level', 'AS and A2 units, UMS-style aggregation, and predicted grades for UCAS.'],
    ['US / AP', 'GPA, letter grades and credits, with transcript-shaped reporting.'],
  ];

  return (
    <section className="py-14 md:py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="scholr-band px-5 py-6 md:px-8 md:py-9">
          <p className="scholr-label m-0" style={{ color: 'var(--brand)' }}>Curricula</p>
          <h2 className="scholr-h1 m-0 mt-2 text-2xl md:text-3xl" style={{ maxWidth: '24ch' }}>
            The framework changes what the software does, not just what it's called.
          </h2>
          <p className="m-0 mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '62ch' }}>
            A school picks its curriculum at setup. Tools that don't apply are hidden rather than
            greyed out — an IGCSE school never sees a CAS tab, and an IB school never sees a GPA.
          </p>

          <div className="mt-7">
            {rows.map(([name, desc]) => (
              <div
                key={name}
                className="scholr-deflist py-3.5"
                style={{ borderTop: '1px solid var(--rule)' }}
              >
                <span
                  className="text-sm font-medium"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}
                >
                  {name}
                </span>
                <span className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** What each role opens the app to do. Six roles, one line each. */
function Roles() {
  const roles = [
    ['Students', 'Today’s timetable, what’s due, and the grades their teachers have released.'],
    ['Teachers', 'One workspace per class: stream, assignments, gradebook, register.'],
    ['Parents', 'Their own children only — grades, attendance, and a line to the teacher.'],
    ['Coordinators', 'Cohort-level oversight, predicted grades, and the IB Core.'],
    ['Admins', 'Users, terms, policies, timetable, billing, audit log.'],
    ['Heads', 'The school in one page: attendance, missing work, and what needs a decision.'],
  ];

  return (
    <Section
      eyebrow="Roles"
      title="Six people, six different pages"
      lead="Nobody gets a general-purpose dashboard with everything on it. Each role gets the page that answers the question they opened the laptop to answer."
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(17rem, 100%), 1fr))', columnGap: '2.5rem' }}
      >
        {roles.map(([name, line]) => (
          <div key={name} className="py-4" style={{ borderTop: '1px solid var(--rule)' }}>
            <h3 className="m-0 text-base font-medium" style={{ color: 'var(--ink)' }}>{name}</h3>
            <p className="m-0 mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{line}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Claims that carry their evidence. */
function Proof() {
  return (
    <Section
      eyebrow="How it holds up"
      title="The parts a procurement committee asks about"
      lead="Every line here is something you can check, not a badge."
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(20rem, 100%), 1fr))', columnGap: '2.5rem' }}
      >
        <Claim
          title="One school cannot read another"
          proof="Enforced in Postgres row-level security"
          >
          Separation is a database policy, not a filter in the interface. A user's own token decides
          which rows exist for them, so there is no request they can craft that returns another
          school's data.
        </Claim>
        <Claim
          title="A grade is invisible until a teacher publishes it"
          proof="Checked in the policy, not the screen"
        >
          Students and families see a mark when the teacher releases it, and pastoral notes marked
          staff-only never reach either, whatever the release flags say.
        </Claim>
        <Claim
          title="Parents see their own children"
          proof="Linked accounts, verified per request"
        >
          A parent account is tied to specific students. Another family's child is not hidden from
          the page — it is not in the response.
        </Claim>
        <Claim
          title="Sensitive actions leave a trail"
          proof="Account, role and grade changes are logged"
        >
          Who changed what, and when. It is the first thing a school asks for after an incident and
          the last thing anyone thinks to build.
        </Claim>
      </div>

      <p className="m-0 mt-8 text-sm">
        <Link to="/Security" className="scholr-focus" style={{ color: 'var(--brand)' }}>
          Read how isolation actually works →
        </Link>
      </p>
    </Section>
  );
}

function Close() {
  return (
    <Section>
      <div className="scholr-panel px-6 py-10 md:px-10 md:py-12 text-center">
        <h2 className="scholr-h1 m-0 text-2xl md:text-3xl" style={{ maxWidth: '20ch', marginInline: 'auto' }}>
          See it against your own timetable
        </h2>
        <p className="m-0 mt-3 text-base" style={{ color: 'var(--muted)', maxWidth: '46ch', marginInline: 'auto' }}>
          Thirty minutes, your curriculum, your questions. We'll show you the parts that matter to
          your school and skip the rest.
        </p>
        <div className="mt-7 flex justify-center">
          <CTA to="/BookDemo">Book a demo <ArrowRight className="w-4 h-4" /></CTA>
        </div>
      </div>
    </Section>
  );
}

export default function Landing() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Shown only until a choice is recorded. Reading localStorage can throw in
    // a locked-down browser, so a failure means "ask again" rather than
    // "silently assume consent".
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
      <Curricula />
      <Roles />
      <Proof />
      <PricingTiersSection />
      <Close />
      <ConsentModal isOpen={showConsent} onClose={() => setShowConsent(false)} />
    </PublicShell>
  );
}
