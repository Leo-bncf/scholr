import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays, Clock, MapPin, User,
  ChevronLeft, ChevronRight, Loader2, Bell, Calendar
} from 'lucide-react';
import { format, addDays, subDays, startOfWeek, getDay, differenceInDays, isSameDay } from 'date-fns';
import { getStudentSidebarLinks } from '@/components/app/studentSidebarLinks';
import * as classesData from '@/data/classes';
import * as scheduleEntriesData from '@/data/scheduleEntries';
import * as assignmentsData from '@/data/assignments';
import * as submissionsData from '@/data/submissions';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_DAYS = [1, 2, 3, 4, 5]; // Mon–Fri

function urgencyColor(daysLeft) {
  if (daysLeft < 0) return 'bg-red-100 text-red-700 border-red-200';
  if (daysLeft <= 1) return 'bg-red-100 text-red-700 border-red-200';
  if (daysLeft <= 3) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (daysLeft <= 7) return 'bg-blue-100 text-blue-700 border-blue-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
}

function urgencyLabel(daysLeft) {
  if (daysLeft < 0) return 'Overdue';
  if (daysLeft === 0) return 'Due today';
  if (daysLeft === 1) return 'Due tomorrow';
  return `${daysLeft} days`;
}

// ── Period / entry card ───────────────────────────────────────────────────────

function PeriodCard({ entry, isNow, isNext }) {
  return (
    <div className={`rounded-xl border p-3 md:p-4 transition-all ${
      isNow ? 'bg-emerald-50 border-emerald-300 shadow-sm' :
      isNext ? 'bg-blue-50 border-blue-300 shadow-sm' :
      'bg-white border-slate-200'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isNow && <Badge className="bg-emerald-600 text-white border-0 text-xs py-0">Now</Badge>}
            {isNext && <Badge className="bg-blue-600 text-white border-0 text-xs py-0">Next</Badge>}
          </div>
          <p className="font-semibold text-slate-900 truncate">{entry.class_name || 'Class'}</p>
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span>{entry.start_time} – {entry.end_time}</span>
            </div>
            {entry.room_name && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{entry.room_name}</span>
              </div>
            )}
            {entry.teacher_name && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <User className="w-3 h-3 flex-shrink-0" />
                <span>{entry.teacher_name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Day View ──────────────────────────────────────────────────────────────────

function DayView({ entries, selectedDate }) {
  const now = format(new Date(), 'HH:mm');
  const isToday = isSameDay(selectedDate, new Date());
  const dayEntries = entries.filter(e => e.day_of_week === getDay(selectedDate)).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const currentEntry = isToday ? dayEntries.find(e => e.start_time <= now && e.end_time > now) : null;
  const nextEntry = isToday ? dayEntries.find(e => e.start_time > now) : null;

  if (dayEntries.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <CalendarDays className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No classes scheduled for {format(selectedDate, 'EEEE')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dayEntries.map(entry => (
        <PeriodCard
          key={entry.id}
          entry={entry}
          isNow={currentEntry?.id === entry.id}
          isNext={!currentEntry && nextEntry?.id === entry.id}
        />
      ))}
    </div>
  );
}

// ── Week View ─────────────────────────────────────────────────────────────────

function WeekView({ entries, weekStart }) {
  const now = format(new Date(), 'HH:mm');
  const todayDow = getDay(new Date());

  return (
    <div className="grid grid-cols-5 gap-2 md:gap-3">
      {WEEK_DAYS.map(dow => {
        const date = addDays(weekStart, dow - 1); // weekStart is Monday
        const dayEntries = entries.filter(e => e.day_of_week === dow).sort((a, b) => a.start_time.localeCompare(b.start_time));
        const isToday = isSameDay(date, new Date());

        return (
          <div key={dow} className={`rounded-xl border overflow-hidden ${isToday ? 'border-indigo-300' : 'border-slate-200'}`}>
            <div className={`px-2 py-2 text-center text-xs font-bold uppercase tracking-wide ${isToday ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-600'}`}>
              <p>{DAY_NAMES[dow]}</p>
              <p className={`text-lg font-bold leading-tight ${isToday ? 'text-white' : 'text-slate-900'}`}>{format(date, 'd')}</p>
            </div>
            <div className="p-2 space-y-2 min-h-32 bg-white">
              {dayEntries.length === 0 ? (
                <p className="text-xs text-slate-300 text-center py-4">—</p>
              ) : (
                dayEntries.map(entry => {
                  const isNow = isToday && entry.start_time <= now && entry.end_time > now;
                  return (
                    <div key={entry.id} className={`rounded-lg p-2 text-xs ${isNow ? 'bg-emerald-100 border border-emerald-300' : 'bg-slate-50 border border-slate-200'}`}>
                      <p className="font-semibold text-slate-900 truncate leading-tight">{entry.class_name}</p>
                      <p className="text-slate-500 mt-0.5">{entry.start_time}–{entry.end_time}</p>
                      {entry.room_name && <p className="text-slate-400 flex items-center gap-0.5 mt-0.5"><MapPin className="w-2.5 h-2.5" />{entry.room_name}</p>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Deadline Notifications ────────────────────────────────────────────────────

function DeadlineAlerts({ assignments, submissions }) {
  const submissionMap = useMemo(() => new Set(submissions.map(s => s.assignment_id)), [submissions]);
  const upcoming = useMemo(() => assignments
    .filter(a => a.due_date && !submissionMap.has(a.id))
    .map(a => ({ ...a, daysLeft: differenceInDays(new Date(a.due_date), new Date()) }))
    .filter(a => a.daysLeft <= 14)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 10),
  [assignments, submissionMap]);

  if (upcoming.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">No upcoming deadlines in the next 2 weeks</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {upcoming.map(a => (
        <div key={a.id} className={`flex items-start justify-between gap-3 rounded-xl border p-3 md:p-4 ${urgencyColor(a.daysLeft)}`}>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{a.title}</p>
            <p className="text-xs opacity-75 mt-0.5">{a.class_name || ''}</p>
            {a.due_date && (
              <p className="text-xs mt-1 flex items-center gap-1 opacity-75">
                <Calendar className="w-3 h-3" />
                {format(new Date(a.due_date), 'EEE, MMM d · h:mm a')}
              </p>
            )}
          </div>
          <Badge className={`flex-shrink-0 border ${urgencyColor(a.daysLeft)} text-xs`} variant="outline">
            {urgencyLabel(a.daysLeft)}
          </Badge>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function StudentTimetable() {
  const { user, school, schoolId, curriculum } = useUser();
  const studentLinks = getStudentSidebarLinks(curriculum);
  const [view, setView] = useState('day'); // 'day' | 'week'
  const [selectedDate, setSelectedDate] = useState(new Date());

  const weekStart = useMemo(() => {
    const s = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return s;
  }, [selectedDate]);

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['student-classes', schoolId, user?.id],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => c.student_ids?.includes(user.id));
    },
    enabled: !!schoolId && !!user?.id,
  });

  const { data: scheduleEntries = [], isLoading: loadingSchedule } = useQuery({
    queryKey: ['student-schedule', schoolId, user?.id],
    queryFn: async () => {
      const all = await scheduleEntriesData.where({ school_id: schoolId, status: 'active' });
      const classIds = new Set(classes.map(c => c.id));
      return all.filter(e => classIds.has(e.class_id));
    },
    enabled: !!schoolId && classes.length > 0,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['student-assignments-tt', schoolId, user?.id],
    queryFn: async () => {
      const classIds = new Set(classes.map(c => c.id));
      const all = await assignmentsData.where({ school_id: schoolId, status: 'published' });
      const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]));
      return all.filter(a => classIds.has(a.class_id)).map(a => ({ ...a, class_name: classMap[a.class_id] || '' }));
    },
    enabled: classes.length > 0,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['student-submissions-tt', schoolId, user?.id],
    queryFn: () => submissionsData.where({ school_id: schoolId, student_id: user?.id }),
    enabled: !!schoolId && !!user?.id,
  });

  const isLoading = loadingClasses || loadingSchedule;

  const goBack = () => setSelectedDate(d => view === 'week' ? subDays(d, 7) : subDays(d, 1));
  const goForward = () => setSelectedDate(d => view === 'week' ? addDays(d, 7) : addDays(d, 1));
  const goToday = () => setSelectedDate(new Date());

  const dateLabel = view === 'week'
    ? `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 4), 'MMM d, yyyy')}`
    : format(selectedDate, 'EEEE, MMMM d, yyyy');

  const urgentCount = useMemo(() => {
    const subSet = new Set(submissions.map(s => s.assignment_id));
    return assignments.filter(a => {
      if (!a.due_date || subSet.has(a.id)) return false;
      const d = differenceInDays(new Date(a.due_date), new Date());
      return d <= 3;
    }).length;
  }, [assignments, submissions]);

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={studentLinks} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">My Timetable</h1>
              <p className="text-sm text-slate-500 mt-1">Personal schedule and upcoming deadlines</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Schedule column */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Controls */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
                    {/* View toggle */}
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
                      {['day', 'week'].map(v => (
                        <button
                          key={v}
                          onClick={() => setView(v)}
                          className={`px-4 py-1.5 font-medium capitalize transition-colors ${view === v ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                      <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <ChevronLeft className="w-4 h-4 text-slate-600" />
                      </button>
                      <span className="text-sm font-medium text-slate-700 min-w-0 text-center">{dateLabel}</span>
                      <button onClick={goForward} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>

                    <button
                      onClick={goToday}
                      className="px-3 py-1.5 text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      Today
                    </button>
                  </div>

                  {/* Schedule content */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
                    {view === 'day' ? (
                      <DayView entries={scheduleEntries} selectedDate={selectedDate} />
                    ) : (
                      <WeekView entries={scheduleEntries} weekStart={weekStart} />
                    )}
                  </div>
                </div>

                {/* Deadlines column */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-500" />
                        <h2 className="font-bold text-sm text-slate-900">Upcoming Deadlines</h2>
                      </div>
                      {urgentCount > 0 && (
                        <Badge className="bg-red-100 text-red-700 border-0 text-xs">{urgentCount} urgent</Badge>
                      )}
                    </div>
                    <div className="p-3 md:p-4">
                      <DeadlineAlerts assignments={assignments} submissions={submissions} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}