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
export default function StatCard({ label, value, trend, hint }) {
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
          color: 'var(--ink)',
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
