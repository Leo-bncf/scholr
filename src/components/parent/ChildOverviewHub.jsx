import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, BarChart3, ClipboardCheck, Calendar } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import * as gradebookData from '@/data/gradebook';
import * as classesData from '@/data/classes';
import * as assignmentsData from '@/data/assignments';
import * as submissionsData from '@/data/submissions';
import * as attendanceData from '@/data/attendance';

export default function ChildOverviewHub({ schoolId, studentId }) {
  const { data: grades = [], isLoading: loadingGrades } = useQuery({
    queryKey: ['parent-child-grades', schoolId, studentId],
    queryFn: () => gradebookData.whereGradeItems({
      school_id: schoolId,
      student_id: studentId,
      visible_to_parent: true,
      status: 'published'
    }, { order: 'created_at', ascending: false, limit: 10 }),
    enabled: !!schoolId && !!studentId,
  });

  const { data: studentClasses = [] } = useQuery({
    queryKey: ['parent-child-classes', schoolId, studentId],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => c.student_ids?.includes(studentId));
    },
    enabled: !!schoolId && !!studentId,
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
    queryKey: ['parent-child-assignments', schoolId, studentClasses],
    queryFn: async () => {
      const classIds = new Set(studentClasses.map(c => c.id));
      const all = await assignmentsData.where({ school_id: schoolId, status: 'published' });
      return all.filter(a => classIds.has(a.class_id)).slice(0, 5);
    },
    enabled: !!schoolId && studentClasses.length > 0,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['parent-child-submissions', schoolId, studentId],
    queryFn: () => submissionsData.where({ school_id: schoolId, student_id: studentId }),
    enabled: !!schoolId && !!studentId,
  });

  const { data: attendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ['parent-child-attendance', schoolId, studentId],
    queryFn: () => attendanceData.whereRecords({ school_id: schoolId, student_id: studentId }, { order: 'date', ascending: false, limit: 30 }),
    enabled: !!schoolId && !!studentId,
  });

  const isLoading = loadingGrades || loadingAssignments || loadingAttendance;

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  }

  // Calculate metrics
  const avgGrade = grades.length > 0 ? (grades.reduce((s, g) => s + (g.score || 0), 0) / grades.length).toFixed(1) : null;
  const upcomingAssignments = assignments.filter(a => a.due_date && new Date(a.due_date) > new Date()).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const overdueAssignments = assignments.filter(a => a.due_date && isPast(new Date(a.due_date)));
  
  const attendanceStats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    excused: attendance.filter(a => a.status === 'excused').length,
  };
  const attendancePercent = attendance.length > 0 ? ((attendanceStats.present / attendance.length) * 100).toFixed(1) : null;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-600 font-medium mb-1">Average Grade</p>
              <p className="text-3xl font-bold text-indigo-900">{avgGrade || '—'}</p>
              <p className="text-xs text-indigo-600 mt-1">{grades.length} grades recorded</p>
            </div>
            <BarChart3 className="w-10 h-10 text-indigo-200" />
          </div>
        </div>

        <div className={`bg-gradient-to-br ${overdueAssignments.length > 0 ? 'from-red-50 to-red-100 border-red-200' : 'from-emerald-50 to-emerald-100 border-emerald-200'} rounded-xl p-5 border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${overdueAssignments.length > 0 ? 'text-red-600' : 'text-emerald-600'} font-medium mb-1`}>Assignments Due</p>
              <p className={`text-3xl font-bold ${overdueAssignments.length > 0 ? 'text-red-900' : 'text-emerald-900'}`}>{upcomingAssignments.length}</p>
              {overdueAssignments.length > 0 && <p className="text-xs text-red-600 mt-1">{overdueAssignments.length} overdue</p>}
            </div>
            <ClipboardCheck className="w-10 h-10 text-opacity-20 opacity-20" />
          </div>
        </div>

        <div className={`bg-gradient-to-br ${attendancePercent < 85 ? 'from-amber-50 to-amber-100 border-amber-200' : 'from-emerald-50 to-emerald-100 border-emerald-200'} rounded-xl p-5 border`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs ${attendancePercent < 85 ? 'text-amber-600' : 'text-emerald-600'} font-medium mb-1`}>Attendance Rate</p>
              <p className={`text-3xl font-bold ${attendancePercent < 85 ? 'text-amber-900' : 'text-emerald-900'}`}>{attendancePercent || '—'}%</p>
              <p className={`text-xs ${attendancePercent < 85 ? 'text-amber-600' : 'text-emerald-600'} mt-1`}>{attendance.length} records</p>
            </div>
            <Calendar className="w-10 h-10 text-opacity-20 opacity-20" />
          </div>
        </div>
      </div>

      {/* Grades & Feedback */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          Recent Grades & Feedback
        </h3>
        {grades.length === 0 ? (
          <p className="text-sm text-slate-500">No grades available yet</p>
        ) : (
          <div className="space-y-3">
            {grades.slice(0, 5).map(grade => (
              <div key={grade.id} className="border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 text-sm truncate">{grade.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{grade.class_name || 'Unknown Class'}</p>
                    {grade.comment && <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded">{grade.comment.substring(0, 100)}...</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-indigo-600">{grade.score}/{grade.max_score}</p>
                    <p className="text-xs text-slate-500">{((grade.score / grade.max_score) * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignments & Deadlines */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-emerald-600" />
          Upcoming Assignments & Deadlines
        </h3>
        {upcomingAssignments.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming assignments</p>
        ) : (
          <div className="space-y-3">
            {upcomingAssignments.map(assignment => {
              const submission = submissions.find(s => s.assignment_id === assignment.id);
              const daysLeft = Math.ceil((new Date(assignment.due_date) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div key={assignment.id} className={`border rounded-lg p-3 ${daysLeft <= 3 ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{assignment.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{assignment.class_name || 'Unknown Class'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-semibold ${daysLeft <= 3 ? 'text-red-600' : 'text-slate-600'}`}>
                        Due in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{format(new Date(assignment.due_date), 'MMM d')}</p>
                      {submission && <Badge variant="outline" className="text-xs mt-1">{submission.status}</Badge>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attendance Tracking */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          Attendance Tracking
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Present', value: attendanceStats.present, color: 'bg-emerald-50 text-emerald-700' },
            { label: 'Absent', value: attendanceStats.absent, color: 'bg-red-50 text-red-700' },
            { label: 'Late', value: attendanceStats.late, color: 'bg-amber-50 text-amber-700' },
            { label: 'Excused', value: attendanceStats.excused, color: 'bg-blue-50 text-blue-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-lg ${color} p-3 text-center`}>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
        {attendance.length === 0 ? (
          <p className="text-sm text-slate-500">No attendance records yet</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {attendance.slice(0, 10).map(record => (
              <div key={record.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
                <div>
                  <p className="text-slate-900 font-medium">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                  {record.note && <p className="text-xs text-slate-500">{record.note}</p>}
                </div>
                <Badge variant="outline" className={`text-xs capitalize ${
                  record.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                  record.status === 'absent' ? 'bg-red-50 text-red-700' :
                  record.status === 'late' ? 'bg-amber-50 text-amber-700' :
                  'bg-blue-50 text-blue-700'
                }`}>
                  {record.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}