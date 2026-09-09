import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, FileText, Clock, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ReportBuilder from './ReportBuilder';
import * as reportsData from '@/data/reports';
import * as reportTemplatesData from '@/data/reportTemplates';

/**
 * Coordinator dashboard for managing academic reports
 * View generation history, publishing status, and distribution
 */
export default function CoordinatorReportingDashboard({ schoolId, academicYearId }) {
  const [reportBuilderOpen, setReportBuilderOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports', schoolId, academicYearId],
    queryFn: () => reportsData.where({
      school_id: schoolId,
      academic_year_id: academicYearId
    })
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['report-templates', schoolId],
    queryFn: () => reportTemplatesData.where({ school_id: schoolId })
  });

  // Filter reports
  const filtered = reports.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Statistics
  const stats = {
    total: reports.length,
    draft: reports.filter(r => r.status === 'draft').length,
    approved: reports.filter(r => r.status === 'approved').length,
    published: reports.filter(r => r.status === 'published').length,
    archived: reports.filter(r => r.status === 'archived').length
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-800';
      case 'ready_for_review':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'published':
        return 'bg-indigo-100 text-indigo-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'ready_for_review':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Academic Reporting</h2>
          <p className="text-sm text-slate-600 mt-1">Generate and manage formal academic reports</p>
        </div>
        <Button
          onClick={() => setReportBuilderOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 gap-2"
        >
          <Plus className="w-4 h-4" />
          Generate Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 font-semibold">Total Reports</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 font-semibold">Draft</p>
            <p className="text-2xl font-bold text-slate-600 mt-2">{stats.draft}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 font-semibold">Approved</p>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 font-semibold">Published</p>
            <p className="text-2xl font-bold text-indigo-600 mt-2">{stats.published}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-slate-600 font-semibold">Templates</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{templates.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Search Reports</label>
          <Input
            placeholder="Search by report title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-40">
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Status</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ready_for_review">Ready for Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reports List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No reports found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{report.title}</h3>
                    <div className="flex gap-3 items-center mt-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {report.report_type.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span className="ml-1">{report.status.replace(/_/g, ' ')}</span>
                      </Badge>
                      {report.student_name && (
                        <span className="text-xs text-slate-600">Student: {report.student_name}</span>
                      )}
                      {report.class_name && !report.student_id && (
                        <span className="text-xs text-slate-600">Class: {report.class_name}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Generated {new Date(report.generated_at).toLocaleDateString()} by {report.generated_by_name}
                    </p>
                    {report.visibility && (
                      <div className="flex gap-2 mt-2">
                        {report.visibility.visible_to_student && (
                          <Badge variant="outline" className="text-xs bg-blue-50">Visible to Student</Badge>
                        )}
                        {report.visibility.visible_to_parent && (
                          <Badge variant="outline" className="text-xs bg-purple-50">Visible to Parent</Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    <Button size="sm" variant="outline">View</Button>
                    {report.status === 'draft' && <Button size="sm" variant="outline">Edit</Button>}
                    {report.status === 'published' && <Button size="sm" variant="outline">Export</Button>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReportBuilder
        open={reportBuilderOpen}
        onClose={() => setReportBuilderOpen(false)}
        schoolId={schoolId}
        academicYearId={academicYearId}
      />
    </div>
  );
}