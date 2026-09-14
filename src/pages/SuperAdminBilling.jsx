import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import { useSuperAdminSchoolsQuery } from '@/components/hooks/useSuperAdminData';
import { Group, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import Meter from '@/components/app/Meter';
import DataTable from '@/components/app/DataTable';
import { Field, FilterBar, SearchField, SelectField } from '@/components/app/Field';
import * as schoolsData from '@/data/schools';
import {
  BILLING_STATUS_OPTIONS,
  SCHOOL_PLAN_OPTIONS,
  getBillingStatusMeta,
  getPlanMeta,
  getPlanPrice,
} from '@/components/admin/super-admin/superAdminConfig';

/**
 * Billing — one page for what used to be three.
 *
 * Billing, Plans and Plan Management all read the same schools query and
 * showed overlapping slices of it; two of them even computed the same MRR
 * with the same code. Plans and Plan Management are gone. What each of them
 * could do that the others couldn't — the plan mix, and editing a school's
 * plan — is here.
 *
 * On the money: Stripe is not connected (billing endpoints return 503), so
 * nothing on this page is settled revenue. Every figure is derived by
 * multiplying each school's plan by the list price in superAdminConfig. The
 * page says so rather than printing a number that looks like it came from a
 * payment processor.
 */

const money = (n) => `€${n.toLocaleString('en-IE')}`;

export default function SuperAdminBilling() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);
  const { data: schools = [], isLoading } = useSuperAdminSchoolsQuery({ enabled: !!currentUser });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);

  const metrics = useMemo(() => {
    const paying = schools.filter((s) => s.billing_status === 'active');
    const byPlan = {};
    schools.forEach((s) => {
      const plan = s.plan || 'unknown';
      byPlan[plan] = (byPlan[plan] || 0) + 1;
    });
    return {
      mrr: paying.reduce((sum, s) => sum + getPlanPrice(s.plan), 0),
      paying: paying.length,
      trial: schools.filter((s) => s.billing_status === 'trial').length,
      pastDue: schools.filter((s) => ['past_due', 'unpaid'].includes(s.billing_status)).length,
      byPlan,
    };
  }, [schools]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schools.filter((s) => {
      if (statusFilter !== 'all' && (s.billing_status || 'none') !== statusFilter) return false;
      if (!q) return true;
      return [s.name, s.city, s.country].filter(Boolean).some((v) => v.toLowerCase().includes(q));
    });
  }, [schools, search, statusFilter]);

  const updateMutation = useMutation({
    mutationFn: ({ schoolId, patch }) => schoolsData.update(schoolId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'schools'] });
      setEditing(null);
    },
  });

  if (isChecking || isLoading) return <SuperAdminLoadingState />;
  if (!currentUser) return null;

  const planRows = SCHOOL_PLAN_OPTIONS.map((opt) => ({
    ...opt,
    count: metrics.byPlan[opt.value] || 0,
  }));

  const columns = [
    { key: 'name', header: 'School', render: (s) => s.name },
    {
      key: 'plan',
      header: 'Plan',
      render: (s) => <StatusChip>{getPlanMeta(s.plan).label}</StatusChip>,
    },
    {
      key: 'billing',
      header: 'Billing',
      render: (s) => {
        const meta = getBillingStatusMeta(s.billing_status);
        return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
      },
    },
    {
      key: 'value',
      header: 'List price',
      num: true,
      render: (s) => (s.billing_status === 'active' ? money(getPlanPrice(s.plan)) : '—'),
    },
  ];

  return (
    <>
      <SuperAdminShell
        activeItem="billing"
        currentUser={currentUser}
        title="Billing"
        eyebrow="Plans, subscriptions and what they are worth"
      >
        <StatRow>
          <StatCard label="Est. MRR" value={money(metrics.mrr)} hint="from list prices, not Stripe" />
          <StatCard label="Paying" value={metrics.paying} hint={`of ${schools.length} schools`} />
          <StatCard label="On trial" value={metrics.trial} hint="not yet billed" />
          <StatCard label="Past due" value={metrics.pastDue} hint="needs chasing" />
        </StatRow>

        <Group
          title="Plan mix"
          action={<span className="scholr-label">schools per plan</span>}
        >
          <div className="px-4 py-3.5 flex flex-col gap-2.5">
            {planRows.map((plan) => (
              <div key={plan.value}>
                <div className="flex items-baseline gap-3">
                  <span className="text-sm" style={{ color: 'var(--ink)' }}>{plan.label}</span>
                  <span className="text-xs" style={{ color: 'var(--faint)' }}>{money(plan.price)}/mo</span>
                  <span
                    className="ml-auto text-sm scholr-num"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--body)' }}
                  >
                    {plan.count}
                  </span>
                </div>
                <div className="mt-1">
                  <Meter value={schools.length ? (plan.count / schools.length) * 100 : 0} height={4} />
                </div>
              </div>
            ))}
          </div>
        </Group>

        <Group
          title={`Schools · ${filtered.length}`}
          action={<span className="scholr-label">click a row to change its plan</span>}
        >
          <div className="px-4 pt-3.5">
            <FilterBar>
              <Field label="Find" htmlFor="billing-search">
                <SearchField
                  id="billing-search"
                  value={search}
                  onChange={setSearch}
                  placeholder="Name, city or country"
                />
              </Field>
              <Field label="Billing status" htmlFor="billing-status">
                <SelectField
                  id="billing-status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  label="Billing status"
                  options={[{ value: 'all', label: 'All' }, ...BILLING_STATUS_OPTIONS]}
                />
              </Field>
            </FilterBar>
          </div>
          {schools.length === 0 ? (
            <GroupEmpty>No schools on the platform yet.</GroupEmpty>
          ) : (
            <DataTable
              columns={columns}
              rows={filtered}
              rowKey={(s) => s.id}
              onRowClick={(s) => setEditing(s)}
              empty="No school matches that search."
            />
          )}
        </Group>
      </SuperAdminShell>

      <EditPlanDialog
        school={editing}
        onClose={() => setEditing(null)}
        onSave={(patch) => updateMutation.mutate({ schoolId: editing.id, patch })}
        saving={updateMutation.isPending}
        error={updateMutation.error}
        onOpenSchool={(id) => navigate(`${createPageUrl('SuperAdminSchoolDetail')}/${id}`)}
      />
    </>
  );
}

function EditPlanDialog({ school, onClose, onSave, saving, error, onOpenSchool }) {
  const [plan, setPlan] = useState('');
  const [billing, setBilling] = useState('');

  // Re-seed the form each time a different school is opened.
  React.useEffect(() => {
    setPlan(school?.plan || '');
    setBilling(school?.billing_status || '');
  }, [school]);

  if (!school) return null;

  const changed = plan !== (school.plan || '') || billing !== (school.billing_status || '');

  return (
    <Dialog open={!!school} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{school.name}</DialogTitle>
          <DialogDescription>
            Changing the plan here changes what the school is charged at the next
            billing run. It does not move money now.
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Field label="Plan" htmlFor="edit-plan">
            <SelectField
              id="edit-plan"
              value={plan}
              onChange={setPlan}
              label="Plan"
              options={SCHOOL_PLAN_OPTIONS.map((o) => ({ value: o.value, label: `${o.label} — €${o.price}/mo` }))}
            />
          </Field>
          <Field label="Billing status" htmlFor="edit-billing">
            <SelectField
              id="edit-billing"
              value={billing}
              onChange={setBilling}
              label="Billing status"
              options={BILLING_STATUS_OPTIONS}
            />
          </Field>
          {error && (
            <p style={{ margin: 0, fontSize: '.82rem', color: 'var(--crit)' }}>
              {error.message || 'That change could not be saved.'}
            </p>
          )}
        </div>

        <DialogFooter>
          <button
            type="button"
            className="pub-btn pub-btn-line scholr-focus"
            onClick={() => onOpenSchool(school.id)}
          >
            Open school
          </button>
          <button
            type="button"
            className="pub-btn pub-btn-gold scholr-focus"
            disabled={!changed || saving}
            onClick={() => onSave({ plan, billing_status: billing })}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save change
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
