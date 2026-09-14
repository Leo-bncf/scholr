import React from 'react';

/**
 * A row of stat tiles joined by hairlines into one object.
 *
 * Four separate bordered cards read as four things to look at; one bordered
 * row with dividers reads as a single instrument panel, which is what a
 * dashboard header is.
 *
 * The dividers are a 1px grid `gap` over a rule-coloured background rather
 * than a border on each cell. With `auto-fit` the column count depends on the
 * viewport, so which cells land on a row edge isn't knowable in advance — this
 * way the hairlines are always right, at any wrap, with no nth-child guessing.
 */
export default function StatRow({ children, min = '9rem' }) {
  return (
    <div
      className="scholr-grid app-statrow"
      style={{
        // minmax(min(x, 100%), 1fr) rather than minmax(x, 1fr): the bare form
        // refuses to shrink below x and pushes the page into horizontal scroll
        // on a narrow phone.
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}, 100%), 1fr))`,
      }}
    >
      {React.Children.toArray(children).filter(Boolean).map((child, i) => (
        <div key={i}>{child}</div>
      ))}
    </div>
  );
}
