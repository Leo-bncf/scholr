import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageCircle, Send, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { useGradebookPolicy } from '@/hooks/useGradebookPolicy';
import * as messagesData from '@/data/messages';

/**
 * AssignmentComments — thread of teacher/student feedback on an assignment or submission.
 * visibility is controlled by gradebook feedback_only_mode and grade_release_mode.
 * Teachers can set a comment as visible to student or private.
 */
export default function AssignmentComments({ assignment, submissionId, userId, userName, userRole, schoolId }) {
  const queryClient = useQueryClient();
  const { policy } = useGradebookPolicy(schoolId);
  const [body, setBody] = useState('');
  const [visibleToStudent, setVisibleToStudent] = useState(true);

  const isTeacher = userRole === 'teacher' || userRole === 'school_admin' || userRole === 'ib_coordinator';

  const queryKey = ['assignment-comments', assignment.id, submissionId || 'all'];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const all = await messagesData.where({
        school_id: schoolId,
        assignment_id: assignment.id,
        is_announcement: false,
        is_comment: true,
        ...(submissionId ? { submission_id: submissionId } : {}),
      }, { order: 'created_at', ascending: true });

      // Students only see comments marked visible
      if (!isTeacher) {
        return all.filter(c => c.visible_to_student !== false);
      }
      return all;
    },
    enabled: !!assignment?.id && !!schoolId,
  });

  const postMutation = useMutation({
    mutationFn: (data) => messagesData.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setBody('');
    },
  });

  const handlePost = () => {
    if (!body.trim()) return;
    postMutation.mutate({
      school_id: schoolId,
      assignment_id: assignment.id,
      ...(submissionId ? { submission_id: submissionId } : {}),
      sender_id: userId,
      sender_name: userName,
      sender_role: userRole,
      subject: `Comment on ${assignment.title}`,
      body: body.trim(),
      is_announcement: false,
      is_comment: true,
      visible_to_student: isTeacher ? visibleToStudent : true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-slate-600" />
        <h3 className="font-semibold text-slate-900">Comments & Feedback</h3>
        {comments.length > 0 && <Badge variant="secondary">{comments.length}</Badge>}
      </div>

      {isLoading ? (
        <div className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto" /></div>
      ) : comments.length === 0 ? (
        <p className="text-slate-400 text-sm py-4 text-center">No comments yet</p>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => {
            const isOwn = comment.sender_id === userId;
            const isTeacherComment = ['teacher', 'school_admin', 'ib_coordinator'].includes(comment.sender_role);
            return (
              <div key={comment.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                  isTeacherComment ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {comment.sender_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className={`flex-1 max-w-lg ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`rounded-xl px-4 py-3 text-sm ${
                    isOwn
                      ? 'bg-indigo-600 text-white'
                      : isTeacherComment
                        ? 'bg-indigo-50 border border-indigo-100 text-slate-800'
                        : 'bg-slate-50 border border-slate-200 text-slate-800'
                  }`}>
                    <p className="whitespace-pre-wrap">{comment.body}</p>
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-xs text-slate-400">
                      {comment.sender_name || 'Unknown'}
                      {isTeacherComment && !isOwn && <span className="ml-1 text-indigo-500 font-medium">· Teacher</span>}
                    </span>
                    <span className="text-xs text-slate-300">
                      {comment.created_at ? format(new Date(comment.created_at), 'MMM d, h:mm a') : ''}
                    </span>
                    {isTeacher && comment.visible_to_student === false && (
                      <span className="text-xs text-amber-600 flex items-center gap-0.5">
                        <EyeOff className="w-3 h-3" /> Private
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Compose */}
      <div className="border-t pt-4 space-y-2">
        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={isTeacher ? 'Add feedback or a comment...' : 'Add a comment...'}
          rows={3}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handlePost();
          }}
        />
        <div className="flex items-center justify-between">
          {isTeacher && (
            <button
              onClick={() => setVisibleToStudent(v => !v)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors ${
                visibleToStudent
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              {visibleToStudent ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {visibleToStudent ? 'Visible to student' : 'Private (teacher only)'}
            </button>
          )}
          {!isTeacher && <span />}
          <Button
            onClick={handlePost}
            disabled={!body.trim() || postMutation.isPending}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {postMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}