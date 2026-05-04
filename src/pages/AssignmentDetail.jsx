import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUser } from '@/components/auth/UserContext';
import { Loader2, ArrowLeft, Calendar, FileText, Paperclip, Presentation, Table, Upload, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import StudentSubmission from '@/components/assignment/StudentSubmission';
import TeacherSubmissions from '@/components/assignment/TeacherSubmissions';
import AssignmentComments from '@/components/assignment/AssignmentComments';
import AssessmentStudentPanel from '@/components/assessment/AssessmentStudentPanel';
import AssessmentTeacherReview from '@/components/assessment/AssessmentTeacherReview';

export default function AssignmentDetail() {
  const { user, schoolId, membership } = useUser();
  const urlParams = new URLSearchParams(window.location.search);
  const assignmentId = urlParams.get('assignment_id');

  const { data: assignment, isLoading: loadingAssignment } = useQuery({
    queryKey: ['assignment-detail', assignmentId],
    queryFn: async () => {
      const results = await base44.entities.Assignment.filter({ id: assignmentId, school_id: schoolId });
      return results[0];
    },
    enabled: !!assignmentId && !!schoolId,
  });

  const { data: classData } = useQuery({
    queryKey: ['class-for-assignment', assignment?.class_id],
    queryFn: async () => {
      const results = await base44.entities.Class.filter({ id: assignment.class_id, school_id: schoolId });
      return results[0];
    },
    enabled: !!assignment?.class_id && !!schoolId,
  });

  const { data: studentSubmission } = useQuery({
    queryKey: ['student-submission', assignmentId, user?.id],
    queryFn: async () => {
      const results = await base44.entities.Submission.filter({
        assignment_id: assignmentId,
        student_id: user.id
      });
      return results[0];
    },
    enabled: !!assignmentId && !!user?.id && classData?.student_ids?.includes(user.id),
  });

  if (!assignmentId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">No assignment selected</p>
      </div>
    );
  }

  if (loadingAssignment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Assignment not found</p>
      </div>
    );
  }

  const isTeacher = classData?.teacher_ids?.includes(user.id) || membership?.role === 'school_admin' || membership?.role === 'super_admin';
  const isStudent = classData?.student_ids?.includes(user.id);

  if (!isTeacher && !isStudent) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">You don't have access to this assignment</p>
      </div>
    );
  }

  const typeColors = {
    homework: 'bg-blue-50 text-blue-700',
    essay: 'bg-purple-50 text-purple-700',
    exam: 'bg-red-50 text-red-700',
    project: 'bg-emerald-50 text-emerald-700',
    quiz: 'bg-amber-50 text-amber-700',
    lab_report: 'bg-cyan-50 text-cyan-700',
    presentation: 'bg-pink-50 text-pink-700',
  };

  const dueDate = new Date(assignment.due_date);
  const isPastDue = new Date() > dueDate;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <a href={createPageUrl('ClassWorkspace') + `?class_id=${assignment.class_id}&tab=assignments`}>
            <Button variant="ghost" size="sm" className="mb-3">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assignments
            </Button>
          </a>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{assignment.title}</h1>
                <Badge className={`${typeColors[assignment.type] || 'bg-slate-100 text-slate-700'} border-0 capitalize`}>
                  {assignment.type?.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Due {format(dueDate, 'EEEE, MMMM d, yyyy')}
                  {assignment.due_date.includes('T') && ` at ${format(dueDate, 'h:mm a')}`}
                </span>
                {isPastDue && (
                  <Badge className="bg-red-50 text-red-700 border-0 text-xs">Past Due</Badge>
                )}
                {assignment.max_score && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {assignment.max_score} points
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {assignment.description && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-3">Instructions</h2>
                <p className="text-slate-700 whitespace-pre-wrap">{assignment.description}</p>
              </div>
            )}

            {assignment.attachments && assignment.attachments.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-3">Attachments</h2>
                <div className="space-y-2">
                  {assignment.attachments.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Paperclip className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">Attachment {i + 1}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {isStudent && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                {assignment.type === 'quiz' || assignment.type === 'exam' ? (
                  <AssessmentStudentPanel assignment={assignment} studentId={user.id} studentName={user.full_name} />
                ) : (
                  <>
                    <h2 className="font-semibold text-slate-900 mb-4">Your Submission</h2>
                    <StudentSubmission
                      assignment={assignment}
                      studentId={user.id}
                      studentName={user.full_name}
                      existingSubmission={studentSubmission}
                    />
                  </>
                )}
              </div>
            )}

            {isTeacher && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">Student Submissions</h2>
                {assignment.type === 'quiz' || assignment.type === 'exam' ? (
                  <AssessmentTeacherReview assignment={assignment} />
                ) : (
                  <TeacherSubmissions assignment={assignment} classData={classData} />
                )}
              </div>
            )}

            {/* Comments & Feedback — visible to both teachers and students */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <AssignmentComments
                assignment={assignment}
                userId={user.id}
                userName={user.full_name}
                userRole={membership?.role}
                schoolId={schoolId}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-3">Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">Class</p>
                  <p className="font-medium text-slate-900">{classData?.name || 'Loading...'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Due Date</p>
                  <p className="font-medium text-slate-900">{format(dueDate, 'MMM d, yyyy')}</p>
                  {assignment.due_date.includes('T') && (
                    <p className="text-slate-600">{format(dueDate, 'h:mm a')}</p>
                  )}
                </div>
                <div>
                  <p className="text-slate-500">Points</p>
                  <p className="font-medium text-slate-900">{assignment.max_score || 'Ungraded'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Late Submissions</p>
                  <p className="font-medium text-slate-900">{assignment.allow_late ? 'Allowed' : 'Not Allowed'}</p>
                </div>
                {assignment.primary_submission_format && (
                  <div>
                    <p className="text-slate-500 mb-2">Submission Format</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const format = assignment.primary_submission_format;
                          let Icon = FileText;
                          let color = 'bg-blue-50 text-blue-700';
                          let label = format;
                          if (format === 'google_doc') { Icon = FileText; color = 'bg-blue-50 text-blue-700'; label = 'Google Doc'; }
                          else if (format === 'google_slides') { Icon = Presentation; color = 'bg-amber-50 text-amber-700'; label = 'Google Slides'; }
                          else if (format === 'google_sheet') { Icon = Table; color = 'bg-emerald-50 text-emerald-700'; label = 'Google Sheet'; }
                          else if (format === 'file_upload') { Icon = Upload; color = 'bg-slate-100 text-slate-700'; label = 'File Upload'; }
                          else if (format === 'link') { Icon = LinkIcon; color = 'bg-indigo-50 text-indigo-700'; label = 'Link'; }
                          return (
                            <Badge className={`${color} border-0 text-xs flex items-center gap-1`}>
                              <Icon className="w-3 h-3" />
                              {label}
                            </Badge>
                          );
                        })()}
                        <span className="text-xs font-medium text-slate-600">Primary</span>
                      </div>
                      {assignment.allow_alternative_formats && assignment.alternative_formats && assignment.alternative_formats.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Also accepts:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {assignment.alternative_formats.map(format => {
                              let Icon = FileText;
                              let color = 'bg-slate-100 text-slate-600';
                              let label = format;
                              if (format === 'google_doc') { Icon = FileText; color = 'bg-blue-50 text-blue-600'; label = 'Doc'; }
                              else if (format === 'google_slides') { Icon = Presentation; color = 'bg-amber-50 text-amber-600'; label = 'Slides'; }
                              else if (format === 'google_sheet') { Icon = Table; color = 'bg-emerald-50 text-emerald-600'; label = 'Sheet'; }
                              else if (format === 'file_upload') { Icon = Upload; color = 'bg-slate-100 text-slate-600'; label = 'File'; }
                              else if (format === 'link') { Icon = LinkIcon; color = 'bg-indigo-50 text-indigo-600'; label = 'Link'; }
                              return (
                                <Badge key={format} className={`${color} border-0 text-xs flex items-center gap-1`}>
                                  <Icon className="w-3 h-3" />
                                  {label}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {!assignment.allow_alternative_formats && (
                        <p className="text-xs text-slate-500 italic">Only this format accepted</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}