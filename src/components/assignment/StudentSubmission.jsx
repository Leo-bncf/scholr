import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Save, Plus, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { FileText, Presentation, Table, Upload as UploadIcon, Link as LinkIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/components/auth/UserContext';
import DocumentCard from './DocumentCard';
import DocumentPicker from './DocumentPicker';
import GoogleDocCreator from './GoogleDocCreator';
import GoogleDrivePicker from './GoogleDrivePicker';
import SubmissionDocumentsView from './SubmissionDocumentsView';
import SubmissionHistory from './SubmissionHistory';
import GoogleConnectionStatus from '@/components/google/GoogleConnectionStatus';
import { useSubmissionPolicy, validateFileForPolicy, getLateSubmissionStatus } from '@/hooks/useSubmissionPolicy';

export default function StudentSubmission({ assignment, studentId, studentName, existingSubmission }) {
  const queryClient = useQueryClient();
  const [selectedSubmission, setSelectedSubmission] = useState(existingSubmission || null);
  const { school } = useUser();
  const { policy } = useSubmissionPolicy(assignment?.school_id);
  const [content, setContent] = useState(existingSubmission?.content || '');
  const [documents, setDocuments] = useState(existingSubmission?.documents || []);
  const [documentPickerOpen, setDocumentPickerOpen] = useState(false);
  const [googleDocCreator, setGoogleDocCreator] = useState({ open: false, type: null });
  const [googleDrivePickerOpen, setGoogleDrivePickerOpen] = useState(false);
  const [googleConnectionAlert, setGoogleConnectionAlert] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [policyError, setPolicyError] = useState(null);

  const { data: submissionHistory = [] } = useQuery({
    queryKey: ['submission-history', assignment?.id, studentId],
    queryFn: () => base44.entities.Submission.filter({ assignment_id: assignment.id, student_id: studentId }),
    enabled: !!assignment?.id && !!studentId,
  });

  const activeSubmission = selectedSubmission || existingSubmission;
  const latestVersionNumber = useMemo(() => submissionHistory.length ? Math.max(...submissionHistory.map((item) => item.version_number || 1)) : 0, [submissionHistory]);

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      if (data.status === 'draft' && activeSubmission && activeSubmission.status === 'draft') {
        return base44.entities.Submission.update(activeSubmission.id, data);
      }
      if (activeSubmission && data.status !== 'draft') {
        await base44.entities.Submission.update(activeSubmission.id, { is_current_version: false });
      }
      return base44.entities.Submission.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-detail'] });
      queryClient.invalidateQueries({ queryKey: ['student-submission'] });
      queryClient.invalidateQueries({ queryKey: ['submission-history'] });
    },
  });

  const handleAddDocuments = (newDocs) => {
    // File size / type policy enforcement
    const errors = [];
    for (const doc of newDocs) {
      if (doc.size_bytes && policy.max_file_size_mb) {
        if (doc.size_bytes > policy.max_file_size_mb * 1024 * 1024) {
          errors.push(`"${doc.name}" exceeds the ${policy.max_file_size_mb}MB limit.`);
        }
      }
      if (doc.name && policy.allowed_file_extensions?.length > 0) {
        const ext = '.' + doc.name.split('.').pop().toLowerCase();
        if (!policy.allowed_file_extensions.map(e => e.toLowerCase()).includes(ext)) {
          errors.push(`File type "${ext}" is not allowed by school policy.`);
        }
      }
      if (doc.type === 'uploaded_file') {
        const allowedV2 = ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
        const currentExt = doc.name?.split('.').pop()?.toLowerCase();
        if (currentExt && !allowedV2.includes(currentExt)) {
          errors.push(`Only PDF, DOCX, and image files are supported.`);
        }
      }
    }
    if (errors.length > 0) { setPolicyError(errors.join(' ')); return; }
    // Max files check
    if (policy.max_files_per_submission && (documents.length + newDocs.length) > policy.max_files_per_submission) {
      setPolicyError(`Maximum ${policy.max_files_per_submission} files allowed per submission.`);
      return;
    }
    setPolicyError(null);
    setDocuments([...documents, ...newDocs]);
    setDocumentPickerOpen(false);
  };

  const handleCreateGoogleDoc = async (type) => {
    try {
      const response = await base44.functions.invoke('verifyGoogleConnection', {
        schoolId: school?.id,
        userId: studentId
      });
      
      if (response.data.requiresReconnection || response.data.requiresConnection) {
        setGoogleConnectionAlert({
          type: 'connection_error',
          message: response.data.message,
          errorCode: response.data.errorCode
        });
        return;
      }
      
      setGoogleDocCreator({ open: true, type });
    } catch (error) {
      console.error('Error checking Google connection:', error);
      setGoogleConnectionAlert({
        type: 'error',
        message: 'Failed to verify Google connection. Please try again.'
      });
    }
  };

  const handleGoogleDocCreated = (doc) => {
    setDocuments([...documents, doc]);
  };

  const handleGoogleDriveFilesSelected = async (newDocs) => {
    setDocuments([...documents, ...newDocs]);
    setGoogleDrivePickerOpen(false);
  };

  const handleGoogleDrivePickerOpen = async () => {
    try {
      const response = await base44.functions.invoke('verifyGoogleConnection', {
        schoolId: school?.id,
        userId: studentId
      });
      
      if (response.data.requiresReconnection || response.data.requiresConnection) {
        setGoogleConnectionAlert({
          type: 'connection_error',
          message: response.data.message,
          errorCode: response.data.errorCode
        });
        return;
      }
      
      setGoogleDrivePickerOpen(true);
    } catch (error) {
      console.error('Error checking Google connection:', error);
      setGoogleConnectionAlert({
        type: 'error',
        message: 'Failed to verify Google connection. Please try again.'
      });
    }
  };

  const handleRemoveDocument = (docId) => {
    setDocuments(documents.filter(d => d.id !== docId));
  };

  const handleOpenDocument = (doc) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    }
  };

  const primaryFormat = assignment.primary_submission_format;
  const allowAlternatives = assignment.allow_alternative_formats;
  const alternativeFormats = assignment.alternative_formats || [];
  const hasFormatGuidance = !!primaryFormat;
  const allowedFormats = primaryFormat ? [primaryFormat, ...(allowAlternatives ? alternativeFormats : [])] : [];

  const formatActions = {
    google_doc: {
      icon: FileText,
      label: 'Create Google Doc',
      shortLabel: 'Google Doc',
      color: 'bg-blue-600 hover:bg-blue-700',
      action: () => handleCreateGoogleDoc('google_doc'),
    },
    google_slides: {
      icon: Presentation,
      label: 'Create Google Slides',
      shortLabel: 'Presentation',
      color: 'bg-amber-600 hover:bg-amber-700',
      action: () => handleCreateGoogleDoc('google_slides'),
    },
    google_sheet: {
      icon: Table,
      label: 'Create Google Sheet',
      shortLabel: 'Spreadsheet',
      color: 'bg-emerald-600 hover:bg-emerald-700',
      action: () => handleCreateGoogleDoc('google_sheet'),
    },
    file_upload: {
      icon: UploadIcon,
      label: 'Upload File',
      shortLabel: 'File Upload',
      color: 'bg-slate-600 hover:bg-slate-700',
      action: () => setDocumentPickerOpen(true),
    },
    link: {
      icon: LinkIcon,
      label: 'Add Link',
      shortLabel: 'Link',
      color: 'bg-indigo-600 hover:bg-indigo-700',
      action: () => setDocumentPickerOpen(true),
    },
  };

  const handleSubmit = (status) => {
    setPolicyError(null);
    // Acknowledgement check
    if (status === 'submitted' && policy.require_submission_acknowledgement && !acknowledged) {
      setPolicyError('Please confirm the academic integrity acknowledgement before submitting.');
      return;
    }
    // Resubmission limit check
    if (status === 'submitted' && activeSubmission?.status === 'returned' && policy.resubmission_limit > 0) {
      const resubCount = Math.max(0, submissionHistory.length - 1);
      if (resubCount >= policy.resubmission_limit) {
        setPolicyError(`Resubmission limit reached (${policy.resubmission_limit}). Contact your teacher.`);
        return;
      }
    }
    // Late submission policy
    const lateStatus = getLateSubmissionStatus(assignment.due_date, policy);
    if (status === 'submitted' && lateStatus === 'blocked') {
      setPolicyError('Late submissions are not accepted for this assignment.');
      return;
    }
    const isLate = new Date() > new Date(assignment.due_date);
    const submissionTime = status === 'submitted' ? new Date().toISOString() : activeSubmission?.submission_time || null;
    submitMutation.mutate({
      school_id: assignment.school_id,
      assignment_id: assignment.id,
      class_id: assignment.class_id,
      student_id: studentId,
      student_name: studentName,
      content,
      documents,
      version_number: latestVersionNumber + (status === 'draft' && activeSubmission?.status === 'draft' ? 0 : 1),
      submission_time: submissionTime,
      file_type: documents[0]?.file_type || documents[0]?.mime_type || null,
      previous_submission_id: activeSubmission?.id || null,
      is_current_version: true,
      status: isLate && status === 'submitted' ? 'late' : status,
      submitted_at: status === 'submitted' ? new Date().toISOString() : activeSubmission?.submitted_at,
    });
  };

  const canSubmit = content.trim() || documents.length > 0;
  const isSubmitted = activeSubmission?.status === 'submitted' || activeSubmission?.status === 'late';
  const isReturned = activeSubmission?.status === 'returned';
  const isEditable = !isSubmitted || isReturned;
  const hasGoogleFormats = assignment.primary_submission_format?.includes('google') || assignment.alternative_formats?.some(f => f.includes('google'));

  return (
    <div className="space-y-6">
      {googleConnectionAlert && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-amber-800 ml-3">
            <div className="font-semibold">Google Connection Required</div>
            <div className="text-sm text-amber-700 mt-1">{googleConnectionAlert.message}</div>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 bg-white border-amber-300 hover:bg-amber-50"
              onClick={() => {
                setGoogleConnectionAlert(null);
                window.location.href = '/reconnect-google';
              }}
            >
              Reconnect Google Account
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {hasGoogleFormats && isEditable && (
        <GoogleConnectionStatus 
          schoolId={school?.id}
          userId={studentId}
          onReconnect={() => window.location.href = '/reconnect-google'}
          compact={true}
        />
      )}
      <SubmissionHistory submissions={[...submissionHistory].sort((a, b) => (b.version_number || 0) - (a.version_number || 0))} currentId={activeSubmission?.id} onSelect={setSelectedSubmission} />

      {activeSubmission && (
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Submission Status</span>
            <Badge className={`${
              activeSubmission.status === 'submitted' ? 'bg-emerald-50 text-emerald-700' :
              activeSubmission.status === 'late' ? 'bg-amber-50 text-amber-700' :
              activeSubmission.status === 'returned' ? 'bg-blue-50 text-blue-700' :
              'bg-slate-100 text-slate-600'
            } border-0`}>
              {activeSubmission.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">Version {activeSubmission.version_number || 1}</p>
          {activeSubmission.submitted_at && (
            <p className="text-xs text-slate-500">
              Submitted {format(new Date(activeSubmission.submitted_at), 'MMM d, yyyy h:mm a')}
            </p>
          )}
          {activeSubmission.feedback && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-700 mb-1">Teacher Feedback</p>
              <p className="text-sm text-slate-600">{activeSubmission.feedback}</p>
            </div>
          )}
        </div>
      )}

      <div>
        <Label className="text-sm font-semibold">Your Work</Label>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type your response or notes here..."
          rows={8}
          className="mt-1.5"
          disabled={!isEditable}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-semibold">
            {hasFormatGuidance ? 'Your Submission' : 'Documents & Links'}
          </Label>
        </div>

        {hasFormatGuidance && isEditable && documents.length === 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-semibold text-indigo-900 mb-1">
              {allowAlternatives ? 'Submission Format' : 'Required Format'}
            </p>
            <p className="text-sm text-indigo-700">
              {allowAlternatives
                ? `Your teacher expects a ${formatActions[primaryFormat]?.shortLabel || primaryFormat}, but also accepts: ${alternativeFormats.map(f => formatActions[f]?.shortLabel || f).join(', ')}.`
                : `Your teacher requires this assignment to be submitted as a ${formatActions[primaryFormat]?.shortLabel || primaryFormat}.`}
            </p>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6">
            {isEditable ? (
              hasFormatGuidance ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 text-center mb-4">
                    {allowAlternatives ? 'Start your work (recommended format):' : 'Start your work:'}
                  </p>
                  {/* Primary format - always prominent */}
                  <Button
                    onClick={formatActions[primaryFormat]?.action}
                    className={`${formatActions[primaryFormat]?.color} text-white h-auto py-4 w-full`}
                  >
                    {React.createElement(formatActions[primaryFormat]?.icon, { className: "w-5 h-5 mr-2" })}
                    {formatActions[primaryFormat]?.label}
                  </Button>
                  
                  {allowAlternatives && alternativeFormats.length > 0 && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-white px-2 text-slate-500">or use alternative format</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {alternativeFormats.map(format => {
                          const action = formatActions[format];
                          if (!action) return null;
                          const Icon = action.icon;
                          return (
                            <Button
                              key={format}
                              onClick={action.action}
                              variant="outline"
                              className="h-auto py-3"
                            >
                              <Icon className="w-4 h-4 mr-2" />
                              {action.label}
                            </Button>
                          );
                        })}
                      </div>
                    </>
                  )}
                  
                  {!allowAlternatives && (
                    <p className="text-xs text-center text-slate-500 pt-2">
                      Only {formatActions[primaryFormat]?.shortLabel} submissions are accepted for this assignment.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-slate-400 mb-3">No documents attached yet</p>
                  <Button 
                    onClick={() => setDocumentPickerOpen(true)}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Your First Document
                  </Button>
                </div>
              )
            ) : (
              <p className="text-sm text-slate-400 text-center">No documents attached yet</p>
            )}
          </div>
        ) : (
          <>
            <SubmissionDocumentsView
              documents={documents}
              onRemove={isEditable ? handleRemoveDocument : null}
              onOpen={handleOpenDocument}
            />
            {isEditable && hasFormatGuidance && (
              <>
                <div className="flex gap-2 flex-wrap">
                  {allowedFormats.map((format, idx) => {
                    const action = formatActions[format];
                    if (!action) return null;
                    const Icon = action.icon;
                    const isPrimary = format === primaryFormat;
                    return (
                      <Button
                        key={format}
                        onClick={action.action}
                        variant={isPrimary ? "default" : "outline"}
                        size="sm"
                        className={isPrimary ? "bg-indigo-600 hover:bg-indigo-700" : "border-indigo-200 text-indigo-700"}
                      >
                        <Icon className="w-4 h-4 mr-1.5" />
                        {action.label}
                        {isPrimary && <span className="ml-1.5 text-xs opacity-75">(recommended)</span>}
                      </Button>
                    );
                  })}
                  {allowedFormats.some(f => ['google_doc', 'google_slides', 'google_sheet'].includes(f)) && (
                    <Button
                      onClick={handleGoogleDrivePickerOpen}
                      variant="outline"
                      size="sm"
                      className="border-indigo-200 text-indigo-700"
                    >
                      <FileText className="w-4 h-4 mr-1.5" />
                      Link Existing
                    </Button>
                  )}
                  {!allowAlternatives && (
                    <span className="text-xs text-slate-500 self-center">
                      Only {formatActions[primaryFormat]?.shortLabel} allowed
                    </span>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Policy error */}
      {policyError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-xs text-red-700">{policyError}</AlertDescription>
        </Alert>
      )}

      {/* Academic integrity acknowledgement */}
      {isEditable && policy.require_submission_acknowledgement && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start gap-2.5">
          <input
            type="checkbox"
            id="integrity_ack"
            checked={acknowledged}
            onChange={e => setAcknowledged(e.target.checked)}
            className="mt-0.5 w-4 h-4 flex-shrink-0"
          />
          <label htmlFor="integrity_ack" className="text-xs text-emerald-800 cursor-pointer leading-relaxed">
            {policy.acknowledgement_text || 'I confirm this is my own original work and I have not plagiarised any content.'}
          </label>
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t">
        {isEditable && (
          <>
            <Button
              onClick={() => handleSubmit('draft')}
              disabled={!canSubmit || submitMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Draft
            </Button>
            <Button
              onClick={() => handleSubmit('submitted')}
              disabled={!canSubmit || submitMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {isReturned ? 'Resubmit' : 'Submit Assignment'}
            </Button>
          </>
        )}
        {isSubmitted && !isReturned && (
          <div className="flex-1 text-center py-3 text-sm text-emerald-700 bg-emerald-50 rounded-lg font-medium">
            ✓ Assignment submitted successfully
          </div>
        )}
      </div>

      <DocumentPicker
        open={documentPickerOpen}
        onClose={() => setDocumentPickerOpen(false)}
        onAddDocuments={handleAddDocuments}
      />

      <GoogleDocCreator
        type={googleDocCreator.type}
        open={googleDocCreator.open}
        onClose={() => setGoogleDocCreator({ open: false, type: null })}
        onDocumentCreated={handleGoogleDocCreated}
        defaultTitle={assignment.title}
      />

      <GoogleDrivePicker
        open={googleDrivePickerOpen}
        onClose={() => setGoogleDrivePickerOpen(false)}
        onFilesSelected={handleGoogleDriveFilesSelected}
      />
    </div>
  );
}