import {
  LayoutDashboard, BookOpen, ClipboardCheck, BarChart3,
  MessageSquare, Users, Settings, CalendarDays
} from 'lucide-react';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from './schoolAdminSidebarLinks';

/**
 * The sidebar for a role.
 *
 * school_admin used to be answered here with three links — Dashboard, Users,
 * Messages — while every page that imported SCHOOL_ADMIN_SIDEBAR_LINKS showed
 * twenty-three. So a school admin who opened Messages watched their navigation
 * collapse, and the way back was the browser's back button. Two sources of
 * truth for one menu; there is one now.
 */
export function getAppSidebarLinks(role) {
  switch (role) {
    case 'teacher':
      return [
        { label: 'Workspace', page: 'TeacherWorkspace', icon: ClipboardCheck },
        { label: 'Curriculum', page: 'CurriculumMapping', icon: BookOpen },
        { label: 'Calendar', page: 'UnifiedCalendar', icon: CalendarDays },
        { label: 'Dashboard', page: 'TeacherDashboard', icon: LayoutDashboard },
        { label: 'My Classes', page: 'TeacherClasses', icon: BookOpen },
        { label: 'Messages', page: 'Messages', icon: MessageSquare },
        { label: 'Settings', page: 'PersonalSettings', icon: Settings },
      ];
    case 'student':
      return [
        { label: 'Dashboard', page: 'StudentDashboard', icon: LayoutDashboard },
        { label: 'Calendar', page: 'UnifiedCalendar', icon: CalendarDays },
        { label: 'Messages', page: 'Messages', icon: MessageSquare },
      ];
    case 'parent':
      return [
        { label: 'Insights', page: 'ParentInsightsDashboard', icon: BarChart3 },
        { label: 'Calendar', page: 'UnifiedCalendar', icon: CalendarDays },
        { label: 'Dashboard', page: 'ParentDashboard', icon: LayoutDashboard },
        { label: 'Messages', page: 'Messages', icon: MessageSquare },
      ];
    case 'school_admin':
    case 'admin':
    case 'super_admin':
      return SCHOOL_ADMIN_SIDEBAR_LINKS;
    case 'ib_coordinator':
      return [
        { label: 'Dashboard', page: 'CoordinatorDashboard', icon: LayoutDashboard },
        { label: 'Users', page: 'SchoolAdminUsers', icon: Users },
        { label: 'Messages', page: 'Messages', icon: MessageSquare },
      ];
    default:
      return [
        { label: 'Dashboard', page: 'AppHome', icon: LayoutDashboard },
      ];
  }
}