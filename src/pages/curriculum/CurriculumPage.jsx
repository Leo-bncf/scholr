import React from 'react';
import { Link } from 'react-router-dom';
import PublicShell, { Section, CTA, RuledList } from '@/components/public/PublicShell';
import Seo from '@/components/public/Seo';
import { CURRICULUM_LIST } from './data';
import { SCHEDUAL_BY_CURRICULUM } from '@/components/public/schedual';
import { ArrowRight, ArrowUpRight } from 'lucide-react';

/**
 * One page per curriculum, from `data.js`.
 *
 * Shared shell, entirely unshared content: the point of these pages is that a
 * head of IGCSE and a head of DP each find their own vocabulary rather than a
 * generic page with their acronym pasted into it. If a section here ever reads
 * the same across all four, it should be deleted from all four.
 */
export default function CurriculumPage({ curriculum: c }) {
  const others = CURRICULUM_LIST.filter(x => x.slug !== c.slug);
  const timetable = SCHEDUAL_BY_CURRICULUM[c.slug];

  return (
    <PublicShell>
      <Seo title={c.seoTitle} description={c.seoDescription} canonical={`/${c.slug}`} />

      <Section>
        <p className="scholr-label" style={{ margin: 0, color: 'var(--brand)' }}>{c.kicker}</p>
        <h1 className="pub-display" style={{ margin: 'var(--space-xs) 0 0', fontSize: 'var(--text-3xl)', maxWidth: '21ch' }}>
          {c.headline}
        </h1>
        <p className="pub-lede" style={{ margin: 'var(--space-sm) 0 0', maxWidth: '56ch', color: 'var(--muted)' }}>
          {c.lede}
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2xs)', marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
          <CTA to="/BookDemo">Book a demo <ArrowRight className="w-4 h-4" /></CTA>
          <CTA to="/Pricing" tone="line">See the price</CTA>
        </div>
      </Section>

      <Section eyebrow="What the framework demands" title="Where generic school software gets it wrong" tint>
        <RuledList items={c.demands} termWidth="15rem" />
      </Section>

      <Section eyebrow="What Scholr does" title="How it is modelled here">
        <RuledList items={c.does} termWidth="15rem" />
        <p
          style={{
            margin: 'var(--space-md) 0 0', padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--brand-sf)', border: '1px solid var(--tint-edge)',
            borderRadius: 'var(--radius-surface)', fontSize: 'var(--text-sm)',
            lineHeight: 'var(--lh-body)', color: 'var(--body)', maxWidth: '60ch',
          }}
        >
          {c.hidden}
          {c.note ? ` ${c.note}` : ''}
        </p>
      </Section>

      {/* The adjacent problem, and the reason the two products exist as a pair.
          A school reading about how we model this curriculum's records is
          exactly the school that has to timetable it too. */}
      {timetable && (
        <Section eyebrow="The other half" title="Someone still has to build the week">
          <div
            className="pub-ruled"
            style={{
              border: '1px solid var(--tint-edge)', borderRadius: 'var(--radius-large)',
              background: 'var(--brand-sf)', padding: 'var(--space-lg) var(--space-md)',
              display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'flex-end',
              overflow: 'hidden',
            }}
          >
            <div style={{ minWidth: 0, maxWidth: '46ch' }}>
              <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--lh-body)', color: 'var(--body)' }}>
                {timetable.line}
              </p>
              <p style={{ margin: 'var(--space-2xs) 0 0', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
                That is our other product, <Link to="/Schedual" className="scholr-focus" style={{ color: 'var(--brand)' }}>Schedual</Link> —
                same two people, same infrastructure. Buy either on its own.
              </p>
            </div>
            <a
              href={timetable.href}
              target="_blank"
              rel="noopener"
              className="pub-btn pub-btn-line scholr-focus"
              style={{ marginLeft: 'auto', flex: 'none' }}
            >
              {timetable.label} <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </Section>
      )}

      <Section eyebrow="Also" title="The other frameworks we run">
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {others.map(o => (
            <li key={o.slug} style={{ borderTop: '1px solid var(--rule)' }}>
              <Link
                to={`/${o.slug}`}
                className="scholr-focus"
                style={{
                  display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)',
                  padding: 'var(--space-sm) 0', textDecoration: 'none', color: 'var(--ink)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--brand)', minWidth: '5rem' }}>
                  {o.nav}
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)', minWidth: 0 }}>{o.seoTitle}</span>
                <ArrowRight className="w-4 h-4" style={{ marginLeft: 'auto', flex: 'none', color: 'var(--faint)' }} />
              </Link>
            </li>
          ))}
          <li style={{ borderTop: '1px solid var(--rule)' }} />
        </ul>
        <p style={{ margin: 'var(--space-md) 0 0', fontSize: 'var(--text-sm)', color: 'var(--muted)', maxWidth: '58ch' }}>
          A school running more than one of these runs them in the same Scholr, on one set of records —
          that is the whole reason the product exists.
        </p>
      </Section>
    </PublicShell>
  );
}
