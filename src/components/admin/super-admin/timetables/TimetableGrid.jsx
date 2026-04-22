import React, { useMemo } from 'react';
import { MapPin, User, Users, BookOpen } from 'lucide-react';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

export default function TimetableGrid({ entries, rooms, classesById, membershipsByUserId }) {
  const roomsById = useMemo(() => Object.fromEntries(rooms.map((r) => [r.id, r])), [rooms]);

  const entriesByDay = useMemo(() => {
    const grouped = {};
    for (const day of DAYS) grouped[day.value] = [];
    for (const e of entries) {
      const key = e.day_of_week ?? 1;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(e);
    }
    for (const day of DAYS) {
      grouped[day.value].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    }
    return grouped;
  }, [entries]);

  // Only show days that have entries OR Mon–Fri (default view)
  const visibleDays = DAYS.filter(
    (d) => (entriesByDay[d.value] && entriesByDay[d.value].length > 0) || (d.value >= 1 && d.value <= 5)
  );

  if (entries.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-md p-10 text-center">
        <p className="text-slate-500 text-sm">No timetable entries found for this selection.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {visibleDays.map((day) => {
        const dayEntries = entriesByDay[day.value] || [];
        return (
          <div key={day.value} className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-900">{day.label}</p>
              <p className="text-xs text-slate-500">{dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}</p>
            </div>
            <div className="flex-1 divide-y divide-slate-100">
              {dayEntries.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No classes</p>
              ) : (
                dayEntries.map((entry) => {
                  const room = entry.room_id ? roomsById[entry.room_id] : null;
                  const cls = entry.class_id ? classesById[entry.class_id] : null;
                  const teacherNames = cls?.teacher_ids?.map((id) => membershipsByUserId[id]?.user_name).filter(Boolean) || [];
                  return (
                    <div key={entry.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-mono text-indigo-600 font-semibold">
                          {entry.start_time} – {entry.end_time}
                        </span>
                        {entry.status && entry.status !== 'active' && (
                          <span className="text-[10px] uppercase tracking-wide text-amber-600 font-medium">
                            {entry.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-slate-900 mb-1 truncate">
                        {entry.class_name || cls?.name || 'Unnamed class'}
                      </p>
                      <div className="space-y-0.5">
                        {entry.teacher_name && (
                          <p className="text-xs text-slate-600 flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            {entry.teacher_name}
                          </p>
                        )}
                        {!entry.teacher_name && teacherNames.length > 0 && (
                          <p className="text-xs text-slate-600 flex items-center gap-1.5">
                            <Users className="w-3 h-3" />
                            {teacherNames.slice(0, 2).join(', ')}
                            {teacherNames.length > 2 && ` +${teacherNames.length - 2}`}
                          </p>
                        )}
                        {(entry.room_name || room?.name) && (
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {entry.room_name || room?.name}
                          </p>
                        )}
                        {cls?.section && (
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3" />
                            Section {cls.section}
                          </p>
                        )}
                      </div>
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