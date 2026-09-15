import React from 'react';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import { useUser } from '@/components/auth/UserContext';


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
    { value: 'sections', label: 'Class Sections' },
    { value: 'teachers', label: 'Staff Assignment' },
    { value: 'students', label: 'Student Enrolment' },
    { value: 'lifecycle', label: 'Lifecycle' },
  ];

  return (
    <SchoolAdminPage
      title="Classes"
      eyebrow="Sections, staff and rosters"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      related={[["SchoolAdminEnrollments","Enrolments"],["SchoolAdminSubjects","Subjects"],["SchoolAdminTimetable","Timetable"]]}
    >          {/* Tab Content */}
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
    </SchoolAdminPage>
  );
}