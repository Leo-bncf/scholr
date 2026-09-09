import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { useUser } from '@/components/auth/UserContext';
import { LayoutDashboard, Building2, Shield, DollarSign, Settings, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as schoolsData from '@/data/schools';

const sidebarLinks = [
  { label: 'Dashboard', page: 'SuperAdminDashboard', icon: LayoutDashboard },
  { label: 'Schools', page: 'SuperAdminSchools', icon: Building2 },
  { label: 'Billing', page: 'SuperAdminBilling', icon: DollarSign },
  { label: 'Plan Management', page: 'SuperAdminPlanManagement', icon: Settings },
  { label: 'Audit Logs', page: 'SuperAdminAuditLogs', icon: Shield },
];

export default function SuperAdminPlanManagement() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editSchool, setEditSchool] = useState(null);
  const [editPlan, setEditPlan] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [extendTrial, setExtendTrial] = useState('');

  const { data: schools = [], isLoading } = useQuery({
    queryKey: ['schools-management'],
    queryFn: () => schoolsData.where({}, { order: 'created_at', ascending: false }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ schoolId, data }) => {
      return schoolsData.update(schoolId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schools-management'] });
      setEditSchool(null);
    },
  });

  const handleSave = () => {
    if (!editSchool) return;
    const updateData = {};
    if (editPlan) updateData.plan = editPlan;
    if (editStatus) updateData.billing_status = editStatus;
    if (extendTrial) {
      const newTrialEnd = new Date();
      newTrialEnd.setDate(newTrialEnd.getDate() + parseInt(extendTrial));
      updateData.trial_end_date = newTrialEnd.toISOString();
    }
    updateMutation.mutate({ schoolId: editSchool.id, data: updateData });
  };

  const filtered = schools.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()));

  const statusColors = {
    trial: 'bg-blue-50 text-blue-700',
    active: 'bg-emerald-50 text-emerald-700',
    past_due: 'bg-amber-50 text-amber-700',
    canceled: 'bg-slate-100 text-slate-600',
    unpaid: 'bg-red-50 text-red-700',
    incomplete: 'bg-amber-50 text-amber-700',
  };

  const planColors = {
    starter: 'bg-blue-50 text-blue-700',
    professional: 'bg-indigo-50 text-indigo-700',
    enterprise: 'bg-violet-50 text-violet-700',
  };

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={sidebarLinks} role="super_admin" userName={user?.full_name} />
        <main className="ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900">Plan Management</h1>
              <p className="text-sm text-slate-500 mt-1">Manage school subscriptions, plans, and access</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Schools</CardTitle>
                <div className="pt-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search schools..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="p-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" /></div>
                ) : filtered.length === 0 ? (
                  <div className="p-16 text-center text-slate-400 text-sm">No schools found</div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-slate-100">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 text-left bg-slate-50">
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">School</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Plan</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Trial End</th>
                          <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filtered.map(school => (
                          <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-medium text-slate-900 text-sm">{school.name}</p>
                              <p className="text-xs text-slate-400">{school.city}{school.country ? `, ${school.country}` : ''}</p>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={`${planColors[school.plan]} border-0 text-xs capitalize`}>
                                {school.plan}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              {school.billing_status ? (
                                <Badge className={`${statusColors[school.billing_status]} border-0 text-xs capitalize`}>
                                  {school.billing_status}
                                </Badge>
                              ) : (
                                <span className="text-xs text-slate-400">No subscription</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">
                              {school.trial_end_date ? new Date(school.trial_end_date).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setEditSchool(school);
                                  setEditPlan(school.plan);
                                  setEditStatus(school.billing_status || 'trial');
                                  setExtendTrial('');
                                }}
                              >
                                <Settings className="w-3 h-3 mr-1" /> Manage
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={!!editSchool} onOpenChange={() => setEditSchool(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage School Plan</DialogTitle>
            <DialogDescription>
              Update plan, status, or extend trial for {editSchool?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Plan</label>
              <Select value={editPlan} onValueChange={setEditPlan}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Billing Status</label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Extend Trial (days)</label>
              <Input 
                type="number" 
                placeholder="e.g., 14" 
                value={extendTrial} 
                onChange={e => setExtendTrial(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditSchool(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  );
}