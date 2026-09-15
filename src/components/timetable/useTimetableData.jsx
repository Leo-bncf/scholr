import { useQuery } from '@tanstack/react-query';
import * as scheduleEntriesData from '@/data/scheduleEntries';
import * as periodsData from '@/data/periods';
import * as roomsData from '@/data/rooms';
import * as timetableSyncsData from '@/data/timetableSyncs';
import * as timetableSettingsData from '@/data/timetableSettings';
import * as membershipsData from '@/data/memberships';
import * as classesData from '@/data/classes';

export function useTimetableData(schoolId) {
  const scheduleEntries = useQuery({
    queryKey: ['timetable-entries', schoolId],
    queryFn: () => scheduleEntriesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const periods = useQuery({
    queryKey: ['timetable-periods', schoolId],
    queryFn: () => periodsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const rooms = useQuery({
    queryKey: ['timetable-rooms', schoolId],
    queryFn: () => roomsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const syncHistory = useQuery({
    queryKey: ['timetable-sync-history', schoolId],
    queryFn: () => timetableSyncsData.where({ school_id: schoolId }, { order: 'started_at', ascending: false, limit: 30 }),
    enabled: !!schoolId,
  });

  const settings = useQuery({
    queryKey: ['timetable-settings', schoolId],
    queryFn: async () => {
      const results = await timetableSettingsData.where({ school_id: schoolId });
      return results[0] || null;
    },
    enabled: !!schoolId,
  });

  const memberships = useQuery({
    queryKey: ['timetable-memberships', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const classes = useQuery({
    queryKey: ['timetable-classes', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  return {
    scheduleEntries: scheduleEntries.data ?? [],
    periods: periods.data ?? [],
    rooms: rooms.data ?? [],
    syncHistory: syncHistory.data ?? [],
    settings: settings.data,
    memberships: memberships.data ?? [],
    classes: classes.data ?? [],
    isLoading: scheduleEntries.isLoading || periods.isLoading,
    refetchAll: () => {
      scheduleEntries.refetch();
      periods.refetch();
      rooms.refetch();
      syncHistory.refetch();
      settings.refetch();
    },
  };
}

/* A finished sync is the ordinary case and takes no colour. Five tailwind
   tints meant a history of successful syncs was a wall of green with one red
   line hidden in it. */
export const SYNC_STATUS_CONFIG = {
  completed:   { tone: null,   label: 'Completed' },
  failed:      { tone: 'crit', label: 'Failed' },
  in_progress: { tone: 'mute', label: 'Running' },
  partial:     { tone: 'warn', label: 'Partial' },
  pending:     { tone: 'mute', label: 'Queued' },
};

/* Three policies, described by what they do rather than by a padlock emoji
   and a parenthetical. None of them is good or bad — a school picks the one
   that matches who owns its timetable — so none of them is coloured. */
export const OVERRIDE_POLICY_CONFIG = {
  read_only: {
    label: 'The external system owns it',
    detail: 'Nothing here can be edited by hand. A sync is the only way anything changes.',
  },
  allow_local_edits: {
    label: 'Shared',
    detail: 'Staff can edit some fields. Synced fields are marked, and the next sync may overwrite local edits.',
  },
  local_override: {
    label: 'Scholr owns it',
    detail: 'Local edits win. What arrives from the external system is treated as information only.',
  },
};