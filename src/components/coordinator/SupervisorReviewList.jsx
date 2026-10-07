import React from 'react';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';

/**
 * SupervisorReviewList
 *
 * Tracks faculty supervisors with pending Extended Essay milestone reviews.
 */
export default function SupervisorReviewList({ eeMilestones = [] }) {
  // Group submitted milestones waiting for supervisor review
  const pendingMilestones = eeMilestones.filter(m => m.status === 'submitted');

  const supervisorMap = {};
  pendingMilestones.forEach(m => {
    const name = m.supervisor_name || 'Unassigned Supervisor';
    if (!supervisorMap[name]) {
      supervisorMap[name] = [];
    }
    supervisorMap[name].push(m);
  });

  const supervisors = Object.entries(supervisorMap)
    .map(([name, items]) => ({ name, count: items.length, items }))
    .sort((a, b) => b.count - a.count);

  return (
    <Group title="Pending Extended Essay Reviews">
      {supervisors.length === 0 ? (
        <GroupEmpty>All submitted Extended Essay milestones have been reviewed by faculty supervisors.</GroupEmpty>
      ) : (
        supervisors.map(({ name, count }) => (
          <Row
            key={name}
            label={name}
            detail={`${count} student draft${count > 1 ? 's' : ''} awaiting review`}
            value={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <StatusChip tone={count >= 3 ? 'crit' : 'warn'}>
                  {count} pending
                </StatusChip>
              </div>
            }
          />
        ))
      )}
    </Group>
  );
}
