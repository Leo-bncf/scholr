import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import { Group, GroupEmpty, Segmented } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import DataTable from '@/components/app/DataTable';
import { Field, FilterBar, SearchField, SelectField } from '@/components/app/Field';
import * as supportTicketsData from '@/data/supportTickets';

/* An open ticket is not a failure and a resolved one is not a success — they
 * are stages. Only priority says how much something hurts, so only priority
 * draws from the reserved palette. */
const PRIORITY_META = {
  high: { label: 'High', tone: 'crit' },
  medium: { label: 'Medium', tone: 'warn' },
  low: { label: 'Low', tone: 'mute' },
};

const STATUS_META = {
  open: { label: 'Open', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'info' },
  resolved: { label: 'Resolved', tone: 'good' },
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Any status' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'Any priority' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

/**
 * Support tickets raised by schools.
 *
 * The expanded detail used to print `ticket.created`, a column that does not
 * exist — the row is `created_at` — so the Created field was permanently
 * blank. That is the base44 naming hangover CLAUDE.md warns about: it reads as
 * undefined rather than raising.
 */
export default function SuperAdminSupport() {
  const navigate = useNavigate();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    supportTicketsData
      .where({}, { order: 'created_at', ascending: false, limit: 200 })
      .then((data) => {
        if (cancelled) return;
        setTickets(data);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filterStatus !== 'all' && t.status !== filterStatus) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (!q) return true;
      return [t.subject, t.school, t.ticket_id].filter(Boolean).some((v) => v.toLowerCase().includes(q));
    });
  }, [tickets, search, filterStatus, filterPriority]);

  const counts = useMemo(() => ({
    open: tickets.filter((t) => t.status === 'open').length,
    inProgress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }), [tickets]);

  const handleStatusChange = async (id, status) => {
    const previous = tickets;
    setSavingId(id);
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      await supportTicketsData.update(id, { status });
    } catch {
      // Put the row back rather than leaving the screen claiming a change that
      // did not reach the database.
      setTickets(previous);
    } finally {
      setSavingId(null);
    }
  };

  if (isChecking) return <SuperAdminLoadingState />;
  if (!currentUser) return null;

  const columns = [
    {
      key: 'subject',
      header: 'Ticket',
      render: (t) => (
        <span style={{ display: 'block' }}>
          <span style={{ display: 'block', color: 'var(--ink)' }}>{t.subject}</span>
          <span
            className="scholr-num"
            style={{ display: 'block', fontSize: '.74rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}
          >
            {t.ticket_id || t.id.slice(0, 8)} · {t.school}
          </span>
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => {
        const meta = PRIORITY_META[t.priority] || PRIORITY_META.low;
        return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
      },
    },
    {
      key: 'assignee',
      header: 'Assignee',
      render: (t) => t.assignee || 'Unassigned',
    },
    {
      key: 'created',
      header: 'Raised',
      render: (t) => (t.created_at ? format(new Date(t.created_at), 'd MMM yyyy') : '—'),
    },
    {
      key: 'status',
      header: 'Status',
      width: '13rem',
      render: (t) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '.4rem', justifyContent: 'flex-end' }}>
          {savingId === t.id && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--faint)' }} />}
          <Segmented
            label={`Status for ${t.subject}`}
            value={t.status}
            onChange={(next) => handleStatusChange(t.id, next)}
            options={[
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'Active' },
              { value: 'resolved', label: 'Done' },
            ]}
          />
        </span>
      ),
    },
  ];

  return (
    <SuperAdminShell
      activeItem="support"
      currentUser={currentUser}
      title="Support"
      eyebrow={
        filtered.length === tickets.length
          ? 'What schools have asked us to fix'
          : `${filtered.length} of ${tickets.length} shown`
      }
    >
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl) 0' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
        </div>
      ) : (
        <>
          <StatRow>
            <StatCard label="Open" value={counts.open} hint="not yet picked up" />
            <StatCard label="In progress" value={counts.inProgress} hint="being worked on" />
            <StatCard label="Resolved" value={counts.resolved} hint="all time" />
          </StatRow>

          <Group>
            <div className="px-4 pt-3.5">
              <FilterBar>
                <Field label="Find" htmlFor="tickets-search">
                  <SearchField
                    id="tickets-search"
                    value={search}
                    onChange={setSearch}
                    placeholder="Subject, school or reference"
                  />
                </Field>
                <Field label="Status" htmlFor="tickets-status">
                  <SelectField id="tickets-status" value={filterStatus} onChange={setFilterStatus} label="Status" options={STATUS_OPTIONS} />
                </Field>
                <Field label="Priority" htmlFor="tickets-priority">
                  <SelectField id="tickets-priority" value={filterPriority} onChange={setFilterPriority} label="Priority" options={PRIORITY_OPTIONS} />
                </Field>
              </FilterBar>
            </div>

            {tickets.length === 0 ? (
              <GroupEmpty>No school has raised a ticket yet.</GroupEmpty>
            ) : (
              <DataTable
                columns={columns}
                rows={filtered}
                rowKey={(t) => t.id}
                empty="No ticket matches those filters."
              />
            )}
          </Group>
        </>
      )}
    </SuperAdminShell>
  );
}
