import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search, Loader2, Pencil, Trash2, UserCheck, ShieldAlert, UserX,
  ChevronDown, Download, MoreHorizontal, RefreshCw, Filter
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { ROLE_CONFIG } from './userConstants';

const STATUS_CONFIG = {
  active:   { label: 'Active',    classes: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  inactive: { label: 'Inactive',  classes: 'bg-slate-100 text-slate-500',   dot: 'bg-slate-400' },
  pending:  { label: 'Pending',   classes: 'bg-amber-50 text-amber-700',    dot: 'bg-amber-400' },
};

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
    mutationFn: (data) => base44.entities.SchoolMembership.update(member.id, data),
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
            <Label className="text-xs font-semibold text-slate-600">Display Name</Label>
            <Input value={form.user_name} onChange={e => setForm({ ...form, user_name: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">Role</Label>
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
            <Label className="text-xs font-semibold text-slate-600">Status</Label>
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
              <Label className="text-xs font-semibold text-slate-600">Grade Level</Label>
              <Input value={form.grade_level} onChange={e => setForm({ ...form, grade_level: e.target.value })} placeholder="DP1, DP2, MYP3…" className="mt-1" />
            </div>
          )}
          {(form.role === 'teacher' || form.role === 'ib_coordinator') && (
            <div>
              <Label className="text-xs font-semibold text-slate-600">Department</Label>
              <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Sciences, Humanities…" className="mt-1" />
            </div>
          )}
          {form.role === 'school_admin' && (
            <div>
              <Label className="text-xs font-semibold text-slate-600">Sub-Admin Permissions</Label>
              <p className="text-[11px] text-slate-400 mb-2">Grant limited admin rights to non-full-admin staff.</p>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {SUB_ADMIN_PERMS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePerm(p.value)}
                    className={`text-xs px-3 py-2 rounded-md border text-left transition-colors ${
                      form.permissions.includes(p.value)
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-medium'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
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
            <Button type="submit" disabled={updateMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
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

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['school-memberships', schoolId],
    queryFn: () => base44.entities.SchoolMembership.filter({ school_id: schoolId }),
    enabled: !!schoolId,
    staleTime: 0,
  });

  const { data: cohorts = [] } = useQuery({
    queryKey: ['cohorts', schoolId],
    queryFn: () => base44.entities.Cohort.filter({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SchoolMembership.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-memberships', schoolId] });
      toast({ title: 'User removed from school' });
    },
    onError: (err) => {
      toast({
        title: 'Could not remove user',
        description: err?.message || 'You may not have permission to remove this member.',
        variant: 'destructive',
      });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (id) => base44.entities.SchoolMembership.update(id, { status: 'inactive' }),
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
    mutationFn: (id) => base44.entities.SchoolMembership.update(id, { status: 'active' }),
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
        m.created_date ? new Date(m.created_date).toLocaleDateString() : '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'users_export.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilters = [roleFilter !== 'all', statusFilter !== 'all', cohortFilter !== 'all'].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Role summary pills */}
      <div className="flex flex-wrap gap-2">
        {roleSummary.map(({ role, label, color, count }) => (
          <button
            key={role}
            onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              roleFilter === role ? 'ring-2 ring-indigo-400 ring-offset-1' : ''
            } ${color}`}
          >
            {label} <span className="font-bold">{count}</span>
          </button>
        ))}
      </div>

      {/* Search + filters bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search name, email, department…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-white h-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9 bg-white text-xs">
            <Filter className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        {cohorts.length > 0 && (
          <Select value={cohortFilter} onValueChange={setCohortFilter}>
            <SelectTrigger className="w-40 h-9 bg-white text-xs">
              <SelectValue placeholder="Cohort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cohorts</SelectItem>
              {cohorts.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {activeFilters > 0 && (
          <button
            onClick={() => { setRoleFilter('all'); setStatusFilter('all'); setCohortFilter('all'); setSearch(''); }}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 h-9"
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

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <UserX className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No users match your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Member</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Detail</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(m => {
                  const rc = ROLE_CONFIG[m.role] || { label: m.role, color: 'bg-slate-100 text-slate-500 border-slate-200' };
                  const sc = STATUS_CONFIG[m.status] || STATUS_CONFIG.pending;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${rc.color}`}>
                            {(m.user_name || m.user_email || '?')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 leading-none">{m.user_name || '—'}</p>
                            <p className="text-[11px] text-slate-400 sm:hidden mt-0.5 truncate max-w-[160px]">{m.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell text-sm text-slate-500">{m.user_email}</td>
                      <td className="px-5 py-3">
                        <Badge className={`${rc.color} border text-[11px] font-medium`}>{rc.label}</Badge>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell text-xs text-slate-500">
                        {m.grade_level
                          ? <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{m.grade_level}</span>
                          : m.department
                          ? <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{m.department}</span>
                          : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${sc.classes}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => setEditingMember(m)} className="text-xs gap-2">
                              <Pencil className="w-3.5 h-3.5" /> Edit Member
                            </DropdownMenuItem>
                            {m.status === 'active' ? (
                              <DropdownMenuItem
                                onClick={() => suspendMutation.mutate(m.id)}
                                className="text-xs gap-2 text-amber-600 focus:text-amber-700"
                              >
                                <UserX className="w-3.5 h-3.5" /> Suspend Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => reactivateMutation.mutate(m.id)}
                                className="text-xs gap-2 text-emerald-600 focus:text-emerald-700"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                if (window.confirm(`Remove ${m.user_name || m.user_email} from school? This cannot be undone.`)) {
                                  deleteMutation.mutate(m.id);
                                }
                              }}
                              className="text-xs gap-2 text-red-600 focus:text-red-700"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove from School
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50">
              <p className="text-[11px] text-slate-400">
                Showing {filtered.length} of {memberships.length} members
              </p>
            </div>
          </div>
        )}
      </div>

      {editingMember && (
        <EditMemberDialog
          member={editingMember}
          onClose={() => setEditingMember(null)}
          schoolId={schoolId}
        />
      )}
    </div>
  );
}