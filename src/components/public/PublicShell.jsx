import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Rise from './Rise';
import useLightTheme from './useLightTheme';
import PublicNav from './PublicNav';
import PublicFooter from './PublicFooter';

/**
 * Every public page, wrapped the same way. Pages used to each assemble their
 * own nav and footer, which is how the two navbars diverged.
 *
 * Now mounted once by PublicShellLayout (see that file) instead of once per
 * page, so nav/glow/footer persist across navigation between these pages —
 * see below for why that also drives the page-transition direction.
 */

// Rough left-to-right order of the public pages — nav link order first
// (Platform/Features, Curricula's four curriculum pages, Pricing, Security,
// Timetabling/Schedual), everything else after. Only used to decide which
// way a transition slides; a page not in this list (there isn't one, but
// belt-and-braces) just gets a plain crossfade via routeIndex's fallback.
const ROUTE_ORDER = [
  '/', '/Features',
  '/ib-school-management-software', '/igcse-school-management-software',
  '/a-level-school-management-software', '/us-school-management-software',
  '/Pricing', '/Security', '/Schedual',
  '/About', '/FAQ', '/Contact', '/BookDemo',
  '/PrivacyPolicy', '/TermsOfService',
];

function routeIndex(pathname) {
  const i = ROUTE_ORDER.indexOf(pathname);
  return i === -1 ? ROUTE_ORDER.length : i;
}

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir === 0 ? 0 : dir > 0 ? 24 : -24 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -24 : dir < 0 ? 24 : 0 }),
};

export default function PublicShell({ children }) {
  useLightTheme();
  const location = useLocation();
  const reduced = useReducedMotion();

  // Ref, not state: reading the PREVIOUS render's index during THIS render
  // is exactly what decides direction, and updating it in an effect (which
  // runs after commit) is what keeps it holding the old value long enough
  // to be read that way — see the comment at the effect below.
  const prevIndexRef = useRef(routeIndex(location.pathname));
  const currentIndex = routeIndex(location.pathname);
  const direction = Math.sign(currentIndex - prevIndexRef.current);

  useEffect(() => {
    prevIndexRef.current = currentIndex;
  }, [currentIndex]);

  return (
    // isolate: gives this element its own stacking context, so its own
    // background counts as that context's step-1 paint rather than being
    // lumped in with ordinary in-flow content at step-3. Without it, a
    // negative-z-index descendant (the background glow below) painted
    // BEHIND this div's own background and vanished entirely — z-index
    // alone can't fix that, the missing piece is the stacking-context
    // boundary itself.
    <div className="scholr-page min-h-screen flex flex-col isolate">
      {/* Background glow — was Landing-only, moved here at Erik's request
          so every public page gets it, not just the one. Not a shape: a
          radial gradient fading smoothly to full transparency across four
          colour-mix stops, so there's no edge for the blur on top to hide
          — that's what reads as "a bulb of light behind glass" rather
          than a blurred shape (every earlier shaped version — border-
          radius blob, hand-drawn SVG blob, halo+core bloom — kept a
          findable boundary no matter how much blur). Fixed to the
          viewport, so it holds its screen position on every page as the
          page scrolls beneath it. -z-10 + the `isolate` above keep it
          behind normal content but above the page's own background.
          Motion is drift + rotation on the outer wrapper and a small
          hover-bob on the inner glow — nothing morphs a silhouette,
          because there isn't one. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="mkt-blob-drift-a absolute -bottom-16 -left-16 h-[30rem] w-[30rem] sm:h-[38rem] sm:w-[38rem]">
          <div
            className="mkt-blob-a h-full w-full rounded-full blur-2xl"
            style={{
              background:
                'radial-gradient(circle, color-mix(in oklab, var(--mkt-accent) 72%, transparent) 0%, '
                + 'color-mix(in oklab, var(--mkt-accent) 42%, transparent) 32%, '
                + 'color-mix(in oklab, var(--mkt-accent) 16%, transparent) 58%, transparent 78%)',
            }}
          />
        </div>
        <div className="mkt-blob-drift-b absolute -right-16 -top-16 h-[28rem] w-[28rem] sm:h-[36rem] sm:w-[36rem]">
          <div
            className="mkt-blob-b h-full w-full rounded-full blur-2xl"
            style={{
              background:
                'radial-gradient(circle, color-mix(in oklab, var(--mkt-accent) 64%, transparent) 0%, '
                + 'color-mix(in oklab, var(--mkt-accent) 36%, transparent) 32%, '
                + 'color-mix(in oklab, var(--mkt-accent) 13%, transparent) 58%, transparent 78%)',
            }}
          />
        </div>
      </div>

      <PublicNav />
      <main className="flex-1">
        {reduced ? (
          // motion.md: spatial motion collapses to nothing for reduced
          // motion, not a faster version of itself — no AnimatePresence,
          // no slide, the new page is just there.
          children
        ) : (
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={location.pathname}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
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
      className={`pub-btn ${tone === 'gold' ? 'pub-btn-primary' : 'pub-btn-line'} ${size === 'lg' ? 'pub-btn-lg' : ''} scholr-focus`}
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
