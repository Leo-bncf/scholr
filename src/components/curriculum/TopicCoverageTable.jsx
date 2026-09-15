import React from 'react';
import { Group } from '@/components/app/AppShell';
import DataTable from '@/components/app/DataTable';
import StatusChip from '@/components/app/StatusChip';

/**
 * Every topic in the selected subject, and how the class is doing on it.
 *
 * Was its own <table> with its own header cells and its own uppercase styling
 * — the fourth such table in the section, each slightly different. DataTable
 * declares the columns as data so alignment and the empty state cannot drift.
 */
export default function TopicCoverageTable({ rows = [] }) {
  return (
    <Group title="Topics">
      <DataTable
        columns={[
          {
            key: 'title',
            header: 'Topic',
            render: (row) => (
              <>
                <span style={{ display: 'block', color: 'var(--ink)' }}>{row.title}</span>
                {row.subtopics?.length > 0 && (
                  <span style={{ display: 'block', fontSize: '.76rem', color: 'var(--muted)' }}>
                    {row.subtopics.join(', ')}
                  </span>
                )}
              </>
            ),
          },
          { key: 'assignmentCount', header: 'Assignments', num: true },
          {
            key: 'averageScore',
            header: 'Average',
            num: true,
            render: (row) => (row.averageScore !== null ? `${row.averageScore}%` : '—'),
          },
          {
            key: 'indicator',
            header: '',
            render: (row) => (row.indicatorTone
              ? <StatusChip tone={row.indicatorTone}>{row.indicatorLabel}</StatusChip>
              : <span style={{ color: 'var(--muted)' }}>{row.indicatorLabel}</span>),
          },
          {
            key: 'covered',
            header: 'Taught',
            /* "Not covered" is the actionable half, so it is the half that
               gets a chip; "Covered" was a filled badge on most rows. */
            render: (row) => (row.covered
              ? <span style={{ color: 'var(--muted)' }}>Yes</span>
              : <StatusChip tone="warn">Not yet</StatusChip>),
          },
        ]}
        rows={rows}
        rowKey={(row) => row.id}
        empty="This subject has no topics mapped yet. Add them under Curriculum for the subject."
      />
    </Group>
  );
}
