import React, { useEffect, useRef, useState } from 'react';

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
export default function AppShell({ title, eyebrow, actions, children }) {
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
          minHeight: '3.25rem', padding: '0 var(--space-md)',
        }}
      >
        <span className="app-toolbar-title" style={{ minWidth: 0 }}>{title}</span>
        {actions && <span style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-2xs)' }}>{actions}</span>}
      </div>

      <div style={{ padding: '0 var(--space-md) var(--space-2xl)' }}>
        <header style={{ padding: 'var(--space-md) 0 var(--space-lg)' }}>
          {eyebrow && <p className="scholr-label" style={{ margin: '0 0 .4rem' }}>{eyebrow}</p>}
          <h1 className="app-title">{title}</h1>
        </header>
        {/* Zero-height marker: when it leaves the viewport the toolbar takes
            over the title. Watching the heading itself would flip the state
            while the heading is still half-visible. */}
        <div ref={sentinel} aria-hidden="true" style={{ height: 0, marginTop: '-1.25rem' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
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
export function Group({ title, action, children }) {
  return (
    <section>
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

  if (href) return <a href={href} className="app-row scholr-focus" style={style}>{inner}</a>;
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
