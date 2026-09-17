import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Section, CTA } from '@/components/public/PublicShell';
import Seo from '@/components/public/Seo';
import { ArrowRight } from 'lucide-react';

/**
 * The questions schools actually ask on the first call, answered the way we
 * answer them on the first call. Anything we cannot answer honestly is not
 * here; the security page carries the "not yet" list.
 */
const GROUPS = [
  {
    heading: 'What it is',
    items: [
      ['What does Scholr actually do?', 'It is the school’s record system. Enrolment and class lists, a gradebook, attendance, behaviour notes, the timetable as it is taught, messaging, and portals for students and parents. For IB schools it also carries CAS, the Extended Essay and TOK. One database holds all of it, so a mark entered in a gradebook is the same mark a parent eventually sees and the same mark a report is built from.'],
      ['Who is it for?', 'International and independent schools that teach more than one programme — IB Diploma alongside MYP, IGCSE alongside A-Level, a US diploma alongside any of them. A school running a single curriculum will find Scholr works, but the reason to choose it over a cheaper single-curriculum system is the second programme.'],
      ['What makes it different from iSAMS or ManageBac?', 'Two things, honestly stated. Scholr treats several curricula as the normal case rather than an add-on, so grading scales, reporting shape and vocabulary are set per programme and the parts that do not apply are hidden rather than greyed out. And the price is published — those three all answer the cost question with “contact sales”. What they have that we do not is fifteen years of edge cases and a support department.'],
      ['How big is the company?', 'Small. You will speak to someone who wrote the code. That is an advantage when you need something changed and a risk when you need someone at 3 a.m., and both should weigh in your decision.'],
      ['Can we see it without talking to anyone?', 'Yes. The demo sandbox runs the real interface against a sample school — no sign-up, no email address, nothing to uninstall. It is linked from every page.'],
    ],
  },
  {
    heading: 'The curricula',
    items: [
      ['How does multi-curriculum actually work?', 'A school declares its programmes once, during setup. From then on every class, subject and student belongs to a programme, and the programme decides what the software asks for. An IB Diploma class is marked 1–7 against published criteria; an MYP class is marked A–D against four criteria; IGCSE reports in letters; A-Level in A*–E; a US class in a GPA with credit hours. The same teacher can teach two of them in the same morning without changing systems.'],
      ['Do teachers have to learn several interfaces?', 'No. The screens are the same; what changes is the scale in the mark field and the shape of the report. A teacher opening an IGCSE class is not asked about CAS, and a coordinator opening a DP cohort is not asked for a GPA.'],
      ['What about IB Core — CAS, EE, TOK?', 'Included, not an extra module. CAS experiences are logged and approved per strand, Extended Essay progress is tracked per student through proposal, draft and viva, and TOK tasks sit alongside. A coordinator sees the cohort’s position on all three without a spreadsheet.'],
      ['Can one student sit in two programmes?', 'Yes — a student can be enrolled in classes across programmes, which is common in schools running IGCSE into A-Level or MYP into DP. Their record follows them; it does not fork.'],
      ['We use a curriculum you have not listed.', 'Then tell us before you buy, not after. The four we support properly are IB, IGCSE, A-Level and US. We would rather say no than pretend a fifth works.'],
    ],
  },
  {
    heading: 'Buying it',
    items: [
      ['What does it cost?', '€22 per student per year for the first two hundred students, €17 for the next four hundred, €13 for every student beyond six hundred, with a minimum of €2,400 a year. Each rate applies only to the students inside its band, the way tax brackets work, so the bill never falls when a school enrols one more child. Staff, admin and parent accounts are free and uncounted. The calculator on the pricing page gives an exact figure.'],
      ['Why is there a minimum?', 'Because a school of eighty pupils costs the same to onboard and support as one of three hundred, and €1,760 a year does not cover that conversation. €200 a month is the honest floor. iSAMS charges a school that size a setup fee of several thousand pounds before the licence.'],
      ['Is there a setup fee?', 'No. Migration from your current system is part of onboarding.'],
      ['Is there a minimum contract?', 'A year, billed yearly, because that is how a school year works and how school budgets are approved. The year runs 1 August to 31 July; a school joining in January pays for seven months, not twelve.'],
      ['Can we trial it?', 'Yes — with your own subjects and grading set up, not a demo school. Ask on the demo call.'],
      ['Do you do purchase orders?', 'Yes, and at the moment every school is invoiced — self-serve card checkout is not switched on. A bursar gets an invoice with a PO reference and thirty days, which is how schools actually pay.'],
    ],
  },
  {
    heading: 'Running it',
    items: [
      ['How long does setup take?', 'The database side is quick — years, terms, subjects, cohorts and classes can be imported. What takes time is deciding things: which grading scale each programme uses, who may see draft marks, whether parents see attendance. Plan on a working week with someone from the school who can make those decisions.'],
      ['What about our timetable?', 'Scholr holds and displays a timetable, per class, per teacher and per student. It does not build one — that is our other product, Schedual, which solves the constraint problem. The automatic sync between them is not live yet; today you would import.'],
      ['How do parents get access?', 'A parent account is linked to specific students and sees only those. Marks appear when a teacher releases them, not when they are entered — a teacher can mark a whole set and publish when ready. Attendance visibility is a school-level setting rather than a per-row one, so a school decides once whether families see absences.'],
      ['Can we stop parents seeing something?', 'Yes, and it is the default in two places. A grade is invisible to students and families until it is released. A behaviour note marked staff-only never leaves the staff room. Both are enforced in the database, not by hiding a button.'],
      ['Does it send email?', 'Not yet, and this one is worth being blunt about: outbound mail is not configured on the production server, so invitations, password resets and notifications are written but not delivered. Accounts are created directly by an administrator in the meantime. Also missing: PDF and Excel export, the Google Drive and Docs integrations, and report generation as a document you can hand to a parent.'],
      ['Does it work on a phone?', 'The interface is responsive and the parent and student portals are usable on a phone. There is no native app.'],
    ],
  },
  {
    heading: 'Data and privacy',
    items: [
      ['Where is the data?', 'On our own servers in Europe. No third-party analytics on the site or in the product — no Google Analytics, no session recording, no advertising pixels. The cookie notice is short because there is little to disclose.'],
      ['How is one school kept separate from another?', 'By a row-level security policy in Postgres, which means the database itself refuses to return another school’s rows. It is not a filter in the interface that we have to remember to apply on every screen. The same mechanism governs which rows a teacher, a student and a parent each see.'],
      ['You hold children’s data. What are your obligations?', 'The same as any school supplier under GDPR, and we act as processor to the school’s controller. A data processing agreement is part of the contract. Full deletion on request is supported — academic records are retained but names on them are replaced.'],
      ['Has it been audited?', 'No. An independent security audit has not been carried out, and saying otherwise would be a lie a procurement officer could check. What exists is documented on the security page, including the gaps.'],
    ],
  },
  {
    heading: 'Leaving it',
    items: [
      ['Can we get our data out?', 'Yes, on request, in full, as structured files. We would rather be easy to leave than hold a school hostage with an export fee.'],
      ['What if you stop trading?', 'Fair question for a small company. Scholr is self-hosted on infrastructure we control, and an escrow arrangement for the database and the deployment scripts is something we will write into a contract if a school asks.'],
      ['What happens at the end of a year?', 'Nothing automatic. A school that does not renew keeps access until the paid year ends, and we export the data before it closes.'],
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
    <>
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
    </>
  );
}
