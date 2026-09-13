import React from 'react';
import { Link } from 'react-router-dom';
import PublicShell, { Section, CTA } from '@/components/public/PublicShell';
import StatusChip from '@/components/app/StatusChip';
import Meter from '@/components/app/Meter';
import { ArrowRight } from 'lucide-react';

/**
 * Features.
 *
 * Every feature used to sit beside a 4:3 grey rectangle containing a faded
 * icon — placeholder art, shipped. An empty box next to a claim is worse than
 * no box: it reads as a product that has nothing to show.
 *
 * Until there are real screenshots, each feature shows the SHAPE of its data
 * instead, built from the same components the app uses. It's honest, it can't
 * go stale, and for this audience a real gradebook row is more convincing than
 * a hero shot anyway.
 *
 * The old headline was "Built for IB, not bolted on" while the landing page
 * sold four curricula. One of those was wrong; the product supports four.
 */

function Frame({ label, children }) {
  return (
    <div className="scholr-panel overflow-hidden">
      <p
        className="scholr-label m-0 px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--rule-soft)' }}
      >
        {label}
      </p>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Row({ name, detail, children }) {
  return (
    <div className="flex items-baseline gap-3 py-2.5" style={{ borderTop: '1px solid var(--rule-soft)' }}>
      <span className="text-sm min-w-0" style={{ color: 'var(--ink)' }}>{name}</span>
      {detail && <span className="text-xs shrink-0" style={{ color: 'var(--muted)' }}>{detail}</span>}
      <span className="ml-auto shrink-0 flex items-center gap-2">{children}</span>
    </div>
  );
}

const Bar = ({ pct }) => (
  <span style={{ display: 'block', width: '5.5rem' }}>
    <Meter value={pct} height={4} />
  </span>
);

const Mono = ({ children }) => (
  <span className="text-sm scholr-num" style={{ fontFamily: 'var(--font-mono)', color: 'var(--body)' }}>
    {children}
  </span>
);

const FEATURES = [
  {
    title: 'A page per role',
    body: 'Nobody gets a general-purpose dashboard. A teacher opens theirs between periods and sees what is on now; a head opens theirs and sees what needs a decision.',
    bullets: [
      'Students: today, what is due, what has been released',
      'Teachers: classes, submissions to mark, the register',
      'Parents: their own children, and a line to the teacher',
      'Coordinators: cohorts, predicted grades, IB Core',
      'Admins: users, terms, policies, billing, audit log',
    ],
    demo: (
      <Frame label="Teacher · today">
        <Row name="Mathematics HL — Y12" detail="08:30–09:20 · B204"><Mono>done</Mono></Row>
        <Row name="Theory of Knowledge" detail="09:30–10:20 · A101"><StatusChip tone="info">Now</StatusChip></Row>
        <Row name="Mathematics SL — Y11" detail="11:00–11:50 · B204"><Mono>next</Mono></Row>
      </Frame>
    ),
  },
  {
    title: 'Assignments, end to end',
    body: 'Set the task with its criteria, watch submissions arrive, mark against the rubric, release when you are ready. Late and missing are states the system knows about, not something a teacher tracks in a spreadsheet.',
    bullets: [
      'Criteria and rubrics attached to the assignment, not bolted on at marking',
      'File upload or link submission',
      'On time, late and missing tracked per student',
      'Inline feedback against each criterion',
      'Late policy configured per school',
    ],
    demo: (
      <Frame label="Paper 2 mock · submissions">
        <Row name="Amara Osei" detail="submitted 17:42"><StatusChip tone="good">On time</StatusChip></Row>
        <Row name="Tomás Rivera" detail="submitted 09:15"><StatusChip tone="warn">Late</StatusChip></Row>
        <Row name="Yuki Tanaka"><StatusChip tone="crit">Missing</StatusChip></Row>
      </Frame>
    ),
  },
  {
    title: 'A gradebook that speaks your framework',
    body: 'IB 1–7, A*–G, 9–1, GPA and percentages are different systems, not different labels on the same number. Predicted grades carry their history so a coordinator can see the trend behind the figure.',
    bullets: [
      'Grading scales per curriculum, chosen at setup',
      'Criterion-level marks that roll up to the subject grade',
      'Predicted grades with term-over-term history',
      'Release controls: what students see, what families see',
      'Term reports shaped to your framework',
    ],
    demo: (
      <Frame label="Amara Osei · DP1 predicted">
        <Row name="Mathematics HL" detail="was 5"><Mono>6 / 7</Mono></Row>
        <Row name="Biology HL" detail="was 6"><Mono>6 / 7</Mono></Row>
        <Row name="English A SL" detail="was 5"><Mono>5 / 7</Mono></Row>
      </Frame>
    ),
  },
  {
    title: 'Families see the right things',
    body: 'A parent portal is only useful if the school controls it. Grades appear when a teacher releases them, attendance visibility is a school-level setting, and pastoral notes marked staff-only never leave the staff room.',
    bullets: [
      'Parents are linked to specific students, and see only those',
      'Per-grade release to students and to families, separately',
      'Attendance visibility set once, per school',
      'Staff-only behaviour notes stay staff-only',
      'Messaging with teachers, within school policy',
    ],
    demo: (
      <Frame label="Attendance · this term">
        <div className="flex items-baseline gap-3 mb-1.5">
          <span className="text-sm" style={{ color: 'var(--body)' }}>Present</span>
          <span className="ml-auto"><Mono>94%</Mono></span>
        </div>
        <Meter value={94} tone="good" height={4} />
        <div className="flex items-baseline gap-3 mb-1.5 mt-4">
          <span className="text-sm" style={{ color: 'var(--body)' }}>Authorised absence</span>
          <span className="ml-auto"><Mono>4%</Mono></span>
        </div>
        <Meter value={4} tone="mute" height={4} />
      </Frame>
    ),
  },
  {
    title: 'The IB Core, properly',
    body: 'CAS, the Extended Essay and TOK have their own deadlines, their own supervisors and their own approval steps. They are modules here, not a folder of uploads.',
    bullets: [
      'CAS experiences with strand mapping and reflections',
      'EE milestones from proposal through viva',
      'TOK deadlines, drafts and coordinator sign-off',
      'Supervisor assignment and progress per student',
      'Hidden entirely for schools that do not run the DP',
    ],
    demo: (
      <Frame label="Extended Essay · DP2 cohort">
        {/* The meter needs a width of its own: inside Row it sits in a shrink-0
            flex cell, and a block element with no intrinsic width collapses to
            nothing there. */}
        <Row name="Proposal approved" detail="41 of 44"><Bar pct={93} /></Row>
        <Row name="First draft in" detail="29 of 44"><Bar pct={66} /></Row>
        <Row name="Viva booked" detail="12 of 44"><Bar pct={27} /></Row>
      </Frame>
    ),
  },
  {
    title: 'One school cannot read another',
    body: 'Separation is a database policy rather than a filter in the interface, so it holds for anything that talks to the API — not just for the screens we remembered to guard.',
    bullets: [
      'Row-level security in Postgres, per school',
      'Roles resolved from the signed-in token, not from the client',
      'Teachers see the classes they teach; students see themselves',
      'Every sensitive action written to an audit log',
      'Isolation covered by tests that assert the negative cases',
    ],
    demo: (
      <Frame label="Cross-school read attempt">
        <Row name="Own school · grade_items"><StatusChip tone="good">200 · 412 rows</StatusChip></Row>
        <Row name="Other school · grade_items"><StatusChip tone="crit">0 rows</StatusChip></Row>
        <p className="m-0 mt-3 text-xs" style={{ color: 'var(--faint)' }}>
          Refused by the database, not by the page.
        </p>
      </Frame>
    ),
  },
];

export default function Features() {
  return (
    <PublicShell>
      <Section>
        <p className="scholr-label m-0">Features</p>
        <h1 className="scholr-h1 m-0 mt-2 text-3xl md:text-4xl" style={{ maxWidth: '20ch' }}>
          Built around how an international school actually runs
        </h1>
        <p className="m-0 mt-4 text-lg leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '54ch' }}>
          Four curricula, six roles, and one set of records underneath all of it.
        </p>
      </Section>

      {FEATURES.map((f, i) => (
        <section key={f.title} className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div
              className="grid gap-8 lg:gap-14 items-start"
              style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(20rem, 100%), 1fr))' }}
            >
              {/* Alternating sides, and the demo goes first on odd rows at wide
                  widths only — on a phone the words always lead. */}
              <div style={{ order: i % 2 === 1 ? 2 : 1 }}>
                <h2 className="scholr-h1 m-0 text-xl md:text-2xl">{f.title}</h2>
                <p className="m-0 mt-3 text-base leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '52ch' }}>
                  {f.body}
                </p>
                <ul className="m-0 mt-5 p-0 list-none">
                  {f.bullets.map(b => (
                    <li
                      key={b}
                      className="py-2.5 text-sm"
                      style={{ borderTop: '1px solid var(--rule-soft)', color: 'var(--body)' }}
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div style={{ order: i % 2 === 1 ? 1 : 2 }}>{f.demo}</div>
            </div>
          </div>
        </section>
      ))}

      <Section>
        <div className="scholr-band px-6 py-9 md:px-9 flex flex-wrap items-center gap-5">
          <div className="min-w-0">
            <h2 className="scholr-h1 m-0 text-xl md:text-2xl">See it with your own data</h2>
            <p className="m-0 mt-2 text-sm" style={{ color: 'var(--muted)', maxWidth: '46ch' }}>
              Bring a timetable and a mark scheme. We'll show you the parts that apply to your
              curriculum and skip the rest.
            </p>
          </div>
          <span className="ml-auto shrink-0">
            <CTA to="/BookDemo">Book a demo <ArrowRight className="w-4 h-4" /></CTA>
          </span>
        </div>
        <p className="m-0 mt-4 text-sm">
          <Link to="/Pricing" className="scholr-focus" style={{ color: 'var(--brand)' }}>
            See what it costs →
          </Link>
        </p>
      </Section>
    </PublicShell>
  );
}
