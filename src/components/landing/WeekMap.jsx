import React, { useState } from 'react';

/**
 * Hallmark · macrostructure 19 Map / Diagram.
 *
 * One spatial composition organises the page: a school week. Not a decorative
 * grid — a timetable is the artefact every person in a school reads fluently,
 * and laying the page out as one says the product's actual claim structurally
 * instead of in a sentence. Four curricula, one building, the same Tuesday.
 *
 * Why not colour-code the curricula: four hues would put a rainbow back into a
 * green-and-white product, which is the thing we have spent the day removing.
 * They are four tints of the one brand green — a sequential ramp, light to
 * dark — plus a written label in every cell, so the difference survives
 * colourblindness, print and a grey monitor. Colour is never the only
 * encoding here.
 *
 * The grid scrolls sideways under 60rem rather than reflowing into a list. A
 * timetable that has stopped being a grid has stopped being a timetable.
 */

const PERIODS = ['08:30', '09:30', '11:00', '13:30', '14:30'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/** Tints of the one green. `depth` indexes a ramp, it is not a hue. */
const PROGRAMMES = {
  dp: { label: 'IB DP', depth: 4 },
  myp: { label: 'MYP', depth: 3 },
  igcse: { label: 'IGCSE', depth: 2 },
  alevel: { label: 'A-Level', depth: 1 },
};

/**
 * A fictional school. Rathmore International is invented and stays invented —
 * naming a real school on a marketing page is a claim we cannot support.
 */
const WEEK = {
  '08:30': {
    Mon: { subject: 'Mathematics AA HL', programme: 'dp', room: 'B204' },
    Tue: { subject: 'Physics', programme: 'igcse', room: 'Lab 2' },
    Wed: { subject: 'Mathematics AA HL', programme: 'dp', room: 'B204' },
    Thu: { subject: 'English Literature', programme: 'alevel', room: 'A108' },
    Fri: { subject: 'Sciences', programme: 'myp', room: 'Lab 1' },
  },
  '09:30': {
    Mon: { subject: 'Theory of Knowledge', programme: 'dp', room: 'A101' },
    Tue: { subject: 'History', programme: 'alevel', room: 'A203' },
    Thu: { subject: 'Individuals & Societies', programme: 'myp', room: 'A110' },
    Fri: { subject: 'Chemistry', programme: 'igcse', room: 'Lab 2' },
  },
  '11:00': {
    Mon: { subject: 'Biology SL', programme: 'dp', room: 'Lab 3' },
    Tue: { subject: 'Design', programme: 'myp', room: 'D1' },
    Wed: { subject: 'Business', programme: 'alevel', room: 'A205' },
    Thu: { subject: 'Mathematics', programme: 'igcse', room: 'B201' },
    Fri: { subject: 'Biology SL', programme: 'dp', room: 'Lab 3' },
  },
  '13:30': {
    Mon: { subject: 'Language & Literature', programme: 'myp', room: 'A104' },
    Wed: { subject: 'Extended Essay supervision', programme: 'dp', room: 'Library' },
    Thu: { subject: 'Geography', programme: 'igcse', room: 'A107' },
    Fri: { subject: 'Economics', programme: 'alevel', room: 'A206' },
  },
  '14:30': {
    Tue: { subject: 'CAS reflection', programme: 'dp', room: 'A101' },
    Wed: { subject: 'Personal Project', programme: 'myp', room: 'Library' },
    Fri: { subject: 'Coursework clinic', programme: 'igcse', room: 'A107' },
  },
};

/**
 * What the software does at that moment. One true sentence per programme —
 * these describe behaviour that exists, not a roadmap.
 */
const NOTES = {
  dp: {
    title: 'Levels 1–7, against published criteria',
    body: 'A DP class is marked on the IB scale, and predictions carry the history behind them so a coordinator can question a number rather than overwrite it. CAS, EE and TOK are tracked per student.',
  },
  myp: {
    title: 'Four criteria, A to D, per subject',
    body: 'MYP marking uses its own criteria and its own reporting shape. The same gradebook holds it without a school having to pretend it is a DP class with different labels.',
  },
  igcse: {
    title: 'Letter grades and coursework deadlines',
    body: 'IGCSE reports in letters, not levels, and the coursework calendar is the thing that actually needs watching. Nothing on this screen asks an IGCSE teacher about CAS.',
  },
  alevel: {
    title: 'A*–E, with UCAS predictions in mind',
    body: 'A-Level teaching sits in the same timetable and the same records, reporting on its own scale. A school running it alongside DP does not run two systems.',
  },
};

function tintFor(depth, selected) {
  // A single hue at four lightnesses. Selected cells go to the solid brand.
  if (selected) return { background: 'var(--brand)', color: 'var(--brand-ink)', borderColor: 'var(--brand)' };
  const lightness = [97, 94, 90, 85][depth - 1];
  return {
    background: `oklch(${lightness}% 0.035 152)`,
    color: 'var(--ink)',
    borderColor: `oklch(${lightness - 6}% 0.04 152)`,
  };
}

export default function WeekMap() {
  const [selected, setSelected] = useState({ period: '09:30', day: 'Mon' });

  const cell = WEEK[selected.period]?.[selected.day];
  const note = cell ? NOTES[cell.programme] : null;

  return (
    <section
      aria-labelledby="week-map-heading"
      style={{ padding: 'clamp(2.5rem, 6vw, 4.5rem) var(--space-md)' }}
    >
      <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
        <p
          className="scholr-num"
          style={{
            fontFamily: 'var(--font-mono)', fontSize: '.72rem', letterSpacing: '.11em',
            textTransform: 'uppercase', color: 'var(--brand)', margin: '0 0 .5rem',
          }}
        >
          One building · four programmes · the same week
        </p>
        <h1
          id="week-map-heading"
          className="pub-display"
          style={{
            margin: '0 0 .7rem', fontSize: 'clamp(1.9rem, 4.2vw, 2.9rem)',
            lineHeight: 1.08, letterSpacing: '-0.03em', maxWidth: '22ch',
            color: 'var(--brand)',
          }}
        >
          This is a real school week. Your software should read it too.
        </h1>
        <p style={{ margin: '0 0 var(--space-lg)', maxWidth: '54ch', color: 'var(--muted)', fontSize: '1.02rem' }}>
          Rathmore runs IB Diploma, MYP, IGCSE and A&#8209;Level in the same corridors.
          Pick any period and see what Scholr does at that moment — different scales,
          different reports, one set of records.
        </p>

        {/* ── The map ─────────────────────────────────────────────────── */}
        <div className="weekmap__scroll">
          <table className="weekmap" aria-describedby="week-map-legend">
            <caption className="sr-only">
              A week timetable. Select a period to see how Scholr handles that programme.
            </caption>
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">Period</span></th>
                {DAYS.map((d) => <th key={d} scope="col">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period}>
                  <th scope="row" className="weekmap__time">{period}</th>
                  {DAYS.map((day) => {
                    const c = WEEK[period]?.[day];
                    if (!c) return <td key={day} className="weekmap__free" aria-hidden="true" />;
                    const isSel = selected.period === period && selected.day === day;
                    return (
                      <td key={day} style={{ padding: 0 }}>
                        <button
                          type="button"
                          onClick={() => setSelected({ period, day })}
                          aria-pressed={isSel}
                          className="weekmap__cell scholr-focus"
                          style={tintFor(PROGRAMMES[c.programme].depth, isSel)}
                        >
                          <span className="weekmap__prog">{PROGRAMMES[c.programme].label}</span>
                          <span className="weekmap__subject">{c.subject}</span>
                          <span className="weekmap__room">{c.room}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Legend ───────────────────────────────────────────────────── */}
        <div id="week-map-legend" className="weekmap__legend">
          {Object.entries(PROGRAMMES).map(([key, p]) => (
            <span key={key} className="weekmap__legend-item">
              <span className="weekmap__swatch" style={{ background: tintFor(p.depth, false).background }} />
              {p.label}
            </span>
          ))}
          <span className="weekmap__legend-item weekmap__legend-note">
            One green, four tints — the label carries the difference, not the colour.
          </span>
        </div>

        {/* ── What the selection means ─────────────────────────────────── */}
        {cell && note && (
          <div className="weekmap__panel" role="status">
            <p className="weekmap__panel-when">
              {selected.day} {selected.period} · {cell.subject} · {cell.room}
            </p>
            <h2 className="weekmap__panel-title">{note.title}</h2>
            <p className="weekmap__panel-body">{note.body}</p>
          </div>
        )}
      </div>
    </section>
  );
}
