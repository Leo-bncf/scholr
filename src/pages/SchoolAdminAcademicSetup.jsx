import React, { useState } from 'react';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import LoadingStateBase from '@/components/common/LoadingStateBase';
import AdminTabNavigation from '@/components/admin/AdminTabNavigation';
import { CalendarDays, BookMarked, UsersRound, Library } from 'lucide-react';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import AcademicYearsTab from '@/components/academic-setup/AcademicYearsTab';
import TermsTab from '@/components/academic-setup/TermsTab';
import CohortsTab from '@/components/academic-setup/CohortsTab';
import SubjectCatalogTab from '@/components/academic-setup/SubjectCatalogTab';

const TABS = [
  { id: 'years',    label: 'Academic Years',    icon: CalendarDays },
  { id: 'terms',    label: 'Terms & Reporting', icon: BookMarked },
  { id: 'cohorts',  label: 'Cohorts & Groups',  icon: UsersRound },
  { id: 'subjects', label: 'Subject Catalogue', icon: Library },
];

export default function SchoolAdminAcademicSetup() {
  const { user, school, schoolId, loading } = useUser();
  const [activeTab, setActiveTab] = useState('years');

  if (loading || !user) return <LoadingStateBase />;

  return (
    <RoleGuard allowedRoles={['school_admin', 'super_admin', 'admin']}>
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
            activeTab={activeTab}
            onTabChange={setActiveTab}
            colorScheme="indigo"
            title="Academic Setup"
            subtitle="School structure & academic framework configuration"
          />

          <div className="flex-1 p-6">
            {activeTab === 'years'    && <AcademicYearsTab schoolId={schoolId} />}
            {activeTab === 'terms'    && <TermsTab schoolId={schoolId} />}
            {activeTab === 'cohorts'  && <CohortsTab schoolId={schoolId} />}
            {activeTab === 'subjects' && <SubjectCatalogTab schoolId={schoolId} curriculum={school?.curriculum || 'ib_dp'} />}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}