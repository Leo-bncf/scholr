import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Printer, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Displays a generated academic report
 * Role-aware: shows full report to coordinators/admins,
 * limited view to students/parents based on visibility
 */
export default function ReportView({
  report,
  userRole,
  canExport = false,
  onExportPDF = null,
  onPrint = null
}) {
  const [showingDetails, setShowingDetails] = useState(true);

  if (!report) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-sm">Report not found or access denied</p>
      </div>
    );
  }

  const reportData = report.report_data || {};
  const studentInfo = reportData.student_info || {};
  const overallSummary = reportData.overall_summary || {};
  const subjectReports = reportData.subject_reports || [];
  const attendanceData = reportData.attendance_data || {};
  const behaviorSummary = reportData.behavior_summary || {};
  const ibProgress = reportData.ib_progress || {};

  // Determine what to show based on role
  const isTeacherOrAdmin = ['teacher', 'school_admin', 'ib_coordinator'].includes(userRole);
  const isStudent = userRole === 'student';
  const isParent = userRole === 'parent';

  const showFullReport = isTeacherOrAdmin;
  const showBasicReport = isStudent || (isParent && report.visibility?.visible_to_parent);

  if (!showBasicReport && !showFullReport) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <Lock className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-amber-800 ml-3">
          This report is not available to you yet or has not been published.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{report.title}</CardTitle>
              <p className="text-sm text-slate-600 mt-2">
                Generated {new Date(report.generated_at).toLocaleDateString()} by {report.generated_by_name}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={report.status === 'published' ? 'default' : 'outline'}>
                {report.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Actions */}
      {showFullReport && (
        <div className="flex gap-2">
          {onExportPDF && (
            <Button size="sm" variant="outline" onClick={onExportPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          )}
          {onPrint && (
            <Button size="sm" variant="outline" onClick={onPrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print
            </Button>
          )}
        </div>
      )}

      {/* Student Info */}
      {studentInfo.name && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-slate-600 font-semibold">Name</p>
                <p className="text-slate-900 mt-1">{studentInfo.name}</p>
              </div>
              {studentInfo.grade_level && (
                <div>
                  <p className="text-slate-600 font-semibold">Grade Level</p>
                  <p className="text-slate-900 mt-1">{studentInfo.grade_level}</p>
                </div>
              )}
              {studentInfo.class && (
                <div>
                  <p className="text-slate-600 font-semibold">Class</p>
                  <p className="text-slate-900 mt-1">{studentInfo.class}</p>
                </div>
              )}
              {studentInfo.report_date && (
                <div>
                  <p className="text-slate-600 font-semibold">Report Date</p>
                  <p className="text-slate-900 mt-1">
                    {new Date(studentInfo.report_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overall Summary */}
      {(overallSummary.gpa || overallSummary.average_grade) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Overall Academic Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {overallSummary.average_grade && (
                <div>
                  <p className="text-slate-600 text-sm font-semibold">Average Grade</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">
                    {Math.round(overallSummary.average_grade)}%
                  </p>
                </div>
              )}
              {overallSummary.gpa && (
                <div>
                  <p className="text-slate-600 text-sm font-semibold">GPA</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{overallSummary.gpa.toFixed(2)}</p>
                </div>
              )}
              {overallSummary.attendance_percentage && (
                <div>
                  <p className="text-slate-600 text-sm font-semibold">Attendance</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    {Math.round(overallSummary.attendance_percentage)}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subject Reports */}
      {subjectReports.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-slate-900">Subject Performance</h3>
          <div className="space-y-3">
            {subjectReports.map((subject, idx) => (
              <Card key={idx}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{subject.subject_name}</h4>
                      {subject.teacher_name && (
                        <p className="text-sm text-slate-600 mt-1">Teacher: {subject.teacher_name}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {subject.grade && (
                        <p className="text-2xl font-bold text-indigo-600">{subject.grade}</p>
                      )}
                      {subject.percentage && (
                        <p className="text-sm text-slate-600">{Math.round(subject.percentage)}%</p>
                      )}
                      {showFullReport && subject.predicted_grade && (
                        <p className="text-sm text-amber-600 font-semibold">Pred: {subject.predicted_grade}</p>
                      )}
                    </div>
                  </div>
                  {subject.teacher_comment && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold text-slate-600 mb-1">Teacher Comment</p>
                      <p className="text-sm text-slate-700">{subject.teacher_comment}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Data */}
      {(showFullReport || isParent) && attendanceData.total_days && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Attendance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-slate-600 font-semibold">Days Present</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">{attendanceData.days_present}</p>
              </div>
              <div>
                <p className="text-slate-600 font-semibold">Days Absent</p>
                <p className="text-lg font-bold text-red-600 mt-1">{attendanceData.days_absent || 0}</p>
              </div>
              <div>
                <p className="text-slate-600 font-semibold">Days Late</p>
                <p className="text-lg font-bold text-amber-600 mt-1">{attendanceData.days_late || 0}</p>
              </div>
              <div>
                <p className="text-slate-600 font-semibold">Total Days</p>
                <p className="text-lg font-bold text-slate-900 mt-1">{attendanceData.total_days}</p>
              </div>
              <div>
                <p className="text-slate-600 font-semibold">Attendance %</p>
                <p className="text-lg font-bold text-indigo-600 mt-1">
                  {Math.round(attendanceData.attendance_percentage || 0)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Behavior Summary (only for teachers/admins/coordinators) */}
      {showFullReport && (behaviorSummary.positive_count || behaviorSummary.concern_count) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Behavior Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-slate-600 font-semibold text-sm">Positive</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{behaviorSummary.positive_count || 0}</p>
              </div>
              <div>
                <p className="text-slate-600 font-semibold text-sm">Concerns</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{behaviorSummary.concern_count || 0}</p>
              </div>
              <div>
                <p className="text-slate-600 font-semibold text-sm">Incidents</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{behaviorSummary.incident_count || 0}</p>
              </div>
            </div>
            {behaviorSummary.notes && (
              <div className="pt-3 border-t">
                <p className="text-xs font-semibold text-slate-600 mb-1">Notes</p>
                <p className="text-sm text-slate-700">{behaviorSummary.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* IB Progress */}
      {showFullReport && ibProgress && Object.keys(ibProgress).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">IB Programme Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ibProgress.cas_status && (
                <div>
                  <p className="text-slate-600 font-semibold text-sm">CAS</p>
                  <p className="text-sm text-slate-900 mt-1">{ibProgress.cas_status}</p>
                </div>
              )}
              {ibProgress.ee_status && (
                <div>
                  <p className="text-slate-600 font-semibold text-sm">Extended Essay</p>
                  <p className="text-sm text-slate-900 mt-1">{ibProgress.ee_status}</p>
                </div>
              )}
              {ibProgress.tok_status && (
                <div>
                  <p className="text-slate-600 font-semibold text-sm">TOK</p>
                  <p className="text-sm text-slate-900 mt-1">{ibProgress.tok_status}</p>
                </div>
              )}
              {ibProgress.core_progress && (
                <div>
                  <p className="text-slate-600 font-semibold text-sm">Core Programme</p>
                  <p className="text-sm text-slate-900 mt-1">{ibProgress.core_progress}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coordinator Notes */}
      {showFullReport && reportData.coordinator_notes && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Coordinator Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">{reportData.coordinator_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Headmaster Notes */}
      {showFullReport && reportData.headmaster_notes && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Headmaster Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">{reportData.headmaster_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Distribution Info */}
      {showFullReport && report.distribution_list && report.distribution_list.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {report.distribution_list.map((dist, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-slate-700">
                    {dist.recipient_name} ({dist.recipient_type})
                  </span>
                  {dist.viewed_at ? (
                    <span className="text-xs text-emerald-600">Viewed {new Date(dist.viewed_at).toLocaleDateString()}</span>
                  ) : (
                    <span className="text-xs text-amber-600">Sent {new Date(dist.distributed_at).toLocaleDateString()}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}