import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { format } from 'date-fns';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminPagination from '@/components/admin/super-admin/SuperAdminPagination';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import {
  usePaginatedItems,
  useSuperAdminAuditLogsQuery,
  useSuperAdminSchoolsQuery,
} from '@/components/hooks/useSuperAdminData';
import { Group } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import DataTable from '@/components/app/DataTable';
import { Field, FilterBar, SearchField, SelectField } from '@/components/app/Field';

const PAGE_SIZE = 50;

/* Severity maps straight onto the reserved palette — this is the one place in
 * the console where a colour genuinely means "something is wrong". */
const LEVEL_TONE = { info: 'mute', warning: 'warn', critical: 'crit' };

const LEVEL_OPTIONS = [
  { value: 'all', label: 'Any level' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

export default function SuperAdminAuditLogs() {
  const navigate = useNavigate();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [page, setPage] = useState(1);

  const { data: logs = [], isLoading } = useSuperAdminAuditLogsQuery({ enabled: !!currentUser });
  const { data: schools = [], isLoading: isLoadingSchools } = useSuperAdminSchoolsQuery({ enabled: !!currentUser });

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = !searchQuery ||
        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
      const matchesSchool = filterSchool === 'all' || log.school_id === filterSchool;
      return matchesSearch && matchesLevel && matchesSchool;
    });
  }, [filterLevel, filterSchool, logs, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterLevel, filterSchool]);

  const { paginatedItems, totalItems, totalPages, page: safePage } = usePaginatedItems(filteredLogs, PAGE_SIZE, page);

  if (isChecking || isLoading || isLoadingSchools) {
    return <SuperAdminLoadingState />;
  }

  if (!currentUser) {
    return null;
  }

  const counts = {
    info: logs.filter((log) => log.level === 'info').length,
    warning: logs.filter((log) => log.level === 'warning').length,
    critical: logs.filter((log) => log.level === 'critical').length,
  };

  const columns = [
    {
      key: 'when',
      header: 'When',
      width: '10rem',
      render: (log) => (log.created_at ? format(new Date(log.created_at), 'd MMM yyyy HH:mm') : '—'),
    },
    {
      key: 'level',
      header: 'Level',
      render: (log) => (
        <StatusChip tone={LEVEL_TONE[log.level] || 'mute'}>{log.level || 'info'}</StatusChip>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (log) => (
        <span style={{ display: 'block' }}>
          <span style={{ display: 'block', color: 'var(--ink)' }}>{log.action || 'Unnamed action'}</span>
          {log.details && (
            <span style={{ display: 'block', fontSize: '.76rem', color: 'var(--muted)', overflowWrap: 'anywhere' }}>
              {log.details}
            </span>
          )}
        </span>
      ),
    },
    { key: 'who', header: 'Who', render: (log) => log.user_email || 'System' },
  ];

  return (
    <SuperAdminShell
      activeItem="audit-logs"
      currentUser={currentUser}
      title="Audit log"
      eyebrow={
        totalItems === logs.length
          ? 'Everything that happened, and who did it'
          : `${totalItems} of ${logs.length} entries shown`
      }
    >
      <StatRow>
        <StatCard label="Entries" value={logs.length} hint="all time" />
        <StatCard label="Warnings" value={counts.warning} hint="worth a look" />
        <StatCard label="Critical" value={counts.critical} hint="needs attention" />
      </StatRow>

      <Group>
        <div className="px-4 pt-3.5">
          <FilterBar>
            <Field label="Find" htmlFor="logs-search">
              <SearchField
                id="logs-search"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Action, user or detail"
              />
            </Field>
            <Field label="Level" htmlFor="logs-level">
              <SelectField id="logs-level" value={filterLevel} onChange={setFilterLevel} label="Level" options={LEVEL_OPTIONS} />
            </Field>
            <Field label="School" htmlFor="logs-school">
              <SelectField
                id="logs-school"
                value={filterSchool}
                onChange={setFilterSchool}
                label="School"
                options={[{ value: 'all', label: 'Any school' }, ...schools.map((s) => ({ value: s.id, label: s.name }))]}
              />
            </Field>
          </FilterBar>
        </div>

        <DataTable
          columns={columns}
          rows={paginatedItems}
          rowKey={(log) => log.id}
          empty={logs.length === 0 ? 'Nothing has been logged yet.' : 'No entry matches those filters.'}
        />

        <SuperAdminPagination
          page={safePage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </Group>
    </SuperAdminShell>
  );
}
