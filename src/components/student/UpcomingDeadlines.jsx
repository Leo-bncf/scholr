import React from 'react';
import { format, differenceInCalendarDays } from 'date-fns';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';
import { Clock, Calendar } from 'lucide-react';

/**
 * UpcomingDeadlines
 *
 * Shows assignments due in the next 48 hours and upcoming across the next fortnight.
 */
export default function UpcomingDeadlines({ assignments = [] }) {
  const now = new Date();

  const validAssignments = assignments
    .filter(a => a.due_date)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const immediate = validAssignments.filter(a => {
    const days = differenceInCalendarDays(new Date(a.due_date), now);
    return days <= 2;
  });

  const upcoming = validAssignments.filter(a => {
    const days = differenceInCalendarDays(new Date(a.due_date), now);
    return days > 2 && days <= 14;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {/* Due in next 48 hours */}
      <Group
        title="Due Soon (Next 48 Hours)"
        action={
          immediate.length > 0 && (
            <StatusChip tone={immediate.some(a => differenceInCalendarDays(new Date(a.due_date), now) <= 0) ? 'crit' : 'warn'}>
              {immediate.length} due
            </StatusChip>
          )
        }
      >
        {immediate.length === 0 ? (
          <GroupEmpty>Nothing due in the next 48 hours.</GroupEmpty>
        ) : (
          immediate.map(a => {
            const days = differenceInCalendarDays(new Date(a.due_date), now);
            const isToday = days <= 0;
            const isTomorrow = days === 1;
            const timeLabel = isToday ? 'due today' : isTomorrow ? 'due tomorrow' : 'in 2 days';

            return (
              <Row
                key={a.id}
                label={a.title}
                detail={a.class_name || a.type?.replace(/_/g, ' ')}
                value={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isToday ? 'var(--crit)' : 'var(--warn)' }}>
                    <Clock style={{ width: '0.85rem', height: '0.85rem' }} />
                    <span style={{ fontWeight: 600 }}>{timeLabel}</span>
                    <span style={{ color: 'var(--muted)', fontWeight: 400 }}>· {format(new Date(a.due_date), 'd MMM')}</span>
                  </span>
                }
              />
            );
          })
        )}
      </Group>

      {/* Upcoming across the next 14 days */}
      <Group title="Upcoming (Next 14 Days)">
        {upcoming.length === 0 ? (
          <GroupEmpty>No upcoming assignments scheduled in the next 14 days.</GroupEmpty>
        ) : (
          upcoming.slice(0, 6).map(a => {
            const days = differenceInCalendarDays(new Date(a.due_date), now);
            return (
              <Row
                key={a.id}
                label={a.title}
                detail={a.class_name || a.type?.replace(/_/g, ' ')}
                value={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--body)' }}>
                    <Calendar style={{ width: '0.85rem', height: '0.85rem', color: 'var(--muted)' }} />
                    <span>in {days} days</span>
                    <span style={{ color: 'var(--muted)' }}>· {format(new Date(a.due_date), 'd MMM')}</span>
                  </span>
                }
              />
            );
          })
        )}
      </Group>
    </div>
  );
}
