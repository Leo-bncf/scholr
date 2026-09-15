import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicShell from '@/components/public/PublicShell';
import ConsentModal from '@/components/public/ConsentModal';
import PricingTiersSection from '@/components/landing/PricingTiersSection';
import SHOTS from '@/marketing/manifest.json';

/**
 * Hallmark · macrostructure: Long Document · genre: modern-minimal
 *
 * Every previous Hallmark output in this project — the landing, the rest of
 * the public site, the signed-in chrome — was Workbench: framed product
 * captures as the primary content, a guided tour of the app. Three entries in
 * .hallmark/log.json, three times the same shape. The diversification rule
 * exists precisely because reusing a structural fingerprint is what makes a
 * site feel generated, and no amount of recolouring reaches it.
 *
 * So this is a memo. Continuous prose at a reading measure, section heads
 * emerging from the flow rather than announcing themselves, negative space as
 * the only divider, captures sized to the text and never full-bleed, and no
 * reveal-on-scroll — the page is simply there when you arrive.
 *
 * The known cost, named in the macrostructure's own notes: Long Document
 * hides calls to action. Mitigated, not solved — the masthead keeps its
 * button, the price is a real section rather than a link, and the close is a
 * typographic ask. If bookings fall, this is the first thing to look at.
 */

/** A capture, sized to the measure. Never full-bleed — that is the Workbench move. */
function Plate({ src, alt, caption }) {
  return (
    <figure style={{ margin: 'var(--space-lg) 0' }}>
      <img
        src={src}
        alt={alt}
        width="1320"
        height="840"
        loading="lazy"
        decoding="async"
        style={{
          width: '100%', height: 'auto', display: 'block',
          border: '1px solid var(--rule)', borderRadius: '4px',
        }}
      />
      <figcaption
        style={{
          marginTop: '.55rem', fontSize: '.8rem', lineHeight: 1.5,
          color: 'var(--muted)', fontStyle: 'italic',
        }}
      >
        {caption}
      </figcaption>
    </figure>
  );
}

/** A heading that emerges from the prose rather than interrupting it. */
function Head({ children }) {
  return (
    <h2
      style={{
        margin: 'var(--space-xl) 0 var(--space-2xs)',
        fontSize: '1.02rem', fontWeight: 650, letterSpacing: '-0.01em',
        color: 'var(--ink)',
      }}
    >
      {children}
    </h2>
  );
}

export default function Landing() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    try {
      setShowConsent(localStorage.getItem('scholr_consent_accepted') === null);
    } catch {
      setShowConsent(true);
    }
  }, []);

  const link = { color: 'var(--brand)', textUnderlineOffset: '2px' };
  const para = { margin: '0 0 var(--space-md)' };

  return (
    <PublicShell>
      <article
        style={{
          maxWidth: '63ch',
          margin: '0 auto',
          padding: 'clamp(3rem, 8vw, 5.5rem) var(--space-md) var(--space-2xl)',
          fontSize: '1.02rem',
          lineHeight: 1.68,
          color: 'var(--body)',
        }}
      >
        <p
          className="scholr-num"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.1em',
            textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 var(--space-md)',
          }}
        >
          Scholr — a note to schools · Dublin, September 2026
        </p>

        <p style={{ margin: '0 0 var(--space-md)', fontSize: '1.22rem', lineHeight: 1.5, color: 'var(--ink)' }}>
          08:26 on a Tuesday. A teacher has four minutes before Theory of Knowledge,
          and needs to know which room, who was absent on Friday, and whether the
          essay drafts came in. Most school software answers that in four clicks.
        </p>

        <p style={para}>
          We are building Scholr because the schools we know teach more than one
          curriculum and their software does not believe them. A school running IB
          Diploma alongside IGCSE, or A&#8209;Level alongside a US high-school diploma,
          ends up with two systems — or one system and a lot of spreadsheets, and a
          registrar who reconciles them by hand every term.
        </p>

        <Head>What a second curriculum actually breaks</Head>

        <p style={para}>
          Not the timetable. The timetable is the easy part. What breaks is everything
          downstream of a mark. An IB gradebook expects levels 1&ndash;7 against
          published criteria; IGCSE expects letters; a US transcript expects a GPA and
          credit hours. The reports look different, the parent sees different things at
          different times, and the rules about who may see a draft grade are not the
          same in either system.
        </p>

        <p style={para}>
          Software that offers &ldquo;multi-curriculum support&rdquo; usually means one
          gradebook with a dropdown on top. That holds until a coordinator has to
          produce a predicted-grade report for one cohort and a progress report for
          another in the same week.
        </p>

        <Head>What we built instead</Head>

        <p style={para}>
          One set of records. A school declares its programmes once, and the grading
          scales, the reporting shape and the vocabulary follow from that — including
          the parts that should disappear. An IGCSE school never sees a CAS tab. An IB
          school is never asked for a GPA.
        </p>

        <Plate
          src={SHOTS['teacher-dashboard']}
          alt="A teacher's dashboard: today's timetable with the current period marked, twenty-three pieces of work waiting to be graded, and the term's deadlines."
          caption="A teacher's first screen is the period they are about to teach — the room, the class, the work waiting. Not a homepage."
        />

        <p style={para}>
          A coordinator signing off predictions for a whole cohort sees the history
          behind each number and its target, so a prediction they disagree with can be
          questioned rather than simply overwritten. Extended Essay progress is tracked
          per student rather than in a shared spreadsheet somebody forgot to save.
        </p>

        <Plate
          src={SHOTS['coordinator-cohort']}
          alt="A coordinator's cohort view: predicted mean against target per subject, Extended Essay progress across the year group, and the students who need a conversation."
          caption="Predicted against target, per subject, with the students who need a conversation named rather than buried in an average."
        />

        <Head>Who can see what</Head>

        <p style={para}>
          This is the question a head of school asks second, and the one we would
          rather answer precisely. Separation between schools is a row-level security
          policy in Postgres, not a filter in the interface — so it holds for anything
          that reaches the data, not only for the screens we remembered to guard. A
          teacher and a student running the identical query get different rows, because
          the database decides.
        </p>

        <p style={para}>
          Parents are linked to specific children and see nothing outside that link.
          Marks appear when a teacher publishes them, not when they are entered. Notes
          marked staff-only never leave the staff room. There is a fuller account,
          including the parts we have not finished, on the{' '}
          <Link to="/Security" className="scholr-focus" style={link}>security page</Link>.
        </p>

        <Head>What we have not built</Head>

        <p style={para}>
          Putting this on a homepage is unusual, and we would rather you found it here
          than in week three. PDF and Excel export are not finished. The Google Drive
          and Docs integrations are not connected. Report generation exists as a
          screen, not as a document you can hand to a parent. Card payment is not
          switched on — we invoice.
        </p>

        <p style={para}>
          Everything else on this page you can go and use right now, without talking to
          anyone, in the{' '}
          <Link to="/demo" className="scholr-focus" style={link}>demo sandbox</Link> —
          real screens, a sample school, no sign-up.
        </p>

        <Head>What it costs</Head>

        <p style={para}>
          Published, which in this market is unusual enough to be worth stating: iSAMS,
          Veracross and ManageBac all answer this question with &ldquo;contact
          sales&rdquo;. Ours is €22 per student per year for the first two hundred, €17
          for the next four hundred, €13 beyond that, with a minimum of €2,400 a year —
          each rate applying only to the students inside its band, so the bill never
          falls when you enrol one more child. The calculator below gives your exact
          number.
        </p>

        <Head>If this sounds like your school</Head>

        <p style={{ margin: 0 }}>
          We would rather show you than write at you.{' '}
          <Link to="/BookDemo" className="scholr-focus" style={{ ...link, fontWeight: 600 }}>
            Book a demo
          </Link>{' '}
          and we will walk through your own programmes, or write to{' '}
          <a href="mailto:contact@scholr.pro" className="scholr-focus" style={link}>contact@scholr.pro</a>{' '}
          and ask the awkward question first. We are a small company in Dublin; you will
          get one of us, not a form.
        </p>
      </article>

      <PricingTiersSection />

      <ConsentModal isOpen={showConsent} onClose={() => setShowConsent(false)} />
    </PublicShell>
  );
}
