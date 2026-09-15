import {
  LayoutDashboard, Users, BookOpen, GraduationCap, Calendar, MessageSquare,
  AlertTriangle, Clock, FileText, CreditCard, Settings, ClipboardList,
  LifeBuoy, ShieldCheck,
} from 'lucide-react';

/**
 * Where a school admin can go.
 *
 * Fifteen destinations, down from twenty-two. The twenty-two were not twenty-two
 * jobs — several were the same job twice, and a school admin had to know which
 * of three pages held the thing they wanted:
 *
 *   Enrolments (Classes · Teachers · Students) was a strict subset of Classes
 *     (Class sections · Staff · Students · Lifecycle).
 *   Subjects was a second, simpler way to do what Academic setup's own
 *     Subjects tab already did.
 *   Reports, Analytics and Report builder were three separate answers to
 *     "let me look at the data".
 *   Governance, Gradebook rules and Messaging rules were three pages of
 *     policy, thirteen tabs between them, all of them rules.
 *
 * The merged pages keep every feature — the removed routes redirect, so old
 * links and bookmarks still land somewhere sensible.
 *
 * Grouped by the reason someone opens them: a school admin is not browsing,
 * they arrived with an errand. Order within a section is most-used first, not
 * alphabetical. Dashboard has no section — it is where you land.
 */
export const SCHOOL_ADMIN_SIDEBAR_LINKS = [
  { label: 'Dashboard', page: 'SchoolAdminDashboard', icon: LayoutDashboard },

  { section: 'People', label: 'Users', page: 'SchoolAdminUsers', icon: Users },
  { section: 'People', label: 'Messages', page: 'Messages', icon: MessageSquare },

  { section: 'Teaching', label: 'Classes', page: 'SchoolAdminClasses', icon: BookOpen },
  { section: 'Teaching', label: 'Curriculum', page: 'CurriculumMapping', icon: GraduationCap },
  { section: 'Teaching', label: 'Timetable', page: 'SchoolAdminTimetable', icon: Clock },
  { section: 'Teaching', label: 'Calendar', page: 'UnifiedCalendar', icon: Calendar },

  { section: 'Records', label: 'Attendance', page: 'SchoolAdminAttendance', icon: ClipboardList },
  { section: 'Records', label: 'Behaviour', page: 'SchoolAdminBehavior', icon: AlertTriangle },
  { section: 'Records', label: 'Reports', page: 'SchoolAdminReports', icon: FileText },

  { section: 'Setting up', label: 'Onboarding', page: 'SchoolAdminOnboarding', icon: GraduationCap },
  { section: 'Setting up', label: 'Academic setup', page: 'SchoolAdminAcademicSetup', icon: Calendar },
  { section: 'Setting up', label: 'Rules', page: 'SchoolAdminRules', icon: ShieldCheck },

  { section: 'The school', label: 'Settings', page: 'SchoolAdminSettings', icon: Settings },
  { section: 'The school', label: 'Billing', page: 'SchoolAdminBilling', icon: CreditCard },
  { section: 'The school', label: 'Support', page: 'SchoolAdminSupport', icon: LifeBuoy },
];

/**
 * Pages that no longer exist, and where they went.
 *
 * Bookmarks, the Next rows, emailed links and anything a school wrote in its
 * own documentation all still point at these. A 404 for a page we chose to
 * merge would be our mistake landing on them, so each one redirects to the tab
 * that absorbed it.
 */
export const SCHOOL_ADMIN_REDIRECTS = {
  SchoolAdminEnrollments: 'SchoolAdminClasses?tab=students',
  SchoolAdminSubjects: 'SchoolAdminAcademicSetup?tab=subjects',
  SchoolAnalytics: 'SchoolAdminReports?tab=analytics',
  ReportingEngine: 'SchoolAdminReports?tab=build',
  SchoolAdminGovernance: 'SchoolAdminRules?tab=records',
  SchoolAdminGradebookGovernance: 'SchoolAdminRules?tab=grading',
  SchoolAdminMessagingPolicy: 'SchoolAdminRules?tab=messaging',
};
