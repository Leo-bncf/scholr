import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileText, BarChart2, Calendar, Shield } from 'lucide-react';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { logAudit, AuditActions, AuditLevels } from '@/components/utils/auditLogger';
import * as attendanceData from '@/data/attendance';
import * as classesData from '@/data/classes';
import * as academics from '@/data/academics';

function downloadCSV(filename, rows, headers) {
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AttendanceExport({ schoolId, schoolName }) {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterClass, setFilterClass] = useState('all');
  const [filterCohort, setFilterCohort] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance-export-data', schoolId],
    queryFn: () => attendanceData.whereRecords({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-for-export', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: cohorts = [] } = useQuery({
    queryKey: ['cohorts-for-export', schoolId],
    queryFn: () => academics.whereCohorts({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const getFiltered = () => {
    return records.filter(r => {
      if (r.date < startDate || r.date > endDate) return false;
      if (filterClass !== 'all' && r.class_id !== filterClass) return false;
      if (filterCohort !== 'all') {
        const cohort = cohorts.find(c => c.id === filterCohort);
        if (!cohort?.student_ids?.includes(r.student_id)) return false;
      }
      return true;
    });
  };

  const getClassName = (classId) => classes.find(c => c.id === classId)?.name || classId;

  const exportRawLog = async () => {
    setIsExporting(true);
    const data = getFiltered();
    const rows = data.map(r => ({
      Date: r.date,
      Student: r.student_name,
      Class: getClassName(r.class_id),
      Status: r.status,
      Note: r.note || '',
      'Reason Category': r.reason_category || '',
      'Recorded By': r.recorded_by || '',
      'Last Corrected At': r.last_corrected_at ? format(new Date(r.last_corrected_at), 'yyyy-MM-dd HH:mm') : '',
      'Last Corrected By': r.last_corrected_by || '',
      'Correction Count': (r.correction_history || []).length,
    }));
    const headers = ['Date','Student','Class','Status','Note','Reason Category','Recorded By','Last Corrected At','Last Corrected By','Correction Count'];
    downloadCSV(`attendance_log_${schoolName?.replace(/\s+/g,'_')}_${startDate}_${endDate}.csv`, rows, headers);
    await logAudit({ action: AuditActions.DATA_EXPORT, entityType: 'AttendanceRecord', entityId: schoolId, details: `Exported raw attendance log: ${data.length} records from ${startDate} to ${endDate}`, level: AuditLevels.INFO, schoolId });
    setIsExporting(false);
  };

  const exportSummaryReport = async () => {
    setIsExporting(true);
    const data = getFiltered();
    const studentMap = {};
    data.forEach(r => {
      if (!studentMap[r.student_id]) {
        studentMap[r.student_id] = { Student: r.student_name, Class: getClassName(r.class_id), Total: 0, Present: 0, Absent: 0, Late: 0, Excused: 0 };
      }
      studentMap[r.student_id].Total++;
      const key = r.status.charAt(0).toUpperCase() + r.status.slice(1);
      if (studentMap[r.student_id][key] !== undefined) studentMap[r.student_id][key]++;
    });
    const rows = Object.values(studentMap).map(s => ({
      ...s,
      'Attendance Rate (%)': s.Total > 0 ? (s.Present / s.Total * 100).toFixed(1) : '0',
    }));
    const headers = ['Student','Class','Total','Present','Absent','Late','Excused','Attendance Rate (%)'];
    downloadCSV(`attendance_summary_${schoolName?.replace(/\s+/g,'_')}_${startDate}_${endDate}.csv`, rows, headers);
    await logAudit({ action: AuditActions.DATA_EXPORT, entityType: 'AttendanceRecord', entityId: schoolId, details: `Exported attendance summary: ${rows.length} students from ${startDate} to ${endDate}`, level: AuditLevels.INFO, schoolId });
    setIsExporting(false);
  };

  const exportAuditTrail = async () => {
    setIsExporting(true);
    const data = getFiltered().filter(r => (r.correction_history || []).length > 0);
    const rows = [];
    data.forEach(r => {
      (r.correction_history || []).forEach(h => {
        rows.push({
          'Record Date': r.date,
          Student: r.student_name,
          Class: getClassName(r.class_id),
          'Previous Status': h.previous_status,
          'New Status': h.new_status,
          'Corrected By': h.corrected_by_name,
          'Corrected At': h.corrected_at ? format(new Date(h.corrected_at), 'yyyy-MM-dd HH:mm') : '',
          Reason: h.reason || '',
        });
      });
    });
    const headers = ['Record Date','Student','Class','Previous Status','New Status','Corrected By','Corrected At','Reason'];
    downloadCSV(`attendance_audit_trail_${schoolName?.replace(/\s+/g,'_')}_${startDate}_${endDate}.csv`, rows, headers);
    await logAudit({ action: AuditActions.DATA_EXPORT, entityType: 'AttendanceRecord', entityId: schoolId, details: `Exported attendance audit trail: ${rows.length} correction entries from ${startDate} to ${endDate}`, level: AuditLevels.WARNING, schoolId });
    setIsExporting(false);
  };

  const exportDailyBreakdown = async () => {
    setIsExporting(true);
    const data = getFiltered();
    const days = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
    const rows = days.map(day => {
      const d = format(day, 'yyyy-MM-dd');
      const dayRecs = data.filter(r => r.date === d);
      const total = dayRecs.length;
      const present = dayRecs.filter(r => r.status === 'present').length;
      const absent = dayRecs.filter(r => r.status === 'absent').length;
      const late = dayRecs.filter(r => r.status === 'late').length;
      const excused = dayRecs.filter(r => r.status === 'excused').length;
      return {
        Date: d,
        'Day of Week': format(day, 'EEEE'),
        Total: total,
        Present: present,
        Absent: absent,
        Late: late,
        Excused: excused,
        'Attendance Rate (%)': total > 0 ? (present / total * 100).toFixed(1) : '0',
      };
    });
    const headers = ['Date','Day of Week','Total','Present','Absent','Late','Excused','Attendance Rate (%)'];
    downloadCSV(`attendance_daily_${schoolName?.replace(/\s+/g,'_')}_${startDate}_${endDate}.csv`, rows, headers);
    await logAudit({ action: AuditActions.DATA_EXPORT, entityType: 'AttendanceRecord', entityId: schoolId, details: `Exported daily attendance breakdown from ${startDate} to ${endDate}`, level: AuditLevels.INFO, schoolId });
    setIsExporting(false);
  };

  const filteredCount = getFiltered().length;

  const EXPORTS = [
    {
      title: 'Raw Attendance Log',
      description: 'Full record-by-record export including status, notes, reason categories, recorded-by, and correction metadata. Suitable for regulatory submission.',
      icon: FileText,
      color: 'indigo',
      action: exportRawLog,
    },
    {
      title: 'Student Summary Report',
      description: 'Aggregated totals per student: present, absent, late, excused counts and attendance rate. Ideal for parent meetings or internal reporting.',
      icon: BarChart2,
      color: 'emerald',
      action: exportSummaryReport,
    },
    {
      title: 'Daily Breakdown',
      description: 'School-wide daily attendance rates across the selected period. Useful for leadership trend review.',
      icon: Calendar,
      color: 'amber',
      action: exportDailyBreakdown,
    },
    {
      title: 'Audit Trail (Corrections)',
      description: 'All attendance corrections with before/after status, who corrected, when, and the reason provided. Full traceability for governance.',
      icon: Shield,
      color: 'rose',
      action: exportAuditTrail,
    },
  ];

  const colorMap = {
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
    amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
    rose: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100',
  };
  const iconBg = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <div className="space-y-6">
      {/* Scope notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">School-scoped exports only</p>
          <p className="text-xs text-blue-700 mt-0.5">All exports are strictly limited to your school's data. Exports are logged in the audit trail.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Cohort</label>
          <select value={filterCohort} onChange={e => setFilterCohort(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="all">All Cohorts</option>
            {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Class</label>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="text-sm text-slate-500">
          <span className="font-bold text-slate-800">{isLoading ? '…' : filteredCount}</span> records in scope
        </div>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORTS.map(exp => {
          const Icon = exp.icon;
          return (
            <div key={exp.title} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg[exp.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{exp.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{exp.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={exp.action}
                disabled={isExporting || isLoading || filteredCount === 0}
                className={`w-full border ${colorMap[exp.color]} font-medium`}
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                Export as CSV
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}