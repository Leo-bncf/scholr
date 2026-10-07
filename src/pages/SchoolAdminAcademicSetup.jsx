import React, { useState } from 'react';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import { useUser } from '@/components/auth/UserContext';
import { getCoordinatorSidebarLinks } from '@/components/app/coordinatorSidebarLinks';
import { getCurriculumConfig } from '@/lib/curriculumConfig';
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
  const { school, schoolId, role } = useUser();
  const [activeTab, setActiveTab] = useState('years');
  const curriculum = school?.curriculum || 'ib_dp';
  const isCoordinator = role === 'ib_coordinator';

  return (
    <SchoolAdminPage
      title="Academic setup"
      eyebrow="Years, terms, subjects, cohorts"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      related={[["SchoolAdminClasses","Classes"],["SchoolAdminTimetable","Timetable"],["SchoolAdminOnboarding","Onboarding"]]}
      allowedRoles={['school_admin', 'ib_coordinator', 'admin', 'super_admin']}
      sidebarLinks={isCoordinator ? getCoordinatorSidebarLinks(curriculum, getCurriculumConfig(curriculum)) : undefined}
      sidebarRole={isCoordinator ? 'ib_coordinator' : undefined}
    >
      <div className="flex-1 p-6">
        {activeTab === 'years'    && <AcademicYearsTab schoolId={schoolId} />}
        {activeTab === 'terms'    && <TermsTab schoolId={schoolId} />}
        {activeTab === 'cohorts'  && <CohortsTab schoolId={schoolId} />}
        {activeTab === 'subjects' && <SubjectCatalogTab schoolId={schoolId} curriculum={curriculum} />}
      </div>
    </SchoolAdminPage>
  );
}