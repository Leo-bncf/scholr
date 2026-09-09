import { supabase } from '@/lib/supabase';
import { rows } from './_query';

/**
 * Generic table access, for the handful of features that are genuinely
 * table-agnostic: bulk export/import, and the paginated query helper.
 *
 * base44 allowed `entities[someVariable]`, which meant any string could name a
 * table. That's convenient but unbounded — a typo silently queried nothing, and
 * nothing stopped a caller reaching a table it had no business touching. Here
 * the set is explicit, so an unknown name is an error.
 *
 * Everything else should use the domain module for its area.
 */

/** Tables reachable through the generic helpers, keyed by their base44 name. */
export const TABLES = {
  School: 'schools',
  SchoolMembership: 'school_memberships',
  Class: 'classes',
  Subject: 'subjects',
  AcademicYear: 'academic_years',
  Term: 'terms',
  Cohort: 'cohorts',
  Assignment: 'assignments',
  Submission: 'submissions',
  GradeItem: 'grade_items',
  PredictedGrade: 'predicted_grades',
  AttendanceRecord: 'attendance_records',
  AttendancePolicy: 'attendance_policies',
  BehaviorRecord: 'behavior_records',
  BehaviorPolicy: 'behavior_policies',
  Message: 'messages',
  MessagingPolicy: 'messaging_policies',
  Notification: 'notifications',
  Room: 'rooms',
  Period: 'periods',
  ScheduleEntry: 'schedule_entries',
  LessonPlan: 'lesson_plans',
  ClassMaterial: 'class_materials',
  CurriculumTopic: 'curriculum_topics',
  Assessment: 'assessments',
  AssessmentSubmission: 'assessment_submissions',
  CASExperience: 'cas_experiences',
  EEMilestone: 'ee_milestones',
  TOKTask: 'tok_tasks',
  Report: 'reports',
  ReportTemplate: 'report_templates',
  RubricTemplate: 'rubric_templates',
  GradebookPolicy: 'gradebook_policies',
  GovernancePolicy: 'governance_policies',
  SubmissionPolicy: 'submission_policies',
  ParentStudentLink: 'parent_student_links',
  UserInvitation: 'user_invitations',
  TimetableSettings: 'timetable_settings',
  TimetableSync: 'timetable_syncs',
  UnifiedCalendarEvent: 'unified_calendar_events',
  AuditLog: 'audit_logs',
  SupportTicket: 'support_tickets',
  PrivacyRequest: 'privacy_requests',
  AccountState: 'account_states',
  ErrorLog: 'error_logs',
};

export function isKnown(name) {
  return Object.prototype.hasOwnProperty.call(TABLES, name);
}

function tableFor(name) {
  const table = TABLES[name];
  if (!table) throw new Error(`Unknown entity "${name}". Add it to src/data/tables.js if it should be reachable generically.`);
  return table;
}

/** Read rows from any known table. RLS still decides what comes back. */
export function select(entityName, filters = {}, { order = 'created_at', ascending = false, limit, offset } = {}) {
  let q = supabase.from(tableFor(entityName)).select('*');
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue;
    if (value === null) q = q.is(key, null);
    else if (Array.isArray(value)) q = q.in(key, value);
    else q = q.eq(key, value);
  }
  q = q.order(order, { ascending });
  if (offset !== undefined && limit) q = q.range(offset, offset + limit - 1);
  else if (limit) q = q.limit(limit);
  return rows(q, `tables.select(${entityName})`);
}

/** Insert many rows into a known table, in chunks. */
export async function insertMany(entityName, records, { chunkSize = 500 } = {}) {
  const table = tableFor(entityName);
  const inserted = [];
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    const { data, error } = await supabase.from(table).insert(chunk).select('id');
    if (error) throw new Error(`tables.insertMany(${entityName}): ${error.message}`);
    inserted.push(...(data ?? []));
  }
  return inserted;
}

/** Count rows without transferring them. */
export async function countRows(entityName, filters = {}) {
  let q = supabase.from(tableFor(entityName)).select('id', { count: 'exact', head: true });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) q = q.eq(key, value);
  }
  const { count, error } = await q;
  if (error) throw new Error(`tables.countRows(${entityName}): ${error.message}`);
  return count ?? 0;
}
