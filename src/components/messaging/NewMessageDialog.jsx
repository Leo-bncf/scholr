import Notice from '@/components/app/Notice';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Send } from 'lucide-react';
import { useMessagingPolicy } from '@/hooks/useMessagingPolicy';
import * as classesData from '@/data/classes';
import * as parentStudentLinksData from '@/data/parentStudentLinks';
import * as membershipsData from '@/data/memberships';
import * as messagesData from '@/data/messages';

export default function NewMessageDialog({ userId, userName, userRole, schoolId, onClose, trigger }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const { canSend: policyCanSend, isQuietHour, policy } = useMessagingPolicy(schoolId);
  const [form, setForm] = useState({ context: '', recipient_id: '', subject: '', body: '' });

  // Teacher: their classes; Student/Parent: enrolled classes
  const { data: teacherClasses = [] } = useQuery({
    queryKey: ['messaging-teacher-classes', schoolId, userId],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => c.teacher_ids?.includes(userId));
    },
    enabled: userRole === 'teacher' && !!schoolId && !!userId,
  });

  const { data: studentClasses = [] } = useQuery({
    queryKey: ['messaging-student-classes', schoolId, userId],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => c.student_ids?.includes(userId));
    },
    enabled: (userRole === 'student') && !!schoolId && !!userId,
  });

  const { data: parentClasses = [] } = useQuery({
    queryKey: ['messaging-parent-classes', schoolId, userId],
    queryFn: async () => {
      const links = await parentStudentLinksData.where({ parent_id: userId });
      const childIds = links.map(l => l.student_id);
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => childIds.some(id => c.student_ids?.includes(id)));
    },
    enabled: userRole === 'parent' && !!schoolId && !!userId,
  });

  const contextClasses = userRole === 'teacher' ? teacherClasses
    : userRole === 'parent' ? parentClasses
    : studentClasses;

  // Load potential recipients based on context selection
  const selectedClass = contextClasses.find(c => c.id === form.context);

  const { data: classMembers = [] } = useQuery({
    queryKey: ['messaging-members', schoolId, form.context],
    queryFn: () => membershipsData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!form.context,
  });

  // For admin/coordinator: load all staff for school-wide messaging
  const { data: allStaff = [] } = useQuery({
    queryKey: ['messaging-staff', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId, status: 'active' }),
    enabled: (userRole === 'school_admin' || userRole === 'ib_coordinator') && !!schoolId,
  });

  // Determine recipient options
  const getRecipients = () => {
    if (!form.context && (userRole === 'school_admin' || userRole === 'ib_coordinator')) {
      return allStaff.filter(m => m.user_id !== userId);
    }
    if (!selectedClass) return [];
    if (userRole === 'teacher') {
      // teachers can message students in their class
      return classMembers.filter(m => selectedClass.student_ids?.includes(m.user_id));
    }
    // students/parents can message teachers of the class
    return classMembers.filter(m => selectedClass.teacher_ids?.includes(m.user_id));
  };

  const recipients = getRecipients();

  const sendMutation = useMutation({
    mutationFn: (data) => messagesData.create(data),
    onSuccess: (newMsg) => {
      // Set thread_id to the new message's id to start a thread
      messagesData.update(newMsg.id, { thread_id: newMsg.id });
      queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
      setOpen(false);
      if (onClose) onClose();
      setForm({ context: '', recipient_id: '', subject: '', body: '' });
    },
  });

  const handleSend = () => {
    sendMutation.mutate({
      school_id: schoolId,
      sender_id: userId,
      sender_name: userName,
      sender_role: userRole,
      recipient_ids: [form.recipient_id],
      subject: form.subject,
      body: form.body,
      class_id: form.context || undefined,
      is_announcement: false,
    });
  };

  const selectedRecipient = recipients.find(m => m.user_id === form.recipient_id);
  const recipientRole = selectedRecipient?.role || '';
  const policyBlocked = form.recipient_id && recipientRole ? !policyCanSend(userRole, recipientRole) : false;
  const quietHour = isQuietHour();
  const quietBlocked = quietHour
    && (policy?.quiet_hours?.block_send_during_quiet ?? false)
    && (policy?.quiet_hours?.applies_to_roles || []).includes(userRole);
  const canSubmit = form.recipient_id && form.subject.trim() && form.body.trim() && !policyBlocked && !quietBlocked;

  const isAdminOrCoord = userRole === 'school_admin' || userRole === 'ib_coordinator';

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)} className="scholr-accent-sf hover:scholr-accent-sf">
          <Plus className="w-4 h-4 mr-2" /> New Message
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {quietHour && (policy?.quiet_hours?.applies_to_roles || []).includes(userRole) && (
              <Notice
                tone={quietBlocked ? 'crit' : 'warn'}
                title={quietBlocked ? 'Quiet hours — you cannot send now' : 'Quiet hours are on'}
              >
                {quietBlocked
                  ? `Nothing sends between ${policy.quiet_hours.start_time} and ${policy.quiet_hours.end_time}.`
                  : `It is outside the hours your school asks staff to message in (${policy.quiet_hours.start_time} – ${policy.quiet_hours.end_time}).`}
              </Notice>
            )}

            {policyBlocked && (
              <Notice tone="crit">
                Your school&apos;s messaging rules do not allow this kind of message.
              </Notice>
            )}

            {!isAdminOrCoord && contextClasses.length > 0 && (
              <div>
                <Label className="text-sm font-semibold">Select Class</Label>
                <Select value={form.context} onValueChange={v => setForm({ ...form, context: v, recipient_id: '' })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Choose a class…" />
                  </SelectTrigger>
                  <SelectContent>
                    {contextClasses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(form.context || isAdminOrCoord) && (
              <div>
                <Label className="text-sm font-semibold">Recipient</Label>
                <Select value={form.recipient_id} onValueChange={v => setForm({ ...form, recipient_id: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Choose recipient…" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipients.map(r => (
                      <SelectItem key={r.user_id} value={r.user_id}>
                        {r.user_name || r.user_email}
                        {r.role && <span className="scholr-faint ml-1">({r.role})</span>}
                      </SelectItem>
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
                placeholder="Message subject…"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Message</Label>
              <Textarea
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
                placeholder="Type your message…"
                rows={5}
                className="mt-1.5 resize-none"
              />
            </div>

            <Button
              onClick={handleSend}
              disabled={!canSubmit || sendMutation.isPending}
              className="w-full scholr-accent-sf hover:scholr-accent-sf"
            >
              {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}