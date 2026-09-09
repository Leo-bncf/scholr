import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Megaphone, Loader2 } from 'lucide-react';
import { useMessagingPolicy } from '@/hooks/useMessagingPolicy';
import * as classesData from '@/data/classes';
import * as messagesData from '@/data/messages';

export default function AnnouncementComposer({ userId, userName, userRole, schoolId }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { canBroadcast } = useMessagingPolicy(schoolId);
  const [form, setForm] = useState({ scope: 'class', class_id: '', subject: '', body: '', is_pinned: false });

  const canSchoolWide = canBroadcast(userRole, 'school_wide');
  const canClassAnnouncement = canBroadcast(userRole, 'class');

  const { data: classes = [] } = useQuery({
    queryKey: ['announcement-composer-classes', schoolId, userId],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      if (userRole === 'teacher' || userRole === 'ib_coordinator') {
        return all.filter(c => c.teacher_ids?.includes(userId));
      }
      return all; // admins see all classes
    },
    enabled: !!schoolId && !!userId,
  });

  const sendMutation = useMutation({
    mutationFn: (data) => messagesData.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      queryClient.invalidateQueries({ queryKey: ['student-announcements'] });
      setOpen(false);
      setForm({ scope: 'class', class_id: '', subject: '', body: '', is_pinned: false });
    },
  });

  const selectedClass = classes.find(c => c.id === form.class_id);

  const handleSend = () => {
    const isSchoolWide = form.scope === 'school_wide';
    const recipientIds = isSchoolWide
      ? [] // school-wide targets everyone
      : selectedClass?.student_ids || [];

    sendMutation.mutate({
      school_id: schoolId,
      sender_id: userId,
      sender_name: userName,
      sender_role: userRole,
      recipient_ids: recipientIds,
      subject: form.subject,
      body: form.body,
      class_id: isSchoolWide ? undefined : form.class_id,
      class_name: isSchoolWide ? undefined : selectedClass?.name,
      is_announcement: true,
      is_school_wide: isSchoolWide,
      is_pinned: form.is_pinned,
    });
  };

  const canSubmit = form.subject.trim() && form.body.trim()
    && (form.scope === 'school_wide' || form.class_id);

  if (!canClassAnnouncement && !canSchoolWide) return null;

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
        <Megaphone className="w-4 h-4 mr-2" /> New Announcement
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Post Announcement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Scope selector */}
            <div>
              <Label className="text-sm font-semibold">Announcement Type</Label>
              <div className="flex gap-2 mt-1.5">
                {canClassAnnouncement && (
                  <button
                    onClick={() => setForm({ ...form, scope: 'class', class_id: '' })}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${form.scope === 'class' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Class Announcement
                  </button>
                )}
                {canSchoolWide && (
                  <button
                    onClick={() => setForm({ ...form, scope: 'school_wide', class_id: '' })}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${form.scope === 'school_wide' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    School-wide
                  </button>
                )}
              </div>
            </div>

            {form.scope === 'class' && (
              <div>
                <Label className="text-sm font-semibold">Class</Label>
                <Select value={form.class_id} onValueChange={v => setForm({ ...form, class_id: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Choose a class…" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-sm font-semibold">Subject</Label>
              <Input
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                placeholder="Announcement subject…"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Message</Label>
              <Textarea
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
                placeholder="Write your announcement…"
                rows={5}
                className="mt-1.5 resize-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_pinned}
                onCheckedChange={v => setForm({ ...form, is_pinned: v })}
              />
              <Label className="text-sm font-medium cursor-pointer">Pin this announcement</Label>
            </div>

            <Button
              onClick={handleSend}
              disabled={!canSubmit || sendMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Megaphone className="w-4 h-4 mr-2" />}
              Post Announcement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}