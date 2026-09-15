import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Edit2, Loader2, Plus, Trash2 } from 'lucide-react';
import CreateSchoolDialog from '@/components/admin/CreateSchoolDialog';
import SchoolOnboardingProgress from '@/components/admin/SchoolOnboardingProgress';
import SchoolQuickEdit from '@/components/admin/SchoolQuickEdit';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminPagination from '@/components/admin/super-admin/SuperAdminPagination';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import { Group, GroupEmpty } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';
import DataTable from '@/components/app/DataTable';
import { Field, FilterBar, SearchField, SelectField } from '@/components/app/Field';
import * as schoolsData from '@/data/schools';
import {
  usePaginatedItems,
  useSuperAdminSchoolOverviewQuery,
} from '@/components/hooks/useSuperAdminData';
import {
  getBillingStatusMeta,
  getPlanMeta,
  getSchoolStatusMeta,
} from '@/components/admin/super-admin/superAdminConfig';

const PAGE_SIZE = 12;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'suspended', label: 'Suspended' },
];

const BILLING_OPTIONS = [
  { value: 'all', label: 'Any billing' },
  { value: 'trial', label: 'Trial' },
  { value: 'active', label: 'Paid' },
  { value: 'past_due', label: 'Past due' },
];

const day = (value) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

/**
 * Every school on the platform.
 *
 * The list is a table rather than a stack of cards: the job here is comparing
 * schools against each other — who is stuck in onboarding, who is past due —
 * and that is what a table is for. Editing a school expands its row in place
 * instead of opening a dialog, so you keep your position in the list.
 */
export default function SuperAdminSchools() {
  const navigate = useNavigate();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);
  const { data, isLoading, refetch } = useSuperAdminSchoolOverviewQuery({ enabled: !!currentUser });
  const schools = data?.schools || [];
  const onboardingBySchool = data?.onboardingBySchool || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBilling, setFilterBilling] = useState('all');
  const [editingSchoolId, setEditingSchoolId] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deletingSchoolId, setDeletingSchoolId] = useState(null);
  const [page, setPage] = useState(1);

  const handleSchoolUpdated = async () => {
    await refetch();
    setEditingSchoolId(null);
  };

  const handleDeleteSchool = async (school) => {
    if (!window.confirm(`Permanently delete "${school.name}"? This cannot be undone.`)) return;
    setDeletingSchoolId(school.id);
    await schoolsData.remove(school.id);
    await refetch();
    setDeletingSchoolId(null);
  };

  const filteredSchools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return schools.filter((school) => {
      if (filterStatus !== 'all' && school.status !== filterStatus) return false;
      if (filterBilling !== 'all' && school.billing_status !== filterBilling) return false;
      if (!q) return true;
      return [school.name, school.email, school.city].filter(Boolean).some((v) => v.toLowerCase().includes(q));
    });
  }, [filterBilling, filterStatus, schools, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterStatus, filterBilling]);

  const { paginatedItems, totalItems, totalPages, page: safePage } = usePaginatedItems(filteredSchools, PAGE_SIZE, page);

  if (isChecking || isLoading) return <SuperAdminLoadingState />;
  if (!currentUser) return null;

  const iconBtn = {
    padding: '.3rem', borderRadius: 'var(--radius-control)', border: 'none',
    background: 'transparent', color: 'var(--faint)', cursor: 'pointer', lineHeight: 0,
  };

  const columns = [
    {
      key: 'name',
      header: 'School',
      render: (school) => (
        <span style={{ display: 'block' }}>
          <span style={{ display: 'block', color: 'var(--ink)' }}>{school.name}</span>
          <span style={{ display: 'block', fontSize: '.76rem', color: 'var(--muted)' }}>
            {[school.city, school.country].filter(Boolean).join(', ') || 'No location on file'}
          </span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (school) => {
        const meta = getSchoolStatusMeta(school.status);
        return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
      },
    },
    {
      key: 'billing',
      header: 'Billing',
      render: (school) => {
        const meta = getBillingStatusMeta(school.billing_status);
        return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
      },
    },
    { key: 'plan', header: 'Plan', render: (school) => getPlanMeta(school.plan).label },
    {
      key: 'setup',
      header: 'Setup',
      width: '9rem',
      render: (school) => (
        <SchoolOnboardingProgress schoolId={school.id} summary={onboardingBySchool[school.id]} />
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (school) => day(school.created_at) || '—',
    },
    {
      key: 'actions',
      header: '',
      width: '5rem',
      render: (school) => (
        <span style={{ display: 'flex', gap: '.15rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="scholr-focus"
            style={iconBtn}
            aria-label={`Edit ${school.name}`}
            onClick={(e) => { e.stopPropagation(); setEditingSchoolId(school.id); }}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="scholr-focus"
            style={iconBtn}
            aria-label={`Delete ${school.name}`}
            disabled={deletingSchoolId === school.id}
            onClick={(e) => { e.stopPropagation(); handleDeleteSchool(school); }}
          >
            {deletingSchoolId === school.id
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Trash2 className="w-4 h-4" />}
          </button>
        </span>
      ),
    },
  ];

  const editing = paginatedItems.find((s) => s.id === editingSchoolId);

  return (
    <>
      <SuperAdminShell
        activeItem="schools"
        currentUser={currentUser}
        title="Schools"
        // The count lives here, not in a heading over the list. The page is
        // already called Schools; repeating the word one line down is the
        // "Settings / Platform Settings" tic.
        eyebrow={
          totalItems === schools.length
            ? `${schools.length} on the platform`
            : `${totalItems} of ${schools.length} shown`
        }
        actions={
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="pub-btn pub-btn-primary scholr-focus"
          >
            <Plus className="w-4 h-4" />
            New school
          </button>
        }
      >
        <Group>
          <div className="px-4 pt-3.5">
            <FilterBar>
              <Field label="Find" htmlFor="schools-search">
                <SearchField
                  id="schools-search"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Name, email or city"
                />
              </Field>
              <Field label="Status" htmlFor="schools-status">
                <SelectField id="schools-status" value={filterStatus} onChange={setFilterStatus} label="Status" options={STATUS_OPTIONS} />
              </Field>
              <Field label="Billing" htmlFor="schools-billing">
                <SelectField id="schools-billing" value={filterBilling} onChange={setFilterBilling} label="Billing" options={BILLING_OPTIONS} />
              </Field>
            </FilterBar>
          </div>

          {schools.length === 0 ? (
            <GroupEmpty>No schools yet. Create the first one with the button above.</GroupEmpty>
          ) : (
            <DataTable
              columns={columns}
              rows={paginatedItems}
              rowKey={(school) => school.id}
              onRowClick={(school) => navigate(`${createPageUrl('SuperAdminSchoolDetail')}/${school.id}`)}
              empty="No school matches those filters."
            />
          )}

          <SuperAdminPagination
            page={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </Group>

        {editing && (
          <Group title={`Editing · ${editing.name}`}>
            <div className="px-4 py-3.5">
              <SchoolQuickEdit
                school={editing}
                onUpdated={handleSchoolUpdated}
                onCancel={() => setEditingSchoolId(null)}
              />
            </div>
          </Group>
        )}
      </SuperAdminShell>

      <CreateSchoolDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSchoolCreated={() => refetch()}
      />
    </>
  );
}
