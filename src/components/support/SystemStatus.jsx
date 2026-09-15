import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw,
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

const STATUS_CONFIG = {
  operational: { label: 'Operational', color: 'scholr-sunk scholr-muted border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  degraded:    { label: 'Degraded',    color: 'scholr-sunk scholr-muted border-amber-200',       dot: 'bg-amber-500',   icon: AlertTriangle },
  outage:      { label: 'Outage',      color: 'bg-red-100 text-red-700 border-red-200',             dot: 'bg-red-500 animate-pulse', icon: XCircle },
  maintenance: { label: 'Maintenance', color: 'scholr-sunk scholr-muted border-blue-200',          dot: 'bg-blue-500',    icon: Clock },
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

  if (hasOutage) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
        <XCircle className="w-5 h-5 shrink-0" />
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--crit)' }}>Service outage detected</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--crit)' }}>One or more services are unavailable. Our team is investigating.</p>
        </div>
      </div>
    );
  }
  if (hasDegraded) {
    return (
      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--warn)' }}>Degraded performance</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--warn)' }}>Some services are running slower than usual. We are monitoring the situation.</p>
        </div>
      </div>
    );
  }
  if (hasMaintenance) {
    return (
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <Clock className="w-5 h-5 shrink-0" />
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>Scheduled maintenance in progress</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink)' }}>Some services may be temporarily unavailable. Check the notice below for details.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
      <CheckCircle2 className="w-5 h-5 shrink-0" />
      <div>
        <p className="text-sm font-bold" style={{ color: 'var(--good)' }}>All systems operational</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--good)' }}>No known incidents. Platform is running normally.</p>
      </div>
    </div>
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
                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
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
              <div key={notice.id} className={`rounded-xl border p-4 ${
                notice.type === 'info' ? 'bg-blue-50 border-blue-200' :
                notice.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${notice.type === 'info' ? 'text-blue-600' : 'text-amber-600'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold scholr-ink">{notice.title}</p>
                    <p className="text-xs scholr-muted mt-1 leading-relaxed">{notice.body}</p>
                    <p className="text-xs scholr-faint mt-2">{formatDistanceToNow(new Date(notice.date), { addSuffix: true })}</p>
                  </div>
                  {!notice.resolved && (
                    <Badge className="scholr-sunk scholr-muted border-0 text-xs shrink-0">Upcoming</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* School-specific alerts */}
      {['past_due', 'unpaid', 'canceled'].includes(billingStatus) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--warn)' }}>Billing issue affecting your school</p>
              <p className="text-xs mt-1" style={{ color: 'var(--warn)' }}>
                Your school's subscription is <strong>{billingStatus?.replace('_', ' ')}</strong>. Some features may be restricted.
                {' '}Resolve this from <a href="/SchoolAdminBilling" className="underline font-semibold">Billing & Subscription</a>.
              </p>
            </div>
          </div>
        </div>
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