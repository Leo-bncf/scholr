import React, { useState } from 'react';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import { useUser } from '@/components/auth/UserContext';


import BehaviorDashboard from '@/components/behavior-admin/BehaviorDashboard';
import BehaviorPolicyConfig from '@/components/behavior-admin/BehaviorPolicyConfig';
import PastoralOversight from '@/components/behavior-admin/PastoralOversight';
import BehaviorExport from '@/components/behavior-admin/BehaviorExport';



const TABS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'pastoral', label: 'Pastoral Oversight' },
  { value: 'policy', label: 'Policy Config' },
  { value: 'exports', label: 'Exports' },
];

export default function SchoolAdminBehavior() {
  const { user, school, schoolId, role } = useUser();
  const [tab, setTab] = useState('dashboard');

  const isPastoral = ['school_admin', 'ib_coordinator', 'super_admin', 'admin'].includes(role);

  return (
    <SchoolAdminPage
      title="Behaviour"
      eyebrow="Incidents and pastoral notes"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      allowedRoles={['school_admin', 'ib_coordinator', 'super_admin', 'admin']}
      related={[["SchoolAdminAttendance","Attendance"],["SchoolAdminReports","Reports"],["SchoolAdminUsers","Users"]]}
    >          {/* Content */}
          <div className="flex-1 p-6">
            {tab === 'dashboard'  && <BehaviorDashboard schoolId={schoolId} isPastoral={isPastoral} />}
            {tab === 'pastoral'   && <PastoralOversight schoolId={schoolId} />}
            {tab === 'policy'     && <BehaviorPolicyConfig schoolId={schoolId} />}
            {tab === 'exports'    && <BehaviorExport schoolId={schoolId} schoolName={school?.name} />}
          </div>
    </SchoolAdminPage>
  );
}