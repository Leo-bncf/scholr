import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Activity } from 'lucide-react';
import { format } from 'date-fns';
import * as timetableSyncsData from '@/data/timetableSyncs';
import * as scheduleEntriesData from '@/data/scheduleEntries';
import * as periodsData from '@/data/periods';
import * as roomsData from '@/data/rooms';

export default function TimetableIntegrationStatus({ schoolId }) {
  const { data: latestSync, isLoading } = useQuery({
    queryKey: ['latest-timetable-sync', schoolId],
    queryFn: async () => {
      const syncs = await timetableSyncsData.where({ school_id: schoolId }, { order: 'started_at', ascending: false, limit: 1 });
      return syncs[0] || null;
    },
    enabled: !!schoolId,
  });

  const { data: scheduleStats } = useQuery({
    queryKey: ['timetable-sync-stats', schoolId],
    queryFn: async () => {
      const [scheduleEntries, periods, rooms] = await Promise.all([
        scheduleEntriesData.where({ school_id: schoolId, status: 'active' }),
        periodsData.where({ school_id: schoolId }),
        roomsData.where({ school_id: schoolId, status: 'active' }),
      ]);

      const syncedSchedule = scheduleEntries.filter(e => e.external_sync_id).length;
      const syncedPeriods = periods.filter(p => p.external_sync_id).length;
      const syncedRooms = rooms.filter(r => r.external_sync_id).length;

      return {
        schedule: { total: scheduleEntries.length, synced: syncedSchedule },
        periods: { total: periods.length, synced: syncedPeriods },
        rooms: { total: rooms.length, synced: syncedRooms },
      };
    },
    enabled: !!schoolId,
  });

  const getStatusConfig = (status) => {
    const configs = {
      completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
      failed: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
      in_progress: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: RefreshCw },
      partial: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
      pending: { color: 'bg-slate-50 text-slate-700 border-slate-200', icon: Clock },
    };
    return configs[status] || configs.pending;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 text-slate-400">
          <Activity className="w-5 h-5 animate-pulse" />
          <span className="text-sm">Loading sync status...</span>
        </div>
      </div>
    );
  }

  const statusConfig = latestSync ? getStatusConfig(latestSync.status) : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900">Integration Status</h3>
        <Badge variant="outline" className="capitalize">
          {latestSync ? 'Active' : 'Not Configured'}
        </Badge>
      </div>

      {latestSync ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
            {StatusIcon && <StatusIcon className="w-5 h-5 mt-0.5 text-slate-600" />}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-900">Last Sync</span>
                <Badge className={`${statusConfig.color} border-0 capitalize`}>
                  {latestSync.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mb-2">
                {latestSync.started_at && format(new Date(latestSync.started_at), 'MMM d, yyyy h:mm a')}
              </p>
              <p className="text-xs text-slate-600">
                Type: <span className="font-medium capitalize">{latestSync.sync_type.replace(/_/g, ' ')}</span>
              </p>
            </div>
          </div>

          {latestSync.status === 'completed' && latestSync.records_processed && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <p className="text-xs font-medium text-indigo-900 mb-1">Schedule Entries</p>
                <p className="text-lg font-bold text-indigo-700">
                  {latestSync.records_processed.schedule_entries || 0}
                </p>
                <p className="text-xs text-indigo-600 mt-1">
                  {latestSync.records_created?.schedule_entries || 0} new, {latestSync.records_updated?.schedule_entries || 0} updated
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-xs font-medium text-emerald-900 mb-1">Periods</p>
                <p className="text-lg font-bold text-emerald-700">
                  {latestSync.records_processed.periods || 0}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  {latestSync.records_created?.periods || 0} new, {latestSync.records_updated?.periods || 0} updated
                </p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs font-medium text-amber-900 mb-1">Rooms</p>
                <p className="text-lg font-bold text-amber-700">
                  {latestSync.records_processed.rooms || 0}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  {latestSync.records_created?.rooms || 0} new, {latestSync.records_updated?.rooms || 0} updated
                </p>
              </div>
            </div>
          )}

          {latestSync.status === 'failed' && latestSync.error_message && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900 mb-1">Error Details</p>
              <p className="text-xs text-red-700">{latestSync.error_message}</p>
            </div>
          )}

          {latestSync.mapping_conflicts && latestSync.mapping_conflicts.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-semibold text-amber-900 mb-2">Mapping Conflicts</p>
              <div className="space-y-1">
                {latestSync.mapping_conflicts.slice(0, 3).map((conflict, i) => (
                  <p key={i} className="text-xs text-amber-700">
                    • {conflict.entity_type}: {conflict.issue}
                  </p>
                ))}
                {latestSync.mapping_conflicts.length > 3 && (
                  <p className="text-xs text-amber-600 mt-2">
                    +{latestSync.mapping_conflicts.length - 3} more conflicts
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500 mb-1">No sync history</p>
          <p className="text-xs text-slate-400">Connect to external timetable system to begin syncing</p>
        </div>
      )}

      {scheduleStats && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Current Data Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Schedule Entries</span>
              <span className="font-medium text-slate-900">
                {scheduleStats.schedule.synced} / {scheduleStats.schedule.total} synced
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Periods</span>
              <span className="font-medium text-slate-900">
                {scheduleStats.periods.synced} / {scheduleStats.periods.total} synced
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Rooms</span>
              <span className="font-medium text-slate-900">
                {scheduleStats.rooms.synced} / {scheduleStats.rooms.total} synced
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}