import { LayoutDashboard, BarChart3, CalendarDays, ClipboardList, Star, MessageSquare, Settings } from 'lucide-react';
import { getCurriculumConfig } from '@/lib/curriculumConfig';

/**
 * Returns student sidebar links, dynamically adjusted for the school's curriculum.
 * The IB Core tab is only shown for curricula that have a coreTab defined.
 * Falls back to full IB links for backward compatibility.
 */
export function getStudentSidebarLinks(curriculum = 'ib_dp') {
  const config = getCurriculumConfig(curriculum);

  const links = [
    { label: 'Dashboard',  page: 'StudentDashboard',         icon: LayoutDashboard },
    { label: 'Academic',   page: 'StudentAcademicDashboard', icon: BarChart3 },
    { label: 'Timetable',  page: 'StudentTimetable',         icon: CalendarDays },
    { label: 'Attendance', page: 'StudentAttendance',        icon: ClipboardList },
  ];

  // Add curriculum-specific core tab (e.g. IB Core for IB DP)
  if (config.coreTab) {
    links.push({
      label: config.coreTab.label,
      page: config.coreTab.page,
      icon: Star,
    });
  }

  links.push({ label: 'Messages', page: 'StudentCommunication', icon: MessageSquare });
  links.push({ label: 'Settings', page: 'PersonalSettings', icon: Settings });

  return links;
}

// Static fallback for any code that still imports STUDENT_SIDEBAR_LINKS directly
export const STUDENT_SIDEBAR_LINKS = getStudentSidebarLinks('ib_dp');