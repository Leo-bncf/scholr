import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { format, getDay } from 'date-fns';
import * as scheduleEntriesData from '@/data/scheduleEntries';
import * as classesData from '@/data/classes';

/**
 * The day, as a timeline.
 *
 * This is the thing a teacher or a student opens the dashboard to check, so it
 * gets the page's one dark band and reads as a single column rather than a
 * stack of bordered cards — the previous version nested a card per period
 * inside a card, which buried the one row that matters (what's on now).
 *
 * Every colour here is a token, which is what lets the same component sit on
 * paper or inside `.cobalt-band` without a dark variant.
 */
export default function TodaySchedule({ schoolId, userId, userRole }) {
  const today = getDay(new Date()); // 0=Sunday, 1=Monday, etc.

  const { data: scheduleEntries = [], isLoading } = useQuery({
    queryKey: ['today-schedule', schoolId, userId, today],
    queryFn: async () => {
      const all = await scheduleEntriesData.where({
        school_id: schoolId,
        day_of_week: today,
        status: 'active'
      });

      // Filter based on role
      if (userRole === 'student') {
        // Get student's classes
        const classes = await classesData.where({ school_id: schoolId, status: 'active' });
        const studentClasses = classes.filter(c => c.student_ids?.includes(userId));
        const studentClassIds = studentClasses.map(c => c.id);
        return all.filter(e => studentClassIds.includes(e.class_id)).sort((a, b) =>
          a.start_time.localeCompare(b.start_time)
        );
      } else if (userRole === 'teacher') {
        // Get teacher's schedule
        return all.filter(e => e.teacher_id === userId).sort((a, b) =>
          a.start_time.localeCompare(b.start_time)
        );
      }

      return [];
    },
    enabled: !!schoolId && !!userId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--cobalt)' }} />
      </div>
    );
  }

  if (scheduleEntries.length === 0) {
    return (
      <p className="py-8 m-0 text-sm" style={{ color: 'var(--faint)' }}>
        Nothing scheduled today.
      </p>
    );
  }

  const now = format(new Date(), 'HH:mm');
  const currentIdx = scheduleEntries.findIndex(e => e.start_time <= now && e.end_time > now);
  const nextIdx = currentIdx === -1 ? scheduleEntries.findIndex(e => e.start_time > now) : -1;
  // Once the last period has finished there is no "rest of the day" to
  // separate the past from, and dimming every row makes the whole panel look
  // disabled. So the recede-what's-done treatment only applies mid-day.
  const dayOver = currentIdx === -1 && nextIdx === -1;

  return (
    <ol className="m-0 p-0 list-none">
      {scheduleEntries.map((entry, i) => {
        const isNow = i === currentIdx;
        const isNext = i === nextIdx;
        // Everything already finished recedes rather than disappearing — the
        // day so far is context, not clutter.
        const past = !dayOver && !isNow && !isNext && entry.end_time <= now;

        return (
          <li
            key={entry.id}
            className="grid items-baseline gap-x-3 py-2.5"
            style={{
              gridTemplateColumns: 'auto 3px minmax(0, 1fr) auto',
              borderTop: i === 0 ? 'none' : '1px solid var(--rule-soft)',
              opacity: past ? 0.55 : 1,
            }}
          >
            <span
              className="cobalt-num text-xs whitespace-nowrap"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}
            >
              {entry.start_time}
            </span>

            {/* The one accent mark: a 3px rule against the current period.
                It is never the only signal — the "Now" chip carries the word. */}
            <span
              aria-hidden="true"
              className="self-stretch"
              style={{ background: isNow ? 'var(--cobalt)' : 'transparent', borderRadius: '2px' }}
            />

            <span className="min-w-0">
              <span
                className="block font-medium text-sm break-words"
                style={{ color: 'var(--ink)' }}
              >
                {entry.class_name}
              </span>
              <span className="block text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {entry.start_time}–{entry.end_time}
                {entry.room_name ? ` · ${entry.room_name}` : ''}
                {entry.teacher_name && userRole === 'student' ? ` · ${entry.teacher_name}` : ''}
              </span>
            </span>

            {(isNow || isNext) && (
              <span
                className="cobalt-label"
                style={{
                  color: isNow ? 'var(--cobalt)' : 'var(--muted)',
                  fontSize: '0.6rem',
                }}
              >
                {isNow ? 'Now' : 'Next'}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
