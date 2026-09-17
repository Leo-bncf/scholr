import { useQuery } from '@tanstack/react-query';
import * as membershipsData from '@/data/memberships';
import * as classesData from '@/data/classes';
import * as academics from '@/data/academics';
import * as attendanceData from '@/data/attendance';
import * as messagesData from '@/data/messages';
import * as timetableSyncsData from '@/data/timetableSyncs';
import * as schoolsData from '@/data/schools';

/**
 * Fetches all operational data needed for the School Admin dashboard.
 * Everything is scoped to the provided schoolId.
 */
export function useSchoolOperationsData(schoolId) {
  return useQuery({
    queryKey: ['school-operations', schoolId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        memberships,
        classes,
        academicYears,
        terms,
        subjects,
        attendance,
        timetableSyncs,
        school,
        missingWork,
        recentMessageCount,
      ] = await Promise.all([
        membershipsData.where({ school_id: schoolId, status: 'active' }),
        classesData.where({ school_id: schoolId, status: 'active' }),
        academics.whereAcademicYears({ school_id: schoolId }),
        academics.whereTerms({ school_id: schoolId }),
        academics.whereSubjects({ school_id: schoolId }),
        attendanceData.whereRecords({ school_id: schoolId }),
        timetableSyncsData.where({ school_id: schoolId }).catch(() => []),
        schoolsData.where({ id: schoolId }).then(r => r[0] || null),
        /* Missing-work used to fetch every assignment and submission to derive
           a percentage; the RPC aggregates it. Messaging volume is a count
           over the last 30 days, not the whole message history. */
        classesData.missingWork(schoolId),
        messagesData.countRecentForSchool(schoolId, { since: thirtyDaysAgo }),
      ]);

      // --- Member Breakdown ---
      const students = memberships.filter(m => m.role === 'student');
      // School admins are staff. They belonged to none of the three buckets
      // while `total` counted every membership, so the breakdown was drawn as
      // shares of a number it did not add up to — 2 + 3 + 1 against a total of
      // 7, giving 86% — and an administrator could not find themselves on
      // their own dashboard.
      const teachers = memberships.filter(
        m => ['teacher', 'ib_coordinator', 'school_admin', 'admin'].includes(m.role),
      );
      const parents = memberships.filter(m => m.role === 'parent');

      // --- Enrollment gaps ---
      const enrolledStudentIds = new Set(classes.flatMap(c => c.student_ids || []));
      const studentsWithoutClasses = students.filter(s => !enrolledStudentIds.has(s.user_id));

      // --- Classes missing teachers ---
      const classesWithoutTeachers = classes.filter(c => {
        const legacyOk = c.teacher_ids && c.teacher_ids.length > 0;
        const assignmentsOk = c.subject_teacher_assignments &&
          c.subject_teacher_assignments.some(a => a.teacher_ids && a.teacher_ids.length > 0);
        return !legacyOk && !assignmentsOk;
      });

      // --- Attendance trend (last 30 days) ---
      const recentAttendance = attendance.filter(a => new Date(a.date) >= thirtyDaysAgo);
      const presentCount = recentAttendance.filter(a => a.status === 'present').length;
      const attendanceRate = recentAttendance.length > 0
        ? Math.round((presentCount / recentAttendance.length) * 100)
        : null;

      // --- Missing work rate (aggregated in Postgres) ---
      const missingCount = missingWork?.missing ?? 0;
      const expectedSubmissions = missingWork?.expected ?? 0;
      const missingWorkRate = expectedSubmissions > 0
        ? Math.round((missingCount / expectedSubmissions) * 100)
        : null;

      // --- Messaging volume (last 30 days) ---
      const recentMessages = recentMessageCount;

      // --- Timetable sync errors ---
      const failedSyncs = timetableSyncs.filter(s => s.status === 'error' || s.status === 'failed');

      // --- Upcoming terms ---
      const now = new Date();
      const upcomingTerms = terms.filter(t => t.end_date && new Date(t.end_date) >= now)
        .sort((a, b) => new Date(a.end_date) - new Date(b.end_date))
        .slice(0, 2);

      // --- Setup completion ---
      const setupSteps = {
        academicYears: academicYears.length > 0,
        terms: terms.length > 0,
        subjects: subjects.length > 0,
        classes: classes.length > 0,
        staff: teachers.length > 0,
      };
      const setupDone = Object.values(setupSteps).filter(Boolean).length;

      return {
        school,
        members: { students, teachers, parents, total: memberships.length },
        classes,
        setupSteps,
        setupDone,
        setupTotal: 5,
        studentsWithoutClasses,
        classesWithoutTeachers,
        failedSyncs,
        attendanceRate,
        recentAttendanceCount: recentAttendance.length,
        missingWorkRate,
        missingCount,
        messagingVolume: recentMessages,
        upcomingTerms,
        subjects,
        academicYears,
        terms,
      };
    },
    enabled: !!schoolId,
    staleTime: 3 * 60 * 1000,
  });
}