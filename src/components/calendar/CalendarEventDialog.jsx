import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, MapPin, BookOpen, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

export default function CalendarEventDialog({ event, open, onOpenChange }) {
  if (!event) return null;

  const typeIcons = {
    class: BookOpen,
    assignment: ClipboardList,
    exam: ClipboardList,
    event: CalendarDays,
  };

  const Icon = typeIcons[event.type] || CalendarDays;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-emerald-700" />
            {event.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm text-slate-700">
          <Badge className="capitalize bg-emerald-50 text-emerald-700 border-0">{event.type}</Badge>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 mt-0.5 text-slate-400" />
            <div>
              <p>{format(new Date(event.start_time), 'EEE, MMM d · h:mm a')}</p>
              <p>{format(new Date(event.end_time), 'EEE, MMM d · h:mm a')}</p>
            </div>
          </div>
          {event.subjectName && (
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 mt-0.5 text-slate-400" />
              <p>{event.subjectName}</p>
            </div>
          )}
          {event.location && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
              <p>{event.location}</p>
            </div>
          )}
          {event.description && <p className="text-slate-600">{event.description}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}