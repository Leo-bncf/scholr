import React from 'react';
import { GroupEmpty } from '@/components/app/AppShell';

/**
 * A table for the signed-in app.
 *
 * Meant to be placed inside a <Group>, which supplies the surface, the radius
 * and the shadow — the table itself draws none of those, because a bordered
 * table inside a bordered card is the card-in-card tell.
 *
 * Columns are declared as data rather than as JSX so that alignment, the
 * monospace treatment for numbers, and the empty state can't drift between
 * one table and the next:
 *
 *   <DataTable
 *     columns={[
 *       { key: 'name',  header: 'School' },
 *       { key: 'seats', header: 'Seats', num: true },
 *       { key: 'state', header: '', render: (row) => <StatusChip … /> },
 *     ]}
 *     rows={schools}
 *     rowKey={(s) => s.id}
 *     onRowClick={(s) => navigate(…)}
 *     empty="No schools match this filter."
 *   />
 */
export default function DataTable({ columns, rows, rowKey, onRowClick, empty = 'Nothing to show.' }) {
  if (!rows || rows.length === 0) return <GroupEmpty>{empty}</GroupEmpty>;

  return (
    <div className="app-tablewrap">
      <table className="app-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.num ? 'num' : undefined} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={rowKey ? rowKey(row) : i}
              data-clickable={onRowClick ? 'true' : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.num ? 'num' : undefined}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
