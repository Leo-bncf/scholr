/* Shared shapes for the Classes page.
 *
 * A third copy of the school-admin menu used to live here — ten links, still
 * saying "Enrollments" and "Academic Setup". The section has one menu now, in
 * schoolAdminSidebarLinks.
 */
/* A class being active is the ordinary case and needs no green badge; a list
   where every row glows is a list with no signal in it. Archived is the one
   worth marking, because it explains why the class is not in the timetable. */
export const CLASS_STATUS_CONFIG = {
  active:   { label: 'Active',   tone: null },
  archived: { label: 'Archived', tone: 'mute' },
};

export const CO_TEACHER_PERMS = [
  { value: 'grades',    label: 'Enter Grades' },
  { value: 'feedback',  label: 'Return Feedback' },
  { value: 'manage',    label: 'Manage Workflows' },
];