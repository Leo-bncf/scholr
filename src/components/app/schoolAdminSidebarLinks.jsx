import {
  LayoutDashboard, Users, BookOpen, GraduationCap, Calendar, MessageSquare,
  AlertTriangle, Clock, FileText, CreditCard, Settings, BarChart3,
  ClipboardList, LifeBuoy, ShieldCheck, UserPlus, Layers,
} from 'lucide-react';

/**
 * Where a school admin can go.
 *
 * This was a flat list of sixteen, in an order nobody chose — Curriculum sat
 * above Dashboard, Analytics and Reporting and Reports were three separate
 * neighbours, and five further pages existed and were reachable by URL but
 * appeared nowhere: Subjects, Support, Governance, Gradebook governance and
 * Messaging policy. Twenty-one destinations, sixteen of them findable.
 *
 * They are grouped now by the reason someone opens them. A school admin is not
 * browsing; they arrived with an errand — someone needs an account, a parent
 * is asking about a grade, the term needs setting up — and the grouping is
 * what turns twenty-one links into five short lists.
 *
 * Order within a section runs most-used first, not alphabetical. Dashboard has
 * no section: it is where you land.
 */
export const SCHOOL_ADMIN_SIDEBAR_LINKS = [
  { label: 'Dashboard', page: 'SchoolAdminDashboard', icon: LayoutDashboard },

  { section: 'People', label: 'Users', page: 'SchoolAdminUsers', icon: Users },
  { section: 'People', label: 'Enrolments', page: 'SchoolAdminEnrollments', icon: UserPlus },
  { section: 'People', label: 'Messages', page: 'Messages', icon: MessageSquare },

  { section: 'Teaching', label: 'Classes', page: 'SchoolAdminClasses', icon: BookOpen },
  { section: 'Teaching', label: 'Subjects', page: 'SchoolAdminSubjects', icon: Layers },
  { section: 'Teaching', label: 'Curriculum', page: 'CurriculumMapping', icon: GraduationCap },
  { section: 'Teaching', label: 'Timetable', page: 'SchoolAdminTimetable', icon: Clock },
  { section: 'Teaching', label: 'Calendar', page: 'UnifiedCalendar', icon: Calendar },

  { section: 'Records', label: 'Attendance', page: 'SchoolAdminAttendance', icon: ClipboardList },
  { section: 'Records', label: 'Behaviour', page: 'SchoolAdminBehavior', icon: AlertTriangle },
  { section: 'Records', label: 'Reports', page: 'SchoolAdminReports', icon: FileText },
  { section: 'Records', label: 'Analytics', page: 'SchoolAnalytics', icon: BarChart3 },
  { section: 'Records', label: 'Report builder', page: 'ReportingEngine', icon: FileText },

  { section: 'Setting up', label: 'Onboarding', page: 'SchoolAdminOnboarding', icon: GraduationCap },
  { section: 'Setting up', label: 'Academic setup', page: 'SchoolAdminAcademicSetup', icon: Calendar },
  { section: 'Setting up', label: 'Gradebook rules', page: 'SchoolAdminGradebookGovernance', icon: BookOpen },
  { section: 'Setting up', label: 'Messaging rules', page: 'SchoolAdminMessagingPolicy', icon: MessageSquare },

  { section: 'The school', label: 'Settings', page: 'SchoolAdminSettings', icon: Settings },
  { section: 'The school', label: 'Governance', page: 'SchoolAdminGovernance', icon: ShieldCheck },
  { section: 'The school', label: 'Billing', page: 'SchoolAdminBilling', icon: CreditCard },
  { section: 'The school', label: 'Support', page: 'SchoolAdminSupport', icon: LifeBuoy },
];
