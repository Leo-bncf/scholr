import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';

import ReportsCenterOverview from '@/components/reports/ReportsCenterOverview';
import CSVExportToolkit from '@/components/reports/CSVExportToolkit';
import PDFReportBuilder from '@/components/reports/PDFReportBuilder';
import CoordinatorReports from '@/components/reports/CoordinatorReports';
import ClassProgressReport from '@/components/reports/ClassProgressReport';
import AnalyticsSection from '@/components/reports-sections/AnalyticsSection';
import BuilderSection from '@/components/reports-sections/BuilderSection';
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
    /* The reports hub is the full export/print path — CSV, PDF and the CAS
       log all print every row inside the school's own filters, so this stays
       a whole-school read by design. It goes through the named helper. */
    queryFn: () => behaviorRecordsData.listForSchool(schoolId),
    enabled: !!schoolId,
  });

  const { data: predictedGrades = [] } = useQuery({
    queryKey: ['school-pg-reports', schoolId],
    queryFn: () => gradebookData.wherePredictedGrades({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: casExperiences = [] } = useQuery({
    queryKey: ['school-cas-reports', schoolId],
    /* Same story as behaviour: CoordinatorReports prints the full CAS log and
       the CSV export takes all CAS rows, so this whole-school read is the
       export surface. */
    queryFn: () => casExperiencesData.listForSchool(schoolId),
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

  /* Analytics and Report builder used to be two more entries in the menu,
     which meant a school admin had to guess which of three pages answered
     "let me look at the data". They are tabs here: read it (Overview,
     Analytics), build a one-off (Build), take it away (Export), or run the
     standing ones (Class reports, IB Core). */
  const TABS = [
    { value: 'overview', label: 'Overview' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'class-reports', label: 'Class reports' },
    ...(isCoordinator ? [{ value: 'coordinator', label: 'IB Core' }] : []),
    { value: 'build', label: 'Build' },
    { value: 'export', label: 'Export' },
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
        ['SchoolAdminAttendance', 'Attendance'],
        ['SchoolAdminBehavior', 'Behaviour'],
        ['SchoolAdminClasses', 'Classes'],
      ]}
    >
      {tab === 'overview' && <ReportsCenterOverview {...sharedProps} />}
      {tab === 'analytics' && <AnalyticsSection />}
      {tab === 'class-reports' && <ClassProgressReport {...sharedProps} />}
      {tab === 'coordinator' && isCoordinator && <CoordinatorReports {...sharedProps} />}
      {tab === 'build' && <BuilderSection />}
      {/* CSV and PDF were two tabs for one errand: getting the data out. */}
      {tab === 'export' && (
        <div className="space-y-4">
          <CSVExportToolkit {...sharedProps} />
          <PDFReportBuilder {...sharedProps} />
        </div>
      )}
    </SchoolAdminPage>
  );
}
