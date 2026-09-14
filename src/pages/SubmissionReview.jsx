import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import { Loader2, ArrowLeft, FileText, Link2, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import DocumentCard from '@/components/assignment/DocumentCard';
import SubmissionHistory from '@/components/assignment/SubmissionHistory';
import TeacherAnnotationsPanel from '@/components/assignment/TeacherAnnotationsPanel';
import FileInlinePreview from '@/components/assignment/FileInlinePreview';
import * as submissionsData from '@/data/submissions';
import * as assignmentsData from '@/data/assignments';

export default function SubmissionReview() {
  const { user, schoolId } = useUser();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const submissionId = urlParams.get('submission_id');
  const [feedback, setFeedback] = useState('');

  const { data: submission, isLoading } = useQuery({
    queryKey: ['submission-review', submissionId],
    queryFn: async () => {
      const results = await submissionsData.where({ id: submissionId, school_id: schoolId });
      return results[0];
    },
    enabled: !!submissionId && !!schoolId,
  });

  const { data: submissionHistory = [] } = useQuery({
    queryKey: ['submission-review-history', submission?.assignment_id, submission?.student_id],
    queryFn: () => submissionsData.where({ assignment_id: submission.assignment_id, student_id: submission.student_id }),
    enabled: !!submission?.assignment_id && !!submission?.student_id,
  });

  const { data: assignment } = useQuery({
    queryKey: ['assignment-for-submission', submission?.assignment_id],
    queryFn: async () => {
      const results = await assignmentsData.where({ id: submission.assignment_id, school_id: schoolId });
      return results[0];
    },
    enabled: !!submission?.assignment_id && !!schoolId,
  });

  // Each caller says what it is doing rather than handing over a patch.
  // submissions.js exports no update(), so the old form threw on every use;
  // it also spread the whole row back as the patch, id and timestamps
  // included.
  const updateMutation = useMutation({
    mutationFn: (apply) => apply(submissionId),
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
      <div className="min-h-screen scholr-sunk flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin scholr-accent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen scholr-sunk flex items-center justify-center">
        <p className="scholr-muted">Submission not found</p>
      </div>
    );
  }

  const handleReturn = () => {
    updateMutation.mutate((id) => submissionsData.returnForRevision(id, { feedback }));
  };

  const handleAddAnnotation = (annotation) => {
    const next = [
      ...(submission.annotations || []),
      {
        id: crypto.randomUUID(),
        ...annotation,
        created_by: user?.full_name || user?.email,
        created_at: new Date().toISOString(),
      },
    ];
    updateMutation.mutate((id) => submissionsData.setAnnotations(id, next));
  };

  const statusColors = {
    submitted: 'bg-emerald-50 text-emerald-700',
    late: 'bg-amber-50 text-amber-700',
    returned: 'bg-blue-50 text-blue-700',
    graded: 'scholr-accent-sf scholr-accent',
  };

  return (
    <div className="min-h-screen scholr-sunk">
      <div className="bg-white border-b scholr-rule">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <a href={createPageUrl('AssignmentDetail') + `?assignment_id=${submission.assignment_id}`}>
            <Button variant="ghost" size="sm" className="mb-3">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignment
            </Button>
          </a>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold scholr-ink">{submission.student_name}'s Submission</h1>
              <p className="text-sm scholr-muted mt-1">
                {assignment?.title || 'Loading...'}
              </p>
            </div>
            <Badge className={`${statusColors[submission.status] || 'scholr-sunk scholr-body'} border-0`}>
              {submission.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SubmissionHistory submissions={[...submissionHistory].sort((a, b) => (b.version_number || 0) - (a.version_number || 0))} currentId={submission.id} />

            <div className="bg-white rounded-xl border scholr-rule p-6">
              <h2 className="font-semibold scholr-ink mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Student Work
              </h2>

              {submission.content && (
                <div className="mb-6">
                  <p className="text-sm font-medium scholr-body mb-2">Written Response</p>
                  <div className="p-4 scholr-sunk rounded-lg">
                    <p className="scholr-body whitespace-pre-wrap">{submission.content}</p>
                  </div>
                </div>
              )}

              {submission.documents && submission.documents.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium scholr-body mb-3">Documents & Attachments</p>
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
                  <p className="text-sm font-medium scholr-body mb-2">Link (Legacy)</p>
                  <a
                    href={submission.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 scholr-sunk rounded-lg hover:scholr-sunk transition-colors scholr-accent"
                  >
                    <Link2 className="w-4 h-4" />
                    {submission.link_url}
                  </a>
                </div>
              )}
              {submission.file_urls && submission.file_urls.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-medium scholr-body mb-2">Attachments (Legacy)</p>
                  <div className="space-y-2">
                    {submission.file_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-3 scholr-sunk rounded-lg hover:scholr-sunk transition-colors"
                      >
                        <FileText className="w-4 h-4 scholr-faint" />
                        <span className="text-sm scholr-body">File {i + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!submission.content && 
               (!submission.documents || submission.documents.length === 0) && 
               !submission.link_url && 
               (!submission.file_urls || submission.file_urls.length === 0) && (
                <p className="scholr-faint text-center py-8">No work submitted yet</p>
              )}
            </div>

            <TeacherAnnotationsPanel annotations={submission.annotations || []} onAddAnnotation={handleAddAnnotation} />

            <div className="bg-white rounded-xl border scholr-rule p-6">
              <h2 className="font-semibold scholr-ink mb-4 flex items-center gap-2">
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
                className="scholr-accent-sf hover:scholr-accent-sf"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Save & Return to Student
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border scholr-rule p-5">
              <h3 className="font-semibold scholr-ink mb-3">Submission Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="scholr-muted">Student</p>
                  <p className="font-medium scholr-ink">{submission.student_name}</p>
                </div>
                <div>
                  <p className="scholr-muted">Submitted</p>
                  <p className="font-medium scholr-ink">
                    {submission.submitted_at 
                      ? format(new Date(submission.submitted_at), 'MMM d, yyyy h:mm a')
                      : 'Not submitted'}
                  </p>
                </div>
                <div>
                  <p className="scholr-muted">Version</p>
                  <p className="font-medium scholr-ink">{submission.version_number || 1}</p>
                </div>
                <div>
                  <p className="scholr-muted">File Type</p>
                  <p className="font-medium scholr-ink">{submission.file_type || '—'}</p>
                </div>
                <div>
                  <p className="scholr-muted">Status</p>
                  <Badge className={`${statusColors[submission.status]} border-0 mt-1`}>
                    {submission.status}
                  </Badge>
                </div>
                {submission.graded_at && (
                  <div>
                    <p className="scholr-muted">Graded</p>
                    <p className="font-medium scholr-ink">
                      {format(new Date(submission.graded_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                {submission.score !== undefined && submission.score !== null && (
                  <div>
                    <p className="scholr-muted">Score</p>
                    <p className="font-medium scholr-ink">{submission.score} points</p>
                  </div>
                )}
                <div>
                  <p className="scholr-muted">Annotations</p>
                  <p className="font-medium scholr-ink">{submission.annotations?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}