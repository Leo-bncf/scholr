import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bell, BookOpen, ClipboardCheck, BarChart3, CalendarX } from 'lucide-react';
import { Button } from '@/components/ui/button';

const iconMap = {
  assignment_created: ClipboardCheck,
  assignment_due_soon: ClipboardCheck,
  assignment_missing: ClipboardCheck,
  grade_published: BarChart3,
  attendance_issue: CalendarX,
};

const linkMap = {
  assignment_created: '/StudentAcademicDashboard',
  assignment_due_soon: '/StudentAcademicDashboard',
  assignment_missing: '/StudentAcademicDashboard',
  grade_published: '/StudentAcademicDashboard',
  attendance_issue: '/StudentAttendance',
};

export default function NotificationList({ notifications, onToggleRead, onClose }) {
  if (!notifications.length) {
    return (
      <div className="p-8 text-center text-slate-400">
        <Bell className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
      {notifications.map((notification) => {
        const Icon = iconMap[notification.type] || BookOpen;
        return (
          <div key={notification.id} className={`px-4 py-3 ${notification.read_status ? 'bg-white' : 'bg-emerald-50/40'}`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5"><Icon className="w-4 h-4 text-emerald-700" /></div>
              <div className="flex-1 min-w-0">
                <a href={linkMap[notification.type] || '#'} onClick={onClose} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${notification.read_status ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                      {notification.message}
                    </p>
                    {!notification.read_status && <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {notification.timestamp ? formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true }) : ''}
                  </p>
                </a>
                <div className="mt-2">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onToggleRead(notification)}>
                    Mark as {notification.read_status ? 'unread' : 'read'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}