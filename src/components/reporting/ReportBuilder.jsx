import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import * as reportTemplatesData from '@/data/reportTemplates';
import * as usersData from '@/data/users';
import * as classesData from '@/data/classes';
import * as fns from '@/data/functions';

/**
 * Coordinator/Admin workflow for generating academic reports
 * Supports multiple report types with configurable templates
 */
export default function ReportBuilder({
  open,
  onClose,
  schoolId,
  academicYearId
}) {
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState('progress_report');
  const [templateId, setTemplateId] = useState('');
  const [title, setTitle] = useState('');
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [coordinatorNotes, setCoordinatorNotes] = useState('');
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [includeBehavior, setIncludeBehavior] = useState(false);
  const [showPredictedGrades, setShowPredictedGrades] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['report-templates', schoolId],
    queryFn: () => reportTemplatesData.where({ school_id: schoolId })
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students', schoolId],
    queryFn: () => usersData.where({ school_id: schoolId, role: 'student' })
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId })
  });

  const generateMutation = useMutation({
    mutationFn: async (data) => {
      // This will be called by a backend function that aggregates the report data
      return fns.invoke('generateReport', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      onClose();
    }
  });

  const handleGenerateReport = () => {
    generateMutation.mutate({
      school_id: schoolId,
      academic_year_id: academicYearId,
      report_type: reportType,
      template_id: templateId,
      title,
      student_id: studentId || null,
      class_id: classId || null,
      period_start: periodStart,
      period_end: periodEnd,
      coordinator_notes: coordinatorNotes,
      include_attendance: includeAttendance,
      include_behavior: includeBehavior,
      show_predicted_grades: showPredictedGrades
    });
  };

  const reportTypeLabels = {
    progress_report: 'Progress Report',
    academic_summary: 'Academic Summary',
    term_report: 'Term Report',
    semester_summary: 'Semester Summary',
    ib_progress: 'IB Progress Report',
    custom: 'Custom Report'
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Academic Report</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-800 ml-3 text-sm">
              <p className="font-semibold">Report Generation</p>
              <p className="mt-1">Create formal academic reports combining grades, attendance, behavior, and feedback.</p>
            </AlertDescription>
          </Alert>

          {/* Report Type */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Report Type</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(reportTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Selection */}
          {templates.length > 0 && (
            <div>
              <Label className="text-sm font-semibold mb-2 block">Template</Label>
              <Select value={templateId} onValueChange={setTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.filter(t => t.report_type === reportType).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Scope - Student or Class */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Student (Optional)</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Individual student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Students</SelectItem>
                  {students.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-semibold mb-2 block">Class (Optional)</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Entire class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Classes</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold mb-2 block">Report Period Start</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-2 block">Report Period End</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          {/* Report Title */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Report Title</Label>
            <Input
              placeholder={`e.g., ${reportTypeLabels[reportType]} - Term 1 2025-2026`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Report Content Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Report Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={includeAttendance}
                  onCheckedChange={setIncludeAttendance}
                />
                <span className="text-sm text-slate-700">Include Attendance Data</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={includeBehavior}
                  onCheckedChange={setIncludeBehavior}
                />
                <span className="text-sm text-slate-700">Include Behavior Records</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={showPredictedGrades}
                  onCheckedChange={setShowPredictedGrades}
                />
                <span className="text-sm text-slate-700">Show Predicted Grades</span>
              </label>
            </CardContent>
          </Card>

          {/* Coordinator Notes */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Coordinator Notes</Label>
            <Textarea
              placeholder="Any additional context or observations for this report..."
              value={coordinatorNotes}
              onChange={(e) => setCoordinatorNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleGenerateReport}
            disabled={!title || generateMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {generateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Generate Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}