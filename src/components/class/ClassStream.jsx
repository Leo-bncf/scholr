import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import * as messagesData from '@/data/messages';

export default function ClassStream({ classData, isTeacher, userId }) {
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState('');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['class-stream', classData.id],
    queryFn: () => messagesData.where({ 
      school_id: classData.school_id, 
      class_id: classData.id 
    }, { order: 'created_at', ascending: false }),
  });

  const postMutation = useMutation({
    mutationFn: (data) => messagesData.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-stream'] });
      setNewPost('');
    },
  });

  const handlePost = () => {
    if (!newPost.trim()) return;
    postMutation.mutate({
      school_id: classData.school_id,
      class_id: classData.id,
      sender_id: userId,
      subject: 'Class Announcement',
      body: newPost,
      is_announcement: true,
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {isTeacher && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Textarea
            placeholder="Share an announcement with your class..."
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            rows={3}
            className="mb-3"
          />
          <div className="flex justify-end">
            <Button 
              onClick={handlePost} 
              disabled={!newPost.trim() || postMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {postMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Post
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" /></div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold flex-shrink-0">
                  {msg.sender_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-slate-900">{msg.sender_name || 'Unknown'}</span>
                    <span className="text-xs text-slate-400">{msg.created_at ? format(new Date(msg.created_at), 'MMM d, h:mm a') : ''}</span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{msg.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}