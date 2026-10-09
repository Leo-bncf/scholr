import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { useUser } from '@/components/auth/UserContext';
import { format } from 'date-fns';
import * as messagesData from '@/data/messages';

export default function ClassStream({ classData, isTeacher, userId }) {
  const queryClient = useQueryClient();
  const { user } = useUser();
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
      // Without this every post showed as "Unknown".
      sender_name: user?.full_name || null,
      subject: 'Class Announcement',
      body: newPost,
      is_announcement: true,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      {isTeacher && (
        <div className="app-group" style={{ padding: '.75rem .9rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
          <label htmlFor={`stream-${classData.id}`} className="sr-only">Announcement to the class</label>
          <textarea
            id={`stream-${classData.id}`}
            className="app-input scholr-focus"
            placeholder="Post an announcement to the class — students see it on their class page."
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            rows={3}
            style={{ resize: 'vertical', lineHeight: 1.5 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="pub-btn pub-btn-primary scholr-focus"
              onClick={handlePost}
              disabled={!newPost.trim() || postMutation.isPending}
            >
              {postMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Post
            </button>
          </div>
          {postMutation.error && <p role="alert" style={{ margin: 0, fontSize: '.8rem', color: 'var(--crit)' }}>That didn't post: {postMutation.error.message}</p>}
        </div>
      )}

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-lg) 0' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
        </div>
      ) : (
        <div className="app-group">
          {messages.length === 0 ? (
            <p style={{ margin: 0, padding: 'var(--space-md) .9rem', fontSize: '.88rem', color: 'var(--faint)' }}>
              No announcements yet.
            </p>
          ) : messages.map(msg => (
            <article key={msg.id} style={{ padding: '.8rem .9rem' }}>
              <p style={{ margin: 0, fontSize: '.8rem', color: 'var(--muted)' }}>
                <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{msg.sender_name || 'Teacher'}</span>
                {msg.created_at ? ` · ${format(new Date(msg.created_at), 'd MMM, HH:mm')}` : ''}
              </p>
              <p style={{ margin: '.3rem 0 0', fontSize: '.92rem', color: 'var(--ink)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{msg.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
