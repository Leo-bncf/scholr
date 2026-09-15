import React from 'react';
import { Link } from 'react-router-dom';
import Seo from '@/components/public/Seo';
import PublicShell, { Section, CTA, RuledList } from '@/components/public/PublicShell';
import StatusChip from '@/components/app/StatusChip';
import { ArrowRight } from 'lucide-react';

/**
 * Security.
 *
 * There were two security pages — /Security and /SecurityAndCompliance — and
 * the nav and footer each pointed at a different one. This is now the single
 * page; the other redirects here.
 *
 * The old /SecurityAndCompliance asserted ISO/IEC 27001 certification, SOC 2
 * Type II, annual third-party penetration testing and AES-256 encryption at
 * rest. Those claims are not backed by anything in this repository or its
 * infrastructure, and a school's procurement team will ask for the
 * certificates. Everything on this page is something that can be demonstrated
 * on request; the roadmap section says plainly what is not done yet, which is
 * a better answer to a procurement questionnaire than a badge nobody can
 * produce.
 */

const STEPS = [
  ['Every record belongs to a school', 'Classes, grades, messages, attendance — each row carries the school it belongs to. There is no shared pool that a query could reach across.'],
  ['The token decides what exists', "A signed-in user's own token is what the database evaluates. The browser cannot widen it, because the public key only ever grants the anonymous role and the rest comes from the session."],
  ['Policies run in Postgres', 'Row-level security decides which rows come back, so the rule holds for the API, for an export, and for anything else that talks to the database — not only for the screens we remembered to guard.'],
  ['Sensitive actions are written down', 'Account creation, role changes, grade edits and policy changes are logged with who did them and when.'],
];

const ROLES = [
  ['Super admin', 'Every school. Held by Scholr staff only.'],
  ['School admin', 'Everything within their own school.'],
  ['Coordinator', 'Everything within their own school.'],
  ['Teacher', 'The classes they teach — following the class, not who typed the grade in.'],
  ['Student', 'Their own records, once a teacher has released them.'],
  ['Parent', 'Their linked children only, once released to families.'],
];

const ROADMAP = [
  ['Encryption at rest', 'planned', 'Data is encrypted in transit today. Full-disk encryption on the database host is scheduled, and we will say so here when it is done rather than before.'],
  ['Independent penetration test', 'planned', 'Not yet carried out. We would rather tell you that than imply otherwise.'],
  ['Formal certification', 'not held', 'Scholr does not currently hold ISO 27001 or SOC 2. We can walk your team through the controls we do have.'],
];

export default function Security() {
  return (
    <PublicShell>
      <Seo
        title="Security"
        description="How tenant separation works in Scholr, enforced as a row-level security policy in Postgres — and a plain list of what we have not built yet."
        canonical="/Security"
      />
      <Section>
        <p className="scholr-label m-0">Security</p>
        <h1 className="scholr-h1 m-0 mt-2 text-3xl md:text-4xl" style={{ maxWidth: '20ch' }}>
          Separation you can test, not a badge you have to trust
        </h1>
        <p className="m-0 mt-4 text-lg leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '54ch' }}>
          A school hands over its entire academic record. The least we owe you is a straight account
          of how it is kept apart from everyone else's — and of what we have not done yet.
        </p>
      </Section>

      <Section eyebrow="How it is built" title="Where the boundary actually sits">
        <div style={{ display: 'grid', gap: 'var(--space-md)', maxWidth: '60ch' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            Almost every access-control bug in a school system has the same shape: the rule was
            written into a screen, and someone later reached the data by a route that screen did not
            cover — an export, an API call, a report, a page written a year afterwards by someone
            who had never read the original. The rule was real, and it was in the wrong place.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            In Scholr the rules live in Postgres as row-level security policies. The database decides
            which rows a request is allowed to see, using the identity in the signed-in token rather
            than anything the browser claims. A teacher and a student can issue the identical query
            and get different rows back, because the filtering is not happening in the page at all.
            A screen we forget to guard returns nothing rather than everything.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            The same mechanism carries the rules a school actually cares about day to day. A parent
            is attached to specific children and cannot reach another family’s record. A grade is
            invisible to students and families until a teacher publishes it, so marking a whole set
            over a weekend does not leak results one at a time. A behaviour note marked staff-only
            is filtered out of every family-facing query at source.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            Every school’s data sits in the same database, separated by policy rather than by
            deployment. That is a deliberate trade: it makes upgrades and backups uniform, and it
            means the isolation has to be right. It is covered by tests that assert the negative
            case — that a signed-in user of one school reading another school’s table gets zero
            rows, not an error page.
          </p>
        </div>
      </Section>

      <Section eyebrow="What holds" title="Four things, each checkable">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(21rem, 100%), 1fr))', gap: '0 3rem' }}>
          {[
            ['One school cannot read another', 'Tenant separation is a database policy. There is no request a signed-in user can craft that returns another school’s rows.', 'Row-level security, per query'],
            ['A grade is invisible until released', 'Marks are private to the teacher until published. Behaviour notes marked staff-only override both flags and never reach a student or a parent.', 'Students and families, separately'],
            ['Access follows the class', 'A teacher who takes over a class sees its history. A teacher who leaves it stops seeing anything — including work they graded themselves.', 'Not authorship'],
            ['Isolation is covered by tests', 'The suite checks that a classmate cannot read another student’s grades and that a teacher outside a class sees nothing.', 'Negative cases asserted'],
          ].map(([h, body, proof]) => (
            <div key={h} style={{ padding: '1.2rem 0', borderTop: '1px solid var(--rule)' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.02rem', letterSpacing: '-0.02em', color: 'var(--ink)' }}>{h}</h3>
              <p style={{ margin: '.55rem 0 0', fontSize: '.94rem', lineHeight: 1.55, color: 'var(--muted)', maxWidth: '46ch' }}>{body}</p>
              <p className="scholr-label" style={{ margin: '.7rem 0 0', color: 'var(--brand)' }}>{proof}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* The dark beat: the mechanism, in order. Numbered because this genuinely
          is a sequence — each step depends on the one above it. */}
      <Section>
        <div className="scholr-band pub-ruled" style={{ padding: '2rem 1.8rem', borderRadius: 'var(--radius-large)' }}>
          <p className="scholr-label m-0" style={{ color: 'var(--brand)' }}>How isolation works</p>
          <h2 className="scholr-h1 m-0 mt-2 text-2xl md:text-3xl" style={{ maxWidth: '22ch' }}>
            Four steps, and the order matters
          </h2>
          <ol className="m-0 mt-7 p-0 list-none">
            {STEPS.map(([title, desc], i) => (
              <li
                key={title}
                className="grid gap-x-5 gap-y-1 py-4"
                style={{ borderTop: '1px solid var(--rule)', gridTemplateColumns: 'auto 1fr' }}
              >
                <span
                  className="scholr-num text-sm"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand)' }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <span className="block text-base font-medium" style={{ color: 'var(--ink)' }}>{title}</span>
                  <span className="block mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '62ch' }}>
                    {desc}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section eyebrow="Roles" title="Who sees what" lede="Six roles, and each one is a rule in the database rather than a setting in the interface.">
        <div style={{ maxWidth: '52rem' }}>
          <RuledList items={ROLES} termWidth="10rem" />
        </div>
      </Section>

      <Section
        eyebrow="Not yet"
        title="What we haven't done"
        lede="Every vendor's security page lists what they have. This is the other half, because you are going to ask anyway and the answer is better coming from us."
      >
        <div style={{ maxWidth: '46rem' }}>
          {ROADMAP.map(([title, state, desc]) => (
            <div key={title} className="py-4" style={{ borderTop: '1px solid var(--rule)' }}>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="m-0 text-base font-medium" style={{ color: 'var(--ink)' }}>{title}</h3>
                <StatusChip tone={state === 'not held' ? 'crit' : 'warn'}>{state}</StatusChip>
              </div>
              <p className="m-0 mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
            </div>
          ))}
        </div>

        <p className="m-0 mt-8 text-sm" style={{ color: 'var(--muted)', maxWidth: '54ch' }}>
          Data protection questions, subject access requests and deletion are covered in the{' '}
          <Link to="/PrivacyPolicy" className="scholr-focus" style={{ color: 'var(--brand)' }}>privacy policy</Link>.
        </p>
      </Section>

      <Section>
        <div className="scholr-panel px-6 py-9 md:px-9 flex flex-wrap items-center gap-5">
          <div className="min-w-0">
            <h2 className="scholr-h1 m-0 text-xl md:text-2xl">Send us your security questionnaire</h2>
            <p className="m-0 mt-2 text-sm" style={{ color: 'var(--muted)', maxWidth: '46ch' }}>
              We'll answer it properly, including the questions where the answer is "not yet".
            </p>
          </div>
          <span className="ml-auto shrink-0">
            <CTA to="/Contact">Get in touch <ArrowRight className="w-4 h-4" /></CTA>
          </span>
        </div>
      </Section>
    </PublicShell>
  );
}
