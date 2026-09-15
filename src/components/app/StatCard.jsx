import React from 'react';

/**
 * A single statistic.
 *
 * A stat tile, deliberately not a chart: these are single magnitudes with no
 * trend to read, and a sparkline behind "3 classes" would be decoration.
 *
 * The figure leads at display size with tight tracking, the label sits above
 * it small and quiet, and the qualifier sits below. Reading order is
 * label → number → context, which is the order the question arrives in.
 *
 * `color` and `icon` are gone. There is one accent in this product and a stat
 * tile is not what it is for.
 */
/* `tone` colours the FIGURE, not the tile.
 *
 * A metric that used to be an alert loses its urgency the moment it becomes a
 * plain number: "work missing 100%" rendered exactly as calmly as "3 classes".
 * The reserved palette carries it back, on the digits only — a fully tinted
 * tile would make a normal reading look like an incident, and four tinted
 * tiles in a row is the wall of colour this product spent the day removing.
 * The hint text still says what the number means, so colour is never the only
 * encoding. */
const TONE_COLOR = {
  good: 'var(--good)',
  warn: 'var(--warn)',
  crit: 'var(--crit)',
};

export default function StatCard({ label, value, trend, hint, tone }) {
  return (
    <div style={{ padding: '.85rem .95rem' }}>
      <p className="scholr-label" style={{ margin: 0 }}>{label}</p>
      <p
        className="scholr-num"
        style={{
          margin: '.3rem 0 0',
          fontFamily: 'var(--font-display)',
          fontSize: '1.9rem',
          fontWeight: 620,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: TONE_COLOR[tone] || 'var(--ink)',
        }}
      >
        {value}
      </p>
      {(trend || hint) && (
        <p style={{ margin: '.35rem 0 0', fontSize: '.78rem', color: 'var(--muted)' }}>
          {trend || hint}
        </p>
      )}
    </div>
  );
}
