import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { format } from 'date-fns';
import * as messagesData from '@/data/messages';

export default function ConversationView({ conversation, userId, userName, userRole }) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');
  const bottomRef = useRef(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['thread-messages', conversation?.thread_id || conversation?.id],
    queryFn: async () => {
      const threadId = conversation.thread_id || conversation.id;
      const all = await messagesData.where({
        school_id: conversation.school_id,
        thread_id: threadId,
      }, { order: 'created_at', ascending: true });
      // If no thread messages, fall back to showing the original message
      if (all.length === 0) {
        const orig = await messagesData.where({ school_id: conversation.school_id, id: conversation.id });
        return orig;
      }
      return all;
    },
    enabled: !!conversation,
    refetchInterval: 10000, // poll every 10s
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: (data) => messagesData.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thread-messages'] });
      queryClient.invalidateQueries({ queryKey: ['user-conversations'] });
      setReply('');
    },
  });

  const handleSend = () => {
    if (!reply.trim() || !conversation) return;
    const threadId = conversation.thread_id || conversation.id;
    sendMutation.mutate({
      school_id: conversation.school_id,
      thread_id: threadId,
      sender_id: userId,
      sender_name: userName,
      sender_role: userRole,
      recipient_ids: conversation.recipient_ids?.includes(userId)
        ? [conversation.sender_id || conversation.participant_id]
        : conversation.recipient_ids,
      subject: conversation.subject.startsWith('Re: ') ? conversation.subject : `Re: ${conversation.subject}`,
      body: reply,
      is_announcement: false,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSend();
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-400">
          <Send className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm">Select a conversation to view messages</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="px-6 py-4 border-b border-slate-200 bg-white">
        <h2 className="font-semibold text-slate-900">{conversation.subject}</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {conversation.participant_name}
          {conversation.participant_role ? ` · ${conversation.participant_role}` : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map(msg => {
          const isSender = msg.sender_id === userId;
          return (
            <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-lg ${isSender ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'} rounded-2xl px-4 py-3`}>
                {!isSender && (
                  <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender_name}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                <p className={`text-xs mt-2 ${isSender ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {msg.created_at ? format(new Date(msg.created_at), 'MMM d, h:mm a') : ''}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="flex gap-3">
          <Textarea
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your reply… (Ctrl+Enter to send)"
            rows={2}
            className="flex-1 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!reply.trim() || sendMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 self-end"
          >
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-1">Ctrl+Enter to send</p>
      </div>
    </div>
  );
}