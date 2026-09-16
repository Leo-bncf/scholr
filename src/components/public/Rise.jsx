import React, { useEffect, useRef, useState } from 'react';

/**
 * Reveal a block once, as it arrives.
 *
 * Visible by default and only hidden when we have an observer to show it
 * again — the same rule the captions learned the hard way, when a block that
 * started at opacity 0 stayed there because its observer never fired.
 *
 * IntersectionObserver, never a scroll listener; reveal-once, never parallax.
 *
 * `from` picks the pending-state offset: 'up' (default, the original
 * vertical rise) or 'right' (slides in from the right instead — Landing
 * uses this on a few elements for a less uniform entrance; every other
 * page's use of Rise, via PublicShell's <Section>, is untouched since it
 * doesn't pass `from` and keeps defaulting to 'up').
 */
export default function Rise({ as: As = 'div', delay = 0, from = 'up', children, ...rest }) {
  const ref = useRef(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (el.getBoundingClientRect().top < window.innerHeight) return undefined;

    setPending(true);
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setPending(false); io.disconnect(); } },
      { rootMargin: '-6% 0px' },
    );
    io.observe(el);
    const failsafe = setTimeout(() => setPending(false), 3000);
    return () => { io.disconnect(); clearTimeout(failsafe); };
  }, []);

  return (
    <As
      ref={ref}
      className={`rise ${rest.className || ''}`}
      data-rise={pending ? 'pending' : 'in'}
      data-from={from}
      style={{ transitionDelay: pending ? `${delay}ms` : '0ms', ...rest.style }}
      {...Object.fromEntries(Object.entries(rest).filter(([k]) => k !== 'className' && k !== 'style'))}
    >
      {children}
    </As>
  );
}
