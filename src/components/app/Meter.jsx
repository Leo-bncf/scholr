import React from 'react';

/**
 * A proportion, drawn against its own 100% track.
 *
 * The track matters: without it a bar is only comparable to the bars beside
 * it, and "83% attendance" needs to read against 100, not against the other
 * rows. Purely decorative — every caller shows the number too — so it is
 * hidden from assistive tech rather than given a redundant ARIA label.
 */
const TONES = {
  accent: 'var(--brand)',
  good: 'var(--good)',
  warn: 'var(--warn)',
  crit: 'var(--crit)',
  mute: 'var(--faint)',
};

export default function Meter({ value, tone = 'accent', height = 6 }) {
  const pct = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div
      aria-hidden="true"
      style={{
        height: `${height}px`,
        borderRadius: `${height / 2}px`,
        background: 'var(--surface-sunk)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: `${height / 2}px`,
          background: TONES[tone] ?? TONES.accent,
        }}
      />
    </div>
  );
}
