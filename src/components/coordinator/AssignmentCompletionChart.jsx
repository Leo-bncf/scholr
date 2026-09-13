import React from 'react';
import { Panel, PanelEmpty } from '@/components/app/Panel';
import Meter from '@/components/app/Meter';

/**
 * Completion rate per class.
 *
 * Horizontal bars, not the vertical recharts bars this used to be: the
 * categories are class names, and names read left-to-right. Vertically they
 * had to be truncated to 18 characters and still collided on the axis.
 *
 * One measure, one series, so there is no legend and no colour coding — bar
 * length is the whole encoding, and every bar carries its own number, which
 * removes the need for a hover tooltip to read a value at all.
 *
 * Sorted descending, because the question this answers is "which classes are
 * behind", and that is a ranking.
 */
export default function AssignmentCompletionChart({ data }) {
  const rows = [...data].sort((a, b) => b.completionRate - a.completionRate);

  return (
    <Panel title="Assignment completion">
      {rows.length === 0 ? (
        <PanelEmpty>
          No submissions recorded yet, so there is nothing to compare.
        </PanelEmpty>
      ) : (
        <div className="px-4 py-4 flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.name}>
              <div className="flex items-baseline gap-3 mb-1">
                <span className="text-sm min-w-0 break-words" style={{ color: 'var(--ink)' }}>
                  {row.name}
                </span>
                <span
                  className="ml-auto text-sm cobalt-num shrink-0"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--body)' }}
                >
                  {row.completionRate}%
                </span>
              </div>
              <Meter value={row.completionRate} />
            </div>
          ))}
          <p className="cobalt-label m-0 mt-1">Submitted ÷ expected, per class</p>
        </div>
      )}
    </Panel>
  );
}
