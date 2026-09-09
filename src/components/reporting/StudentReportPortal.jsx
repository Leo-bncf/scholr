import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Download } from 'lucide-react';
import ReportView from './ReportView';
import * as reportsData from '@/data/reports';

/**
 * Student-facing portal to view published reports
 * Only shows reports that are explicitly visible to them
 */
export default function StudentReportPortal({ schoolId, studentId }) {
  const [selectedReportId, setSelectedReportId] = useState(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['student-reports', schoolId, studentId],
    queryFn: async () => {
      const allReports = await reportsData.where({
        school_id: schoolId,
        student_id: studentId
      });
      // Only return published reports visible to student
      return allReports.filter(r =>
        r.status === 'published' && r.visibility?.visible_to_student
      );
    }
  });

  const selectedReport = selectedReportId
    ? reports.find(r => r.id === selectedReportId)
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Academic Reports</h2>
        <p className="text-sm text-slate-600 mt-1">View your progress reports and academic summaries</p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No reports available yet</p>
            <p className="text-sm text-slate-500 mt-2">Reports will appear here when your school publishes them.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list">All Reports ({reports.length})</TabsTrigger>
            {selectedReport && <TabsTrigger value="view">View Report</TabsTrigger>}
          </TabsList>

          <TabsContent value="list" className="space-y-3">
            {reports.map((report) => (
              <Card
                key={report.id}
                className={`cursor-pointer hover:shadow-md transition-all ${
                  selectedReport?.id === report.id ? 'ring-2 ring-indigo-600' : ''
                }`}
                onClick={() => setSelectedReportId(report.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{report.title}</h3>
                      <div className="flex gap-2 items-center mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs">
                          {report.report_type.replace(/_/g, ' ')}
                        </Badge>
                        {report.report_period_start && report.report_period_end && (
                          <span className="text-xs text-slate-600">
                            {new Date(report.report_period_start).toLocaleDateString()} - {new Date(report.report_period_end).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        Published {new Date(report.visibility?.visibility_date || report.generated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReportId(report.id);
                      }}
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {selectedReport && (
            <TabsContent value="view" className="space-y-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Print Report
              </Button>
              <ReportView
                report={selectedReport}
                userRole="student"
              />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}