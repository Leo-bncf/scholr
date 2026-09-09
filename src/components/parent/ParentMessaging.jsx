import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import * as classesData from '@/data/classes';
import * as membershipsData from '@/data/memberships';
import * as messagesData from '@/data/messages';

export default function ParentMessaging({ parentId, parentName, schoolId, studentId }) {
  const queryClient = useQueryClient();
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [form, setForm] = useState({
    teacher_id: '',
    subject: '',
    body: '',
  });

  const { data: studentClasses = [] } = useQuery({
    queryKey: ['parent-student-classes', schoolId, studentId],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => c.student_ids?.includes(studentId));
    },
    enabled: !!schoolId && !!studentId,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['parent-available-teachers', schoolId, studentId],
    queryFn: async () => {
      const allTeacherIds = new Set();
      studentClasses.forEach(c => c.teacher_ids?.forEach(tid => allTeacherIds.add(tid)));
      
      const members = await membershipsData.where({
        school_id: schoolId,
        status: 'active'
      });
      
      return members.filter(m => allTeacherIds.has(m.user_id));
    },
    enabled: studentClasses.length > 0,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['parent-messages', schoolId, parentId],
    queryFn: async () => {
      const all = await messagesData.where({
        school_id: schoolId,
        is_announcement: false
      }, { order: 'created_at', ascending: false });
      
      return all.filter(m => m.sender_id === parentId || m.recipient_ids?.includes(parentId));
    },
    enabled: !!schoolId && !!parentId,
  });

  const sendMutation = useMutation({
    mutationFn: (data) => messagesData.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-messages'] });
      setShowNewMessage(false);
      setForm({ teacher_id: '', subject: '', body: '' });
    },
  });

  const handleSend = () => {
    sendMutation.mutate({
      school_id: schoolId,
      sender_id: parentId,
      sender_name: parentName,
      sender_role: 'parent',
      recipient_ids: [form.teacher_id],
      subject: form.subject,
      body: form.body,
      is_announcement: false,
    });
  };

  return (
    <div className="space-y-4">
      {!showNewMessage ? (
        <Button onClick={() => setShowNewMessage(true)} className="w-full bg-indigo-600 hover:bg-indigo-700">
          <Send className="w-4 h-4 mr-2" /> Message a Teacher
        </Button>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-slate-900">New Message</h4>
            <Button variant="ghost" size="sm" onClick={() => setShowNewMessage(false)}>Cancel</Button>
          </div>
          
          <div>
            <Label className="text-sm font-semibold">Select Teacher</Label>
            <Select value={form.teacher_id} onValueChange={v => setForm({ ...form, teacher_id: v })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Choose a teacher..." />
              </SelectTrigger>
              <SelectContent>
                {teachers.map(t => (
                  <SelectItem key={t.user_id} value={t.user_id}>
                    {t.user_name || t.user_email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold">Subject</Label>
            <Input
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              placeholder="Message subject..."
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">Message</Label>
            <Textarea
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              placeholder="Type your message..."
              rows={4}
              className="mt-1.5"
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={!form.teacher_id || !form.subject || !form.body || sendMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Send Message
          </Button>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-slate-900 mb-3">Message History</h4>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map(msg => (
              <div key={msg.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-medium text-slate-900 text-sm">{msg.subject}</p>
                  <span className="text-xs text-slate-500">
                    {msg.created_at ? format(new Date(msg.created_at), 'MMM d') : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-2">{msg.sender_name}</p>
                <p className="text-sm text-slate-700 line-clamp-2">{msg.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}