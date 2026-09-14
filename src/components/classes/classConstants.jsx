export const SIDEBAR_LINKS = [
  { label: 'Dashboard',      page: 'SchoolAdminDashboard',     icon: 'LayoutDashboard' },
  { label: 'Users',          page: 'SchoolAdminUsers',         icon: 'Users' },
  { label: 'Classes',        page: 'SchoolAdminClasses',       icon: 'BookOpen' },
  { label: 'Enrollments',    page: 'SchoolAdminEnrollments',   icon: 'Users' },
  { label: 'Academic Setup', page: 'SchoolAdminAcademicSetup', icon: 'GraduationCap' },
  { label: 'Attendance',     page: 'SchoolAdminAttendance',    icon: 'Calendar' },
  { label: 'Timetable',      page: 'SchoolAdminTimetable',     icon: 'Clock' },
  { label: 'Reports',        page: 'SchoolAdminReports',       icon: 'FileText' },
  { label: 'Billing',        page: 'SchoolAdminBilling',       icon: 'CreditCard' },
  { label: 'Settings',       page: 'SchoolAdminSettings',      icon: 'Settings' },
];

export const CLASS_STATUS_CONFIG = {
  active:   { label: 'Active',    classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  archived: { label: 'Archived',  classes: 'scholr-sunk scholr-muted scholr-rule',     dot: 'bg-slate-400' },
};

export const CO_TEACHER_PERMS = [
  { value: 'grades',    label: 'Enter Grades' },
  { value: 'feedback',  label: 'Return Feedback' },
  { value: 'manage',    label: 'Manage Workflows' },
];