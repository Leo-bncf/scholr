import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, MapPin, User } from 'lucide-react';
import { format, getDay } from 'date-fns';
import * as scheduleEntriesData from '@/data/scheduleEntries';
import * as classesData from '@/data/classes';

export default function TodaySchedule({ schoolId, userId, userRole }) {
  const today = getDay(new Date()); // 0=Sunday, 1=Monday, etc.

  const { data: scheduleEntries = [], isLoading } = useQuery({
    queryKey: ['today-schedule', schoolId, userId, today],
    queryFn: async () => {
      const all = await scheduleEntriesData.where({
        school_id: schoolId,
        day_of_week: today,
        status: 'active'
      });

      // Filter based on role
      if (userRole === 'student') {
        // Get student's classes
        const classes = await classesData.where({ school_id: schoolId, status: 'active' });
        const studentClasses = classes.filter(c => c.student_ids?.includes(userId));
        const studentClassIds = studentClasses.map(c => c.id);
        return all.filter(e => studentClassIds.includes(e.class_id)).sort((a, b) => 
          a.start_time.localeCompare(b.start_time)
        );
      } else if (userRole === 'teacher') {
        // Get teacher's schedule
        return all.filter(e => e.teacher_id === userId).sort((a, b) => 
          a.start_time.localeCompare(b.start_time)
        );
      }

      return [];
    },
    enabled: !!schoolId && !!userId,
  });

  const getCurrentOrNextClass = () => {
    const now = format(new Date(), 'HH:mm');
    const current = scheduleEntries.find(e => e.start_time <= now && e.end_time > now);
    if (current) return { entry: current, status: 'current' };
    
    const next = scheduleEntries.find(e => e.start_time > now);
    if (next) return { entry: next, status: 'next' };
    
    return null;
  };

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  }

  if (scheduleEntries.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">No classes scheduled for today</p>
      </div>
    );
  }

  const currentOrNext = getCurrentOrNextClass();

  return (
    <div className="space-y-4">
      {currentOrNext && (
        <div className={`rounded-xl border-2 p-4 ${
          currentOrNext.status === 'current' 
            ? 'bg-emerald-50 border-emerald-300' 
            : 'bg-blue-50 border-blue-300'
        }`}>
          <Badge className={`mb-2 ${
            currentOrNext.status === 'current'
              ? 'bg-emerald-600 text-white border-0'
              : 'bg-blue-600 text-white border-0'
          }`}>
            {currentOrNext.status === 'current' ? 'Now' : 'Next'}
          </Badge>
          <h3 className="font-bold text-lg text-slate-900 mb-2">{currentOrNext.entry.class_name}</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4 h-4" />
              <span>{currentOrNext.entry.start_time} - {currentOrNext.entry.end_time}</span>
            </div>
            {currentOrNext.entry.room_name && (
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="w-4 h-4" />
                <span>{currentOrNext.entry.room_name}</span>
              </div>
            )}
            {currentOrNext.entry.teacher_name && userRole === 'student' && (
              <div className="flex items-center gap-2 text-slate-700">
                <User className="w-4 h-4" />
                <span>{currentOrNext.entry.teacher_name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-slate-900 mb-3">Today's Schedule</h4>
        <div className="space-y-2">
          {scheduleEntries.map(entry => (
            <div key={entry.id} className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{entry.class_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {entry.start_time} - {entry.end_time}
                    </span>
                    {entry.room_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {entry.room_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}