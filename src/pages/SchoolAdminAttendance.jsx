import React, { useState } from 'react';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import { useUser } from '@/components/auth/UserContext';


import AttendanceDashboard from '@/components/attendance-admin/AttendanceDashboard';
import AttendanceCodeConfig from '@/components/attendance-admin/AttendanceCodeConfig';
import AttendanceCorrectionWorkflow from '@/components/attendance-admin/AttendanceCorrectionWorkflow';
import AttendanceExport from '@/components/attendance-admin/AttendanceExport';

const TABS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'codes', label: 'Codes' },
  { value: 'corrections', label: 'Corrections' },
  { value: 'exports', label: 'Exports' },
];

export default function SchoolAdminAttendance() {
  const { user, school, schoolId } = useUser();
  const [tab, setTab] = useState('dashboard');

  return (
    <SchoolAdminPage
      title="Attendance"
      eyebrow="Registers and codes"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      allowedRoles={['school_admin', 'ib_coordinator', 'super_admin', 'admin']}
      related={[["SchoolAdminBehavior","Behaviour"],["SchoolAdminReports","Reports"],["SchoolAdminClasses","Classes"]]}
    >          {/* Tab Content */}
          <div className="flex-1 p-6">
            {tab === 'dashboard' && <AttendanceDashboard schoolId={schoolId} />}
            {tab === 'codes' && <AttendanceCodeConfig schoolId={schoolId} />}
            {tab === 'corrections' && <AttendanceCorrectionWorkflow schoolId={schoolId} />}
            {tab === 'exports' && <AttendanceExport schoolId={schoolId} schoolName={school?.name} />}
          </div>
    </SchoolAdminPage>
  );
}