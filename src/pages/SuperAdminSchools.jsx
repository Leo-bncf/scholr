import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, Edit2, Loader2, Plus, School, Search, Trash2 } from 'lucide-react';
import CreateSchoolDialog from '@/components/admin/CreateSchoolDialog';
import SchoolOnboardingProgress from '@/components/admin/SchoolOnboardingProgress';
import SchoolQuickEdit from '@/components/admin/SchoolQuickEdit';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminPageHeader from '@/components/admin/super-admin/SuperAdminPageHeader';
import SuperAdminPagination from '@/components/admin/super-admin/SuperAdminPagination';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import * as schoolsData from '@/data/schools';
import {
  usePaginatedItems,
  useSuperAdminSchoolOverviewQuery,
} from '@/components/hooks/useSuperAdminData';
import {
  getBillingStatusMeta,
  getSchoolStatusMeta,
} from '@/components/admin/super-admin/superAdminConfig';

const PAGE_SIZE = 12;

const STATUS_FILTERS = ['all', 'active', 'onboarding', 'suspended'];
const BILLING_FILTERS = ['all', 'trial', 'active', 'past_due'];

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
    let filtered = schools;
    if (searchQuery) {
      filtered = filtered.filter(
        (school) =>
          school.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          school.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          school.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterStatus !== 'all') filtered = filtered.filter((school) => school.status === filterStatus);
    if (filterBilling !== 'all') filtered = filtered.filter((school) => school.billing_status === filterBilling);
    return filtered;
  }, [filterBilling, filterStatus, schools, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterStatus, filterBilling]);

  const { paginatedItems, totalItems, totalPages, page: safePage } = usePaginatedItems(filteredSchools, PAGE_SIZE, page);

  if (isChecking || isLoading) {
    return <SuperAdminLoadingState />;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <>
      <SuperAdminShell activeItem="schools" currentUser={currentUser}>
        <SuperAdminPageHeader
          title="School Management"
          subtitle={`${schools.length} total schools`}
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

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 mb-5 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium">Status</p>
              <div className="flex gap-1">
                {STATUS_FILTERS.map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                      filterStatus === status
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {status === 'all' ? 'All' : status}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1 font-medium">Billing</p>
              <div className="flex gap-1">
                {BILLING_FILTERS.map((billing) => (
                  <button
                    key={billing}
                    onClick={() => setFilterBilling(billing)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                      filterBilling === billing
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {billing === 'all' ? 'All Billing' : billing === 'past_due' ? 'Past Due' : billing}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200">
            <span className="text-sm text-slate-500">
              Showing <strong className="text-slate-900">{totalItems}</strong> matching schools
            </span>
          </div>

          {paginatedItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <School className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No schools found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paginatedItems.map((school) => {
                const isEditing = editingSchoolId === school.id;

                return (
                  <div key={school.id} className={`p-5 transition-colors ${isEditing ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                    {isEditing ? (
                      <SchoolQuickEdit
                        school={school}
                        onUpdated={handleSchoolUpdated}
                        onCancel={() => setEditingSchoolId(null)}
                      />
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="text-base font-semibold text-slate-900">{school.name}</h3>
                            {school.status && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getSchoolStatusMeta(school.status, 'dark').color}`}>
                                {getSchoolStatusMeta(school.status, 'dark').label}
                              </span>
                            )}
                            {school.billing_status && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getBillingStatusMeta(school.billing_status, 'dark').color}`}>
                                {getBillingStatusMeta(school.billing_status, 'dark').label}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                            <div>
                              <p className="text-slate-500">Location</p>
                              <p className="text-slate-700 font-medium">{school.city || 'N/A'}, {school.country || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Plan</p>
                              <p className="text-slate-700 font-medium capitalize">{school.plan || 'Starter'}</p>
                            </div>
                            <div>
                              <p className="text-slate-500">Created</p>
                              <p className="text-slate-700 font-medium">
                                {new Date(school.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500">Trial End</p>
                              <p className="text-slate-700 font-medium">
                                {school.trial_end_date ? new Date(school.trial_end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100">
                            <SchoolOnboardingProgress schoolId={school.id} summary={onboardingBySchool[school.id]} />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                           <button
                             onClick={() => setEditingSchoolId(school.id)}
                             className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                           >
                             <Edit2 className="w-4 h-4" />
                           </button>
                           <button
                             onClick={() => handleDeleteSchool(school)}
                             disabled={deletingSchoolId === school.id}
                             className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                           >
                             {deletingSchoolId === school.id
                               ? <Loader2 className="w-4 h-4 animate-spin" />
                               : <Trash2 className="w-4 h-4" />}
                           </button>
                           <button
                             onClick={() => navigate(`/SuperAdminSchoolDetail/${school.id}`)}
                             className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                           >
                             <ChevronRight className="w-5 h-5" />
                           </button>
                         </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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

      <CreateSchoolDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSchoolCreated={() => refetch()}
      />
    </>
  );
}