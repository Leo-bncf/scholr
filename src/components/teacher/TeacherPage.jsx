import React from 'react';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import { getAppSidebarLinks } from '@/components/app/sidebarLinks';

/**
 * Every teacher page, framed the same way.
 *
 * The teacher section had four different frames: the dashboard used AppShell,
 * the workspace and class list drew their own headers, and a class page had no
 * sidebar at all — opening a class took the navigation away. This reuses the
 * school-admin frame (sidebar, collapsing title, tabs that live in the URL)
 * with the teacher's sidebar, so the two sections are one product.
 */
export default function TeacherPage(props) {
  return (
    <SchoolAdminPage
      allowedRoles={['teacher', 'ib_coordinator', 'school_admin', 'admin', 'super_admin']}
      sidebarLinks={getAppSidebarLinks('teacher')}
      sidebarRole="teacher"
      {...props}
    />
  );
}
