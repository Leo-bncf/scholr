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
  info: { color: 'var(--cobalt)', background: 'var(--cobalt-sf)', borderColor: 'var(--cobalt)' },
  mute: { color: 'var(--muted)', background: 'transparent', borderColor: 'var(--rule)' },
};

export default function StatusChip({ tone = 'mute', children }) {
  return (
    <span
      className="cobalt-label shrink-0"
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
