import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUser } from '@/components/auth/UserContext';
import { Loader2, ArrowLeft, Calendar, FileText, Link2, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import DocumentCard from '@/components/assignment/DocumentCard';
import SubmissionHistory from '@/components/assignment/SubmissionHistory';
import TeacherAnnotationsPanel from '@/components/assignment/TeacherAnnotationsPanel';
import FileInlinePreview from '@/components/assignment/FileInlinePreview';

export default function SubmissionReview() {
  const { user, schoolId } = useUser();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const submissionId = urlParams.get('submission_id');
  const [feedback, setFeedback] = useState('');

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission-review', submissionId],
    queryFn: async () => {
      const results = await base44.entities.Submission.filter({ id: submissionId, school_id: schoolId });
      return results[0];
    },
    enabled: !!submissionId && !!schoolId,
  });

  const { data: submissionHistory = [] } = useQuery({
    queryKey: ['submission-review-history', submission?.assignment_id, submission?.student_id],
    queryFn: () => base44.entities.Submission.filter({ assignment_id: submission.assignment_id, student_id: submission.student_id }),
    enabled: !!submission?.assignment_id && !!submission?.student_id,
  });

  const { data: assignment } = useQuery({
    queryKey: ['assignment-for-submission', submission?.assignment_id],
    queryFn: async () => {
      const results = await base44.entities.Assignment.filter({ id: submission.assignment_id, school_id: schoolId });
      return results[0];
    },
    enabled: !!submission?.assignment_id && !!schoolId,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Submission.update(submissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submission-review'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-submissions'] });
    },
  });

  React.useEffect(() => {
    if (submission?.feedback) {
      setFeedback(submission.feedback);
    }
  }, [submission]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Submission not found</p>
      </div>
    );
  }

  const handleReturn = () => {
    updateMutation.mutate({
      ...submission,
      feedback,
      status: 'returned',
    });
  };

  const handleAddAnnotation = (annotation) => {
    updateMutation.mutate({
      ...submission,
      annotations: [
        ...(submission.annotations || []),
        {
          id: crypto.randomUUID(),
          ...annotation,
          created_by: user?.full_name || user?.email,
          created_at: new Date().toISOString(),
        }
      ]
    });
  };

  const statusColors = {
    submitted: 'bg-emerald-50 text-emerald-700',
    late: 'bg-amber-50 text-amber-700',
    returned: 'bg-blue-50 text-blue-700',
    graded: 'bg-violet-50 text-violet-700',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <a href={createPageUrl('AssignmentDetail') + `?assignment_id=${submission.assignment_id}`}>
            <Button variant="ghost" size="sm" className="mb-3">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignment
            </Button>
          </a>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{submission.student_name}'s Submission</h1>
              <p className="text-sm text-slate-500 mt-1">
                {assignment?.title || 'Loading...'}
              </p>
            </div>
            <Badge className={`${statusColors[submission.status] || 'bg-slate-100 text-slate-700'} border-0`}>
              {submission.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SubmissionHistory submissions={[...submissionHistory].sort((a, b) => (b.version_number || 0) - (a.version_number || 0))} currentId={submission.id} />

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Student Work
              </h2>

              {submission.content && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-2">Written Response</p>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-slate-700 whitespace-pre-wrap">{submission.content}</p>
                  </div>
                </div>
              )}

              {submission.documents && submission.documents.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-3">Documents & Attachments</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {submission.documents.map(doc => (
                      <div key={doc.id} className="space-y-3">
                        <DocumentCard
                          document={doc}
                          onOpen={(doc) => window.open(doc.url, '_blank')}
                          compact={false}
                        />
                        <FileInlinePreview document={doc} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legacy support for old submissions */}
              {submission.link_url && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-2">Link (Legacy)</p>
                  <a
                    href={submission.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-indigo-600"
                  >
                    <Link2 className="w-4 h-4" />
                    {submission.link_url}
                  </a>
                </div>
              )}
              {submission.file_urls && submission.file_urls.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-700 mb-2">Attachments (Legacy)</p>
                  <div className="space-y-2">
                    {submission.file_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">File {i + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!submission.content && 
               (!submission.documents || submission.documents.length === 0) && 
               !submission.link_url && 
               (!submission.file_urls || submission.file_urls.length === 0) && (
                <p className="text-slate-400 text-center py-8">No work submitted yet</p>
              )}
            </div>

            <TeacherAnnotationsPanel annotations={submission.annotations || []} onAddAnnotation={handleAddAnnotation} />

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Teacher Feedback
              </h2>
              <Textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="Add feedback for the student..."
                rows={6}
                className="mb-4"
              />
              <Button
                onClick={handleReturn}
                disabled={updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Save & Return to Student
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Submission Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Student</p>
                  <p className="font-medium text-slate-900">{submission.student_name}</p>
                </div>
                <div>
                  <p className="text-slate-500">Submitted</p>
                  <p className="font-medium text-slate-900">
                    {submission.submitted_at 
                      ? format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')
                      : 'Not submitted'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Version</p>
                  <p className="font-medium text-slate-900">{submission.version_number || 1}</p>
                </div>
                <div>
                  <p className="text-slate-500">File Type</p>
                  <p className="font-medium text-slate-900">{submission.file_type || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Status</p>
                  <Badge className={`${statusColors[submission.status]} border-0 mt-1`}>
                    {submission.status}
                  </Badge>
                </div>
                {submission.graded_at && (
                  <div>
                    <p className="text-slate-500">Graded</p>
                    <p className="font-medium text-slate-900">
                      {format(new Date(submission.graded_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                {submission.score !== undefined && submission.score !== null && (
                  <div>
                    <p className="text-slate-500">Score</p>
                    <p className="font-medium text-slate-900">{submission.score} points</p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">Annotations</p>
                  <p className="font-medium text-slate-900">{submission.annotations?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}