import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatusChip from '@/components/app/StatusChip';
import Meter from '@/components/app/Meter';
import React, { useState } from 'react';
import Notice from '@/components/app/Notice';
import { humanise } from '@/lib/labels';
import {
  CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw, ChevronDown
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
        <button className="w-full px-5 py-4 flex items-center justify-between hover:scholr-sunk transition-colors text-left group">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-sm font-semibold scholr-ink capitalize">
                  {humanise(sync.sync_type)}
                </span>
                {cfg.tone
                  ? <StatusChip tone={cfg.tone}>{cfg.label}</StatusChip>
                  : <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>{cfg.label}</span>}
                {unresolved > 0 && (
                  <StatusChip tone="warn">{unresolved} conflict{unresolved !== 1 ? 's' : ''}</StatusChip>
                )}
              </div>
              <div className="flex items-center gap-3 text-[11px] scholr-faint flex-wrap">
                <span>{sync.started_at ? format(new Date(sync.started_at), 'MMM d, yyyy HH:mm') : '—'}</span>
                {duration != null && <span>· {duration}s</span>}
                {sync.initiated_by_name && <span>· by {sync.initiated_by_name}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {sync.records_processed && (
              /* Three abbreviations in three tints — "12 sch", "5 per", "3 rm"
                 — that nobody could read without being told. One count. */
              <span className="scholr-label" style={{ margin: 0 }}>
                {['schedule_entries', 'periods', 'rooms']
                  .reduce((n, k) => n + (sync.records_processed[k] || 0), 0)} records
              </span>
            )}
            <ChevronDown className={`w-4 h-4 scholr-faint transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="border-t scholr-rule-soft scholr-sunk px-5 py-4 space-y-4">
        {/* Change summary */}
        {sync.change_summary && <Notice>{sync.change_summary}</Notice>}

        {/* Record counts */}
        {sync.records_processed && (
          <div>
            <p className="text-xs font-semibold scholr-body mb-2">Records Processed</p>
            <div className="app-group">
              {['schedule_entries', 'periods', 'rooms'].map(type => (
                <Row
                  key={type}
                  label={humanise(type)}
                  detail={`${sync.records_created?.[type] || 0} added · ${sync.records_updated?.[type] || 0} changed · ${sync.records_deleted?.[type] || 0} removed`}
                  value={sync.records_processed[type] || 0}
                />
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {sync.status === 'failed' && sync.error_message && (
          <Notice tone="crit">
            {sync.error_message}
          </Notice>
        )}
        {errors.length > 0 && (
          <div>
            <p className="text-xs font-semibold scholr-body mb-2">Error Details ({errors.length})</p>
            <div className="app-group" style={{ maxHeight: '12rem', overflowY: 'auto' }}>
              {errors.map((e, i) => (
                <Row key={i} label={`${humanise(e.entity_type)} ${e.external_id}`} detail={e.error} />
              ))}
            </div>
          </div>
        )}

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div>
            <p className="text-xs font-semibold scholr-body mb-2">Mapping Conflicts ({conflicts.length})</p>
            <div className="app-group" style={{ maxHeight: '12rem', overflowY: 'auto' }}>
              {conflicts.map((c, i) => (
                <Row
                  key={i}
                  label={`${humanise(c.entity_type)} ${c.external_id}`}
                  detail={c.resolved && c.resolution ? `${c.issue} — ${c.resolution}` : c.issue}
                >
                  {c.resolved
                    ? <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>Resolved</span>
                    : <StatusChip tone="warn">Open</StatusChip>}
                </Row>
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
      <Group>
        <div className="scholr-grid app-cols-4">
          <StatCard
            label="Last sync"
            value={lastSync ? formatDistanceToNow(new Date(lastSync.started_at), { addSuffix: true }) : 'Never'}
            hint={lastSync ? (SYNC_STATUS_CONFIG[lastSync.status]?.label || lastSync.status) : 'not connected yet'}
            tone={lastSync ? SYNC_STATUS_CONFIG[lastSync.status]?.tone : undefined}
          />
          <StatCard
            label="Last good sync"
            value={lastSuccess ? formatDistanceToNow(new Date(lastSuccess.started_at), { addSuffix: true }) : 'Never'}
            hint="completed without errors"
          />
          <StatCard
            label="Open conflicts"
            value={totalConflicts}
            tone={totalConflicts > 0 ? 'warn' : undefined}
            hint="need a decision"
          />
          <StatCard
            label="Failed syncs"
            value={totalFailed}
            tone={totalFailed > 0 ? 'crit' : undefined}
            hint="in the history below"
          />
        </div>
      </Group>

      {/* These bars were `bg-${color}-500`. Tailwind builds its stylesheet by
          scanning source for whole class names, so an interpolated one is
          never generated — the bars have been drawing nothing at all. */}
      <Group title="How much of this came from the external system">
        <div className="px-4 py-3.5 flex flex-col gap-3">
          {[
            { label: 'Timetable entries', total: scheduleEntries.length, synced: syncedEntries },
            { label: 'Periods', total: periods.length, synced: syncedPeriods },
            { label: 'Rooms', total: rooms.length, synced: syncedRooms },
          ].map(({ label, total, synced }) => {
            const pct = total > 0 ? Math.round((synced / total) * 100) : 0;
            return (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '.6rem' }}>
                  <span style={{ fontSize: '.88rem', color: 'var(--ink)' }}>{label}</span>
                  <span
                    className="scholr-num"
                    style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '.82rem', color: 'var(--body)' }}
                  >
                    {synced} of {total}
                  </span>
                  <span className="scholr-label" style={{ minWidth: '2.6rem', textAlign: 'right' }}>{pct}%</span>
                </div>
                <div style={{ marginTop: '.25rem' }}>
                  <Meter value={pct} height={4} />
                </div>
              </div>
            );
          })}
        </div>
      </Group>

      {/* Sync timeline */}
      <Group title="History" action={<span className="scholr-label">{syncHistory.length} runs</span>}>
        {syncHistory.length === 0 ? (
          <GroupEmpty>
            Nothing has synced yet. Set up the external system under Settings, then run the first sync.
          </GroupEmpty>
        ) : (
          syncHistory.map(sync => <SyncRowDetail key={sync.id} sync={sync} />)
        )}
      </Group>
    </div>
  );
}