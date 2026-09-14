import React from 'react';

/**
 * A titled surface, bounded by a hairline rather than a shadow.
 *
 * `dark` renders Cobalt's one graphite band — the single dark beat that gives
 * a page its light → dark → light rhythm. Use it once per dashboard, for the
 * thing that role opens the page to check.
 */
export function Panel({ title, action, dark = false, children, className = '' }) {
  return (
    <section className={`${dark ? 'scholr-band' : 'scholr-panel'} ${className}`}>
      {title && (
        <header
          className={`flex items-center gap-3 ${dark ? 'px-5 pt-4 pb-3' : 'px-4 py-2.5'}`}
          style={dark ? undefined : { borderBottom: '1px solid var(--rule-soft)' }}
        >
          <h2 className="scholr-label m-0" style={dark ? { color: 'var(--brand)' } : undefined}>
            {title}
          </h2>
          {action && <div className="ml-auto">{action}</div>}
        </header>
      )}
      {/* Rows inside a band are full-bleed (see scholr-theme.css), so the band's own
          horizontal padding lives here rather than on the section. */}
      <div className={dark ? 'px-5 pb-4' : ''}>{children}</div>
    </section>
  );
}

/**
 * One line inside a Panel: name, optional detail, and a right-aligned value.
 * The value is tabular so a column of them lines up.
 */
export function PanelRow({ name, detail, value, children }) {
  return (
    <div
      className="panel-row flex items-baseline gap-3 px-4 py-2.5"
      style={{ borderBottom: '1px solid var(--rule-soft)' }}
    >
      <span className="font-medium text-sm min-w-0 break-words" style={{ color: 'var(--ink)' }}>
        {name}
      </span>
      {detail && (
        <span className="text-xs shrink-0 capitalize" style={{ color: 'var(--muted)' }}>
          {detail}
        </span>
      )}
      {(value || children) && (
        <span
          className="ml-auto shrink-0 flex items-center gap-2 text-sm scholr-num whitespace-nowrap"
          style={{ fontFamily: children ? undefined : 'var(--font-mono)', color: 'var(--body)' }}
        >
          {children ?? value}
        </span>
      )}
    </div>
  );
}

/**
 * Wraps a PanelRow that navigates. A row that does something has to look like
 * it does something, and has to be reachable from the keyboard — hence a real
 * button/link element rather than an onClick on a div.
 */
export function PanelRowLink({ as: As = 'button', children, ...props }) {
  return (
    <As
      {...props}
      className={`panel-row-link scholr-focus block w-full text-left ${props.className || ''}`}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        font: 'inherit',
        color: 'inherit',
        textDecoration: 'none',
        cursor: 'pointer',
        ...props.style,
      }}
    >
      {children}
    </As>
  );
}

/** Shown instead of an empty list — says why it's empty, not just "no data". */
export function PanelEmpty({ children }) {
  return (
    <p className="panel-empty px-4 py-6 m-0 text-sm" style={{ color: 'var(--faint)' }}>
      {children}
    </p>
  );
}

export default Panel;
