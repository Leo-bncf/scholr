import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { getAppSidebarLinks } from '@/components/app/sidebarLinks';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CalendarEventDialog from '@/components/calendar/CalendarEventDialog';
import CreateCalendarEventDialog from '@/components/calendar/CreateCalendarEventDialog';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from 'date-fns';

const eventColors = {
  class: 'bg-sky-100 text-sky-800 border-sky-200',
  assignment: 'bg-amber-100 text-amber-800 border-amber-200',
  exam: 'bg-rose-100 text-rose-800 border-rose-200',
  event: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

function MonthView({ currentDate, events, onSelectEvent }) {
  const monthStart = startOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  const days = [];
  let day = calendarStart;

  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
        <div key={label} className="px-2 py-2 text-xs font-semibold text-slate-500 uppercase">{label}</div>
      ))}
      {days.map((date) => {
        const dayEvents = events.filter((event) => isSameDay(new Date(event.start_time), date));
        return (
          <div key={date.toISOString()} className={`min-h-36 rounded-xl border p-2 ${isSameMonth(date, currentDate) ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
            <p className="text-sm font-semibold text-slate-700 mb-2">{format(date, 'd')}</p>
            <div className="space-y-1.5">
              {dayEvents.slice(0, 4).map((event) => (
                <button key={event.id} onClick={() => onSelectEvent(event)} className={`w-full text-left text-xs rounded-lg px-2 py-1 border truncate ${eventColors[event.type] || eventColors.event}`}>
                  {event.title}
                </button>
              ))}
              {dayEvents.length > 4 && <p className="text-xs text-slate-400">+{dayEvents.length - 4} more</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WeekView({ currentDate, events, onSelectEvent }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {days.map((date) => {
        const dayEvents = events.filter((event) => isSameDay(new Date(event.start_time), date));
        return (
          <div key={date.toISOString()} className="bg-white rounded-xl border border-slate-200 p-3 min-h-56">
            <p className="text-xs uppercase text-slate-500 font-semibold">{format(date, 'EEE')}</p>
            <p className="text-lg font-bold text-slate-900">{format(date, 'd')}</p>
            <div className="mt-3 space-y-2">
              {dayEvents.length === 0 ? <p className="text-xs text-slate-400">No events</p> : dayEvents.map((event) => (
                <button key={event.id} onClick={() => onSelectEvent(event)} className={`w-full text-left rounded-lg border px-2.5 py-2 ${eventColors[event.type] || eventColors.event}`}>
                  <p className="text-xs font-semibold truncate">{event.title}</p>
                  <p className="text-[11px] mt-1 opacity-80">{format(new Date(event.start_time), 'h:mm a')}</p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function UnifiedCalendar() {
  const { user, school, schoolId, role } = useUser();
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const canCreate = ['teacher', 'school_admin', 'ib_coordinator', 'admin', 'super_admin'].includes(role);
  const sidebarLinks = role === 'school_admin' || role === 'ib_coordinator' ? SCHOOL_ADMIN_SIDEBAR_LINKS : getAppSidebarLinks(role);

  const { data, isLoading } = useQuery({
    queryKey: ['unified-calendar', schoolId, user?.id, role],
    queryFn: async () => {
      const [classes, scheduleEntries, assignments, manualEvents, subjects, parentLinks] = await Promise.all([
        base44.entities.Class.filter({ school_id: schoolId, status: 'active' }),
        base44.entities.ScheduleEntry.filter({ school_id: schoolId, status: 'active' }),
        base44.entities.Assignment.filter({ school_id: schoolId, status: 'published' }),
        base44.entities.UnifiedCalendarEvent.filter({ school_id: schoolId }),
        base44.entities.Subject.filter({ school_id: schoolId, status: 'active' }),
        role === 'parent' ? base44.entities.ParentStudentLink.filter({ school_id: schoolId, parent_id: user.id }) : Promise.resolve([]),
      ]);

      let relevantClasses = classes;
      if (role === 'teacher') relevantClasses = classes.filter((item) => item.teacher_ids?.includes(user.id));
      if (role === 'student') relevantClasses = classes.filter((item) => item.student_ids?.includes(user.id));
      if (role === 'parent') {
        const childIds = parentLinks.map((item) => item.student_id);
        relevantClasses = classes.filter((item) => item.student_ids?.some((studentId) => childIds.includes(studentId)));
      }

      const classIds = new Set(relevantClasses.map((item) => item.id));
      const subjectMap = Object.fromEntries(subjects.map((item) => [item.id, item.name]));

      const classEvents = scheduleEntries
        .filter((item) => classIds.has(item.class_id))
        .map((item) => {
          const startDate = new Date();
          const endDate = new Date();
          const [startHour, startMinute] = (item.start_time || '00:00').split(':').map(Number);
          const [endHour, endMinute] = (item.end_time || '00:00').split(':').map(Number);
          const today = new Date();
          const dayOffset = ((item.day_of_week ?? today.getDay()) - today.getDay() + 7) % 7;
          startDate.setDate(today.getDate() + dayOffset);
          endDate.setDate(today.getDate() + dayOffset);
          startDate.setHours(startHour || 0, startMinute || 0, 0, 0);
          endDate.setHours(endHour || 0, endMinute || 0, 0, 0);
          return {
            id: `class-${item.id}`,
            title: item.class_name || 'Class',
            type: 'class',
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            related_entity_id: item.class_id,
            subject_id: null,
            subjectName: '',
            description: item.teacher_name ? `Teacher: ${item.teacher_name}` : '',
            location: item.room_name || '',
          };
        });

      const assignmentEvents = assignments
        .filter((item) => classIds.has(item.class_id) && item.due_date)
        .map((item) => ({
          id: `assignment-${item.id}`,
          title: item.title,
          type: item.type === 'exam' ? 'exam' : 'assignment',
          start_time: item.due_date,
          end_time: item.due_date,
          related_entity_id: item.id,
          subject_id: null,
          subjectName: relevantClasses.find((classItem) => classItem.id === item.class_id)?.name || '',
          description: item.description || '',
          location: '',
        }));

      const customEvents = manualEvents.map((item) => ({
        ...item,
        subjectName: subjectMap[item.subject_id] || '',
      }));

      return {
        subjects,
        events: [...classEvents, ...assignmentEvents, ...customEvents],
      };
    },
    enabled: !!schoolId && !!user?.id,
  });

  const filteredEvents = useMemo(() => {
    const allEvents = data?.events || [];
    return allEvents.filter((event) => {
      const typeMatch = selectedType === 'all' || event.type === selectedType;
      const subjectMatch = selectedSubject === 'all' || event.subject_id === selectedSubject || event.subjectName === selectedSubject;
      return typeMatch && subjectMatch;
    });
  }, [data, selectedType, selectedSubject]);

  return (
    <RoleGuard allowedRoles={['student', 'teacher', 'parent', 'school_admin', 'ib_coordinator', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={sidebarLinks} role={role} schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Unified Calendar</h1>
                <p className="text-sm text-slate-600 mt-1">Classes, deadlines, exams, and school events in one place.</p>
              </div>
              {canCreate && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="w-4 h-4" /> Create event
                </Button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : addDays(currentDate, -7))}><ChevronLeft className="w-4 h-4" /></Button>
                  <div className="min-w-[180px] text-center font-semibold text-slate-900">{view === 'month' ? format(currentDate, 'MMMM yyyy') : `Week of ${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMM d')}`}</div>
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addDays(currentDate, 7))}><ChevronRight className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Select value={view} onValueChange={setView}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month</SelectItem>
                      <SelectItem value="week">Week</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Event type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="class">Class</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Subject" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All subjects</SelectItem>
                      {(data?.subjects || []).map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="py-20 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-700" /></div>
              ) : view === 'month' ? (
                <MonthView currentDate={currentDate} events={filteredEvents} onSelectEvent={setSelectedEvent} />
              ) : (
                <WeekView currentDate={currentDate} events={filteredEvents} onSelectEvent={setSelectedEvent} />
              )}
            </div>
          </div>
        </main>

        <CalendarEventDialog event={selectedEvent} open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)} />
        <CreateCalendarEventDialog open={createOpen} onOpenChange={setCreateOpen} schoolId={schoolId} user={user} />
      </div>
    </RoleGuard>
  );
}