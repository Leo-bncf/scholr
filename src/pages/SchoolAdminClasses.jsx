import React from 'react';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { useUser } from '@/components/auth/UserContext';
import AdminTabNavigation from '@/components/admin/AdminTabNavigation';
import {
  Layers, UserCheck, Users2, Archive
} from 'lucide-react';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';

import { useClassData } from '@/components/classes/useClassData';
import ClassSectionTab      from '@/components/classes/ClassSectionTab';
import TeacherAssignmentTab from '@/components/classes/TeacherAssignmentTab';
import StudentEnrollmentTab from '@/components/classes/StudentEnrollmentTab';
import ClassLifecycleTab    from '@/components/classes/ClassLifecycleTab';



export default function SchoolAdminClasses() {
  const { user, school, schoolId } = useUser();
  const { classes, subjects, memberships, academicYears, cohorts, isLoading } = useClassData(schoolId);
  const [tab, setTab] = React.useState('sections');

  const activeCount   = classes.filter(c => c.status === 'active').length;
  const archivedCount = classes.filter(c => c.status === 'archived').length;
  const unstaffed     = classes.filter(c => c.status === 'active' && (!c.teacher_ids || c.teacher_ids.length === 0)).length;

  const TABS = [
    { id: 'sections', label: 'Class Sections', icon: Layers },
    { id: 'teachers', label: 'Staff Assignment', icon: UserCheck, badge: unstaffed > 0 ? unstaffed : null },
    { id: 'students', label: 'Student Enrolment', icon: Users2 },
    { id: 'lifecycle', label: 'Lifecycle', icon: Archive },
  ];

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
            activeTab={tab}
            onTabChange={setTab}
            title="Classes"
            subtitle={`${activeCount} active · ${archivedCount} archived${unstaffed > 0 ? ` · ${unstaffed} unstaffed` : ''}`}
          />

          {/* Tab Content */}
          <div className="flex-1 p-6">
            {tab === 'sections' && (
              <ClassSectionTab
                schoolId={schoolId}
                classes={classes}
                subjects={subjects}
                academicYears={academicYears}
                cohorts={cohorts}
              />
            )}
            {tab === 'teachers' && (
              <TeacherAssignmentTab
                schoolId={schoolId}
                classes={classes}
                memberships={memberships}
              />
            )}
            {tab === 'students' && (
              <StudentEnrollmentTab
                schoolId={schoolId}
                classes={classes}
                memberships={memberships}
              />
            )}
            {tab === 'lifecycle' && (
              <ClassLifecycleTab
                schoolId={schoolId}
                classes={classes}
                memberships={memberships}
                academicYears={academicYears}
              />
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}