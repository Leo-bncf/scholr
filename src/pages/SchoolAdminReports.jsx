import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import {
  LayoutDashboard, FileSpreadsheet, Printer, Star, Users,
} from 'lucide-react';
import AdminTabNavigation from '@/components/admin/AdminTabNavigation';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import ReportsCenterOverview from '@/components/reports/ReportsCenterOverview';
import CSVExportToolkit from '@/components/reports/CSVExportToolkit';
import PDFReportBuilder from '@/components/reports/PDFReportBuilder';
import CoordinatorReports from '@/components/reports/CoordinatorReports';
import ClassProgressReport from '@/components/reports/ClassProgressReport';
import * as membershipsData from '@/data/memberships';
import * as classesData from '@/data/classes';
import * as gradebookData from '@/data/gradebook';
import * as attendanceData from '@/data/attendance';
import * as behaviorRecordsData from '@/data/behaviorRecords';
import * as casExperiencesData from '@/data/casExperiences';
import * as academics from '@/data/academics';



export default function SchoolAdminReports() {
  const { user, school, schoolId, role } = useUser();

  const { data: memberships = [] } = useQuery({
    queryKey: ['school-memberships-reports', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['school-classes-reports', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: grades = [] } = useQuery({
    queryKey: ['school-grades-reports', schoolId],
    queryFn: () => gradebookData.whereGradeItems({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['school-attendance-reports', schoolId],
    queryFn: () => attendanceData.whereRecords({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: behavior = [] } = useQuery({
    queryKey: ['school-behavior-reports', schoolId],
    queryFn: () => behaviorRecordsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: predictedGrades = [] } = useQuery({
    queryKey: ['school-pg-reports', schoolId],
    queryFn: () => gradebookData.wherePredictedGrades({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: casExperiences = [] } = useQuery({
    queryKey: ['school-cas-reports', schoolId],
    queryFn: () => casExperiencesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['school-terms-reports', schoolId],
    queryFn: () => academics.whereTerms({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: cohorts = [] } = useQuery({
    queryKey: ['school-cohorts-reports', schoolId],
    queryFn: () => academics.whereCohorts({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const sharedProps = { memberships, classes, grades, attendance, behavior, predictedGrades, casExperiences, terms, cohorts, school, schoolId, userName: user?.full_name };

  const isCoordinator = ['ib_coordinator', 'school_admin', 'super_admin', 'admin'].includes(role);

  const [tab, setTab] = useState('overview');

  const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'exports', label: 'CSV Exports', icon: FileSpreadsheet },
    { id: 'class-reports', label: 'Class Reports', icon: Users },
    { id: 'pdf', label: 'PDF Reports', icon: Printer },
    ...(isCoordinator ? [{ id: 'coordinator', label: 'IB Coordinator', icon: Star }] : []),
  ];

  return (
    <RoleGuard allowedRoles={['school_admin', 'ib_coordinator', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={SCHOOL_ADMIN_SIDEBAR_LINKS} role="school_admin" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />

        <main className="md:ml-64 min-h-screen flex flex-col">
          <AdminTabNavigation
            tabs={TABS}
            activeTab={tab}
            onTabChange={setTab}
            colorScheme="indigo"
            title="Reports Center"
            subtitle="Generate operational and academic reports, export datasets, and print progress documents."
          />

          <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
            {tab === 'overview' && <ReportsCenterOverview {...sharedProps} />}
            {tab === 'exports' && <CSVExportToolkit {...sharedProps} />}
            {tab === 'class-reports' && <ClassProgressReport {...sharedProps} />}
            {tab === 'pdf' && <PDFReportBuilder {...sharedProps} />}
            {tab === 'coordinator' && isCoordinator && <CoordinatorReports {...sharedProps} />}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}