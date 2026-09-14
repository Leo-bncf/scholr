import React from 'react';
import Rise from './Rise';
import useLightTheme from './useLightTheme';
import PublicNav from './PublicNav';
import PublicFooter from './PublicFooter';

/**
 * Every public page, wrapped the same way. Pages used to each assemble their
 * own nav and footer, which is how the two navbars diverged.
 */
export default function PublicShell({ children }) {
  useLightTheme();

  return (
    <div className="scholr-page min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}

/**
 * A page section.
 *
 * `align` defaults to left and there is deliberately no centred variant for
 * body sections. A whole page of centred headings and centred paragraphs is
 * the most reliable tell of a template, and it makes long copy harder to read
 * — the eye loses the left edge on every line.
 */
export function Section({ eyebrow, title, lede, children, tint = false, className = '', ...rest }) {
  // A `lead=` typo silently dropped the pricing section's whole explanatory
  // sentence for weeks — the prop just wasn't read, and nothing complained.
  // Unknown props are now loud in development.
  if (import.meta.env.DEV && Object.keys(rest).length) {
    // eslint-disable-next-line no-console
    console.warn(`<Section> got unknown prop(s): ${Object.keys(rest).join(', ')} — did you mean "lede"?`);
  }

  return (
    <section
      className={className}
      style={{
        padding: '3.4rem 0',
        background: tint ? 'linear-gradient(180deg, var(--paper) 0%, var(--wash) 220%)' : undefined,
      }}
    >
      <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '0 1.5rem' }}>
        {(eyebrow || title || lede) && (
          <Rise as="header" style={{ maxWidth: '36rem', marginBottom: 'var(--space-lg)' }}>
            {eyebrow && <p className="scholr-label" style={{ margin: 0 }}>{eyebrow}</p>}
            {title && (
              <h2 className="pub-display" style={{ margin: '.6rem 0 0', fontSize: 'clamp(1.6rem, 3.2vw, 2.15rem)' }}>
                {title}
              </h2>
            )}
            {lede && <p className="pub-lede" style={{ margin: '.85rem 0 0', color: 'var(--muted)' }}>{lede}</p>}
          </Rise>
        )}
        {children}
      </div>
    </section>
  );
}

/** The primary action. Gold, and there is one per page. */
export function CTA({ to, children, tone = 'gold', size = 'lg' }) {
  return (
    <a
      href={to}
      className={`pub-btn ${tone === 'gold' ? 'pub-btn-gold' : 'pub-btn-line'} ${size === 'lg' ? 'pub-btn-lg' : ''} scholr-focus`}
    >
      {children}
    </a>
  );
}

/**
 * A ruled list of term/description pairs.
 *
 * This replaces the row-of-shadowed-cards that every section used to be. A
 * page whose only structural idea is "card" has no structure; rules, indents
 * and a change of measure do more with less.
 */
export function RuledList({ items, termWidth = '11rem' }) {
  return (
    <dl style={{ margin: 0 }}>
      {items.map(([term, desc], i) => (
        <div
          key={term}
          className="ruled-row"
          style={{
            display: 'grid',
            gridTemplateColumns: `minmax(7rem, ${termWidth}) 1fr`,
            gap: '0 2rem',
            padding: '1rem 0',
            borderTop: i === 0 ? 'none' : '1px solid var(--rule)',
          }}
        >
          <dt style={{ fontFamily: 'var(--font-mono)', fontSize: '.78rem', letterSpacing: '.04em', color: 'var(--brand)', paddingTop: '.15rem' }}>
            {term}
          </dt>
          <dd style={{ margin: 0, fontSize: '.97rem', lineHeight: 1.55, color: 'var(--body)', maxWidth: '58ch' }}>
            {desc}
          </dd>
        </div>
      ))}
      <style>{`@media (max-width: 40rem){ .ruled-row { grid-template-columns: 1fr !important; gap: .3rem 0 !important; } }`}</style>
    </dl>
  );
}
