import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, FileText, Download } from 'lucide-react';
import ReportView from './ReportView';
import * as parentStudentLinksData from '@/data/parentStudentLinks';
import * as reportsData from '@/data/reports';

/**
 * Parent-facing portal to view child's published reports
 * Respects school visibility policies
 */
export default function ParentReportPortal({ schoolId, parentId }) {
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState('');

  // Get parent's children
  const { data: children = [], isLoading: loadingChildren } = useQuery({
    queryKey: ['parent-children', schoolId, parentId],
    queryFn: async () => {
      const links = await parentStudentLinksData.where({
        school_id: schoolId,
        parent_id: parentId
      });
      return links;
    }
  });

  const activeChildId = selectedChildId || (children.length > 0 ? children[0].student_id : '');

  // Get reports for selected child
  const { data: reports = [], isLoading: loadingReports } = useQuery({
    queryKey: ['parent-reports', schoolId, activeChildId],
    queryFn: async () => {
      if (!activeChildId) return [];
      const allReports = await reportsData.where({
        school_id: schoolId,
        student_id: activeChildId
      });
      // Only return published reports visible to parents
      return allReports.filter(r =>
        r.status === 'published' && r.visibility?.visible_to_parent
      );
    },
    enabled: !!activeChildId
  });

  const selectedReport = selectedReportId
    ? reports.find(r => r.id === selectedReportId)
    : null;

  const isLoading = loadingChildren || loadingReports;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-slate-600">No children linked to your account</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Child Reports</h2>
        <p className="text-sm text-slate-600 mt-1">View your child's academic reports and progress</p>
      </div>

      {/* Child Selection */}
      {children.length > 1 && (
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Select Child</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {children.map((link) => (
              <Card
                key={link.student_id}
                className={`cursor-pointer hover:shadow-md transition-all ${
                  activeChildId === link.student_id ? 'ring-2 ring-indigo-600' : ''
                }`}
                onClick={() => {
                  setSelectedChildId(link.student_id);
                  setSelectedReportId(null);
                }}
              >
                <CardContent className="pt-4">
                  <p className="font-semibold text-slate-900">{link.student_name}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {link.relationship === 'mother' && '👩 Mother'}
                    {link.relationship === 'father' && '👨 Father'}
                    {link.relationship === 'guardian' && '👤 Guardian'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reports */}
      {reports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No reports available yet</p>
            <p className="text-sm text-slate-500 mt-2">Reports will appear here when the school publishes them.</p>
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
                userRole="parent"
              />
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}