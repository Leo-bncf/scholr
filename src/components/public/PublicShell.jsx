import React from 'react';
import PublicNav from './PublicNav';
import PublicFooter from './PublicFooter';

/**
 * Every public page, wrapped the same way.
 *
 * Pages used to each assemble their own nav + footer, which is how the two
 * navbars diverged. One shell means one place to change.
 */
export default function PublicShell({ children }) {
  return (
    <div className="scholr-page min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}

/**
 * A page section on the public grid.
 *
 * `eyebrow` is the mono label that runs above a heading — the same voice the
 * app uses for column headers, which is the point: the marketing site and the
 * product should look like they were made by the same people.
 */
export function Section({ eyebrow, title, lead, children, bleed = false, className = '' }) {
  return (
    <section className={`py-14 md:py-20 ${className}`} style={bleed ? undefined : undefined}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {(eyebrow || title || lead) && (
          <header className="max-w-2xl mb-8 md:mb-10">
            {eyebrow && <p className="scholr-label m-0">{eyebrow}</p>}
            {title && <h2 className="scholr-h1 m-0 mt-2 text-2xl md:text-3xl">{title}</h2>}
            {lead && (
              <p className="m-0 mt-3 text-base leading-relaxed" style={{ color: 'var(--muted)' }}>
                {lead}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

/** The primary call to action. There is one per page. */
export function CTA({ to, children, tone = 'accent' }) {
  const accent = tone === 'accent';
  return (
    <a
      href={to}
      className="scholr-focus inline-flex items-center gap-2 text-sm font-medium"
      style={{
        background: accent ? 'var(--brand)' : 'transparent',
        color: accent ? 'var(--brand-ink)' : 'var(--body)',
        border: accent ? '1px solid var(--brand)' : '1px solid var(--rule)',
        padding: '0.6rem 1.05rem',
        borderRadius: 'var(--radius-control)',
        textDecoration: 'none',
      }}
    >
      {children}
    </a>
  );
}

/**
 * A claim with its evidence.
 *
 * Marketing bullets are cheap; the reason this component pairs a claim with a
 * `proof` line is that the audience is a procurement committee, and "roles are
 * enforced in Postgres, not in the interface" persuades where "enterprise
 * grade security" does not.
 */
export function Claim({ title, children, proof }) {
  return (
    <div className="py-4" style={{ borderTop: '1px solid var(--rule)' }}>
      <h3 className="m-0 text-base font-medium" style={{ color: 'var(--ink)' }}>{title}</h3>
      <p className="m-0 mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '60ch' }}>
        {children}
      </p>
      {proof && (
        <p
          className="scholr-label m-0 mt-2"
          style={{ color: 'var(--brand)' }}
        >
          {proof}
        </p>
      )}
    </div>
  );
}
