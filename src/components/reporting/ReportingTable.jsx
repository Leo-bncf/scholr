import React from 'react';

export default function ReportingTable({ columns = [], rows = [] }) {
  return (
    <div className="app-group overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="scholr-sunk border-b scholr-rule">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left text-xs font-semibold scholr-muted uppercase">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y scholr-divide">
            {rows.map((row, index) => (
              <tr key={row.id || index}>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 scholr-body">{row[column.key] ?? '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}