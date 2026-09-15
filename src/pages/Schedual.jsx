import React from 'react';
import { Link } from 'react-router-dom';
import PublicShell, { Section, CTA, RuledList } from '@/components/public/PublicShell';
import Seo from '@/components/public/Seo';
import StatusChip from '@/components/app/StatusChip';
import { SCHEDUAL_HOME, SCHEDUAL_PAGES, SCHEDUAL_BY_CURRICULUM } from '@/components/public/schedual';
import { CURRICULUM_LIST } from '@/pages/curriculum/data';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

/**
 * The other half of a cross-link that only ran one way.
 *
 * Schedual has had a /ScholrIntegration page for a while; Scholr said nothing
 * about Schedual at all, so a school evaluating one had no way to learn that
 * the same two people build the other — which is the strongest thing either
 * product has to say. The timetable and the school record are the same data;
 * everywhere else they are two vendors with a spreadsheet in between.
 *
 * The status section is deliberately blunt and matches what Schedual's own
 * page says. A school will read both, and they had better agree.
 */

function Out({ href, children, sub }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className="scholr-focus out-link"
      style={{
        display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)',
        padding: 'var(--space-sm) 0', borderTop: '1px solid var(--rule)',
        textDecoration: 'none', color: 'var(--ink)',
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 'var(--text-base)', fontWeight: 500 }}>{children}</span>
        {sub && (
          <span style={{ display: 'block', marginTop: '.2rem', fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 'var(--lh-body)' }}>
            {sub}
          </span>
        )}
      </span>
      <ArrowUpRight className="w-4 h-4" style={{ marginLeft: 'auto', flex: 'none', color: 'var(--brand)' }} />
    </a>
  );
}

const SPLIT = [
  ['Schedual', 'Builds the timetable. Option blocks, HL/SL pairings, teacher loads, room constraints and clash resolution — the solver that turns a set of student subject choices into a week that works.'],
  ['Scholr', 'Runs the year that timetable describes. Registers, gradebooks, predicted grades, reports, behaviour, the family portal, and the records underneath all of it.'],
];

const WHY = [
  ['One team, not a partnership', 'Both are built and hosted by the same two people. There is no partner API to be deprecated and no integration that stops being commercially interesting to somebody else.'],
  ['One vocabulary', 'Schedual already thinks in subject, level, block, cohort and teacher load. A lesson does not have to be translated between two vendors’ idea of what a lesson is.'],
  ['Buy either, or both', 'Neither requires the other. A school happy with its timetable can take Scholr alone; a school happy with its MIS can take Schedual alone. Nothing is bundled to force the pair.'],
  ['Same answer on security', 'Both self-hosted on infrastructure we control, both in Europe, both with the same policy on what leaves the building. One data-processing conversation, not two.'],
];

const STATUS = [
  ['Endpoint', 'planned', 'The Scholr endpoint that accepts a finalised timetable from Schedual is specified but not deployed.'],
  ['Authentication', 'planned', 'Both systems are ours, so this is a shared-secret decision rather than an OAuth dance. Not locked yet.'],
  ['Field mapping', 'in progress', 'Mapping Schedual’s lesson, teacher and room records onto Scholr’s academic model, field for field. This is the part that decides whether it actually saves anyone work.'],
];

export default function Schedual() {
  return (
    <PublicShell>
      <Seo
        title="Schedual — the timetabling half"
        description="Scholr and Schedual are built by the same two people in Ireland: Schedual solves the timetable, Scholr runs the school year around it. What each does, how they fit, and exactly where the sync stands."
        canonical="/Schedual"
      />

      <Section>
        <p className="scholr-label reveal" style={{ margin: 0, color: 'var(--brand)', '--i': 0 }}>Our other product</p>
        <h1 className="pub-display reveal" style={{ margin: 'var(--space-xs) 0 0', fontSize: 'var(--text-3xl)', maxWidth: '20ch', '--i': 1 }}>
          The timetable and the school record are the same data
        </h1>
        <p className="pub-lede reveal" style={{ margin: 'var(--space-sm) 0 0', maxWidth: '56ch', color: 'var(--muted)', '--i': 2 }}>
          Everywhere else they are two vendors, two exports and a spreadsheet in between.{' '}
          <a href={SCHEDUAL_HOME} target="_blank" rel="noopener" className="scholr-focus" style={{ color: 'var(--brand)' }}>
            Schedual
          </a>{' '}
          is our timetabling engine for the same kind of school, built by the same two people, on the
          same infrastructure.
        </p>
        <div className="reveal" style={{ display: 'flex', gap: 'var(--space-2xs)', marginTop: 'var(--space-md)', flexWrap: 'wrap', '--i': 3 }}>
          <a href={SCHEDUAL_HOME} target="_blank" rel="noopener" className="pub-btn pub-btn-primary pub-btn-lg scholr-focus">
            Visit schedual-pro.com <ArrowUpRight className="w-4 h-4" />
          </a>
          <CTA to="/BookDemo" tone="line">See both together</CTA>
        </div>
      </Section>

      <Section eyebrow="Two products" title="Why they are separate at all">
        <div style={{ display: 'grid', gap: 'var(--space-md)', maxWidth: '60ch' }}>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            Building a timetable and running a school are different problems, and conflating them is
            why so much school software does one of them badly. A timetable is a constraint-solving
            job: several hundred students with individual subject combinations, teachers who cannot
            be in two rooms, labs that seat twenty-four, and a solution that has to satisfy all of it
            at once. It runs for minutes and it either works or it does not.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            Everything after that is record-keeping across a year: marks, attendance, reports,
            messages, the things a school touches every day. Scholr is that half. Schedual is the
            solver, and it exists because an IB Diploma block structure — six groups, individual
            combinations, HL and SL running concurrently — defeats a general-purpose timetabler.
          </p>
          <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
            A school can use either on its own. Scholr holds and displays a timetable however it was
            produced, including one built by hand in a spreadsheet, and Schedual will export to a
            system that is not Scholr. Using both is a convenience, not a requirement, and we would
            rather say that than sell a suite.
          </p>
        </div>
      </Section>

      <Section eyebrow="The split" title="Which product does what" tint>
        <RuledList items={SPLIT} termWidth="9rem" />
      </Section>

      <Section
        eyebrow="By curriculum"
        title="The timetabling page for each programme we run"
        lede="Every framework below has a page on each site: how Scholr models its records, and how Schedual builds its week."
      >
        <div style={{ maxWidth: '52rem' }}>
          {CURRICULUM_LIST.map(c => {
            const s = SCHEDUAL_BY_CURRICULUM[c.slug];
            return (
              <div key={c.slug} style={{ borderTop: '1px solid var(--rule)', padding: 'var(--space-sm) 0' }}>
                <p className="scholr-label" style={{ margin: 0, color: 'var(--brand)' }}>{c.nav}</p>
                <p style={{ margin: '.15rem 0 0', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>{c.seoTitle}</p>
                <div
                  style={{
                    display: 'grid', gap: 'var(--space-2xs) var(--space-lg)', marginTop: 'var(--space-2xs)',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(18rem, 100%), 1fr))',
                  }}
                >
                  <Link to={`/${c.slug}`} className="scholr-focus" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
                    <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                      Records → how we model {c.nav} <ArrowRight className="w-3 h-3" style={{ display: 'inline', verticalAlign: '-1px', color: 'var(--brand)' }} />
                    </span>
                  </Link>
                  <a href={s.href} target="_blank" rel="noopener" className="scholr-focus" style={{ textDecoration: 'none', color: 'var(--ink)' }}>
                    <span style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                      Timetable → how Schedual builds it <ArrowUpRight className="w-3 h-3" style={{ display: 'inline', verticalAlign: '-1px', color: 'var(--brand)' }} />
                    </span>
                    <span style={{ display: 'block', marginTop: '.2rem', fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 'var(--lh-body)' }}>
                      {s.line}
                    </span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section eyebrow="Why it matters" title="A timetable finalised once, and never retyped" tint>
        <RuledList items={WHY} termWidth="14rem" />
      </Section>

      <Section
        eyebrow="Status"
        title="The sync is not live yet"
        lede="Schedual's own page says the same thing, and you should be able to read both without finding a contradiction. Today you would export from one and import into the other."
      >
        <div style={{ maxWidth: '46rem' }}>
          {STATUS.map(([title, state, desc]) => (
            <div key={title} style={{ padding: 'var(--space-sm) 0', borderTop: '1px solid var(--rule)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2xs)', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-base)', letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                  {title}
                </h3>
                <StatusChip tone={state === 'in progress' ? 'info' : 'warn'}>{state}</StatusChip>
              </div>
              <p style={{ margin: 'var(--space-3xs) 0 0', fontSize: 'var(--text-sm)', lineHeight: 'var(--lh-body)', color: 'var(--muted)', maxWidth: '58ch' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Everything on the other site" title="Where to read more">
        <div style={{ maxWidth: '46rem' }}>
          {SCHEDUAL_PAGES.map(([label, href]) => <Out key={href} href={href}>{label}</Out>)}
          <div style={{ borderTop: '1px solid var(--rule)' }} />
        </div>
        <p style={{ margin: 'var(--space-md) 0 0', fontSize: 'var(--text-sm)', color: 'var(--muted)', maxWidth: '56ch' }}>
          If you are evaluating both, say so on the demo call and we will show them in one sitting
          rather than booking you twice.
        </p>
        <div style={{ marginTop: 'var(--space-md)' }}>
          <CTA to="/BookDemo">Book one call for both <ArrowRight className="w-4 h-4" /></CTA>
        </div>
      </Section>
    </PublicShell>
  );
}
