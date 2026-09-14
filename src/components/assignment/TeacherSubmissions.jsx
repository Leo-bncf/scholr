import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, CheckCircle, Clock, XCircle, AlertCircle, Eye, FileText, Presentation, Table, Upload, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import DocumentAccessValidator from '@/components/google/DocumentAccessValidator';
import * as membershipsData from '@/data/memberships';
import * as submissionsData from '@/data/submissions';

export default function TeacherSubmissions({ assignment, classData }) {
  const { data: students = [] } = useQuery({
    queryKey: ['class-students', classData.id],
    queryFn: async () => {
      const members = await membershipsData.where({
        school_id: classData.school_id,
        status: 'active'
      });
      return members.filter(m => classData.student_ids?.includes(m.user_id));
    },
  });

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ['assignment-submissions', assignment.id],
    queryFn: () => submissionsData.where({
      school_id: assignment.school_id,
      assignment_id: assignment.id
    }),
  });

  if (isLoading) {
    return <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin scholr-accent mx-auto" /></div>;
  }

  const submissionMap = {};
  submissions.forEach(s => {
    submissionMap[s.student_id] = s;
  });

  const dueDate = new Date(assignment.due_date);
  
  const studentsWithStatus = students.map(student => {
    const submission = submissionMap[student.user_id];
    let status = 'missing';
    let statusColor = 'scholr-sunk scholr-body';
    let statusIcon = <XCircle className="w-4 h-4" />;

    if (submission) {
      if (submission.status === 'submitted' || submission.status === 'late') {
        status = submission.status;
        statusColor = submission.status === 'submitted' 
          ? 'bg-emerald-50 text-emerald-700' 
          : 'bg-amber-50 text-amber-700';
        statusIcon = submission.status === 'submitted' 
          ? <CheckCircle className="w-4 h-4" /> 
          : <Clock className="w-4 h-4" />;
      } else if (submission.status === 'returned') {
        status = 'returned';
        statusColor = 'bg-blue-50 text-blue-700';
        statusIcon = <AlertCircle className="w-4 h-4" />;
      } else if (submission.status === 'graded') {
        status = 'graded';
        statusColor = 'scholr-accent-sf scholr-accent';
        statusIcon = <CheckCircle className="w-4 h-4" />;
      } else {
        status = 'draft';
        statusColor = 'scholr-sunk scholr-muted';
        statusIcon = <Clock className="w-4 h-4" />;
      }
    } else if (new Date() > dueDate) {
      status = 'missing';
      statusColor = 'bg-red-50 text-red-700';
      statusIcon = <XCircle className="w-4 h-4" />;
    }

    return { ...student, submission, status, statusColor, statusIcon };
  });

  const stats = {
    submitted: studentsWithStatus.filter(s => s.status === 'submitted' || s.status === 'graded').length,
    late: studentsWithStatus.filter(s => s.status === 'late').length,
    missing: studentsWithStatus.filter(s => s.status === 'missing').length,
    total: students.length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border scholr-rule p-4">
          <p className="text-sm scholr-muted font-medium">Total Students</p>
          <p className="text-2xl font-bold scholr-ink mt-1">{stats.total}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
          <p className="text-sm text-emerald-700 font-medium">Submitted</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.submitted}</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <p className="text-sm text-amber-700 font-medium">Late</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{stats.late}</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-4">
          <p className="text-sm text-red-700 font-medium">Missing</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{stats.missing}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border scholr-rule overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b scholr-rule scholr-sunk">
              <th className="px-6 py-3 text-left text-xs font-semibold scholr-muted uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-semibold scholr-muted uppercase">Status</th>
              <th className="px-6 py-3 text-center text-xs font-semibold scholr-muted uppercase">Documents</th>
              <th className="px-6 py-3 text-left text-xs font-semibold scholr-muted uppercase">Submitted</th>
              <th className="px-6 py-3 text-left text-xs font-semibold scholr-muted uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y scholr-divide">
            {studentsWithStatus.map(student => (
              <tr key={student.id} className="hover:scholr-sunk">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium scholr-ink">{student.user_name || student.user_email}</p>
                    <p className="text-xs scholr-faint">{student.grade_level || ''}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge className={`${student.statusColor} border-0 flex items-center gap-1 w-fit`}>
                    {student.statusIcon}
                    {student.status}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                   {student.submission?.documents && student.submission.documents.length > 0 ? (
                     <div className="space-y-1.5">
                       {student.submission.documents.map((doc) => {
                         let Icon = FileText;
                         let color = 'scholr-muted';
                         let label = 'File';
                         const isGoogleDoc = doc.type?.includes('google');
                         if (doc.type === 'google_doc') { Icon = FileText; color = 'text-blue-600'; label = 'Doc'; }
                         else if (doc.type === 'google_slides') { Icon = Presentation; color = 'text-amber-600'; label = 'Slides'; }
                         else if (doc.type === 'google_sheet') { Icon = Table; color = 'text-emerald-600'; label = 'Sheet'; }
                         else if (doc.type === 'uploaded_file') { Icon = Upload; color = 'scholr-muted'; label = 'File'; }
                         else if (doc.type === 'external_link') { Icon = LinkIcon; color = 'scholr-accent'; label = 'Link'; }

                         if (isGoogleDoc) {
                           return (
                             <div key={doc.id} className="flex items-center gap-2 text-xs">
                               <DocumentAccessValidator 
                                 document={doc}
                                 onOpenDocument={() => window.open(doc.url, '_blank')}
                                 isTeacher={true}
                               />
                               <span className="scholr-muted truncate">{doc.name}</span>
                             </div>
                           );
                         }

                         return (
                           <div key={doc.id} className="flex items-center gap-2 text-xs">
                             <Icon className={`w-3.5 h-3.5 ${color}`} />
                             <span className="scholr-body max-w-xs truncate">{doc.name}</span>
                             {doc.url && (
                               <a
                                 href={doc.url}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className={`${color} hover:opacity-70`}
                               >
                                 <ExternalLink className="w-3 h-3" />
                               </a>
                             )}
                           </div>
                         );
                       })}
                     </div>
                   ) : (
                     <span className="scholr-faint text-sm">—</span>
                   )}
                 </td>
                <td className="px-6 py-4 text-sm scholr-muted">
                  {student.submission?.submitted_at 
                    ? format(new Date(student.submission.submitted_at), 'MMM d, h:mm a')
                    : '—'}
                </td>
                <td className="px-6 py-4">
                  {student.submission && (
                    <a href={createPageUrl('SubmissionReview') + `?submission_id=${student.submission.id}`}>
                      <Button size="sm" variant="outline">
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Review
                      </Button>
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}