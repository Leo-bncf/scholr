import React from 'react';

/**
 * A school week, drawn.
 *
 * The hero used to be a 145vh parallax with the word "Scholr" scrolling past
 * in 18rem type and no product anywhere. This replaces it with the artefact
 * the entire audience reads every single morning: a timetable grid.
 *
 * It is drawn from tokens rather than being a screenshot, so it can't go stale
 * when the product changes, and it stays sharp on any display. It is also
 * honest — it shows the shape of the data, and claims nothing the product
 * doesn't do.
 */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// A plausible DP week. Deliberately not full: real timetables have gaps, and a
// solid block of colour would look like a marketing illustration.
const WEEK = [
  ['Maths HL',   'Biology HL', 'Maths HL',   'TOK',        'Biology HL'],
  ['English A',  'Maths HL',   'Physics SL', 'English A',  'Maths HL'],
  [null,         'TOK',        'Biology HL', 'Physics SL', null],
  ['Physics SL', 'English A',  null,         'Maths HL',   'English A'],
  ['Spanish B',  null,         'Spanish B',  'Biology HL', 'CAS'],
  ['Biology HL', 'Physics SL', 'English A',  null,         'Spanish B'],
];

const PERIODS = ['08:30', '09:30', '10:45', '11:45', '13:30', '14:30'];

// The one highlighted cell — "what's on now". Row 2, Wednesday.
const NOW = [2, 2];

export default function WeekGrid() {
  return (
    <figure className="m-0 scholr-panel overflow-hidden" aria-label="An example week in a Diploma Programme timetable">
      <figcaption
        className="flex items-baseline gap-3 px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--rule-soft)' }}
      >
        <span className="scholr-label">Week 12 · DP1</span>
        <span className="scholr-label ml-auto" style={{ color: 'var(--brand)' }}>Live</span>
      </figcaption>

      <div className="overflow-x-auto">
        <table
          className="w-full"
          style={{ borderCollapse: 'collapse', minWidth: '30rem', tableLayout: 'fixed' }}
        >
          <thead>
            <tr>
              <th style={{ width: '3.6rem' }} />
              {DAYS.map(d => (
                <th
                  key={d}
                  scope="col"
                  className="scholr-label"
                  style={{ textAlign: 'left', padding: '0.45rem 0.6rem', fontWeight: 500 }}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEK.map((row, r) => (
              <tr key={r}>
                <th
                  scope="row"
                  className="scholr-label scholr-num"
                  style={{ textAlign: 'left', padding: '0.5rem 0.6rem', fontWeight: 400, verticalAlign: 'middle' }}
                >
                  {PERIODS[r]}
                </th>
                {row.map((cell, c) => {
                  const isNow = r === NOW[0] && c === NOW[1];
                  return (
                    <td
                      key={c}
                      style={{
                        borderTop: '1px solid var(--rule-soft)',
                        borderLeft: '1px solid var(--rule-soft)',
                        padding: '0.4rem',
                        height: '2.6rem',
                        verticalAlign: 'middle',
                      }}
                    >
                      {cell && (
                        <span
                          className="block truncate text-xs"
                          style={{
                            background: isNow ? 'var(--brand)' : 'var(--surface-sunk)',
                            color: isNow ? 'var(--brand-ink)' : 'var(--body)',
                            borderRadius: '4px',
                            padding: '0.28rem 0.45rem',
                          }}
                        >
                          {cell}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
