import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * The Workbench block: one product capture, one caption, one annotation.
 *
 * The frame IS the divider — Workbench pages separate sections by gap and
 * frame rather than by rules or coloured bands, so there is deliberately no
 * border, no eyebrow and no section heading between these.
 *
 * The figure carries at most a hairline. No drawn browser chrome: no URL pill,
 * no traffic lights, no fake window bar. The viewer's own browser is already
 * the chrome, and re-drawing it is a named tell.
 *
 * Annotations sit just inside the frame, in a part of the capture that is
 * empty. They used to hang off the outside edge, which looked deliberate at
 * 1600 px and was sliced in half by `overflow-x: clip` at 1280 — the width
 * most people actually use.
 */
export function Bench({ n, caption, note, src, alt, annotations = [], eager = false }) {
  const ref = useRef(null);

  // Visible by default, and only hidden if we are certain we can reveal it
  // again. A reveal-on-scroll that starts at opacity 0 and depends on an
  // observer firing will, the one time the observer doesn't fire, hide the
  // content forever — which is exactly what happened here: the third caption
  // never appeared. Hiding is opt-in, done in a layout effect so there is no
  // flash, and only for elements that are actually below the fold.
  const [shown, setShown] = useState(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight) return undefined;
    setShown(false);
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { rootMargin: '-8% 0px' },
    );
    io.observe(el);
    // Belt and braces: if the observer somehow never fires, the caption still
    // arrives. Invisible copy is a worse failure than an unanimated one.
    const failsafe = setTimeout(() => setShown(true), 3000);
    return () => { io.disconnect(); clearTimeout(failsafe); };
  }, []);

  return (
    <section ref={ref} style={{ padding: '0 1.5rem', margin: '0 auto', maxWidth: '76rem' }}>
      <div
        /* Gate 54 (auto-fail): a label and a heading in the same wrapper must
           resolve to a single column. The number sits ABOVE the caption, never
           beside it — tag-left/heading-right is the templated-editorial tell. */
        style={{
          display: 'flex', flexDirection: 'column', gap: 'var(--space-3xs)',
          marginBottom: 'var(--space-sm)',
          opacity: shown ? 1 : 0,
          transform: shown ? 'none' : 'translateY(6px)',
          transition: 'opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out)',
        }}
      >
        <span
          className="scholr-num"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '.72rem', color: 'var(--brand)', letterSpacing: '.08em' }}
        >
          {n}
        </span>
        <h2 className="pub-display" style={{ margin: 0, fontSize: 'clamp(1.15rem, 2.1vw, 1.45rem)', letterSpacing: '-0.028em', maxWidth: '30ch' }}>
          {caption}
        </h2>
        {note && (
          <p style={{ margin: 'var(--space-3xs) 0 0', fontSize: '.92rem', color: 'var(--muted)', maxWidth: '52ch' }}>
            {note}
          </p>
        )}
      </div>

      <figure style={{ margin: 0, position: 'relative' }}>
        <img
          src={src}
          alt={alt}
          width="1320"
          height="840"
          className="pub-shot"
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={eager ? 'high' : undefined}
        />
        {annotations.map(a => (
          <figcaption
            key={a.text}
            className="bench-note"
            style={{ top: a.top, left: a.left, right: a.right }}
          >
            {a.text}
          </figcaption>
        ))}
      </figure>
    </section>
  );
}

/**
 * The sticky call to action.
 *
 * Workbench puts this after the third capture — once the reader has enough
 * context for the ask to mean something. It slides in at that point rather
 * than shadowing the page from the first pixel, which is nagging, not selling.
 */
export function StickyCTA({ afterRef, suppressed = false }) {
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const el = afterRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => setPassed(e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [afterRef]);

  // Two bottom-anchored asks at once is one too many, and between roughly 800
  // and 1000 px the cookie notice and this bar physically overlap. The notice
  // is dismissed once; the bar waits its turn.
  const shown = passed && !suppressed;

  return (
    <div
      aria-hidden={!shown}
      className="bench-cta"
      style={{
        transform: shown ? 'translateY(0)' : 'translateY(120%)',
        visibility: shown ? 'visible' : 'hidden',
      }}
    >
      <p style={{ margin: 0, fontSize: '.9rem', color: 'var(--body)' }}>
        Thirty minutes, against your own timetable.
      </p>
      <a href="/BookDemo" className="pub-btn pub-btn-gold scholr-focus" style={{ marginLeft: 'auto' }} tabIndex={shown ? 0 : -1}>
        Book a demo
      </a>
    </div>
  );
}
