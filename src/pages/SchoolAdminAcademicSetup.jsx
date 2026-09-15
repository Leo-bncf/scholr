import React, { useState } from 'react';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import { useUser } from '@/components/auth/UserContext';
import LoadingStateBase from '@/components/common/LoadingStateBase';
import AcademicYearsTab from '@/components/academic-setup/AcademicYearsTab';
import TermsTab from '@/components/academic-setup/TermsTab';
import CohortsTab from '@/components/academic-setup/CohortsTab';
import SubjectCatalogTab from '@/components/academic-setup/SubjectCatalogTab';

const TABS = [
  { value: 'years', label: 'Academic years' },
  { value: 'terms', label: 'Terms and reporting' },
  { value: 'cohorts', label: 'Cohorts and groups' },
  { value: 'subjects', label: 'Subjects' },
];

export default function SchoolAdminAcademicSetup() {
  const { user, school, schoolId, loading } = useUser();
  const [activeTab, setActiveTab] = useState('years');

  if (loading || !user) return <LoadingStateBase />;

  return (
    <SchoolAdminPage
      title="Academic setup"
      eyebrow="Years, terms, subjects, cohorts"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      related={[["SchoolAdminClasses","Classes"],["SchoolAdminTimetable","Timetable"],["SchoolAdminOnboarding","Onboarding"]]}
    >          <div className="flex-1 p-6">
            {activeTab === 'years'    && <AcademicYearsTab schoolId={schoolId} />}
            {activeTab === 'terms'    && <TermsTab schoolId={schoolId} />}
            {activeTab === 'cohorts'  && <CohortsTab schoolId={schoolId} />}
            {activeTab === 'subjects' && <SubjectCatalogTab schoolId={schoolId} curriculum={school?.curriculum || 'ib_dp'} />}
          </div>
    </SchoolAdminPage>
  );
}