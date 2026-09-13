import React from 'react';
import { Link } from 'react-router-dom';
import PublicShell, { Section, CTA, RuledList } from '@/components/public/PublicShell';
import Seo from '@/components/public/Seo';
import StatusChip from '@/components/app/StatusChip';
import { ArrowRight } from 'lucide-react';

/**
 * The other half of a cross-link that only existed in one direction.
 *
 * Schedual has shipped a /ScholrIntegration page for a while; Scholr said
 * nothing about Schedual at all. A school evaluating one of them had no way to
 * discover that the same two people build the other, which is the single
 * strongest thing either product has to say — the timetable and the school
 * record are the same data, and everywhere else they are two vendors.
 *
 * The status section is deliberately blunt. Schedual's page already says the
 * connector is in development; saying anything softer here would contradict
 * our own site, and a school will read both.
 */

const SPLIT = [
  ['Schedual', 'Builds the timetable. Option blocks, HL/SL pairings, teacher loads, room constraints, clash resolution — the solver that turns a set of student subject choices into a workable week.'],
  ['Scholr', 'Runs the year that timetable describes. Registers, gradebooks, predicted grades, reports, behaviour, the family portal, and the records underneath all of it.'],
];

const WHY = [
  ['One team, not a partnership', 'Both products are built and hosted by the same two people. There is no partner API to be deprecated, no integration that stops being commercially interesting to someone else.'],
  ['One data model', 'Schedual already thinks in the vocabulary Scholr uses — subject, level, block, cohort, teacher load. A lesson does not have to be translated between two vendors’ idea of what a lesson is.'],
  ['Buy either, or both', 'Neither requires the other. A school with a timetable it likes can take Scholr alone; a school happy with its MIS can take Schedual alone. Nothing is bundled to force the pair.'],
];

const STATUS = [
  ['Endpoint', 'planned', 'The Scholr endpoint that accepts a finalised timetable from Schedual is specified but not deployed.'],
  ['Authentication', 'planned', 'Both systems are self-hosted and under our control, so this is a shared-secret decision rather than an OAuth dance. Not locked yet.'],
  ['Field mapping', 'in progress', 'Mapping Schedual’s lesson, teacher and room records onto Scholr’s academic model, field for field. This is the part that decides whether it actually saves anyone work.'],
];

export default function Schedual() {
  return (
    <PublicShell>
      <Seo
        title="Schedual — the timetabling half"
        description="Scholr and Schedual are built by the same two people in Ireland: Schedual solves the timetable, Scholr runs the school year around it. Here is how they fit, and exactly where the sync between them stands."
        canonical="/Schedual"
      />

      <Section>
        <p className="scholr-label" style={{ margin: 0, color: 'var(--brand)' }}>Our other product</p>
        <h1 className="pub-display" style={{ margin: 'var(--space-xs) 0 0', fontSize: 'var(--text-3xl)', maxWidth: '20ch' }}>
          The timetable and the school record are the same data
        </h1>
        <p className="pub-lede" style={{ margin: 'var(--space-sm) 0 0', maxWidth: '54ch', color: 'var(--muted)' }}>
          Everywhere else they are two vendors, two exports and a spreadsheet in between.{' '}
          <a href="https://schedual-pro.com" className="scholr-focus" style={{ color: 'var(--brand)' }} target="_blank" rel="noopener">
            Schedual
          </a>{' '}
          is our timetabling product for the same schools, built by the same two people.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2xs)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
          <a href="https://schedual-pro.com" target="_blank" rel="noopener" className="pub-btn pub-btn-line pub-btn-lg scholr-focus">
            schedual-pro.com <ArrowRight className="w-4 h-4" />
          </a>
          <CTA to="/BookDemo">See both together</CTA>
        </div>
      </Section>

      <Section eyebrow="The split" title="Which product does what" tint>
        <RuledList items={SPLIT} termWidth="9rem" />
      </Section>

      <Section eyebrow="Why it matters" title="A timetable finalised once, and never retyped">
        <RuledList items={WHY} termWidth="14rem" />
      </Section>

      <Section
        eyebrow="Status"
        title="The sync is not live yet"
        lede="Schedual's own site says the same thing, and you should be able to read both without finding a contradiction. Today you would export from one and import into the other."
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
        <p style={{ margin: 'var(--space-md) 0 0', fontSize: 'var(--text-sm)' }}>
          <Link to="/Security" className="scholr-focus" style={{ color: 'var(--brand)' }}>
            The rest of what we haven’t built yet →
          </Link>
        </p>
      </Section>
    </PublicShell>
  );
}
