import React from 'react';
import { Group } from '@/components/app/AppShell';
import DataTable from '@/components/app/DataTable';

/**
 * The rows of a built report.
 *
 * Was its own <table>, the fifth in the section. DataTable declares the
 * columns as data, so alignment, the monospace treatment for numbers and the
 * empty state cannot drift from every other table in the product.
 */
export default function ReportingTable({ columns = [], rows = [] }) {
  return (
    <Group title="Results" action={<span className="scholr-label">{rows.length} rows</span>}>
      <DataTable
        columns={columns.map((c) => ({ key: c.key, header: c.label, num: c.num }))}
        rows={rows}
        rowKey={(row, i) => row.id || i}
        empty="Nothing matches these filters. Widen the dates, or clear a filter."
      />
    </Group>
  );
}
