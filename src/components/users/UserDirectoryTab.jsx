import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Group } from '@/components/app/AppShell';
import DataTable from '@/components/app/DataTable';
import StatusChip from '@/components/app/StatusChip';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search, Loader2, Pencil, Trash2, UserCheck, UserX, Download, MoreHorizontal, Filter
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { ROLE_CONFIG } from './userConstants';
import * as membershipsData from '@/data/memberships';
import * as academics from '@/data/academics';
import * as fns from '@/data/functions';

/* Only two of these are a judgement. Active is the normal case and gets no
   colour at all — a directory where every row glows green tells you nothing.
   Suspended is something someone did on purpose, and pending is unfinished
   work, so those two draw from the reserved palette. */
const STATUS_TONE = { active: 'mute', inactive: 'crit', pending: 'warn' };
const STATUS_LABEL = { active: 'Active', inactive: 'Suspended', pending: 'Pending' };

function EditMemberDialog({ member, onClose, schoolId }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    user_name: member.user_name || '',
    role: member.role || 'student',
    status: member.status || 'active',
    grade_level: member.grade_level || '',
    department: member.department || '',
    permissions: member.permissions || [],
  });

  const updateMutation = useMutation({
    mutationFn: (data) => membershipsData.update(member.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-memberships', schoolId] });
      onClose();
    },
  });

  const SUB_ADMIN_PERMS = [
    { value: 'attendance_admin', label: 'Attendance Admin' },
    { value: 'behavior_admin',   label: 'Behavior Admin' },
    { value: 'reports_admin',    label: 'Reports Admin' },
    { value: 'billing_viewer',   label: 'Billing Viewer' },
  ];

  const togglePerm = (perm) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            Edit — {member.user_name || member.user_email}
          </DialogTitle>
        </DialogHeader>
        <form
          onSubmit={e => { e.preventDefault(); updateMutation.mutate(form); }}
          className="space-y-4 pt-1"
        >
          <div>
            <Label className="text-xs font-semibold scholr-muted">Display Name</Label>
            <Input value={form.user_name} onChange={e => setForm({ ...form, user_name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold scholr-muted">Role</Label>
            <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-semibold scholr-muted">Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive (Suspended)</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.role === 'student' && (
            <div>
              <Label className="text-xs font-semibold scholr-muted">Grade Level</Label>
              <Input value={form.grade_level} onChange={e => setForm({ ...form, grade_level: e.target.value })} placeholder="DP1, DP2, MYP3…" className="mt-1" />
            </div>
          )}
          {(form.role === 'teacher' || form.role === 'ib_coordinator') && (
            <div>
              <Label className="text-xs font-semibold scholr-muted">Department</Label>
              <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Sciences, Humanities…" className="mt-1" />
            </div>
          )}
          {form.role === 'school_admin' && (
            <div>
              <Label className="text-xs font-semibold scholr-muted">Sub-Admin Permissions</Label>
              <p className="text-[11px] scholr-faint mb-2">Grant limited admin rights to non-full-admin staff.</p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {SUB_ADMIN_PERMS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePerm(p.value)}
                    className={`text-xs px-3 py-2 rounded-md border text-left transition-colors ${
                      form.permissions.includes(p.value)
                        ? 'scholr-accent-sf scholr-accent-rule scholr-accent font-medium'
                        : 'bg-white scholr-rule scholr-muted hover:scholr-rule'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending} className="flex-1 pub-btn pub-btn-primary">
              {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function UserDirectoryTab({ schoolId }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cohortFilter, setCohortFilter] = useState('all');
  const [editingMember, setEditingMember] = useState(null);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [memberToSuspend, setMemberToSuspend] = useState(null);

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['school-memberships', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
    staleTime: 0,
  });

  const { data: cohorts = [] } = useQuery({
    queryKey: ['cohorts', schoolId],
    queryFn: () => academics.whereCohorts({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fns.invoke('removeSchoolMember', { membershipId: id });
      const errMsg = res?.error || res?.error;
      if (errMsg) throw new Error(errMsg);
      return res;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['school-memberships', schoolId] });
      toast({
        title: data?.note === 'already gone'
          ? 'Stale record cleared'
          : 'User removed from school',
      });
    },
    onError: (err) => {
      toast({
        title: 'Could not remove user',
        description:
          err?.response?.data?.error ||
          err?.message ||
          'You may not have permission to remove this member.',
        variant: 'destructive',
      });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id) => membershipsData.update(id, { status: 'inactive' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-memberships', schoolId] });
      toast({ title: 'User suspended' });
    },
    onError: (err) => {
      toast({
        title: 'Could not suspend user',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (id) => membershipsData.update(id, { status: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-memberships', schoolId] });
      toast({ title: 'User reactivated' });
    },
    onError: (err) => {
      toast({
        title: 'Could not reactivate user',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Map cohort -> student_ids for filter
  const cohortMemberMap = useMemo(() => {
    const map = {};
    cohorts.forEach(c => {
      (c.student_ids || []).forEach(sid => { map[sid] = (map[sid] || []); map[sid].push(c.id); });
    });
    return map;
  }, [cohorts]);

  // A column where every cell reads "—" is noise. Departments are optional,
  // and most schools never set them, so the column appears only if used.
  const showDetail = memberships.some((m) => m.department);

  const filtered = useMemo(() => memberships.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (m.user_name || '').toLowerCase().includes(q) ||
      (m.user_email || '').toLowerCase().includes(q) ||
      (m.department || '').toLowerCase().includes(q);
    const matchRole   = roleFilter   === 'all' || m.role   === roleFilter;
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchCohort = cohortFilter === 'all' ||
      (cohortMemberMap[m.user_id] || []).includes(cohortFilter);
    return matchSearch && matchRole && matchStatus && matchCohort;
  }), [memberships, search, roleFilter, statusFilter, cohortFilter, cohortMemberMap]);

  const roleSummary = Object.entries(ROLE_CONFIG).map(([role, cfg]) => ({
    role,
    ...cfg,
    count: memberships.filter(m => m.role === role).length,
  }));

  const handleExport = () => {
    const rows = [
      ['Name', 'Email', 'Role', 'Status', 'Grade/Dept', 'Joined'],
      ...filtered.map(m => [
        m.user_name || '',
        m.user_email || '',
        ROLE_CONFIG[m.role]?.label || m.role,
        m.status,
        m.grade_level || m.department || '',
        m.created_at ? new Date(m.created_at).toLocaleDateString() : '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilters = [roleFilter !== 'all', statusFilter !== 'all', cohortFilter !== 'all'].filter(Boolean).length;

  const columns = [
    {
      key: 'name',
      header: 'Member',
      render: (m) => (
        <>
          <span style={{ display: 'block', color: 'var(--ink)' }}>{m.user_name || '—'}</span>
          <span className="sm:hidden" style={{ display: 'block', fontSize: '.76rem', color: 'var(--muted)' }}>
            {m.user_email}
          </span>
        </>
      ),
    },
    { key: 'user_email', header: 'Email' },
    { key: 'role', header: 'Role', render: (m) => ROLE_CONFIG[m.role]?.label || m.role },
    ...(showDetail ? [{ key: 'detail', header: 'Detail', render: (m) => m.grade_level || m.department || '—' }] : []),
    {
      key: 'status',
      header: 'Status',
      /* Active is the normal case, so it shows nothing. A column where every
         cell says ACTIVE is a column of noise, and the two rows that need
         someone's attention were the same weight as the five that did not. */
      render: (m) => (m.status === 'active' ? null : (
        <StatusChip tone={STATUS_TONE[m.status] || 'mute'}>
          {STATUS_LABEL[m.status] || m.status}
        </StatusChip>
      )),
    },
    {
      key: 'actions',
      header: '',
      width: '3rem',
      render: (m) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label={`Actions for ${m.user_name || m.user_email}`}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setEditingMember(m)} className="text-xs gap-2">
              <Pencil className="w-3.5 h-3.5" /> Edit member
            </DropdownMenuItem>
            {m.status === 'active' ? (
              <DropdownMenuItem onClick={() => setMemberToSuspend(m)} className="text-xs gap-2">
                <UserX className="w-3.5 h-3.5" /> Suspend account
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => reactivateMutation.mutate(m.id)} className="text-xs gap-2">
                <UserCheck className="w-3.5 h-3.5" /> Reactivate
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setMemberToRemove(m)} className="text-xs gap-2" style={{ color: 'var(--crit)' }}>
              <Trash2 className="w-3.5 h-3.5" /> Remove from school
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Counts that are also the role filter — the number and the way to see
          those people are the same control, rather than a row of tiles above a
          separate dropdown saying the same thing. */}
      <div className="flex flex-wrap gap-1.5">
        {roleSummary.map(({ role, label, count }) => {
          const on = roleFilter === role;
          return (
            <button
              key={role}
              type="button"
              aria-pressed={on}
              onClick={() => setRoleFilter(on ? 'all' : role)}
              className="scholr-focus"
              style={{
                display: 'inline-flex', alignItems: 'baseline', gap: '.4rem',
                padding: '.3rem .6rem', borderRadius: '6px', fontSize: '.82rem',
                border: `1px solid ${on ? 'var(--brand)' : 'var(--rule)'}`,
                background: on ? 'var(--brand-sf)' : 'var(--surface)',
                color: on ? 'var(--brand)' : 'var(--body)',
                cursor: 'pointer',
              }}
            >
              {label}
              <span className="scholr-num" style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 scholr-faint" />
          <Input
            placeholder="Search name, email, department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white h-9"
            aria-label="Search members"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 bg-white text-xs">
            <Filter className="w-3.5 h-3.5 mr-1.5 scholr-faint" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        {cohorts.length > 0 && (
          <Select value={cohortFilter} onValueChange={setCohortFilter}>
            <SelectTrigger className="w-40 h-9 bg-white text-xs">
              <SelectValue placeholder="Cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cohorts</SelectItem>
              {cohorts.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {activeFilters > 0 && (
          <button
            type="button"
            onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setCohortFilter('all'); setSearch(''); }}
            className="text-xs scholr-faint hover:scholr-muted px-2 h-9 scholr-focus"
          >
            Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''} ×
          </button>
        )}

        <div className="ml-auto">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-9 text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      <Group
        title="Members"
        action={
          <span className="scholr-label">
            {filtered.length === memberships.length
              ? `${memberships.length} total`
              : `${filtered.length} of ${memberships.length}`}
          </span>
        }
      >
        {isLoading ? (
          <div className="p-10 text-center">
            <Loader2 className="w-5 h-5 animate-spin scholr-faint mx-auto" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(m) => m.id}
            empty={
              memberships.length === 0
                ? 'Nobody has joined this school yet. Invite staff from the Invitations tab, or import a roster.'
                : 'No members match these filters.'
            }
          />
        )}
      </Group>

      {editingMember && (
        <EditMemberDialog
          member={editingMember}
          onClose={() => setEditingMember(null)}
          schoolId={schoolId}
        />
      )}

      <ConfirmDialog
        open={!!memberToRemove}
        title="Remove from school?"
        description={
          memberToRemove
            ? `This will remove ${memberToRemove.user_name || memberToRemove.user_email || 'this user'} from the school. Their user account stays intact but they will lose all access here. This cannot be undone.`
            : ''
        }
        confirmLabel={deleteMutation.isPending ? 'Removing…' : 'Remove user'}
        cancelLabel="Cancel"
        isDestructive
        onConfirm={() => {
          if (!memberToRemove) return;
          deleteMutation.mutate(memberToRemove.id, {
            onSettled: () => setMemberToRemove(null),
          });
        }}
        onCancel={() => !deleteMutation.isPending && setMemberToRemove(null)}
      />

      <ConfirmDialog
        open={!!memberToSuspend}
        title="Suspend this user?"
        description={
          memberToSuspend
            ? `${memberToSuspend.user_name || memberToSuspend.user_email} will be marked inactive and unable to sign in until reactivated.`
            : ''
        }
        confirmLabel={suspendMutation.isPending ? 'Suspending…' : 'Suspend'}
        cancelLabel="Cancel"
        onConfirm={() => {
          if (!memberToSuspend) return;
          suspendMutation.mutate(memberToSuspend.id, {
            onSettled: () => setMemberToSuspend(null),
          });
        }}
        onCancel={() => !suspendMutation.isPending && setMemberToSuspend(null)}
      />
    </div>
  );
}