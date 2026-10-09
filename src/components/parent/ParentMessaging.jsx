
import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  Send,
  MessageSquare,
  Star,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import * as classesData from '@/data/classes';
import * as membershipsData from '@/data/memberships';
import * as messagesData from '@/data/messages';

/*
 * Removes "Re:" from subjects so:
 *
 * Homework
 * Re: Homework
 * RE: Homework
 *
 * are treated as the same conversation.
 */
function normalizeSubject(subject = '') {
  return subject
    .replace(/^(re:\s*)+/i, '')
    .trim()
    .toLowerCase();
}

/*
 * Work out who the teacher is for a message.
 */
function getOtherParticipantId(message, parentId) {
  if (message.sender_id === parentId) {
    return (
      message.recipient_ids?.find(id => id !== parentId) ||
      message.recipient_ids?.[0] ||
      ''
    );
  }

  return message.sender_id || '';
}

/*
 * Group messages using:
 *
 * teacher + subject
 *
 * This does NOT require any database changes.
 */
function getConversationKey(message, parentId) {
  const teacherId = getOtherParticipantId(message, parentId);
  const subject = normalizeSubject(message.subject);

  return `${teacherId}:${subject}`;
}

/*
 * Supports several possible unread formats.
 *
 * If your message system already uses one of these,
 * the star will work automatically.
 */
function isMessageUnread(message, parentId) {
  // Parent's own messages are not unread.
  if (message.sender_id === parentId) {
    return false;
  }

  if (Array.isArray(message.read_by)) {
    return !message.read_by.includes(parentId);
  }

  if (Array.isArray(message.unread_by)) {
    return message.unread_by.includes(parentId);
  }

  if (typeof message.is_read === 'boolean') {
    return !message.is_read;
  }

  if ('read_at' in message) {
    return !message.read_at;
  }

  return false;
}

export default function ParentMessaging({
  parentId,
  parentName,
  schoolId,
  studentId,
}) {
  const queryClient = useQueryClient();

  const [showNewMessage, setShowNewMessage] = useState(false);
  const [activeConversationKey, setActiveConversationKey] = useState(null);

  const [form, setForm] = useState({
    teacher_id: '',
    subject: '',
    body: '',
  });

  const [replyBody, setReplyBody] = useState('');

  /*
   * Get the student's active classes.
   */
  const { data: studentClasses = [] } = useQuery({
    queryKey: ['parent-student-classes', schoolId, studentId],

    queryFn: async () => {
      const all = await classesData.where({
        school_id: schoolId,
        status: 'active',
      });

      return all.filter(classItem =>
        classItem.student_ids?.includes(studentId)
      );
    },

    enabled: !!schoolId && !!studentId,
  });

  /*
   * Get teachers attached to those classes.
   */
  const { data: teachers = [] } = useQuery({
    queryKey: ['parent-available-teachers', schoolId, studentId],

    queryFn: async () => {
      const allTeacherIds = new Set();

      studentClasses.forEach(classItem => {
        classItem.teacher_ids?.forEach(teacherId => {
          allTeacherIds.add(teacherId);
        });
      });

      const members = await membershipsData.where({
        school_id: schoolId,
        status: 'active',
      });

      return members.filter(member =>
        allTeacherIds.has(member.user_id)
      );
    },

    enabled: studentClasses.length > 0,
  });

  /*
   * This query is intentionally kept very close to your
   * original working version.
   */
  const {
    data: messages = [],
    isLoading,
  } = useQuery({
    queryKey: ['parent-messages', schoolId, parentId],

    queryFn: async () => {
      const all = await messagesData.where(
        {
          school_id: schoolId,
          is_announcement: false,
        },
        {
          order: 'created_at',
          ascending: false,
        }
      );

      return all.filter(
        message =>
          message.sender_id === parentId ||
          message.recipient_ids?.includes(parentId)
      );
    },

    enabled: !!schoolId && !!parentId,
  });

  /*
   * Group individual messages into conversations.
   *
   * No changes to the database are needed.
   */
  const conversations = useMemo(() => {
    const conversationMap = new Map();

    messages.forEach(message => {
      const key = getConversationKey(message, parentId);

      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          key,
          messages: [],
        });
      }

      conversationMap.get(key).messages.push(message);
    });

    return Array.from(conversationMap.values())
      .map(conversation => {
        /*
         * Messages inside a conversation are shown
         * oldest -> newest.
         */
        const sortedMessages = [...conversation.messages].sort(
          (a, b) =>
            new Date(a.created_at || 0).getTime() -
            new Date(b.created_at || 0).getTime()
        );

        const firstMessage = sortedMessages[0];
        const latestMessage =
          sortedMessages[sortedMessages.length - 1];

        const teacherId =
          getOtherParticipantId(firstMessage, parentId) ||
          getOtherParticipantId(latestMessage, parentId);

        const teacher = teachers.find(
          item => item.user_id === teacherId
        );

        /*
         * Try to get the teacher's name from memberships first.
         * If that isn't available, use the incoming sender name.
         */
        let teacherName =
          teacher?.user_name ||
          teacher?.user_email ||
          '';

        if (!teacherName) {
          const incomingMessage = sortedMessages.find(
            message => message.sender_id !== parentId
          );

          teacherName =
            incomingMessage?.sender_name ||
            'Teacher';
        }

        const hasUnread = sortedMessages.some(message =>
          isMessageUnread(message, parentId)
        );

        return {
          ...conversation,
          messages: sortedMessages,
          firstMessage,
          latestMessage,
          teacherId,
          teacherName,
          subject:
            firstMessage.subject ||
            latestMessage.subject ||
            'Message',
          hasUnread,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.latestMessage?.created_at || 0).getTime() -
          new Date(a.latestMessage?.created_at || 0).getTime()
      );
  }, [messages, parentId, teachers]);

  const activeConversation = conversations.find(
    conversation =>
      conversation.key === activeConversationKey
  );

  /*
   * New message mutation.
   *
   * This uses the SAME fields as your original working file.
   */
  const sendMutation = useMutation({
    mutationFn: data => messagesData.create(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['parent-messages'],
      });

      setShowNewMessage(false);

      setForm({
        teacher_id: '',
        subject: '',
        body: '',
      });
    },
  });

  /*
   * Reply mutation.
   *
   * Again, this only sends fields your original component
   * already used.
   */
  const replyMutation = useMutation({
    mutationFn: data => messagesData.create(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['parent-messages'],
      });

      setReplyBody('');
    },
  });

  /*
   * Send a new conversation.
   *
   * This payload matches your original working version.
   */
  const handleSend = () => {
    if (
      !form.teacher_id ||
      !form.subject.trim() ||
      !form.body.trim()
    ) {
      return;
    }

    sendMutation.mutate({
      school_id: schoolId,
      sender_id: parentId,
      sender_name: parentName,
      sender_role: 'parent',
      recipient_ids: [form.teacher_id],
      subject: form.subject.trim(),
      body: form.body.trim(),
      is_announcement: false,
    });
  };

  /*
   * Reply to the currently open conversation.
   *
   * Keeping the same subject means the reply gets grouped
   * back into the same conversation.
   */
  const handleReply = () => {
    if (
      !activeConversation ||
      !activeConversation.teacherId ||
      !replyBody.trim()
    ) {
      return;
    }

    replyMutation.mutate({
      school_id: schoolId,
      sender_id: parentId,
      sender_name: parentName,
      sender_role: 'parent',
      recipient_ids: [activeConversation.teacherId],
      subject: activeConversation.subject,
      body: replyBody.trim(),
      is_announcement: false,
    });
  };

  /*
   * OPEN CONVERSATION
   */
  if (activeConversation) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 border-b scholr-rule pb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setActiveConversationKey(null);
              setReplyBody('');
            }}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-semibold scholr-ink">
                {activeConversation.subject}
              </h4>

              {activeConversation.hasUnread && (
                <Star
                  className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
                  aria-label="Unread message"
                />
              )}
            </div>

            <p className="mt-0.5 truncate text-xs scholr-muted">
              Conversation with {activeConversation.teacherName}
            </p>
          </div>
        </div>

        {/* Conversation messages */}
        <div className="space-y-3">
          {activeConversation.messages.map(message => {
            const isParent =
              message.sender_id === parentId;

            const unread = isMessageUnread(
              message,
              parentId
            );

            return (
              <div
                key={message.id}
                className={`flex ${
                  isParent
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`
                    max-w-[88%]
                    rounded-2xl
                    px-4 py-3
                    ${
                      isParent
                        ? 'scholr-accent-sf rounded-br-md'
                        : 'scholr-sunk border scholr-rule rounded-bl-md'
                    }
                  `}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <p
                      className={`text-xs font-semibold ${
                        isParent
                          ? 'text-white/80'
                          : 'scholr-muted'
                      }`}
                    >
                      {isParent
                        ? 'You'
                        : message.sender_name ||
                          activeConversation.teacherName}
                    </p>

                    {unread && (
                      <Star
                        className="h-3 w-3 fill-amber-400 text-amber-400"
                        aria-label="Unread"
                      />
                    )}
                  </div>

                  <p
                    className={`whitespace-pre-wrap text-sm leading-6 ${
                      isParent
                        ? 'text-white'
                        : 'scholr-body'
                    }`}
                  >
                    {message.body}
                  </p>

                  {message.created_at && (
                    <p
                      className={`mt-2 text-[11px] ${
                        isParent
                          ? 'text-white/60'
                          : 'scholr-faint'
                      }`}
                    >
                      {format(
                        new Date(message.created_at),
                        'MMM d, h:mm a'
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply */}
        <div className="border-t scholr-rule pt-4">
          <Label className="text-sm font-semibold">
            Reply
          </Label>

          <Textarea
            value={replyBody}
            onChange={event =>
              setReplyBody(event.target.value)
            }
            placeholder={`Reply to ${activeConversation.teacherName}...`}
            rows={3}
            className="mt-2 resize-none"
          />

          <Button
            onClick={handleReply}
            disabled={
              !replyBody.trim() ||
              !activeConversation.teacherId ||
              replyMutation.isPending
            }
            className="mt-3 w-full scholr-accent-sf hover:scholr-accent-sf"
          >
            {replyMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}

            Send Reply
          </Button>
        </div>
      </div>
    );
  }

  /*
   * CONVERSATION LIST
   */
  return (
    <div className="space-y-5">
      {/* New message */}
      {!showNewMessage ? (
        <Button
          onClick={() => setShowNewMessage(true)}
          className="w-full scholr-accent-sf hover:scholr-accent-sf"
        >
          <Plus className="mr-2 h-4 w-4" />
          Message a Teacher
        </Button>
      ) : (
        <div className="app-group space-y-4 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold scholr-ink">
                New Message
              </h4>

              <p className="mt-0.5 text-xs scholr-muted">
                Start a conversation with a teacher.
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setShowNewMessage(false)
              }
            >
              Cancel
            </Button>
          </div>

          {/* Teacher */}
          <div>
            <Label className="text-sm font-semibold">
              Select Teacher
            </Label>

            <Select
              value={form.teacher_id}
              onValueChange={value =>
                setForm(previous => ({
                  ...previous,
                  teacher_id: value,
                }))
              }
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Choose a teacher..." />
              </SelectTrigger>

              <SelectContent>
                {teachers.map(teacher => (
                  <SelectItem
                    key={teacher.user_id}
                    value={teacher.user_id}
                  >
                    {teacher.user_name ||
                      teacher.user_email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject */}
          <div>
            <Label className="text-sm font-semibold">
              Subject
            </Label>

            <Input
              value={form.subject}
              onChange={event =>
                setForm(previous => ({
                  ...previous,
                  subject: event.target.value,
                }))
              }
              placeholder="Message subject..."
              className="mt-1.5"
            />
          </div>

          {/* Message */}
          <div>
            <Label className="text-sm font-semibold">
              Message
            </Label>

            <Textarea
              value={form.body}
              onChange={event =>
                setForm(previous => ({
                  ...previous,
                  body: event.target.value,
                }))
              }
              placeholder="Type your message..."
              rows={4}
              className="mt-1.5 resize-none"
            />
          </div>

          {/* Send */}
          <Button
            onClick={handleSend}
            disabled={
              !form.teacher_id ||
              !form.subject.trim() ||
              !form.body.trim() ||
              sendMutation.isPending
            }
            className="w-full scholr-accent-sf hover:scholr-accent-sf"
          >
            {sendMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}

            Send Message
          </Button>
        </div>
      )}

      {/* Message history */}
      <div>
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold scholr-ink">
              Messages
            </h4>

            <p className="mt-0.5 text-xs scholr-muted">
              Select a conversation to view all replies.
            </p>
          </div>

          {conversations.some(
            conversation => conversation.hasUnread
          ) && (
            <div className="flex shrink-0 items-center gap-1.5 text-xs scholr-muted">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              Unread
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin scholr-accent" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-10 text-center scholr-faint">
            <MessageSquare className="mx-auto mb-3 h-10 w-10 scholr-faint" />

            <p className="text-sm font-medium scholr-muted">
              No messages yet
            </p>

            <p className="mt-1 text-xs scholr-faint">
              Start a conversation with one of your
              child&apos;s teachers.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map(conversation => (
              <button
                key={conversation.key}
                type="button"
                onClick={() =>
                  setActiveConversationKey(
                    conversation.key
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  scholr-rule
                  scholr-sunk
                  p-3.5
                  text-left
                  transition
                  hover:-translate-y-px
                  hover:shadow-sm
                "
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border scholr-rule bg-background">
                    <MessageSquare className="h-4 w-4 scholr-muted" />
                  </div>

                  {/* Conversation info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <p
                          className={`truncate text-sm scholr-ink ${
                            conversation.hasUnread
                              ? 'font-bold'
                              : 'font-semibold'
                          }`}
                        >
                          {conversation.subject}
                        </p>

                        {conversation.hasUnread && (
                          <Star
                            className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
                            aria-label="Unread message"
                          />
                        )}
                      </div>

                      <span className="shrink-0 text-xs scholr-muted">
                        {conversation.latestMessage
                          ?.created_at
                          ? format(
                              new Date(
                                conversation.latestMessage.created_at
                              ),
                              'MMM d'
                            )
                          : ''}
                      </span>
                    </div>

                    <p className="mt-0.5 truncate text-xs scholr-muted">
                      {conversation.teacherName}
                    </p>

                    <p
                      className={`mt-2 line-clamp-1 text-sm ${
                        conversation.hasUnread
                          ? 'font-medium scholr-ink'
                          : 'scholr-body'
                      }`}
                    >
                      {conversation.latestMessage
                        ?.sender_id === parentId
                        ? 'You: '
                        : ''}

                      {conversation.latestMessage?.body}
                    </p>

                    {conversation.messages.length > 1 && (
                      <p className="mt-1.5 text-[11px] scholr-faint">
                        {conversation.messages.length}{' '}
                        messages in this conversation
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
