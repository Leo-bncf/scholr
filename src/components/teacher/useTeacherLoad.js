import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, getDay } from 'date-fns';
import { useUser } from '@/components/auth/UserContext';
import * as classesData from '@/data/classes';
import * as assignmentsData from '@/data/assignments';
import * as submissionsData from '@/data/submissions';
import * as gradebookData from '@/data/gradebook';
import * as membershipsData from '@/data/memberships';
import * as attendanceData from '@/data/attendance';
import * as scheduleData from '@/data/scheduleEntries';

/** Statuses that mean "handed in and waiting for the teacher". */
export const AWAITING = new Set(['submitted', 'late', 'resubmitted']);
/** Statuses that mean the student has handed something in at all. */
const HANDED_IN = new Set(['submitted', 'late', 'resubmitted', 'graded', 'returned']);

/**
 * Everything a teacher's pages derive their numbers from, in one place.
 *
 * The dashboard, the class list and the marking page used to each run their
 * own queries and their own arithmetic. The dashboard's "To grade" was a
 * hard-coded 0 while the workspace counted 7. Now every one of those numbers
 * comes from here, so two screens cannot disagree about the same fact.
 *
 * Scoped to the teacher's own classes throughout: nothing reads the whole
 * school and filters in the browser.
 *
 * Pass `classId` to narrow everything to one class (the class page).
 */
export function useTeacherLoad({ classId } = {}) {
  const { user, schoolId, effectiveUserId } = useUser();
  const teacherId = effectiveUserId || user?.id;
  const enabled = !!schoolId && !!teacherId;
  const today = format(new Date(), 'yyyy-MM-dd');

  const classesQ = useQuery({
    queryKey: ['teacher-load', 'classes', schoolId, teacherId],
    queryFn: () => classesData.listForTeacher(schoolId, teacherId),
    enabled,
  });
  const allClasses = classesQ.data;
  const classes = useMemo(
    () => (allClasses || []).filter((c) => !classId || c.id === classId),
    [allClasses, classId],
  );
  const classIds = useMemo(() => classes.map((c) => c.id), [classes]);
  const studentIds = useMemo(
    () => [...new Set(classes.flatMap((c) => c.student_ids || []))],
    [classes],
  );
  const ready = enabled && !!allClasses;
  const key = classIds.join(',');

  const assignmentsQ = useQuery({
    queryKey: ['teacher-load', 'assignments', key],
    queryFn: () => assignmentsData.listForClasses(classIds),
    enabled: ready,
  });
  const submissionsQ = useQuery({
    queryKey: ['teacher-load', 'submissions', key],
    queryFn: () => submissionsData.listForClasses(classIds),
    enabled: ready,
  });
  const gradesQ = useQuery({
    queryKey: ['teacher-load', 'grades', key],
    queryFn: () => gradebookData.listForClasses(classIds),
    enabled: ready,
  });
  const rosterQ = useQuery({
    queryKey: ['teacher-load', 'roster', schoolId, studentIds.join(',')],
    queryFn: () => membershipsData.listClassRoster(schoolId, studentIds),
    enabled: ready,
  });
  const registersQ = useQuery({
    queryKey: ['teacher-load', 'registers', key, today],
    queryFn: () => attendanceData.listForClassesOnDate(classIds, today),
    enabled: ready,
  });
  const scheduleQ = useQuery({
    queryKey: ['teacher-load', 'schedule', key],
    queryFn: () => scheduleData.listForClasses(classIds, { status: 'active' }),
    enabled: ready,
  });

  const isLoading = classesQ.isLoading
    || (ready && [assignmentsQ, submissionsQ, gradesQ, rosterQ, registersQ].some((q) => q.isLoading));
  const error = [classesQ, assignmentsQ, submissionsQ, gradesQ, rosterQ, registersQ].find((q) => q.error)?.error;

  const derived = useMemo(() => {
    const assignments = assignmentsQ.data || [];
    const submissions = submissionsQ.data || [];
    const grades = gradesQ.data || [];
    const roster = rosterQ.data || [];
    const registers = registersQ.data || [];
    const schedule = scheduleQ.data || [];
    const now = new Date();

    const classById = new Map(classes.map((c) => [c.id, c]));
    const assignmentById = new Map(assignments.map((a) => [a.id, a]));
    const nameOf = new Map(roster.map((m) => [m.user_id, m.user_name || m.user_email]));
    const subKey = (a, s) => `${a}:${s}`;
    const subByKey = new Map(submissions.map((s) => [subKey(s.assignment_id, s.student_id), s]));
    const gradeByKey = new Map(grades.filter((g) => g.assignment_id).map((g) => [subKey(g.assignment_id, g.student_id), g]));

    const enrich = (s) => ({
      ...s,
      assignment: assignmentById.get(s.assignment_id) || null,
      cls: classById.get(s.class_id) || null,
      studentName: nameOf.get(s.student_id) || s.student_name || 'Student',
      grade: gradeByKey.get(subKey(s.assignment_id, s.student_id)) || null,
    });

    // Waiting for the teacher, oldest first — the order they should be marked in.
    const toMark = submissions
      .filter((s) => AWAITING.has(s.status) && assignmentById.has(s.assignment_id))
      .map(enrich)
      .sort((a, b) => new Date(a.submitted_at || 0) - new Date(b.submitted_at || 0));

    const marked = submissions
      .filter((s) => s.status === 'graded' || s.status === 'returned')
      .map(enrich)
      .sort((a, b) => new Date(b.graded_at || 0) - new Date(a.graded_at || 0));

    // Past due, nothing handed in, and no mark recorded some other way (paper).
    const published = assignments.filter((a) => a.status === 'published');
    const missing = [];
    for (const a of published) {
      if (!a.due_date || new Date(a.due_date) > now) continue;
      const cls = classById.get(a.class_id);
      for (const sid of cls?.student_ids || []) {
        const sub = subByKey.get(subKey(a.id, sid));
        if (sub && HANDED_IN.has(sub.status)) continue;
        if (gradeByKey.has(subKey(a.id, sid))) continue;
        missing.push({
          key: subKey(a.id, sid),
          assignment: a,
          cls,
          student_id: sid,
          studentName: nameOf.get(sid) || 'Student',
          daysOverdue: Math.floor((now - new Date(a.due_date)) / 86400000),
        });
      }
    }
    missing.sort((x, y) => new Date(x.assignment.due_date) - new Date(y.assignment.due_date));

    const upcoming = published
      .filter((a) => a.due_date && new Date(a.due_date) >= now)
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .map((a) => ({ ...a, cls: classById.get(a.class_id) || null }));

    const dow = getDay(now);
    const lessonsToday = schedule
      .filter((e) => Number(e.day_of_week) === dow)
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
    const registerTaken = new Set(registers.map((r) => r.class_id));
    const teachesToday = new Set(lessonsToday.map((e) => e.class_id));

    const byClass = new Map(classes.map((c) => [c.id, {
      cls: c,
      students: c.student_ids?.length || 0,
      toMark: 0,
      missing: 0,
      nextDue: null,
      teachesToday: teachesToday.has(c.id),
      registerTaken: registerTaken.has(c.id),
    }]));
    toMark.forEach((s) => { const r = byClass.get(s.class_id); if (r) r.toMark++; });
    missing.forEach((m) => { const r = byClass.get(m.cls?.id); if (r) r.missing++; });
    upcoming.forEach((a) => { const r = byClass.get(a.class_id); if (r && !r.nextDue) r.nextDue = a; });

    const registersDue = [...byClass.values()].filter((r) => r.teachesToday && !r.registerTaken);

    return {
      assignments, submissions, grades, roster, nameOf,
      toMark, marked, missing, upcoming, lessonsToday,
      byClass, registersDue,
      gradeFor: (assignmentId, studentId) => gradeByKey.get(subKey(assignmentId, studentId)) || null,
      submissionFor: (assignmentId, studentId) => subByKey.get(subKey(assignmentId, studentId)) || null,
    };
  }, [classes, assignmentsQ.data, submissionsQ.data, gradesQ.data, rosterQ.data, registersQ.data, scheduleQ.data]);

  return { classes, isLoading, error, teacherId, schoolId, ...derived };
}

/** Query keys to invalidate after anything that changes the numbers above. */
export const TEACHER_LOAD_KEY = ['teacher-load'];
