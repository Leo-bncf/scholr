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
import { annualCost, effectiveRate } from '@/lib/pricing';
import {
  BILLING_STATUS_OPTIONS,
  getBillingStatusMeta,
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
 * nothing here is settled revenue. Every figure is computed from the seats a
 * school has bought, through the graduated bands in src/lib/pricing.js — the
 * one place that answers what a school pays. The page says so rather than
 * printing a number that looks like it came from a payment processor.
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
    const bucket = (n) => (!n ? 'none' : n <= 200 ? 'small' : n <= 600 ? 'mid' : 'large');
    const bySize = { none: 0, small: 0, mid: 0, large: 0 };
    schools.forEach((s) => { bySize[bucket(s.max_students)] += 1; });
    return {
      mrr: paying.reduce((sum, s) => sum + annualCost(s.max_students || 0) / 12, 0),
      paying: paying.length,
      trial: schools.filter((s) => s.billing_status === 'trial').length,
      pastDue: schools.filter((s) => ['past_due', 'unpaid'].includes(s.billing_status)).length,
      bySize,
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

  const sizeBands = [
    { key: 'small', label: 'Up to 200', rate: '€22 a head' },
    { key: 'mid', label: '201–600', rate: 'blended €17–22' },
    { key: 'large', label: 'Over 600', rate: 'blended under €19' },
    { key: 'none', label: 'No seats set', rate: 'not billable yet' },
  ].map((b) => ({ ...b, count: metrics.bySize[b.key] || 0 }));

  const columns = [
    { key: 'name', header: 'School', render: (s) => s.name },
    {
      key: 'seats',
      header: 'Seats',
      num: true,
      render: (s) => (s.max_students ? s.max_students.toLocaleString('en-IE') : '—'),
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
      key: 'rate',
      header: 'Per student',
      num: true,
      render: (s) => (s.max_students ? `€${effectiveRate(s.max_students).toFixed(2)}` : '—'),
    },
    {
      // Annual, not monthly: this is how the school is invoiced, and showing a
      // twelfth of it here would just be the MRR tile again in another column.
      key: 'value',
      header: 'Annual',
      num: true,
      render: (s) => (s.max_students ? money(annualCost(s.max_students)) : '—'),
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

        {/* Where schools sit on the curve. The old version of this block
            counted schools per plan, which stopped meaning anything when the
            plans went away — there is one product now, and the only thing that
            varies is the roll. */}
        <Group title="By size" action={<span className="scholr-label">seats purchased</span>}>
          <div className="px-4 py-3.5 flex flex-col gap-2.5">
            {sizeBands.map((band) => (
              <div key={band.label}>
                <div className="flex items-baseline gap-3">
                  <span className="text-sm" style={{ color: 'var(--ink)' }}>{band.label}</span>
                  <span className="text-xs" style={{ color: 'var(--faint)' }}>{band.rate}</span>
                  <span
                    className="ml-auto text-sm scholr-num"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--body)' }}
                  >
                    {band.count}
                  </span>
                </div>
                <div className="mt-1">
                  <Meter value={schools.length ? (band.count / schools.length) * 100 : 0} height={4} />
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
  const [seats, setSeats] = useState('');
  const [billing, setBilling] = useState('');
  const seatCount = Math.max(0, parseInt(seats, 10) || 0);

  // Re-seed the form each time a different school is opened.
  React.useEffect(() => {
    setSeats(school?.max_students != null ? String(school.max_students) : '');
    setBilling(school?.billing_status || '');
  }, [school]);

  if (!school) return null;

  const changed = seatCount !== (school.max_students || 0) || billing !== (school.billing_status || '');

  return (
    <Dialog open={!!school} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{school.name}</DialogTitle>
          <DialogDescription>
            Seats are what the school is billed for. Changing them changes the
            next invoice; it does not move money now.
          </DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <Field
            label="Student seats"
            htmlFor="edit-seats"
            hint={
              seatCount > 0
                ? `${money(annualCost(seatCount))} a year · €${effectiveRate(seatCount).toFixed(2)} per student`
                : 'Not billable until seats are set'
            }
          >
            <input
              id="edit-seats"
              type="number"
              min="0"
              step="10"
              className="app-input scholr-focus"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
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
            className="pub-btn pub-btn-primary scholr-focus"
            disabled={!changed || saving}
            onClick={() => onSave({ max_students: seatCount, billing_status: billing })}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save change
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
