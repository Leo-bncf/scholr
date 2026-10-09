import React, { useState } from 'react';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';

/**
 * AtRiskStudents
 *
 * Displays students with active or borderline IBO Diploma failing conditions.
 */
export default function AtRiskStudents({ atRiskStudents = [], onSelectStudent }) {
  const [filter, setFilter] = useState('all');

  const filtered = atRiskStudents.filter(s => {
    if (filter === 'critical') return s.evaluation.criticalCount > 0;
    if (filter === 'borderline') return s.evaluation.criticalCount === 0 && s.evaluation.status === 'warn';
    return true;
  });

  return (
    <Group
      title="At-Risk Students"
      action={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2xs)' }}>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="scholr-focus"
            style={{
              fontSize: '0.75rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              border: '1px solid var(--rule)',
              background: filter === 'all' ? 'var(--brand-sf)' : 'transparent',
              color: filter === 'all' ? 'var(--brand)' : 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            All ({atRiskStudents.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('critical')}
            className="scholr-focus"
            style={{
              fontSize: '0.75rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '4px',
              border: '1px solid var(--rule)',
              background: filter === 'critical' ? 'var(--crit-sf)' : 'transparent',
              color: filter === 'critical' ? 'var(--crit)' : 'var(--muted)',
              cursor: 'pointer',
            }}
          >
            Failing Conditions ({atRiskStudents.filter(s => s.evaluation.criticalCount > 0).length})
          </button>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <GroupEmpty>
          {filter === 'critical'
            ? 'No students currently have active failing conditions.'
            : 'No at-risk students found.'}
        </GroupEmpty>
      ) : (
        filtered.map(student => {
          const evalRes = student.evaluation;
          const isCrit = evalRes.criticalCount > 0;
          const tone = isCrit ? 'crit' : 'warn';
          const primaryIssue = evalRes.failedConditions[0]?.label || 'Borderline threshold';

          return (
            <Row
              key={student.id}
              label={student.name || 'Candidate'}
              detail={
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                  <span style={{ color: isCrit ? 'var(--crit)' : 'var(--warn)', fontWeight: 500 }}>
                    {primaryIssue}
                  </span>
                  <span style={{ color: 'var(--muted)' }}>· HL: {evalRes.hlPoints}/12 · Total: {evalRes.totalPoints} pts</span>
                </span>
              }
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <StatusChip tone={tone}>
                    {isCrit ? 'Failing Condition' : 'Borderline'}
                  </StatusChip>
                  <span className="scholr-num" style={{ fontWeight: 700, fontSize: '0.95rem', color: isCrit ? 'var(--crit)' : 'var(--ink)' }}>
                    {evalRes.totalPoints}/45
                  </span>
                </div>
              }
              onClick={() => onSelectStudent?.(student)}
            />
          );
        })
      )}
    </Group>
  );
}
