import React from 'react';

/**
 * A single statistic.
 *
 * A stat tile, deliberately not a chart: these are single magnitudes with no
 * trend to read, and a sparkline behind "3 classes" would be decoration.
 *
 * The previous version gave every tile a coloured accent bar, a filled icon
 * chip and a drop shadow, so four of them read as four competing objects.
 * Cobalt puts the weight on the number and lets hairlines do the structure,
 * which is why there is no longer a per-tile `color` — Cobalt has one accent
 * and a stat tile is not what it is for.
 *
 * Six other files declare their own local `StatCard`. They are not this one.
 * Folding them in is worth doing, but it is a change to those screens, not to
 * this component.
 */
export default function StatCard({ label, value, trend, hint }) {
  return (
    <div className="px-4 py-3.5">
      <p className="cobalt-label m-0">{label}</p>
      <p
        className="cobalt-num m-0 mt-1 leading-none"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.85rem',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: 'var(--ink)',
        }}
      >
        {value}
      </p>
      {(trend || hint) && (
        <p className="m-0 mt-1.5 text-xs" style={{ color: 'var(--muted)' }}>
          {trend || hint}
        </p>
      )}
    </div>
  );
}
