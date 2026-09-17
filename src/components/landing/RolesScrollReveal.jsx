import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import ZoomableShot from './ZoomableShot';

/**
 * The four role screenshots, but the scroll itself drives them in from the
 * right instead of a one-time reveal-on-intersect.
 *
 * Erik: the earlier Rise-based reveal (fade + slide, triggered once per
 * element as it crosses into view) didn't read as "non-linear" — each card
 * still just arrives independently while the page scrolls normally
 * underneath it. This is a genuinely different mechanism: a tall (230vh)
 * track holds a `position: sticky` viewport-height panel pinned in place
 * while you scroll through it, and `useScroll` + `useTransform` map that
 * scroll progress directly onto each card's horizontal position — so
 * scrolling down visually reads as pushing the cards in right-to-left
 * first, and only once the track is exhausted does the page unpin and
 * continue scrolling top-to-bottom as normal. Nothing else on the page
 * (layout, copy, the grid itself) changed — this replaces only how the
 * roles section arrives.
 *
 * `prefers-reduced-motion` skips the pin and the transform entirely: a
 * plain static grid, no track height, no scroll-linked motion — collapsing
 * a genuinely spatial effect like this to a faster version of itself isn't
 * enough, per motion.md, so it's not attempted here.
 */
const RANGES = [
  [0, 0.3],
  [0.15, 0.45],
  [0.3, 0.6],
  [0.45, 0.75],
];

function Caption({ role }) {
  return (
    <figcaption style={{ marginTop: '.5rem' }}>
      <span
        className="scholr-num"
        style={{
          display: 'block', fontFamily: 'var(--font-mono)', fontSize: '.64rem',
          letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--brand)',
        }}
      >
        {role.who}
      </span>
      <span style={{ display: 'block', marginTop: '.2rem', fontSize: '.84rem', lineHeight: 1.5, color: 'var(--muted)' }}>
        {role.line}
      </span>
    </figcaption>
  );
}

function ScrollCard({ role, src, scrollYProgress, range }) {
  const x = useTransform(scrollYProgress, range, ['55vw', '0vw']);
  const opacity = useTransform(scrollYProgress, range, [0, 1]);
  return (
    <motion.figure style={{ margin: 0, x, opacity }}>
      <ZoomableShot src={src} alt={`${role.who} view in Scholr`} width="1320" height="840" />
      <Caption role={role} />
    </motion.figure>
  );
}

function StaticCard({ role, src }) {
  return (
    <figure style={{ margin: 0 }}>
      <ZoomableShot src={src} alt={`${role.who} view in Scholr`} width="1320" height="840" />
      <Caption role={role} />
    </figure>
  );
}

export default function RolesScrollReveal({ roles, shots }) {
  const trackRef = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });

  if (reduced) {
    return (
      <div className="landing-roles">
        {roles.map((r) => <StaticCard key={r.key} role={r} src={shots[r.key]} />)}
      </div>
    );
  }

  return (
    <div ref={trackRef} style={{ position: 'relative', height: '230vh' }}>
      <div
        style={{
          position: 'sticky', top: '72px', height: 'calc(100vh - 72px)',
          display: 'flex', alignItems: 'center', overflow: 'hidden',
        }}
      >
        <div className="landing-roles" style={{ width: '100%' }}>
          {roles.map((r, i) => (
            <ScrollCard key={r.key} role={r} src={shots[r.key]} scrollYProgress={scrollYProgress} range={RANGES[i]} />
          ))}
        </div>
      </div>
    </div>
  );
}
