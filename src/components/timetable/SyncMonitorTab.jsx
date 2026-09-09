import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw, ChevronDown, Activity, Calendar, MapPin
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { SYNC_STATUS_CONFIG } from './useTimetableData';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const STATUS_ICONS = {
  completed:   CheckCircle,
  failed:      XCircle,
  partial:     AlertTriangle,
  in_progress: RefreshCw,
  pending:     Clock,
};

function SyncRowDetail({ sync }) {
  const [open, setOpen] = useState(false);
  const cfg = SYNC_STATUS_CONFIG[sync.status] || SYNC_STATUS_CONFIG.pending;
  const Icon = STATUS_ICONS[sync.status] || Clock;
  const duration = sync.started_at && sync.completed_at
    ? Math.round((new Date(sync.completed_at) - new Date(sync.started_at)) / 1000)
    : null;
  const conflicts = sync.mapping_conflicts || [];
  const errors    = sync.error_details || [];
  const unresolved = conflicts.filter(c => !c.resolved).length;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left group">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg border flex-shrink-0 ${cfg.color}`}>
              <Icon className={`w-4 h-4 ${sync.status === 'in_progress' ? 'animate-spin' : ''}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-sm font-semibold text-slate-900 capitalize">
                  {sync.sync_type.replace(/_/g, ' ')}
                </span>
                <Badge className={`${cfg.color} border text-[10px]`}>{sync.status}</Badge>
                {unresolved > 0 && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-[10px]">
                    {unresolved} conflict{unresolved !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                <span>{sync.started_at ? format(new Date(sync.started_at), 'MMM d, yyyy HH:mm') : '—'}</span>
                {duration != null && <span>· {duration}s</span>}
                {sync.initiated_by_name && <span>· by {sync.initiated_by_name}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {sync.records_processed && (
              <div className="hidden md:flex gap-1.5 text-[11px]">
                {sync.records_processed.schedule_entries > 0 && (
                  <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">{sync.records_processed.schedule_entries} sch</span>
                )}
                {sync.records_processed.periods > 0 && (
                  <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">{sync.records_processed.periods} per</span>
                )}
                {sync.records_processed.rooms > 0 && (
                  <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">{sync.records_processed.rooms} rm</span>
                )}
              </div>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t border-slate-100 bg-slate-50 px-5 py-4 space-y-4">
        {/* Change summary */}
        {sync.change_summary && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <p className="text-xs font-semibold text-slate-700 mb-1">Change Summary</p>
            <p className="text-xs text-slate-600">{sync.change_summary}</p>
          </div>
        )}

        {/* Record counts */}
        {sync.records_processed && (
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Records Processed</p>
            <div className="grid grid-cols-3 gap-2">
              {['schedule_entries', 'periods', 'rooms'].map(type => (
                <div key={type} className="bg-white rounded-lg border border-slate-200 p-2.5 text-center">
                  <p className="text-[11px] text-slate-500 capitalize mb-1">{type.replace('_', ' ')}</p>
                  <p className="text-sm font-bold text-slate-900">{sync.records_processed[type] || 0}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    +{sync.records_created?.[type] || 0} / ~{sync.records_updated?.[type] || 0} / -{sync.records_deleted?.[type] || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {sync.status === 'failed' && sync.error_message && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-xs text-red-700">{sync.error_message}</AlertDescription>
          </Alert>
        )}
        {errors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Error Details ({errors.length})</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {errors.map((e, i) => (
                <div key={i} className="bg-white rounded border border-red-100 px-3 py-2 text-xs">
                  <span className="font-medium text-red-700">{e.entity_type}</span>
                  <span className="text-slate-500 mx-1">·</span>
                  <span className="text-slate-600 font-mono">{e.external_id}</span>
                  <span className="text-slate-500 mx-1">·</span>
                  <span className="text-red-600">{e.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-700 mb-2">Mapping Conflicts ({conflicts.length})</p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {conflicts.map((c, i) => (
                <div key={i} className={`flex items-start gap-2 bg-white rounded border px-3 py-2 text-xs ${c.resolved ? 'border-emerald-100' : 'border-amber-100'}`}>
                  <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${c.resolved ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium capitalize">{c.entity_type}</span>
                    <span className="text-slate-400 mx-1">·</span>
                    <span className="font-mono">{c.external_id}</span>
                    <p className="text-slate-500 mt-0.5 truncate">{c.issue}</p>
                    {c.resolved && c.resolution && (
                      <p className="text-emerald-600 mt-0.5">✓ {c.resolution}</p>
                    )}
                  </div>
                  {c.resolved
                    ? <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 border flex-shrink-0">Resolved</Badge>
                    : <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 border flex-shrink-0">Unresolved</Badge>
                  }
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function SyncMonitorTab({ schoolId, syncHistory, settings, scheduleEntries, periods, rooms }) {
  const lastSync    = syncHistory[0];
  const lastSuccess = syncHistory.find(s => s.status === 'completed');
  const totalConflicts = syncHistory.reduce((sum, s) => sum + (s.mapping_conflicts?.filter(c => !c.resolved).length || 0), 0);
  const totalFailed    = syncHistory.filter(s => s.status === 'failed').length;

  const syncedEntries  = scheduleEntries.filter(e => e.external_sync_id).length;
  const syncedPeriods  = periods.filter(p => p.external_sync_id).length;
  const syncedRooms    = rooms.filter(r => r.external_sync_id).length;

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-slate-400 mb-1">Last Sync</p>
          {lastSync ? (
            <>
              <p className="text-sm font-bold text-slate-900">{formatDistanceToNow(new Date(lastSync.started_at), { addSuffix: true })}</p>
              <Badge className={`mt-1 text-[10px] border ${SYNC_STATUS_CONFIG[lastSync.status]?.color}`}>{lastSync.status}</Badge>
            </>
          ) : (
            <p className="text-sm text-slate-400">Never</p>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-[11px] text-slate-400 mb-1">Last Successful</p>
          {lastSuccess ? (
            <p className="text-sm font-bold text-slate-900">{formatDistanceToNow(new Date(lastSuccess.started_at), { addSuffix: true })}</p>
          ) : (
            <p className="text-sm text-slate-400">Never</p>
          )}
        </div>
        <div className={`border rounded-xl p-4 shadow-sm ${totalConflicts > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <p className="text-[11px] text-slate-400 mb-1">Open Conflicts</p>
          <p className={`text-xl font-bold ${totalConflicts > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{totalConflicts}</p>
        </div>
        <div className={`border rounded-xl p-4 shadow-sm ${totalFailed > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
          <p className="text-[11px] text-slate-400 mb-1">Failed Syncs</p>
          <p className={`text-xl font-bold ${totalFailed > 0 ? 'text-red-700' : 'text-slate-900'}`}>{totalFailed}</p>
        </div>
      </div>

      {/* Data coverage */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Sync Coverage</h3>
        </div>
        <div className="px-5 py-4 grid grid-cols-3 gap-4">
          {[
            { label: 'Schedule Entries', total: scheduleEntries.length, synced: syncedEntries, icon: Calendar, color: 'indigo' },
            { label: 'Periods',          total: periods.length,         synced: syncedPeriods, icon: Clock,    color: 'emerald' },
            { label: 'Rooms',            total: rooms.length,           synced: syncedRooms,   icon: MapPin,   color: 'amber' },
          ].map(({ label, total, synced, icon: Icon, color }) => {
            const pct = total > 0 ? Math.round((synced / total) * 100) : 0;
            return (
              <div key={label}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-3.5 h-3.5 text-${color}-500`} />
                  <span className="text-xs font-medium text-slate-600">{label}</span>
                </div>
                <div className="flex items-end justify-between mb-1">
                  <span className="text-lg font-bold text-slate-900">{synced}<span className="text-slate-400 text-sm font-normal">/{total}</span></span>
                  <span className="text-xs text-slate-400">{pct}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-${color}-500 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sync timeline */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Sync History</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{syncHistory.length} sync operations recorded</p>
          </div>
          <Activity className="w-4 h-4 text-slate-300" />
        </div>

        {syncHistory.length === 0 ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No sync history yet</p>
            <p className="text-[11px] text-slate-300 mt-1">Configure your external system connection and run the first sync</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {syncHistory.map(sync => (
              <SyncRowDetail key={sync.id} sync={sync} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}