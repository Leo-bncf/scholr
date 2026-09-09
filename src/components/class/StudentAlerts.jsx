import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, Clock, FileX, CheckCircle2, Loader2 } from 'lucide-react';
import { subDays } from 'date-fns';
import * as membershipsData from '@/data/memberships';
import * as attendanceData from '@/data/attendance';
import * as assignmentsData from '@/data/assignments';
import * as submissionsData from '@/data/submissions';
import * as gradebookData from '@/data/gradebook';

function AlertBadge({ type }) {
  const config = {
    attendance: { label: 'Attendance Risk', color: 'bg-red-50 text-red-700 border-red-200', icon: Clock },
    low_grade: { label: 'Low Performance', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: TrendingDown },
    missing_work: { label: 'Missing Work', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: FileX },
  };
  const { label, color, icon: Icon } = config[type] || config.attendance;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${color}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}

export default function StudentAlerts({ classData }) {
  const today = new Date();
  const windowStart = subDays(today, 30).toISOString().split('T')[0];

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['alert-students', classData.id],
    queryFn: async () => {
      const members = await membershipsData.where({
        school_id: classData.school_id, status: 'active'
      });
      return members.filter(m => classData.student_ids?.includes(m.user_id));
    },
  });

  const { data: attendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['alert-attendance', classData.id],
    queryFn: () => attendanceData.whereRecords({
      school_id: classData.school_id,
      class_id: classData.id,
    }),
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['alert-assignments', classData.id],
    queryFn: () => assignmentsData.where({
      school_id: classData.school_id,
      class_id: classData.id,
      status: 'published',
    }),
  });

  const { data: submissions = [], isLoading: loadingSubmissions } = useQuery({
    queryKey: ['alert-submissions', classData.id],
    queryFn: () => submissionsData.where({
      school_id: classData.school_id,
      class_id: classData.id,
    }),
    enabled: assignments.length > 0,
  });

  const { data: grades = [], isLoading: loadingGrades } = useQuery({
    queryKey: ['alert-grades', classData.id],
    queryFn: () => gradebookData.whereGradeItems({
      school_id: classData.school_id,
      class_id: classData.id,
    }),
  });

  const isLoading = loadingStudents || loadingAttendance || loadingAssignments || loadingSubmissions || loadingGrades;

  const pastDueAssignments = assignments.filter(a => a.due_date && new Date(a.due_date) < today);

  // Build per-student alerts
  const studentAlerts = students.map(student => {
    const alerts = [];

    // 1. Attendance risk — >20% absences in last 30 days
    const recentAttendance = attendance.filter(r =>
      r.student_id === student.user_id && r.date >= windowStart
    );
    const absentCount = recentAttendance.filter(r => r.status === 'absent').length;
    const totalSessions = recentAttendance.length;
    const absenceRate = totalSessions > 0 ? (absentCount / totalSessions) * 100 : 0;
    if (absenceRate >= 20 && totalSessions >= 3) {
      alerts.push({
        type: 'attendance',
        detail: `${absentCount} absence${absentCount > 1 ? 's' : ''} in last 30 days (${Math.round(absenceRate)}%)`,
      });
    }

    // 2. Missing work — past-due assignments with no submission
    const missingAssignments = pastDueAssignments.filter(a => {
      const submitted = submissions.find(s => s.assignment_id === a.id && s.student_id === student.user_id);
      return !submitted;
    });
    if (missingAssignments.length > 0) {
      alerts.push({
        type: 'missing_work',
        detail: `${missingAssignments.length} missing assignment${missingAssignments.length > 1 ? 's' : ''}`,
      });
    }

    // 3. Low grade — average score below 50%
    const studentGrades = grades.filter(g => g.student_id === student.user_id && g.score != null);
    if (studentGrades.length >= 2) {
      const items = grades.filter(g => !g.student_id); // template items
      const totalMax = items.reduce((s, g) => s + (g.max_score || 0), 0);
      const totalEarned = studentGrades.reduce((s, g) => s + (g.score || 0), 0);
      if (totalMax > 0 && (totalEarned / totalMax) < 0.5) {
        alerts.push({
          type: 'low_grade',
          detail: `Average below 50% (${Math.round((totalEarned / totalMax) * 100)}%)`,
        });
      }
    }

    return { student, alerts };
  }).filter(s => s.alerts.length > 0);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-slate-900">Student Risk Alerts</h3>
        </div>
        <Badge variant="secondary">{studentAlerts.length} at risk</Badge>
      </div>

      {studentAlerts.length === 0 ? (
        <div className="p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <p className="text-slate-600 font-medium">No at-risk students</p>
          <p className="text-sm text-slate-400 mt-1">All students are on track based on attendance, submissions, and grades</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {studentAlerts.map(({ student, alerts }) => (
            <div key={student.id} className="px-5 py-4 flex items-start gap-4">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-semibold text-sm flex-shrink-0">
                {student.user_name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm">{student.user_name || student.user_email}</p>
                <p className="text-xs text-slate-400 mb-2">{student.grade_level || 'Student'}</p>
                <div className="flex flex-wrap gap-2">
                  {alerts.map((alert, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <AlertBadge type={alert.type} />
                      <span className="text-xs text-slate-500 pl-1">{alert.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}