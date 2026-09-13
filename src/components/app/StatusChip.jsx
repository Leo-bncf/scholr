import React from 'react';

/**
 * A state, shown as colour AND a word.
 *
 * Status is a reserved palette — good / warning / critical — never reused for
 * decoration. The label is not optional: colour alone fails for a colourblind
 * reader, in print, and in forced-colors mode.
 */
const TONES = {
  good: { color: 'var(--good)', background: 'var(--good-sf)', borderColor: 'var(--good)' },
  warn: { color: 'var(--warn)', background: 'var(--warn-sf)', borderColor: 'var(--warn)' },
  crit: { color: 'var(--crit)', background: 'var(--crit-sf)', borderColor: 'var(--crit)' },
  // Not the brand green. Now that the accent IS green, an `info` chip drawn in
  // it sits next to a green `good` chip and the two read as the same state —
  // so `info` is a filled neutral instead: clearly a chip, clearly not a
  // judgement about health.
  info: { color: 'var(--ink)', background: 'var(--surface-sunk)', borderColor: 'var(--muted)' },
  mute: { color: 'var(--muted)', background: 'transparent', borderColor: 'var(--rule)' },
};

export default function StatusChip({ tone = 'mute', children }) {
  return (
    <span
      className="scholr-label shrink-0"
      style={{
        ...TONES[tone] ?? TONES.mute,
        fontSize: '0.6rem',
        padding: '0.16rem 0.42rem',
        borderRadius: '4px',
        borderWidth: '1px',
        borderStyle: 'solid',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
