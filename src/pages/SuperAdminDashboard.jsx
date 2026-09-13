import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  getSuperAdminPlatformMetrics,
  useSuperAdminSchoolsQuery,
} from '@/components/hooks/useSuperAdminData';
import { ArrowRight, ChevronRight, Plus } from 'lucide-react';
import CreateSchoolDialog from '@/components/admin/CreateSchoolDialog';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import { Panel, PanelRow, PanelRowLink, PanelEmpty } from '@/components/app/Panel';
import Meter from '@/components/app/Meter';

// Platform status → the reserved palette. `suspended` and a broken billing
// state are the only two things on this page that are actually wrong, so they
// are the only two that get a status colour.
function schoolTone(school) {
  if (school.status === 'suspended') return 'crit';
  if (['past_due', 'unpaid', 'incomplete'].includes(school.billing_status)) return 'warn';
  if (school.status === 'active') return 'good';
  return 'mute';
}

function schoolStateLabel(school) {
  if (school.status === 'suspended') return 'Suspended';
  if (['past_due', 'unpaid', 'incomplete'].includes(school.billing_status)) {
    return school.billing_status.replace('_', ' ');
  }
  return school.status || 'unknown';
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);
  const { data: schools = [], isLoading, refetch } = useSuperAdminSchoolsQuery({ enabled: !!currentUser });
  const metrics = getSuperAdminPlatformMetrics(schools);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (isChecking || isLoading) {
    return <SuperAdminLoadingState />;
  }

  if (!currentUser) {
    return null;
  }

  const recentSchools = [...schools].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
  const atRiskSchools = schools.filter(
    (school) => school.billing_status === 'past_due' || school.billing_status === 'incomplete' || school.status === 'suspended'
  );

  const split = [
    { label: 'Paid', value: metrics.paid },
    { label: 'Trial', value: metrics.trial },
    { label: 'Onboarding', value: metrics.onboarding },
    { label: 'Suspended', value: metrics.suspended },
  ];
  const splitTotal = split.reduce((sum, s) => sum + s.value, 0);

  return (
    <>
      <SuperAdminShell activeItem="overview" currentUser={currentUser}>
        <div className="cobalt-page max-w-6xl mx-auto flex flex-col gap-5 md:gap-6" style={{ background: 'transparent' }}>
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="cobalt-label m-0">Every school, every tenant</p>
              <h1 className="cobalt-h1 m-0 mt-1.5 text-2xl md:text-3xl">Platform</h1>
            </div>
            <button
              type="button"
              onClick={() => setCreateDialogOpen(true)}
              className="cobalt-focus inline-flex items-center gap-2 self-start sm:self-auto shrink-0 text-sm font-medium"
              style={{
                background: 'var(--cobalt)',
                color: 'var(--cobalt-ink)',
                borderRadius: 'var(--radius-control)',
                padding: '0.5rem 0.85rem',
              }}
            >
              <Plus className="w-4 h-4" />
              New school
            </button>
          </header>

          <StatRow>
            <StatCard label="Schools" value={metrics.total} hint={`${metrics.onboarding} still in setup`} />
            <StatCard label="Active" value={metrics.active} hint="fully onboarded" />
            <StatCard label="Paying" value={metrics.paid} hint={`${metrics.trial} on trial`} />
            <StatCard label="At risk" value={metrics.atRisk} hint="billing or suspended" />
          </StatRow>

          {/* The dark beat, and it earns it: this is the only list on the page
              that anyone has to act on. It is omitted entirely when empty
              rather than rendered as a reassuring green box. */}
          {atRiskSchools.length > 0 && (
            <Panel title={`Needs attention · ${atRiskSchools.length}`} dark>
              <div className="max-h-56 overflow-y-auto">
                {atRiskSchools.map((school) => (
                  <PanelRowLink
                    key={school.id}
                    type="button"
                    onClick={() => navigate(createPageUrl('SuperAdminSchoolDetail') + `/${school.id}`)}
                  >
                    <PanelRow name={school.name}>
                      <StatusChip tone={schoolTone(school)}>{schoolStateLabel(school)}</StatusChip>
                    </PanelRow>
                  </PanelRowLink>
                ))}
              </div>
            </Panel>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
            <Panel
              title="Recent schools"
              className="lg:col-span-2 overflow-hidden"
              action={
                <Link
                  to={createPageUrl('SuperAdminSchools')}
                  className="cobalt-focus inline-flex items-center gap-1 text-xs"
                  style={{ color: 'var(--cobalt)' }}
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              {recentSchools.length === 0 ? (
                <PanelEmpty>No schools on the platform yet.</PanelEmpty>
              ) : (
                recentSchools.map((school) => (
                  <PanelRowLink
                    key={school.id}
                    type="button"
                    onClick={() => navigate(createPageUrl('SuperAdminSchoolDetail') + `/${school.id}`)}
                  >
                    <PanelRow
                      name={school.name}
                      detail={[school.city, school.country].filter(Boolean).join(', ') || undefined}
                    >
                      <StatusChip tone={schoolTone(school)}>{schoolStateLabel(school)}</StatusChip>
                    </PanelRow>
                  </PanelRowLink>
                ))
              )}
            </Panel>

            <div className="flex flex-col gap-5 md:gap-6">
              <Panel title="Subscription split">
                <div className="px-4 py-3.5 flex flex-col gap-2.5">
                  {split.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-baseline gap-3">
                        <span className="text-sm" style={{ color: 'var(--ink)' }}>{item.label}</span>
                        <span
                          className="ml-auto text-sm cobalt-num"
                          style={{ fontFamily: 'var(--font-mono)', color: 'var(--body)' }}
                        >
                          {item.value}
                        </span>
                      </div>
                      {/* Parts of one whole, so each bar is measured against
                          the total rather than against the largest slice. */}
                      <div className="mt-1">
                        <Meter value={splitTotal ? (item.value / splitTotal) * 100 : 0} height={4} />
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel title="Go to">
                {[
                  ['SuperAdminSchools', 'Schools'],
                  ['SuperAdminUsers', 'Users'],
                  ['SuperAdminBilling', 'Billing'],
                  ['SuperAdminAuditLogs', 'Audit logs'],
                ].map(([page, label]) => (
                  <PanelRowLink key={page} as={Link} to={createPageUrl(page)}>
                    <PanelRow name={label}>
                      <ChevronRight className="w-4 h-4" style={{ color: 'var(--faint)' }} />
                    </PanelRow>
                  </PanelRowLink>
                ))}
              </Panel>
            </div>
          </div>
        </div>
      </SuperAdminShell>

      <CreateSchoolDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSchoolCreated={() => refetch()}
      />
    </>
  );
}
