import { Group } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Download, RefreshCw, AlertTriangle, Info, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { buildCSV, downloadCSV } from '@/components/reports/reportUtils';
import * as admin from '@/data/admin';

const CATEGORY_MAP = {
  user_created: 'Users', user_invited: 'Users', user_role_changed: 'Users',
  user_suspended: 'Users', user_reactivated: 'Users',
  membership_created: 'Users', membership_removed: 'Users', membership_role_changed: 'Users',
  grade_created: 'Grades', grade_updated: 'Grades', grade_visibility_changed: 'Grades',
  grade_published: 'Grades', predicted_grade_updated: 'Grades',
  attendance_recorded: 'Attendance', attendance_updated: 'Attendance',
  behavior_record_created: 'Behaviour', behavior_visibility_changed: 'Behaviour',
  class_created: 'Classes', class_updated: 'Classes', class_archived: 'Classes',
  teacher_assigned: 'Classes', teacher_removed: 'Classes',
  student_enrolled: 'Classes', student_unenrolled: 'Classes',
  data_export: 'Data & Exports', school_settings_changed: 'Settings',
  unauthorized_access_attempt: 'Security',
};

const CATEGORIES = ['All', 'Users', 'Grades', 'Attendance', 'Behaviour', 'Classes', 'Data & Exports', 'Settings', 'Security'];

const LEVEL_CONFIG = {
  info:     { label: 'Info',     tone: null,   icon: Info },
  warning:  { label: 'Warning',  tone: 'warn', icon: AlertTriangle },
  critical: { label: 'Critical', tone: 'crit', icon: ShieldAlert },
};

function LevelBadge({ level }) {
  const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.info;
  const Icon = cfg.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color: cfg.tone ? `var(--${cfg.tone})` : 'var(--muted)' }}
    >
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function LogRow({ log }) {
  const [expanded, setExpanded] = useState(false);
  const category = CATEGORY_MAP[log.action] || 'Other';
  return (
    <div className="border-b scholr-rule-soft last:border-0">
      <div
        className="flex items-start gap-3 px-4 py-3 hover:scholr-sunk cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="w-36 shrink-0">
          <p className="text-xs scholr-muted">{log.created_at ? format(new Date(log.created_at), 'dd MMM yyyy') : '—'}</p>
          <p className="text-xs scholr-faint">{log.created_at ? format(new Date(log.created_at), 'HH:mm:ss') : ''}</p>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <code className="text-xs scholr-sunk scholr-body px-1.5 py-0.5 rounded font-mono">{log.action}</code>
            <Badge variant="outline" className="text-xs px-1.5 py-0">{category}</Badge>
            <LevelBadge level={log.level} />
          </div>
          <p className="text-sm scholr-body mt-1 truncate">{log.details || '—'}</p>
          <p className="text-xs scholr-faint mt-0.5">{log.user_email || 'system'}</p>
        </div>
        <div className="shrink-0 scholr-faint">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      {expanded && (
        <div className="mx-4 mb-3 scholr-sunk rounded-lg border scholr-rule p-3 text-xs space-y-1.5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div><span className="scholr-faint font-medium">Action:</span> <span className="scholr-body">{log.action}</span></div>
            <div><span className="scholr-faint font-medium">Level:</span> <span className="scholr-body">{log.level}</span></div>
            <div><span className="scholr-faint font-medium">User:</span> <span className="scholr-body">{log.user_email || '—'}</span></div>
            <div><span className="scholr-faint font-medium">User ID:</span> <span className="scholr-body font-mono">{log.user_id || '—'}</span></div>
            <div><span className="scholr-faint font-medium">Entity Type:</span> <span className="scholr-body">{log.entity_type || '—'}</span></div>
            <div><span className="scholr-faint font-medium">Entity ID:</span> <span className="scholr-body font-mono truncate">{log.entity_id || '—'}</span></div>
            <div className="col-span-2"><span className="scholr-faint font-medium">Details:</span> <span className="scholr-body">{log.details || '—'}</span></div>
            <div className="col-span-2"><span className="scholr-faint font-medium">Timestamp:</span> <span className="scholr-body">{log.created_at ? format(new Date(log.created_at),"dd MMM yyyy 'at' HH:mm:ss") : '—'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditLogViewer({ schoolId }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-logs-school', schoolId],
    queryFn: () => admin.whereAuditLogs({ school_id: schoolId }, { order: 'created_at', ascending: false, limit: 500 }),
    enabled: !!schoolId,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    return logs.filter(log => {
      if (category !== 'All' && (CATEGORY_MAP[log.action] || 'Other') !== category) return false;
      if (level !== 'all' && log.level !== level) return false;
      if (userFilter && !log.user_email?.toLowerCase().includes(userFilter.toLowerCase())) return false;
      if (search && !log.details?.toLowerCase().includes(search.toLowerCase()) && !log.action?.toLowerCase().includes(search.toLowerCase())) return false;
      if (dateFrom && log.created_at < dateFrom) return false;
      if (dateTo && log.created_at > dateTo + 'T23:59:59') return false;
      return true;
    });
  }, [logs, category, level, userFilter, search, dateFrom, dateTo]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const exportCSV = () => {
    const cols = [
      { key: 'created_at', label: 'Timestamp', fn: r => r.created_at ? format(new Date(r.created_at), 'yyyy-MM-dd HH:mm:ss') : '' },
      { key: 'action', label: 'Action' },
      { key: 'level', label: 'Level' },
      { key: 'user_email', label: 'User Email' },
      { key: 'entity_type', label: 'Entity Type' },
      { key: 'entity_id', label: 'Entity ID' },
      { key: 'details', label: 'Details' },
    ];
    const csv = buildCSV(filtered, cols);
    downloadCSV(csv, 'audit_log');
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="app-group" style={{ padding: '.9rem 1rem' }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <Label className="text-xs scholr-faint mb-1 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 scholr-faint" />
              <Input className="pl-8 h-8 text-sm" placeholder="Action or details…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
            </div>
          </div>
          <div>
            <Label className="text-xs scholr-faint mb-1 block">Category</Label>
            <Select value={category} onValueChange={v => { setCategory(v); setPage(0); }}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs scholr-faint mb-1 block">Level</Label>
            <Select value={level} onValueChange={v => { setLevel(v); setPage(0); }}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs scholr-faint mb-1 block">Date From</Label>
            <Input type="date" className="h-8 text-sm" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }} />
          </div>
          <div>
            <Label className="text-xs scholr-faint mb-1 block">Date To</Label>
            <Input type="date" className="h-8 text-sm" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }} />
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div>
            <Label className="text-xs scholr-faint mb-1 block">Filter by User Email</Label>
            <Input className="h-8 text-sm w-56" placeholder="user@school.edu" value={userFilter} onChange={e => { setUserFilter(e.target.value); setPage(0); }} />
          </div>
          <div className="flex gap-2 items-end">
            <Button size="sm" variant="outline" onClick={() => refetch()} className="gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Button size="sm" onClick={exportCSV} disabled={filtered.length === 0} className="scholr-accent-sf hover:scholr-accent-sf gap-1">
              <Download className="w-3.5 h-3.5" /> Export ({filtered.length})
            </Button>
          </div>
        </div>
      </div>

      <Group>
        <div className="scholr-grid app-cols-4">
        {[
          { label: 'Entries', value: filtered.length, hint: 'matching the filters' },
          { label: 'Critical', value: filtered.filter(l => l.level === 'critical').length, tone: 'crit', hint: 'need a look' },
          { label: 'Warnings', value: filtered.filter(l => l.level === 'warning').length, tone: 'warn', hint: 'worth a look' },
          { label: 'People', value: new Set(filtered.map(l => l.user_email).filter(Boolean)).size, hint: 'appear in these entries' },
        ].map(({ label, value, tone, hint }) => (
          <StatCard key={label} label={label} value={value} tone={value > 0 ? tone : undefined} hint={hint} />
        ))}
        </div>
      </Group>

      {/* Log table */}
      <div className="app-group overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b scholr-rule-soft scholr-sunk">
          <p className="text-xs font-semibold scholr-muted uppercase tracking-wide">Audit Events</p>
          <p className="text-xs scholr-faint">Showing {paginated.length} of {filtered.length} results</p>
        </div>
        {isLoading ? (
          <div className="text-center py-16 scholr-faint text-sm">Loading audit log…</div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16 scholr-faint text-sm">No audit events match the current filters.</div>
        ) : (
          <div>
            {paginated.map(log => <LogRow key={log.id} log={log} />)}
          </div>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t scholr-rule-soft">
            <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-xs scholr-muted">Page {page + 1} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </div>
  );
}