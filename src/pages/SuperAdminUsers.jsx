import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Trash2, UserX } from 'lucide-react';
import ManageUserDialog from '@/components/admin/ManageUserDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminPagination from '@/components/admin/super-admin/SuperAdminPagination';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import { usePaginatedItems, useSuperAdminUsersQuery } from '@/components/hooks/useSuperAdminData';
import { useToast } from '@/components/ui/use-toast';
import { Group, GroupEmpty } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';
import DataTable from '@/components/app/DataTable';
import { Field, FilterBar, SearchField, SelectField } from '@/components/app/Field';
import * as fns from '@/data/functions';

const PAGE_SIZE = 25;

/* A role is an attribute, not a health state, so it wears the neutral chip —
 * this was seven Tailwind hues, all of them the dark variant, on a light page.
 * super_admin is the one exception: it is worth noticing in a list, so it gets
 * the filled neutral rather than a colour that would read as "broken". */
const ROLE_LABELS = {
  super_admin: 'Super admin',
  school_admin: 'School admin',
  ib_coordinator: 'Coordinator',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  user: 'No role',
};

const ROLE_OPTIONS = [
  { value: 'all', label: 'Any role' },
  ...Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })),
];

export default function SuperAdminUsers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);
  const { data, isLoading, error, refetch } = useSuperAdminUsersQuery({ enabled: !!currentUser });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [showBlankOnly, setShowBlankOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [page, setPage] = useState(1);

  const schools = data?.schools || [];
  const users = data?.users || [];

  const isBlankUser = (u) => !u.full_name && !u.email;

  const blankUserCount = useMemo(() => users.filter(isBlankUser).length, [users]);

  const filteredUsers = useMemo(() => {
    let filtered = users;
    if (showBlankOnly) {
      filtered = filtered.filter(isBlankUser);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterRole !== 'all') filtered = filtered.filter((user) => user.role === filterRole);
    if (filterSchool !== 'all') filtered = filtered.filter((user) => user.active_school_id === filterSchool);
    return filtered;
  }, [filterRole, filterSchool, searchQuery, users, showBlankOnly]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterRole, filterSchool, showBlankOnly]);

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fns.invoke('superAdminDeleteUser', { userId: userToDelete.id });
      const errMsg = res?.error;
      const failures = res?.failures || [];
      if (errMsg) throw new Error(errMsg);
      if (failures.length > 0) throw new Error(failures[0].error || 'Delete failed');
      toast({ title: 'User deleted', description: userToDelete.email || userToDelete.id });
      setUserToDelete(null);
      await queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
      await refetch();
    } catch (err) {
      toast({
        title: 'Could not delete user',
        description: err?.response?.data?.error || err?.message || 'Try again',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteBlank = async () => {
    const blanks = users.filter(isBlankUser);
    if (blanks.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await fns.invoke('superAdminDeleteUser', { userIds: blanks.map((u) => u.id) });
      const deleted = res?.deleted || 0;
      toast({ title: `Deleted ${deleted} blank account${deleted === 1 ? '' : 's'}` });
    } catch (err) {
      toast({
        title: 'Bulk delete failed',
        description: err?.message || 'Try again',
        variant: 'destructive',
      });
    }
    setBulkDeleteOpen(false);
    setIsDeleting(false);
    await queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
    await refetch();
  };

  const { paginatedItems, totalItems, totalPages, page: safePage } = usePaginatedItems(filteredUsers, PAGE_SIZE, page);

  const handleUserUpdated = async () => {
    setManageDialogOpen(false);
    // Bust all super-admin caches so the row reflects the new school assignment
    await queryClient.invalidateQueries({ queryKey: ['super-admin', 'users'] });
    await queryClient.invalidateQueries({ queryKey: ['super-admin', 'school-overview'] });
    await refetch();
  };

  if (isChecking || isLoading) {
    return <SuperAdminLoadingState />;
  }

  if (!currentUser) {
    return null;
  }

  const iconBtn = {
    padding: '.3rem', borderRadius: 'var(--radius-control)', border: 'none',
    background: 'transparent', color: 'var(--faint)', cursor: 'pointer', lineHeight: 0,
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '.6rem', minWidth: 0 }}>
          <span
            aria-hidden="true"
            style={{
              width: '1.75rem', height: '1.75rem', flex: 'none', borderRadius: '999px',
              display: 'grid', placeItems: 'center',
              background: 'var(--surface-sunk)', color: 'var(--muted)',
              fontSize: '.7rem', fontWeight: 600,
            }}
          >
            {(user.full_name || user.email || '?')[0].toUpperCase()}
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', color: 'var(--ink)', overflowWrap: 'anywhere' }}>
              {user.full_name || 'No name on file'}
            </span>
            <span style={{ display: 'block', fontSize: '.76rem', color: 'var(--muted)', overflowWrap: 'anywhere' }}>
              {user.email || 'No email'}
            </span>
          </span>
        </span>
      ),
    },
    { key: 'school', header: 'School', render: (user) => user.school_name || '—' },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <StatusChip tone={user.role === 'super_admin' ? 'info' : 'mute'}>
          {ROLE_LABELS[user.role] || user.role || 'No role'}
        </StatusChip>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (user) =>
        user.created_at
          ? new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
          : '—',
    },
    {
      key: 'actions',
      header: '',
      width: '7.5rem',
      render: (user) => (
        <span style={{ display: 'flex', gap: '.3rem', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            type="button"
            className="pub-btn pub-btn-line scholr-focus"
            style={{ fontSize: '.75rem', padding: '.22rem .6rem' }}
            onClick={() => { setSelectedUser(user); setManageDialogOpen(true); }}
          >
            Manage
          </button>
          <button
            type="button"
            className="scholr-focus"
            style={iconBtn}
            aria-label={`Delete ${user.email || user.id}`}
            onClick={() => setUserToDelete(user)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </span>
      ),
    },
  ];

  return (
    <>
      <SuperAdminShell
        activeItem="users"
        currentUser={currentUser}
        title="Users"
        eyebrow={
          totalItems === users.length
            ? `${users.length} across every school`
            : `${totalItems} of ${users.length} shown`
        }
        actions={
          blankUserCount > 0 ? (
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(true)}
              className="pub-btn pub-btn-line scholr-focus"
            >
              <UserX className="w-4 h-4" />
              Clean up {blankUserCount} blank account{blankUserCount === 1 ? '' : 's'}
            </button>
          ) : null
        }
      >
        {error && (
          <Group title="Could not load users">
            <GroupEmpty>
              {error?.response?.data?.error || error.message || 'The user list failed to load.'}
            </GroupEmpty>
          </Group>
        )}

        <Group
          action={
            blankUserCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowBlankOnly(!showBlankOnly)}
                className="scholr-focus scholr-label"
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: showBlankOnly ? 'var(--brand)' : 'var(--muted)',
                }}
              >
                {showBlankOnly ? 'Showing blank only' : `${blankUserCount} blank`}
              </button>
            ) : null
          }
        >
          <div className="px-4 pt-3.5">
            <FilterBar>
              <Field label="Find" htmlFor="users-search">
                <SearchField
                  id="users-search"
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Name or email"
                />
              </Field>
              <Field label="Role" htmlFor="users-role">
                <SelectField id="users-role" value={filterRole} onChange={setFilterRole} label="Role" options={ROLE_OPTIONS} />
              </Field>
              <Field label="School" htmlFor="users-school">
                <SelectField
                  id="users-school"
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
            rowKey={(user) => user.id}
            empty="No user matches those filters."
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

      {selectedUser && (
        <ManageUserDialog
          open={manageDialogOpen}
          onOpenChange={setManageDialogOpen}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      )}

      <ConfirmDialog
        open={!!userToDelete}
        title="Delete this user?"
        description={
          userToDelete
            ? `This will permanently delete ${userToDelete.full_name || userToDelete.email || userToDelete.id} and remove all their school memberships. This cannot be undone.`
            : ''
        }
        confirmLabel={isDeleting ? 'Deleting…' : 'Delete user'}
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handleDeleteUser}
        onCancel={() => !isDeleting && setUserToDelete(null)}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${blankUserCount} blank account${blankUserCount === 1 ? '' : 's'}?`}
        description="These are user records with no name and no email — usually created when unauthorised visitors hit the app. They will be permanently removed."
        confirmLabel={isDeleting ? 'Deleting…' : `Delete ${blankUserCount} account${blankUserCount === 1 ? '' : 's'}`}
        cancelLabel="Cancel"
        isDestructive
        onConfirm={handleBulkDeleteBlank}
        onCancel={() => !isDeleting && setBulkDeleteOpen(false)}
      />
    </>
  );
}