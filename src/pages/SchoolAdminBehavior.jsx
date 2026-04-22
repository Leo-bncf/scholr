import React, { useState } from 'react';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import {
  BarChart2, Tag, Shield, Download, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import AdminTabNavigation from '@/components/admin/AdminTabNavigation';

import BehaviorDashboard from '@/components/behavior-admin/BehaviorDashboard';
import BehaviorPolicyConfig from '@/components/behavior-admin/BehaviorPolicyConfig';
import PastoralOversight from '@/components/behavior-admin/PastoralOversight';
import BehaviorExport from '@/components/behavior-admin/BehaviorExport';



const TABS = [
  { id: 'dashboard',  label: 'Dashboard',         icon: BarChart2,   desc: 'Search, filter & review records' },
  { id: 'pastoral',   label: 'Pastoral Oversight', icon: Shield,      desc: 'High severity & follow-up management' },
  { id: 'policy',     label: 'Policy Config',      icon: Tag,         desc: 'Incident types & severity levels' },
  { id: 'exports',    label: 'Exports',            icon: Download,    desc: 'Privacy-safe reports & exports' },
];

export default function SchoolAdminBehavior() {
  const { user, school, schoolId, role } = useUser();
  const [tab, setTab] = useState('dashboard');

  const isPastoral = ['school_admin', 'ib_coordinator', 'super_admin', 'admin'].includes(role);

  return (
    <RoleGuard allowedRoles={['school_admin', 'ib_coordinator', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar
          links={SCHOOL_ADMIN_SIDEBAR_LINKS}
          role="school_admin"
          schoolName={school?.name}
          userName={user?.full_name}
          userId={user?.id}
          schoolId={schoolId}
        />

        <main className="md:ml-64 min-h-screen flex flex-col">
          <AdminTabNavigation
            tabs={TABS}
            activeTab={tab}
            onTabChange={setTab}
            colorScheme="emerald"
            title="Behavior & Pastoral Notes"
            subtitle={`${school?.name} · Governed pastoral operations`}
            rightContent={
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                School-scoped · Role-protected
              </div>
            }
          />

          {/* Content */}
          <div className="flex-1 p-6">
            {tab === 'dashboard'  && <BehaviorDashboard schoolId={schoolId} isPastoral={isPastoral} />}
            {tab === 'pastoral'   && <PastoralOversight schoolId={schoolId} />}
            {tab === 'policy'     && <BehaviorPolicyConfig schoolId={schoolId} />}
            {tab === 'exports'    && <BehaviorExport schoolId={schoolId} schoolName={school?.name} />}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}