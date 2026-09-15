import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * The signed-in page frame.
 *
 * Two Apple conventions carry most of the feel here, and both are structural
 * rather than decorative:
 *
 *   1. The title starts large in the content and collapses into the toolbar as
 *      you scroll. You always know where you are, without a header eating the
 *      top of every screen.
 *   2. The toolbar is a translucent material, so what scrolls under it stays
 *      faintly visible. Its hairline only appears once something is behind it.
 *
 * What stays from Hallmark: one accent, tokens for every colour, mono labels,
 * tabular figures, and motion limited to transform and opacity with a
 * reduced-motion fallback.
 */
export default function AppShell({ title, eyebrow, actions, tabs, children }) {
  const sentinel = useRef(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => setCollapsed(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="scholr-page min-h-screen">
      <div
        className="app-toolbar app-material"
        data-collapsed={collapsed}
        style={{
          position: 'sticky', top: 0, zIndex: 30,
          display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
          minHeight: '3.25rem',
        }}
      >
        <span
          className="app-measure"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
        >
          <span className="app-toolbar-title" style={{ minWidth: 0 }}>{title}</span>
          {/* The actions used to live only up here. Before the page scrolls
              the toolbar title is still faded out, so a page whose only action
              was a button showed that button floating alone against the top of
              the window, attached to nothing. They belong beside the heading,
              and reappear here once the heading has scrolled away. */}
          {actions && (
            <span
              aria-hidden={!collapsed}
              style={{
                marginLeft: 'auto', display: 'flex', gap: 'var(--space-2xs)',
                opacity: collapsed ? 1 : 0,
                pointerEvents: collapsed ? 'auto' : 'none',
                transition: 'opacity var(--dur-short) var(--ease-out)',
              }}
            >
              {actions}
            </span>
          )}
        </span>
      </div>

      {/* Content is held to a measure. Left to fill a 1440px window the groups
          sprawl, a row's label and its value end up a hand-span apart, and the
          page reads as unfinished rather than spacious. */}
      <div className="app-measure" style={{ paddingBottom: 'var(--space-3xl)' }}>
        {/* The tab bar belongs to the header. Rendered as the first child of
            the content column instead, it collected that column's --space-xl
            gap on top of the header's own padding, and every tabbed page had a
            hand-span of nothing between its title and its first row. */}
        <header style={{ padding: `var(--space-lg) 0 ${tabs ? 'var(--space-md)' : 'var(--space-xl)'}` }}>
          {eyebrow && <p className="scholr-label" style={{ margin: '0 0 .4rem' }}>{eyebrow}</p>}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <h1 className="app-title" style={{ margin: 0 }}>{title}</h1>
            {actions && (
              <span style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2xs)', alignItems: 'center' }}>
                {actions}
              </span>
            )}
          </div>
          {tabs && <div style={{ marginTop: 'var(--space-md)' }}>{tabs}</div>}
        </header>
        {/* Zero-height marker: when it leaves the viewport the toolbar takes
            over the title. Watching the heading itself would flip the state
            while the heading is still half-visible. */}
        <div ref={sentinel} aria-hidden="true" style={{ height: 0, marginTop: '-1.25rem' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * A grouped inset list — the iOS Settings shape.
 *
 * One containment layer: the group is the card and its rows are hairlines
 * inside it. Nothing nested gets its own border or shadow, which is the line
 * between this and the card-in-card tell.
 */
export function Group({ title, action, className, children }) {
  // className is forwarded because callers place groups inside a grid — the
  // Platform overview asks for lg:col-span-2. React drops unknown props on a
  // component silently, so for a while that group simply sat in one column and
  // nothing said why.
  return (
    <section className={className}>
      {(title || action) && (
        <div className="app-group-head">
          <h2 className="scholr-label" style={{ margin: 0 }}>{title}</h2>
          {action && <span style={{ marginLeft: 'auto' }}>{action}</span>}
        </div>
      )}
      <div className="app-group">{children}</div>
    </section>
  );
}

/** A row inside a Group. */
export function Row({ label, detail, value, children, onClick, href }) {
  const inner = (
    <>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: '.92rem', color: 'var(--ink)', overflowWrap: 'anywhere' }}>{label}</span>
        {detail && (
          <span style={{ display: 'block', marginTop: '.1rem', fontSize: '.8rem', color: 'var(--muted)' }}>{detail}</span>
        )}
      </span>
      {(value || children) && (
        <span
          className="scholr-num"
          style={{
            marginLeft: 'auto', flex: 'none', display: 'flex', alignItems: 'center', gap: '.5rem',
            fontSize: '.88rem', color: 'var(--body)',
            fontFamily: children ? undefined : 'var(--font-mono)',
          }}
        >
          {children ?? value}
        </span>
      )}
    </>
  );

  const style = {
    display: 'flex', alignItems: 'center', gap: '.75rem',
    padding: '.7rem .9rem', textDecoration: 'none', color: 'inherit',
    background: 'transparent', border: 'none', width: '100%', font: 'inherit', textAlign: 'left',
  };

  // An internal href goes through the router. This was a bare <a>, which threw
  // away the SPA on every click: full document reload, auth re-checked, every
  // query refetched, scroll lost. External links keep the plain anchor.
  if (href) {
    const external = /^(https?:)?\/\//.test(href) || href.startsWith('mailto:');
    if (external) {
      return (
        <a href={href} className="app-row scholr-focus" style={style} target="_blank" rel="noreferrer">
          {inner}
        </a>
      );
    }
    return <Link to={href} className="app-row scholr-focus" style={style}>{inner}</Link>;
  }
  if (onClick) return <button type="button" onClick={onClick} className="app-row scholr-focus" style={{ ...style, cursor: 'pointer' }}>{inner}</button>;
  return <div style={style}>{inner}</div>;
}

/** Shown instead of an empty list — says why it is empty. */
export function GroupEmpty({ children }) {
  return (
    <p style={{ margin: 0, padding: 'var(--space-md) .9rem', fontSize: '.88rem', color: 'var(--faint)' }}>
      {children}
    </p>
  );
}

/** A segmented control. Labels never move; the selected pill does. */
export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="app-segmented" role="tablist" aria-label={label}>
      {options.map(o => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className="app-segment scholr-focus"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
