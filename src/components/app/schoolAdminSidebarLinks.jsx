import {
  LayoutDashboard, Users, BookOpen, GraduationCap, Calendar,
  AlertTriangle, Clock, FileText, CreditCard, Settings, BarChart3
} from 'lucide-react';

export const SCHOOL_ADMIN_SIDEBAR_LINKS = [
  { label: 'Dashboard',      page: 'SchoolAdminDashboard',     icon: LayoutDashboard },
  { label: 'Users',          page: 'SchoolAdminUsers',          icon: Users },
  { label: 'Classes',        page: 'SchoolAdminClasses',        icon: BookOpen },
  { label: 'Enrollments',    page: 'SchoolAdminEnrollments',    icon: Users },
  { label: 'Academic Setup', page: 'SchoolAdminAcademicSetup',  icon: GraduationCap },
  { label: 'Attendance',     page: 'SchoolAdminAttendance',     icon: Calendar },
  { label: 'Behavior',       page: 'SchoolAdminBehavior',       icon: AlertTriangle },
  { label: 'Timetable',      page: 'SchoolAdminTimetable',      icon: Clock },
  { label: 'Calendar',       page: 'UnifiedCalendar',           icon: Calendar },
  { label: 'Analytics',      page: 'SchoolAnalytics',           icon: BarChart3 },
  { label: 'Reports',        page: 'SchoolAdminReports',        icon: FileText },
  { label: 'Billing',        page: 'SchoolAdminBilling',        icon: CreditCard },
  { label: 'Settings',       page: 'SchoolAdminSettings',       icon: Settings },
];