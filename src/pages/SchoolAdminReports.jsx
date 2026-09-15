import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';

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
    { value: 'overview', label: 'Overview' },
    { value: 'exports', label: 'CSV' },
    { value: 'class-reports', label: 'Class reports' },
    { value: 'pdf', label: 'PDF' },
    ...(isCoordinator ? [{ value: 'coordinator', label: 'IB Core' }] : []),
  ];

  return (
    <SchoolAdminPage
      title="Reports"
      eyebrow="Export and print"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      allowedRoles={['school_admin', 'ib_coordinator', 'super_admin', 'admin']}
      /* A report is almost always the end of a chain that started somewhere
         else — the marks, the register, or the question behind them. */
      related={[
        ['SchoolAnalytics', 'Analytics'],
        ['ReportingEngine', 'Report builder'],
        ['SchoolAdminAttendance', 'Attendance'],
      ]}
    >
      {tab === 'overview' && <ReportsCenterOverview {...sharedProps} />}
      {tab === 'exports' && <CSVExportToolkit {...sharedProps} />}
      {tab === 'class-reports' && <ClassProgressReport {...sharedProps} />}
      {tab === 'pdf' && <PDFReportBuilder {...sharedProps} />}
      {tab === 'coordinator' && isCoordinator && <CoordinatorReports {...sharedProps} />}
    </SchoolAdminPage>
  );
}
