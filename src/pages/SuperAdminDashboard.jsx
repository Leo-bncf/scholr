import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  getSuperAdminPlatformMetrics,
  useSuperAdminSchoolsQuery,
} from '@/components/hooks/useSuperAdminData';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle,
  ChevronRight,
  DollarSign,
  Plus,
} from 'lucide-react';
import {
  getBillingStatusMeta,
  getSchoolStatusMeta,
} from '@/components/admin/super-admin/superAdminConfig';
import CreateSchoolDialog from '@/components/admin/CreateSchoolDialog';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminPageHeader from '@/components/admin/super-admin/SuperAdminPageHeader';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);
  const { data: schools = [], isLoading, refetch } = useSuperAdminSchoolsQuery({ enabled: !!currentUser });
  const metrics = getSuperAdminPlatformMetrics(schools);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (isChecking || isLoading) {
    return <SuperAdminLoadingState />;
  }

  if (!currentUser) {
    return null;
  }

  const recentSchools = [...schools].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);
  const atRiskSchools = schools.filter(
    (school) => school.billing_status === 'past_due' || school.billing_status === 'incomplete' || school.status === 'suspended'
  );

  return (
    <>
      <SuperAdminShell activeItem="overview" currentUser={currentUser}>
        <SuperAdminPageHeader
          title="Platform Overview"
          subtitle="Monitor and manage your IB platform"
          actions={
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New School
            </Button>
          }
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Total Schools</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{metrics.total}</p>
            <p className="text-slate-500 text-xs mt-1">{metrics.onboarding} in setup</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Active</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{metrics.active}</p>
            <p className="text-slate-500 text-xs mt-1">fully onboarded</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-500 text-xs font-medium uppercase tracking-wide">Paying</span>
              <DollarSign className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">{metrics.paid}</p>
            <p className="text-slate-500 text-xs mt-1">{metrics.trial} on trial</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-md p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-red-700 text-xs font-medium uppercase tracking-wide">At Risk</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-700">{metrics.atRisk}</p>
            <p className="text-red-600 text-xs mt-1">billing or suspended</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-900">Recent Schools</h2>
              <Link to={createPageUrl('SuperAdminSchools')} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {recentSchools.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No schools yet</p>
              ) : (
                recentSchools.map((school) => (
                  <div
                    key={school.id}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(createPageUrl('SuperAdminSchoolDetail') + `/${school.id}`)}
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{school.name}</p>
                      <p className="text-xs text-slate-500">{school.city || '–'}, {school.country || '–'}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {school.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getSchoolStatusMeta(school.status, 'light').color}`}>
                          {getSchoolStatusMeta(school.status, 'light').label}
                        </span>
                      )}
                      {school.billing_status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getBillingStatusMeta(school.billing_status, 'light').color}`}>
                          {getBillingStatusMeta(school.billing_status, 'light').label}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            {atRiskSchools.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md overflow-hidden shadow-sm">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-semibold text-red-800">Needs Attention ({atRiskSchools.length})</h3>
                </div>
                <div className="divide-y divide-red-100 max-h-48 overflow-auto">
                  {atRiskSchools.map((school) => (
                    <div
                      key={school.id}
                      className="px-5 py-3 cursor-pointer hover:bg-red-100/50 transition-colors"
                      onClick={() => navigate(createPageUrl('SuperAdminSchoolDetail') + `/${school.id}`)}
                    >
                      <p className="text-sm font-medium text-red-900 truncate">{school.name}</p>
                      <p className="text-xs text-red-600 mt-0.5">
                        {school.status === 'suspended' ? 'Suspended' : `Billing: ${school.billing_status}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link to={createPageUrl('SuperAdminSchools')} className="flex items-center justify-between w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-md text-sm text-slate-700 hover:text-slate-900 transition-colors">
                  <span>Manage Schools</span> <ChevronRight className="w-4 h-4" />
                </Link>
                <Link to={createPageUrl('SuperAdminUsers')} className="flex items-center justify-between w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-md text-sm text-slate-700 hover:text-slate-900 transition-colors">
                  <span>Manage Users</span> <ChevronRight className="w-4 h-4" />
                </Link>
                <Link to={createPageUrl('SuperAdminBilling')} className="flex items-center justify-between w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-md text-sm text-slate-700 hover:text-slate-900 transition-colors">
                  <span>Billing Overview</span> <ChevronRight className="w-4 h-4" />
                </Link>
                <Link to={createPageUrl('SuperAdminAuditLogs')} className="flex items-center justify-between w-full px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-md text-sm text-slate-700 hover:text-slate-900 transition-colors">
                  <span>Audit Logs</span> <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-md p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Subscription Split</h3>
              <div className="space-y-2">
                {[
                  { label: 'Paid', value: metrics.paid, color: 'bg-emerald-500' },
                  { label: 'Trial', value: metrics.trial, color: 'bg-amber-500' },
                  { label: 'Onboarding', value: metrics.onboarding, color: 'bg-blue-500' },
                  { label: 'Suspended', value: metrics.suspended, color: 'bg-red-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-slate-600 text-xs flex-1">{item.label}</span>
                    <span className="text-slate-900 text-sm font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SuperAdminShell>

      <CreateSchoolDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSchoolCreated={() => refetch()}
      />
    </>
  );
}