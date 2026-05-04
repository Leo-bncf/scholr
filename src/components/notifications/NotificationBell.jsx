import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import NotificationList from './NotificationList';

export default function NotificationBell({ userId, schoolId }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['user-notifications', userId, schoolId],
    queryFn: () => base44.entities.Notification.filter({ user_id: userId, school_id: schoolId }, '-timestamp', 30),
    enabled: !!userId && !!schoolId,
    initialData: [],
  });

  useEffect(() => {
    if (!userId || !schoolId) return;
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data?.user_id === userId && event.data?.school_id === schoolId) {
        queryClient.invalidateQueries({ queryKey: ['user-notifications', userId, schoolId] });
      }
    });
    return unsubscribe;
  }, [userId, schoolId, queryClient]);

  const toggleMutation = useMutation({
    mutationFn: (notification) => base44.entities.Notification.update(notification.id, { read_status: !notification.read_status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-notifications', userId, schoolId] }),
  });

  const groupedNotifications = useMemo(() => {
    const groups = new Map();
    notifications.forEach((item) => {
      const key = item.group_key || item.id;
      if (!groups.has(key)) {
        groups.set(key, { ...item, items: [item] });
      } else {
        const current = groups.get(key);
        current.items.push(item);
        current.group_count = current.items.length;
        current.read_status = current.items.every((entry) => entry.read_status);
        current.message = current.items.length > 1 ? item.message : current.message;
        if (new Date(item.timestamp) > new Date(current.timestamp)) current.timestamp = item.timestamp;
      }
    });
    return Array.from(groups.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [notifications]);

  const unreadCount = notifications.filter((item) => !item.read_status).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 bg-red-600 text-white border-0 px-1.5 py-0 text-xs min-w-[18px] h-[18px] flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Notifications</h3>
        </div>
        <NotificationList notifications={groupedNotifications} onToggleRead={(notification) => toggleMutation.mutate(notification)} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}