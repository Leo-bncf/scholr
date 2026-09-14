import React, { useState } from 'react';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import AdminTabNavigation from '@/components/admin/AdminTabNavigation';
import {
  Calendar, BarChart2, Tag, PenLine, Download, ShieldCheck,
} from 'lucide-react';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';

import AttendanceDashboard from '@/components/attendance-admin/AttendanceDashboard';
import AttendanceCodeConfig from '@/components/attendance-admin/AttendanceCodeConfig';
import AttendanceCorrectionWorkflow from '@/components/attendance-admin/AttendanceCorrectionWorkflow';
import AttendanceExport from '@/components/attendance-admin/AttendanceExport';

const TABS = [
  { id: 'dashboard',   label: 'Dashboard',    icon: BarChart2 },
  { id: 'codes',       label: 'Code Config',  icon: Tag },
  { id: 'corrections', label: 'Corrections',  icon: PenLine },
  { id: 'exports',     label: 'Exports',      icon: Download },
];

export default function SchoolAdminAttendance() {
  const { user, school, schoolId } = useUser();
  const [tab, setTab] = useState('dashboard');

  return (
    <RoleGuard allowedRoles={['school_admin', 'ib_coordinator', 'super_admin', 'admin']}>
      <div className="min-h-screen scholr-sunk">
        <AppSidebar
          links={SCHOOL_ADMIN_SIDEBAR_LINKS}
          role="school_admin"
          schoolName={school?.name}
          userName={user?.full_name}
          userId={user?.id}
          schoolId={schoolId}
        />

        <main className="app-offset min-h-screen flex flex-col">
          <AdminTabNavigation
            tabs={TABS}
            activeTab={tab}
            onTabChange={setTab}
            colorScheme="indigo"
            title={
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 scholr-accent" />
                Attendance Administration
              </div>
            }
            subtitle={`${school?.name} · Governed attendance operations`}
            rightContent={
              <div className="flex items-center gap-2 text-xs font-bold scholr-muted scholr-sunk border scholr-rule px-3 py-1.5 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                School-scoped
              </div>
            }
          />

          {/* Tab Content */}
          <div className="flex-1 p-6">
            {tab === 'dashboard' && <AttendanceDashboard schoolId={schoolId} />}
            {tab === 'codes' && <AttendanceCodeConfig schoolId={schoolId} />}
            {tab === 'corrections' && <AttendanceCorrectionWorkflow schoolId={schoolId} />}
            {tab === 'exports' && <AttendanceExport schoolId={schoolId} schoolName={school?.name} />}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}