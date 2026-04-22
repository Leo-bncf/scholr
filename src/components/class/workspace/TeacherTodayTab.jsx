import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  CheckSquare, ClipboardList, FileText, Loader2, ArrowRight,
  Calendar, AlertCircle, Sparkles
} from 'lucide-react';
import { format, isToday, isPast, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';

/**
 * Teacher landing tab — shows what needs attention right now.
 * Three lanes: attendance today, ungraded submissions, upcoming assignments.
 */
export default function TeacherTodayTab({ classData, onNavigate }) {
  const todayISO = format(new Date(), 'yyyy-MM-dd');

  const { data: todayAttendance = [], isLoading: loadingAtt } = useQuery({
    queryKey: ['class-today-attendance', classData.id, todayISO],
    queryFn: () => base44.entities.AttendanceRecord.filter({
      school_id: classData.school_id,
      class_id: classData.id,
      date: todayISO,
    }),
  });

  const { data: assignments = [], isLoading: loadingAssign } = useQuery({
    queryKey: ['class-assignments', classData.id],
    queryFn: () => base44.entities.Assignment.filter({
      school_id: classData.school_id,
      class_id: classData.id,
    }),
  });

  const { data: submissions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ['class-submissions', classData.id],
    queryFn: () => base44.entities.Submission.filter({
      school_id: classData.school_id,
      class_id: classData.id,
    }),
  });

  const isLoading = loadingAtt || loadingAssign || loadingSubs;

  const studentCount = classData.student_ids?.length || 0;
  const attendanceTaken = todayAttendance.length > 0;
  const missingAttendance = Math.max(0, studentCount - todayAttendance.length);

  const ungradedSubs = submissions.filter(
    s => (s.status === 'submitted' || s.status === 'late' || s.status === 'resubmitted')
  );

  const upcoming = assignments
    .filter(a => a.status === 'published' && a.due_date)
    .map(a => ({ ...a, _due: new Date(a.due_date) }))
    .filter(a => !isNaN(a._due) && differenceInDays(a._due, new Date()) >= -1)
    .sort((a, b) => a._due - b._due)
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-5 h-5 animate-spin text-slate-300 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Today</h2>
        <p className="text-xs text-slate-500">What needs your attention in this class right now.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          icon={CheckSquare}
          title="Attendance"
          status={attendanceTaken ? 'done' : 'pending'}
          primary={
            attendanceTaken
              ? `${todayAttendance.length}/${studentCount} recorded`
              : studentCount === 0 ? 'No roster' : 'Not taken yet'
          }
          secondary={
            attendanceTaken && missingAttendance > 0
              ? `${missingAttendance} student${missingAttendance !== 1 ? 's' : ''} not marked`
              : format(new Date(), 'EEEE, MMM d')
          }
          cta={attendanceTaken ? 'Review' : 'Take attendance'}
          onClick={() => onNavigate('attendance')}
        />

        <ActionCard
          icon={FileText}
          title="To grade"
          status={ungradedSubs.length > 0 ? 'pending' : 'done'}
          primary={
            ungradedSubs.length > 0
              ? `${ungradedSubs.length} submission${ungradedSubs.length !== 1 ? 's' : ''}`
              : 'All caught up'
          }
          secondary={
            ungradedSubs.length > 0
              ? `Oldest: ${format(new Date(
                  [...ungradedSubs].sort((a, b) =>
                    new Date(a.submitted_at || a.created_date) - new Date(b.submitted_at || b.created_date)
                  )[0].submitted_at || ungradedSubs[0].created_date
                ), 'MMM d')}`
              : 'No pending submissions'
          }
          cta="Open grades"
          onClick={() => onNavigate('grades')}
          disabled={ungradedSubs.length === 0}
        />

        <ActionCard
          icon={ClipboardList}
          title="Assignments due"
          status={upcoming.length > 0 ? 'info' : 'done'}
          primary={
            upcoming.length > 0
              ? `${upcoming.length} upcoming`
              : 'Nothing scheduled'
          }
          secondary={
            upcoming[0]
              ? `Next: ${upcoming[0].title} · ${format(upcoming[0]._due, 'MMM d')}`
              : 'Post something new'
          }
          cta="Assignments"
          onClick={() => onNavigate('assignments')}
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Coming up</h3>
            <p className="text-[11px] text-slate-500">Next assignments due in this class</p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={() => onNavigate('assignments')}>
            View all <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

        {upcoming.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            No upcoming assignments.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcoming.map(a => {
              const overdue = isPast(a._due) && !isToday(a._due);
              return (
                <div key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                    <p className="text-[11px] text-slate-500 capitalize">{a.type?.replace('_', ' ') || 'assignment'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-semibold ${overdue ? 'text-red-600' : isToday(a._due) ? 'text-amber-600' : 'text-slate-600'}`}>
                      {isToday(a._due) ? 'Today' : format(a._due, 'MMM d')}
                    </p>
                    <p className="text-[10px] text-slate-400">{format(a._due, 'h:mm a')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, status, primary, secondary, cta, onClick, disabled }) {
  const statusStyles = {
    pending: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', dot: 'bg-amber-400' },
    done:    { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', dot: 'bg-emerald-400' },
    info:    { bg: 'bg-white', border: 'border-slate-200', icon: 'text-indigo-600', dot: 'bg-indigo-400' },
  }[status] || { bg: 'bg-white', border: 'border-slate-200', icon: 'text-slate-500', dot: 'bg-slate-300' };

  return (
    <div className={`rounded-xl border p-4 ${statusStyles.bg} ${statusStyles.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center ${statusStyles.icon}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={`w-2 h-2 rounded-full ${statusStyles.dot}`} />
      </div>
      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{title}</p>
      <p className="text-lg font-semibold text-slate-900 mt-0.5">{primary}</p>
      <p className="text-xs text-slate-500 mt-0.5 truncate">{secondary}</p>
      <Button
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={onClick}
        className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 -ml-2 mt-2"
      >
        {cta} <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
    </div>
  );
}