import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Search, Users } from 'lucide-react';
import ManageUserDialog from '@/components/admin/ManageUserDialog';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminPageHeader from '@/components/admin/super-admin/SuperAdminPageHeader';
import SuperAdminPagination from '@/components/admin/super-admin/SuperAdminPagination';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import { usePaginatedItems, useSuperAdminUsersQuery } from '@/components/hooks/useSuperAdminData';

const PAGE_SIZE = 25;

const roleColors = {
  super_admin: 'bg-red-900/50 text-red-300 border-red-800',
  school_admin: 'bg-purple-900/50 text-purple-300 border-purple-800',
  ib_coordinator: 'bg-blue-900/50 text-blue-300 border-blue-800',
  teacher: 'bg-emerald-900/50 text-emerald-300 border-emerald-800',
  student: 'bg-indigo-900/50 text-indigo-300 border-indigo-800',
  parent: 'bg-amber-900/50 text-amber-300 border-amber-800',
  user: 'bg-slate-700/50 text-slate-400 border-slate-600',
};

const ROLES = ['all', 'super_admin', 'school_admin', 'ib_coordinator', 'teacher', 'student', 'parent', 'user'];

export default function SuperAdminUsers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);
  const { data, isLoading, error, refetch } = useSuperAdminUsersQuery({ enabled: !!currentUser });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const schools = data?.schools || [];
  const users = data?.users || [];

  const filteredUsers = useMemo(() => {
    let filtered = users;
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
  }, [filterRole, filterSchool, searchQuery, users]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterRole, filterSchool]);

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

  return (
    <>
      <SuperAdminShell activeItem="users" currentUser={currentUser}>
        <SuperAdminPageHeader
          title="User Management"
          subtitle={`${users.length} total users across all schools`}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
            {error?.response?.data?.error || error.message || 'Failed to load users'}
          </div>
        )}

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 mb-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium">Role</p>
              <div className="flex flex-wrap gap-1">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      filterRole === role
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {role === 'all' ? 'All Roles' : role.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium">School</p>
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Schools</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>{school.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Showing <strong className="text-slate-900">{totalItems}</strong> matching users
            </span>
          </div>

          {paginatedItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-5 py-3">User</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">School</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Joined</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedItems.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-slate-600">
                            {(user.full_name || user.email || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{user.full_name || '—'}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-slate-600">{user.school_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${roleColors[user.role] || roleColors.user}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">
                        {user.created_date
                          ? new Date(user.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setManageDialogOpen(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                      >
                        Manage
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <SuperAdminPagination
            page={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      </SuperAdminShell>

      {selectedUser && (
        <ManageUserDialog
          open={manageDialogOpen}
          onOpenChange={setManageDialogOpen}
          user={selectedUser}
          onUserUpdated={handleUserUpdated}
        />
      )}
    </>
  );
}