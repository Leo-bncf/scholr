import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import * as timetableSyncsData from '@/data/timetableSyncs';

export default function TimetableSyncHistory({ schoolId }) {
  const { data: syncHistory = [], isLoading } = useQuery({
    queryKey: ['timetable-sync-history', schoolId],
    queryFn: () => timetableSyncsData.where({ school_id: schoolId }, { order: 'started_at', ascending: false, limit: 20 }),
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
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">Sync History</h3>
        <p className="text-sm text-slate-500 mt-1">Recent timetable synchronization operations</p>
      </div>

      {syncHistory.length === 0 ? (
        <div className="p-8 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No sync history available</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {syncHistory.map((sync) => {
            const statusConfig = getStatusConfig(sync.status);
            const StatusIcon = statusConfig.icon;
            const duration = sync.started_at && sync.completed_at
              ? Math.round((new Date(sync.completed_at) - new Date(sync.started_at)) / 1000)
              : null;

            return (
              <div key={sync.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`mt-1 p-2 rounded-lg ${statusConfig.color.split(' ')[0]} border`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-900 capitalize">
                          {sync.sync_type.replace(/_/g, ' ')}
                        </span>
                        <Badge className={`${statusConfig.color} border-0 capitalize text-xs`}>
                          {sync.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                        <span>{format(new Date(sync.started_at), 'MMM d, yyyy h:mm a')}</span>
                        {duration && <span>• {duration}s</span>}
                        {sync.initiated_by_name && <span>• by {sync.initiated_by_name}</span>}
                      </div>

                      {sync.status === 'completed' && sync.records_processed && (
                        <div className="flex items-center gap-3 text-xs">
                          {sync.records_processed.schedule_entries > 0 && (
                            <span className="text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
                              {sync.records_processed.schedule_entries} schedules
                            </span>
                          )}
                          {sync.records_processed.periods > 0 && (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                              {sync.records_processed.periods} periods
                            </span>
                          )}
                          {sync.records_processed.rooms > 0 && (
                            <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded">
                              {sync.records_processed.rooms} rooms
                            </span>
                          )}
                        </div>
                      )}

                      {sync.status === 'failed' && sync.error_message && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {sync.error_message}
                        </p>
                      )}

                      {sync.mapping_conflicts && sync.mapping_conflicts.length > 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          {sync.mapping_conflicts.length} mapping conflicts detected
                        </p>
                      )}
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="flex-shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}