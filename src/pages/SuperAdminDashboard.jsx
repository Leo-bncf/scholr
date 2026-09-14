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
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
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
      <SuperAdminShell
        activeItem="overview"
        currentUser={currentUser}
        title="Platform"
        eyebrow="Every school, every tenant"
        actions={
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="pub-btn pub-btn-gold scholr-focus"
          >
            <Plus className="w-4 h-4" />
            New school
          </button>
        }
      >
        {/* No second container: AppShell already holds the measure, and
            nesting another one indented every group past the title. */}
        <>
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
            <Group title={`Needs attention · ${atRiskSchools.length}`}>
              <div className="max-h-56 overflow-y-auto">
                {atRiskSchools.map((school) => (
                  <Row
                    key={school.id}
                    label={school.name}
                    onClick={() => navigate(createPageUrl('SuperAdminSchoolDetail') + `/${school.id}`)}
                  >
                    <StatusChip tone={schoolTone(school)}>{schoolStateLabel(school)}</StatusChip>
                  </Row>
                ))}
              </div>
            </Group>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
            <Group
              title="Recent schools"
              className="lg:col-span-2 overflow-hidden"
              action={
                <Link
                  to={createPageUrl('SuperAdminSchools')}
                  className="scholr-focus inline-flex items-center gap-1 text-xs"
                  style={{ color: 'var(--brand)' }}
                >
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              }
            >
              {recentSchools.length === 0 ? (
                <GroupEmpty>No schools on the platform yet.</GroupEmpty>
              ) : (
                recentSchools.map((school) => (
                  <Row
                    key={school.id}
                    label={school.name}
                    detail={[school.city, school.country].filter(Boolean).join(', ') || undefined}
                    onClick={() => navigate(createPageUrl('SuperAdminSchoolDetail') + `/${school.id}`)}
                  >
                    <StatusChip tone={schoolTone(school)}>{schoolStateLabel(school)}</StatusChip>
                  </Row>
                ))
              )}
            </Group>

            <div className="flex flex-col gap-5 md:gap-6">
              <Group title="Subscription split">
                <div className="px-4 py-3.5 flex flex-col gap-2.5">
                  {split.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-baseline gap-3">
                        <span className="text-sm" style={{ color: 'var(--ink)' }}>{item.label}</span>
                        <span
                          className="ml-auto text-sm scholr-num"
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
              </Group>

              <Group title="Go to">
                {[
                  ['SuperAdminSchools', 'Schools'],
                  ['SuperAdminUsers', 'Users'],
                  ['SuperAdminBilling', 'Billing'],
                  ['SuperAdminAuditLogs', 'Audit logs'],
                ].map(([page, label]) => (
                  <Row key={page} label={label} href={createPageUrl(page)}>
                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--faint)' }} />
                  </Row>
                ))}
              </Group>
            </div>
          </div>
        </>
      </SuperAdminShell>

      <CreateSchoolDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSchoolCreated={() => refetch()}
      />
    </>
  );
}
