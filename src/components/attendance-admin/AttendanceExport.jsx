import { Group, Row } from '@/components/app/AppShell';
import { Field, SelectField, FilterBar } from '@/components/app/Field';
import Notice from '@/components/app/Notice';
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
      action: exportRawLog,
    },
    {
      title: 'Student Summary Report',
      description: 'Aggregated totals per student: present, absent, late, excused counts and attendance rate. Ideal for parent meetings or internal reporting.',
      icon: BarChart2,
      action: exportSummaryReport,
    },
    {
      title: 'Daily Breakdown',
      description: 'School-wide daily attendance rates across the selected period. Useful for leadership trend review.',
      icon: Calendar,
      action: exportDailyBreakdown,
    },
    {
      title: 'Audit Trail (Corrections)',
      description: 'All attendance corrections with before/after status, who corrected, when, and the reason provided. Full traceability for governance.',
      icon: Shield,
      action: exportAuditTrail,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Four exports in four hues, each with a filled icon chip, made the page
          look like a decision about colour rather than about data. They are
          four rows of the same kind of thing. */}
      <Notice title="These exports cover your school only">
        Every export is limited to your school&apos;s records, and each one is written to the audit trail.
      </Notice>

      <FilterBar>
        <Field label="From" htmlFor="exp-from">
          <input id="exp-from" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="app-input scholr-focus" />
        </Field>
        <Field label="To" htmlFor="exp-to">
          <input id="exp-to" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="app-input scholr-focus" />
        </Field>
        <Field label="Cohort" htmlFor="exp-cohort">
          <SelectField
            id="exp-cohort" label="Cohort" value={filterCohort} onChange={setFilterCohort}
            options={[{ value: 'all', label: 'All cohorts' }, ...cohorts.map(c => ({ value: c.id, label: c.name }))]}
          />
        </Field>
        <Field label="Class" htmlFor="exp-class">
          <SelectField
            id="exp-class" label="Class" value={filterClass} onChange={setFilterClass}
            options={[{ value: 'all', label: 'All classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]}
          />
        </Field>
      </FilterBar>

      <Group
        title="What you can export"
        action={
          <span className="scholr-label">
            {isLoading ? '…' : `${filteredCount} record${filteredCount === 1 ? '' : 's'} in scope`}
          </span>
        }
      >
        {EXPORTS.map(exp => (
          <Row key={exp.title} label={exp.title} detail={exp.description}>
            <Button
              variant="outline"
              size="sm"
              onClick={exp.action}
              disabled={isExporting || isLoading || filteredCount === 0}
              className="gap-2 flex-shrink-0"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              CSV
            </Button>
          </Row>
        ))}
      </Group>

      {!isLoading && filteredCount === 0 && (
        <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--muted)' }}>
          Nothing matches these filters, so there is nothing to export. Widen the dates or clear the class filter.
        </p>
      )}
    </div>
  );
}
