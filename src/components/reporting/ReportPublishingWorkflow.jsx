import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import * as reportsData from '@/data/reports';
import { getCurrentUser } from '@/data/session';

/**
 * Workflow for publishing reports and managing visibility
 * Coordinators review and approve reports before publishing
 */
export default function ReportPublishingWorkflow({
  open,
  onClose,
  report
}) {
  const queryClient = useQueryClient();
  const [visibleToStudent, setVisibleToStudent] = useState(report?.visibility?.visible_to_student || false);
  const [visibleToParent, setVisibleToParent] = useState(report?.visibility?.visible_to_parent || false);
  const [coordinatorApprovalNotes, setCoordinatorApprovalNotes] = useState('');
  const [confirmPublish, setConfirmPublish] = useState(false);

  const publishMutation = useMutation({
    mutationFn: async () => {
      return reportsData.update(report.id, {
        status: 'published',
        visibility: {
          visible_to_student: visibleToStudent,
          visible_to_parent: visibleToParent,
          visibility_date: new Date().toISOString()
        },
        approvals: [
          ...(report.approvals || []),
          {
            approved_by: (await getCurrentUser()).id,
            approved_by_name: (await getCurrentUser()).full_name,
            approved_by_role: 'coordinator',
            approved_at: new Date().toISOString(),
            comments: coordinatorApprovalNotes
          }
        ]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      onClose();
    }
  });

  const handlePublish = () => {
    if (!confirmPublish) return;
    publishMutation.mutate();
  };

  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800 ml-3 text-sm">
              <p className="font-semibold">Publishing Report</p>
              <p className="mt-1">{report.student_name ? `Report for ${report.student_name}` : `Report: ${report.title}`}</p>
            </AlertDescription>
          </Alert>

          {/* Visibility Options */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Who Can See This Report?</Label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={visibleToStudent}
                onCheckedChange={setVisibleToStudent}
                className="mt-1"
              />
              <div>
                <p className="font-semibold text-sm text-slate-900">Visible to Student</p>
                <p className="text-xs text-slate-600 mt-0.5">Student can view their own report</p>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={visibleToParent}
                onCheckedChange={setVisibleToParent}
                className="mt-1"
              />
              <div>
                <p className="font-semibold text-sm text-slate-900">Visible to Parent</p>
                <p className="text-xs text-slate-600 mt-0.5">Parents/guardians can view the report</p>
              </div>
            </label>
          </div>

          {/* Coordinator Notes */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Approval Notes (Optional)</Label>
            <Textarea
              placeholder="Any notes or approval comments..."
              value={coordinatorApprovalNotes}
              onChange={(e) => setCoordinatorApprovalNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Confirmation */}
          <div className="space-y-3">
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-800 ml-3 text-sm">
                <p className="font-semibold">Publishing will send notifications to selected recipients</p>
              </AlertDescription>
            </Alert>

            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={confirmPublish}
                onCheckedChange={setConfirmPublish}
                className="mt-1"
              />
              <p className="text-sm text-slate-700">
                I confirm this report is complete and ready to publish
              </p>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handlePublish}
            disabled={!confirmPublish || publishMutation.isPending || (!visibleToStudent && !visibleToParent)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {publishMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {publishMutation.isPending ? 'Publishing...' : 'Publish Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}