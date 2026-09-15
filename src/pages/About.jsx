import React from 'react';
import { Link } from 'react-router-dom';
import PublicShell, { Section, CTA, RuledList } from '@/components/public/PublicShell';
import Seo from '@/components/public/Seo';
import { ArrowRight } from 'lucide-react';

/**
 * Who builds it.
 *
 * A school is handing over its entire academic record to a company it has
 * never heard of. "About" is not filler on that page — it is the page where a
 * head of school decides whether we will still exist in five years. So it says
 * how small we are rather than hiding it, and what that buys them.
 */
const HOW = [
  ['Two people', 'Scholr is built by the two of us. You will not be handed from a salesperson to an implementation consultant to a support queue, because there is nobody to hand you to.'],
  ['Self-hosted, in Europe', 'Scholr runs on our own infrastructure rather than a hyperscaler account, and the database sits in Europe. There is no third-party analytics on this site and none in the product.'],
  ['We say what is missing', 'The security page carries a section listing what we have not built. It is unusual and it costs us deals, and we would rather lose one that way than by being found out in month three.'],
  ['Sister product', 'We also build Schedual, the timetabling engine for the same kind of school. Same team, same infrastructure, same idea about who owns a school’s data.'],
];

export default function About() {
  return (
    <PublicShell>
      <Seo
        title="About"
        description="Scholr is school-management software for international schools, built in Ireland by the two people who also build Schedual. Self-hosted in Europe, no third-party tracking."
        canonical="/About"
      />

      <Section>
        <p className="scholr-label" style={{ margin: 0, color: 'var(--brand)' }}>About</p>
        <h1 className="pub-display" style={{ margin: 'var(--space-xs) 0 0', fontSize: 'var(--text-3xl)', maxWidth: '20ch' }}>
          Small, Irish, and unusually willing to tell you what doesn’t work yet
        </h1>
        <p className="pub-lede" style={{ margin: 'var(--space-sm) 0 0', maxWidth: '56ch', color: 'var(--muted)' }}>
          International schools are sold to by very large companies with very long feature lists.
          We are the opposite of that, and for some schools that is the wrong trade. It is worth
          knowing which one you are before you spend a term on a migration.
        </p>
      </Section>

      <Section eyebrow="The product" title="What Scholr is, in one place">
        <div style={{ display: 'grid', gap: 'var(--space-md)', maxWidth: '60ch' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            Scholr is the system a school keeps its records in. Enrolment and class lists, a
            gradebook, attendance, behaviour notes, the timetable as it is actually taught,
            messaging between staff and families, and portals for students and parents. For IB
            schools it also carries CAS, the Extended Essay and TOK, which are usually the first
            things to fall back into a spreadsheet. All of it sits in one database, so a mark
            entered by a teacher is the same mark a parent eventually sees and the same mark a
            report is built from.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            The part that is unusual is what happens when a school teaches two programmes. A school
            declares its curricula once; from then on every class belongs to one, and the programme
            decides what the software asks for. A Diploma class is marked on levels 1&ndash;7 against
            published criteria, an MYP class on four criteria A&ndash;D, IGCSE in letters, A&#8209;Level
            in A*&ndash;E, a US class in a percentage that rolls into a GPA. A teacher who takes an
            IGCSE set at nine and a Diploma set at eleven does not change systems in between, and
            neither class is shown a field that belongs to the other.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            Who can see what is decided in the database rather than in the interface. Separation
            between schools, and between a teacher, a student and a parent, is a row-level security
            policy in Postgres — so it holds for anything that reaches the data, not only for the
            screens we remembered to guard. A mark is invisible to a family until a teacher releases
            it. A note marked staff-only never leaves the staff room.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            What it does not do yet: PDF and Excel export, the Google Drive and Docs integrations,
            report generation as a document you can hand to a parent, and card payment — schools
            are invoiced. Those are listed on the security page rather than left to be discovered.
          </p>
        </div>
      </Section>

      <Section eyebrow="How we work" title="What being small actually means here" tint>
        <RuledList items={HOW} termWidth="12rem" />
      </Section>

      <Section eyebrow="Why we built it" title="Because the alternative was a spreadsheet and four logins">
        <div style={{ maxWidth: '60ch', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            International schools rarely run one curriculum. They run the DP for one cohort, IGCSE
            underneath it, and sometimes a US track alongside — and the software they buy is built for
            a school that runs one of those. The gap gets filled with exports, a shared drive, and a
            member of staff who knows where everything is.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            Scholr models the frameworks as different from each other, because they are, and keeps
            one record underneath them. That is the whole idea. Everything else on this site is a
            consequence of it.
          </p>
        </div>
        <p style={{ margin: 'var(--space-md) 0 0', fontSize: 'var(--text-sm)' }}>
          <Link to="/Schedual" className="scholr-focus" style={{ color: 'var(--brand)' }}>
            The timetabling half of that idea is Schedual →
          </Link>
        </p>
      </Section>

      <Section>
        <div className="scholr-panel" style={{ padding: 'var(--space-lg) var(--space-md)', display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 0 }}>
            <h2 className="pub-display" style={{ margin: 0, fontSize: 'var(--text-2xl)', maxWidth: '18ch' }}>
              Ask us the awkward question
            </h2>
            <p style={{ margin: 'var(--space-2xs) 0 0', fontSize: 'var(--text-sm)', color: 'var(--muted)', maxWidth: '46ch' }}>
              What happens if you get hit by a bus, where is the data, can we get it out. We would
              rather answer those on the first call than the third.
            </p>
          </div>
          <span style={{ marginLeft: 'auto' }}><CTA to="/Contact">Email us <ArrowRight className="w-4 h-4" /></CTA></span>
        </div>
      </Section>
    </PublicShell>
  );
}
