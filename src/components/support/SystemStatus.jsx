import StatusChip from '@/components/app/StatusChip';
import Notice from '@/components/app/Notice';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { RefreshCw,
  Database, Globe, Lock, FileText, Bell, Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import * as schoolsData from '@/data/schools';

// Static service definitions — in a real deployment these would come from a status API
const SERVICES = [
  { id: 'platform',    label: 'Core Platform',         icon: Globe,    description: 'Authentication, routing, and core app functionality' },
  { id: 'database',    label: 'Database & Storage',    icon: Database, description: 'Entity data, file uploads, and query processing' },
  { id: 'auth',        label: 'Authentication',        icon: Lock,     description: 'User login, session management, and role access' },
  { id: 'reports',     label: 'Reports & Exports',     icon: FileText, description: 'PDF generation, CSV exports, and report builder' },
  { id: 'email',       label: 'Email & Notifications', icon: Bell,     description: 'Invitation emails, alerts, and system notifications' },
  { id: 'integrations',label: 'Integrations',          icon: Activity, description: 'Google Drive, Stripe, and external timetable connectors' },
];

/* Running normally is the answer you want and the answer you usually get, so
   it carries no colour. A status page where every one of six services glows
   green is a status page nobody scans. */
const STATUS_CONFIG = {
  operational: { label: 'Running', tone: null },
  degraded:    { label: 'Slow',    tone: 'warn' },
  outage:      { label: 'Down',    tone: 'crit' },
  maintenance: { label: 'Maintenance', tone: 'mute' },
};

// Static maintenance / incident notices — would be fetched from a status endpoint in production
const NOTICES = [
  {
    id: 'n1',
    type: 'info',
    title: 'Scheduled Maintenance — 22 Mar 2026, 02:00–04:00 UTC',
    body: 'Routine database maintenance will be performed. The platform will be in read-only mode during this window. No data will be lost. Save any in-progress work before 02:00 UTC.',
    date: '2026-03-17T10:00:00Z',
    resolved: false,
  },
];

function OverallStatusBanner({ statuses }) {
  const hasOutage = Object.values(statuses).some(s => s === 'outage');
  const hasDegraded = Object.values(statuses).some(s => s === 'degraded');
  const hasMaintenance = Object.values(statuses).some(s => s === 'maintenance');

  /* Four near-identical tinted banners became one Notice. Only the two states
     that need a person carry colour; "all systems operational" is the normal
     case and reads as a plain line. */
  if (hasOutage) {
    return (
      <Notice tone="crit" title="Something is down">
        One or more services are unavailable. Our team is already looking at it.
      </Notice>
    );
  }
  if (hasDegraded) {
    return (
      <Notice tone="warn" title="Slower than usual">
        Some services are responding slowly. We are watching it.
      </Notice>
    );
  }
  if (hasMaintenance) {
    return (
      <Notice title="Maintenance is running">
        Some services may be briefly unavailable. The notice below has the details.
      </Notice>
    );
  }
  return (
    <Notice title="Everything is running">
      No known incidents.
    </Notice>
  );
}

export default function SystemStatus({ schoolId, school }) {
  const [lastChecked, setLastChecked] = useState(new Date());

  // In production this would call a real status API endpoint
  // For now we derive status from recent audit logs and school data
  const { data: schoolData, refetch, isRefetching } = useQuery({
    queryKey: ['system-status-school', schoolId],
    queryFn: async () => {
      const schools = await schoolsData.where({ id: schoolId });
      return schools[0];
    },
    enabled: !!schoolId,
  });

  // Derive per-service status — all operational unless school is suspended/billing issue
  const billingStatus = schoolData?.billing_status;
  const serviceStatuses = {
    platform:     schoolData?.status === 'suspended' ? 'outage' : 'operational',
    database:     'operational',
    auth:         'operational',
    reports:      'operational',
    email:        'operational',
    integrations: ['past_due', 'unpaid'].includes(billingStatus) ? 'degraded' : 'operational',
  };

  const handleRefresh = () => {
    refetch();
    setLastChecked(new Date());
  };

  return (
    <div className="space-y-5">
      {/* Overall banner */}
      <OverallStatusBanner statuses={serviceStatuses} />

      {/* Refresh bar */}
      <div className="flex items-center justify-between">
        <p className="text-xs scholr-faint">
          Last checked: {formatDistanceToNow(lastChecked, { addSuffix: true })}
        </p>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs scholr-accent hover:underline"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh status
        </button>
      </div>

      {/* Service grid */}
      <div className="app-group overflow-hidden">
        <div className="px-5 py-3 border-b scholr-rule-soft flex items-center justify-between">
          <p className="text-xs font-bold scholr-muted uppercase tracking-wide">Service Status</p>
          <Badge className="scholr-sunk scholr-muted border-0 text-xs">{Object.values(serviceStatuses).filter(s => s === 'operational').length}/{SERVICES.length} operational</Badge>
        </div>
        <div className="divide-y scholr-divide">
          {SERVICES.map(svc => {
            const status = serviceStatuses[svc.id] || 'operational';
            const cfg = STATUS_CONFIG[status];
            const StatusIcon = cfg.icon;
            const SvcIcon = svc.icon;
            return (
              <div key={svc.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-8 h-8 scholr-sunk rounded-lg flex items-center justify-center shrink-0">
                  <SvcIcon className="w-4 h-4 scholr-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold scholr-ink">{svc.label}</p>
                  <p className="text-xs scholr-faint truncate">{svc.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cfg.tone
                    ? <StatusChip tone={cfg.tone}>{cfg.label}</StatusChip>
                    : <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{cfg.label}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incident / maintenance notices */}
      {NOTICES.length > 0 && (
        <div>
          <p className="text-xs font-bold scholr-muted uppercase tracking-wide mb-3">Notices & Incidents</p>
          <div className="space-y-3">
            {NOTICES.map(notice => (
              <Notice
                key={notice.id}
                tone={notice.type === 'info' ? 'info' : notice.type === 'warning' ? 'warn' : 'crit'}
                title={notice.title}
                action={!notice.resolved ? <StatusChip tone="mute">Upcoming</StatusChip> : null}
              >
                {notice.body}
                <span style={{ display: 'block', marginTop: '.4rem', fontSize: '.76rem', color: 'var(--faint)' }}>
                  {formatDistanceToNow(new Date(notice.date), { addSuffix: true })}
                </span>
              </Notice>
            ))}
          </div>
        </div>
      )}

      {/* School-specific alerts */}
      {['past_due', 'unpaid', 'canceled'].includes(billingStatus) && (
        <Notice tone="warn" title="Your subscription needs attention">
          It is currently <strong>{billingStatus?.replace('_', ' ')}</strong>, which restricts some features.
          {' '}Sort it out under <a href="/SchoolAdminBilling" className="underline">Billing</a>.
        </Notice>
      )}

      {/* Uptime SLA note */}
      <div className="text-center py-4">
        <p className="text-xs scholr-faint">
          IB Manager targets 99.9% uptime. For critical incidents, email <span className="font-medium scholr-muted">support@ibmanager.io</span>
        </p>
      </div>
    </div>
  );
}