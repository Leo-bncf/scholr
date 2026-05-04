import {
  LayoutDashboard, BookOpen, ClipboardCheck, BarChart3,
  MessageSquare, Users, GraduationCap, Settings
} from 'lucide-react';

export function getAppSidebarLinks(role) {
  switch (role) {
    case 'teacher':
      return [
        { label: 'Workspace', page: 'TeacherWorkspace', icon: ClipboardCheck },
        { label: 'Dashboard', page: 'TeacherDashboard', icon: LayoutDashboard },
        { label: 'My Classes', page: 'TeacherClasses', icon: BookOpen },
        { label: 'Messages', page: 'Messages', icon: MessageSquare },
        { label: 'Settings', page: 'PersonalSettings', icon: Settings },
      ];
    case 'student':
      return [
        { label: 'Dashboard', page: 'StudentDashboard', icon: LayoutDashboard },
        { label: 'Messages', page: 'Messages', icon: MessageSquare },
      ];
    case 'parent':
      return [
        { label: 'Insights', page: 'ParentInsightsDashboard', icon: BarChart3 },
        { label: 'Dashboard', page: 'ParentDashboard', icon: LayoutDashboard },
        { label: 'Messages', page: 'Messages', icon: MessageSquare },
      ];
    case 'school_admin':
      return [
        { label: 'Dashboard', page: 'SchoolAdminDashboard', icon: LayoutDashboard },
        { label: 'Users', page: 'SchoolAdminUsers', icon: Users },
        { label: 'Messages', page: 'Messages', icon: MessageSquare },
      ];
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