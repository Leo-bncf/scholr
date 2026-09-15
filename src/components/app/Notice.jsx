import React from 'react';

/**
 * A short message about the page, set apart from it.
 *
 * The signed-in app had roughly a hundred of these written by hand, as
 * `bg-amber-50 border border-amber-200 rounded-lg p-4` and eleven variations
 * on it. Two problems followed. Blue and indigo were used for ordinary
 * explanation, which spends colour on something nobody has to act on and
 * clashes with a product whose one accent is green. And a page with three of
 * them — a blue tip, an amber caution, a red error — read as an incident when
 * nothing at all was wrong.
 *
 * So: `info` is the default and carries no hue. It is a rule down the left and
 * quiet text, which is enough to say "this is about the page, not part of it".
 * `warn` and `crit` draw from the reserved status palette, and are for
 * something a person has to do.
 */
const TONES = {
  info: { rule: 'var(--rule)', ink: 'var(--muted)', ground: 'transparent' },
  warn: { rule: 'var(--warn)', ink: 'var(--body)', ground: 'var(--warn-sf)' },
  crit: { rule: 'var(--crit)', ink: 'var(--body)', ground: 'var(--crit-sf)' },
  good: { rule: 'var(--good)', ink: 'var(--body)', ground: 'var(--good-sf)' },
};

export default function Notice({ tone = 'info', title, action, children }) {
  const t = TONES[tone] || TONES.info;
  return (
    <div
      role={tone === 'crit' ? 'alert' : undefined}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '.9rem',
        borderLeft: `2px solid ${t.rule}`,
        background: t.ground,
        padding: '.7rem .9rem',
        borderRadius: tone === 'info' ? 0 : '0 6px 6px 0',
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        {title && (
          <p style={{ margin: '0 0 .15rem', fontSize: '.88rem', fontWeight: 550, color: 'var(--ink)' }}>
            {title}
          </p>
        )}
        <div style={{ fontSize: '.85rem', color: t.ink, lineHeight: 1.5 }}>{children}</div>
      </div>
      {action && <div style={{ flex: 'none' }}>{action}</div>}
    </div>
  );
}
