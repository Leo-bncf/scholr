import { Group, Row } from '@/components/app/AppShell';
import { Field, SelectField, FilterBar } from '@/components/app/Field';
import StatusChip from '@/components/app/StatusChip';
import Notice from '@/components/app/Notice';
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, Download, FileText, BarChart2, Shield, AlertTriangle } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { logAudit, AuditActions, AuditLevels } from '@/components/utils/auditLogger';
import * as behaviorRecordsData from '@/data/behaviorRecords';

function downloadCSV(filename, rows, headers) {
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function BehaviorExport({ schoolId, schoolName }) {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterType, setFilterType] = useState('all');
  const [includeStaffOnly, setIncludeStaffOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['behavior-export', schoolId],
    queryFn: () => behaviorRecordsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const getFiltered = (forceIncludeStaffOnly = false) => {
    return records.filter(r => {
      if (r.date < startDate || r.date > endDate) return false;
      if (!forceIncludeStaffOnly && !includeStaffOnly && r.staff_only) return false;
      if (filterType !== 'all' && r.type !== filterType) return false;
      return true;
    });
  };

  const scopeLabel = schoolName?.replace(/\s+/g, '_') || 'school';

  const exportFullLog = async () => {
    setIsExporting(true);
    const data = getFiltered();
    const rows = data.map(r => ({
      Date: r.date,
      Student: r.student_name,
      Type: r.type,
      Category: r.category || '',
      Severity: r.severity || '',
      Title: r.title,
      Description: r.description || '',
      'Action Taken': r.action_taken || '',
      'Follow-up Required': r.follow_up_required ? 'Yes' : 'No',
      'Follow-up Completed': r.follow_up_completed ? 'Yes' : 'No',
      'Visible to Student': r.visible_to_student ? 'Yes' : 'No',
      'Visible to Parent': r.visible_to_parent ? 'Yes' : 'No',
      'Staff Only': r.staff_only ? 'Yes' : 'No',
      'Pastoral Reviewed': r.pastoral_reviewed ? 'Yes' : 'No',
      'Recorded By': r.recorded_by_name || '',
    }));
    const headers = ['Date','Student','Type','Category','Severity','Title','Description','Action Taken','Follow-up Required','Follow-up Completed','Visible to Student','Visible to Parent','Staff Only','Pastoral Reviewed','Recorded By'];
    downloadCSV(`behavior_log_${scopeLabel}_${startDate}_${endDate}.csv`, rows, headers);
    await logAudit({ action: AuditActions.DATA_EXPORT, entityType: 'BehaviorRecord', entityId: schoolId, details: `Exported full behavior log: ${data.length} records`, level: AuditLevels.INFO, schoolId });
    setIsExporting(false);
  };

  const exportStudentSummary = async () => {
    setIsExporting(true);
    const data = getFiltered();
    const map = {};
    data.forEach(r => {
      if (!map[r.student_id]) map[r.student_id] = { Student: r.student_name, Incidents: 0, Concerns: 0, Positives: 0, Notes: 0, 'High/Critical': 0, 'Follow-up Pending': 0 };
      if (r.type === 'incident') map[r.student_id].Incidents++;
      if (r.type === 'concern') map[r.student_id].Concerns++;
      if (r.type === 'positive') map[r.student_id].Positives++;
      if (r.type === 'note') map[r.student_id].Notes++;
      if (r.severity === 'high' || r.severity === 'critical') map[r.student_id]['High/Critical']++;
      if (r.follow_up_required && !r.follow_up_completed) map[r.student_id]['Follow-up Pending']++;
    });
    const rows = Object.values(map);
    downloadCSV(`behavior_summary_${scopeLabel}_${startDate}_${endDate}.csv`, rows, ['Student','Incidents','Concerns','Positives','Notes','High/Critical','Follow-up Pending']);
    await logAudit({ action: AuditActions.DATA_EXPORT, entityType: 'BehaviorRecord', entityId: schoolId, details: `Exported behavior summary: ${rows.length} students`, level: AuditLevels.INFO, schoolId });
    setIsExporting(false);
  };

  const exportFollowUpReport = async () => {
    setIsExporting(true);
    const data = records.filter(r => r.follow_up_required && r.date >= startDate && r.date <= endDate);
    const rows = data.map(r => ({
      Date: r.date,
      Student: r.student_name,
      Title: r.title,
      Severity: r.severity || '',
      'Follow-up Completed': r.follow_up_completed ? 'Yes' : 'No',
      'Follow-up Note': r.follow_up_note || '',
      'Pastoral Reviewed': r.pastoral_reviewed ? 'Yes' : 'No',
      'Recorded By': r.recorded_by_name || '',
    }));
    downloadCSV(`behavior_followups_${scopeLabel}_${startDate}_${endDate}.csv`, rows, ['Date','Student','Title','Severity','Follow-up Completed','Follow-up Note','Pastoral Reviewed','Recorded By']);
    await logAudit({ action: AuditActions.DATA_EXPORT, entityType: 'BehaviorRecord', entityId: schoolId, details: `Exported follow-up report: ${rows.length} records`, level: AuditLevels.INFO, schoolId });
    setIsExporting(false);
  };

  const exportPastoralLog = async () => {
    setIsExporting(true);
    const data = getFiltered(true).filter(r => r.pastoral_reviewed || r.severity === 'high' || r.severity === 'critical' || r.staff_only);
    const rows = data.map(r => ({
      Date: r.date,
      Student: r.student_name,
      Type: r.type,
      Severity: r.severity || '',
      Title: r.title,
      Description: r.description || '',
      'Staff Only': r.staff_only ? 'Yes' : 'No',
      'Pastoral Reviewed': r.pastoral_reviewed ? 'Yes' : 'No',
      'Reviewed By': r.pastoral_reviewed_by || '',
      'Reviewed At': r.pastoral_reviewed_at ? format(new Date(r.pastoral_reviewed_at), 'yyyy-MM-dd HH:mm') : '',
      'Recorded By': r.recorded_by_name || '',
    }));
    downloadCSV(`behavior_pastoral_log_${scopeLabel}_${startDate}_${endDate}.csv`, rows, ['Date','Student','Type','Severity','Title','Description','Staff Only','Pastoral Reviewed','Reviewed By','Reviewed At','Recorded By']);
    await logAudit({ action: AuditActions.DATA_EXPORT, entityType: 'BehaviorRecord', entityId: schoolId, details: `Exported pastoral log (includes staff-only): ${rows.length} records`, level: AuditLevels.WARNING, schoolId });
    setIsExporting(false);
  };

  const filteredCount = getFiltered().length;

  const EXPORTS = [
    { title: 'Full Behavior Log', desc: 'Complete record-by-record export respecting visibility settings. Suitable for internal review or incident logs.', icon: FileText, action: exportFullLog },
    { title: 'Student Summary Report', desc: 'Per-student aggregated counts of incident types, severity flags, and follow-up status. Ideal for parent meetings.', icon: BarChart2, action: exportStudentSummary },
    { title: 'Follow-up Tracker', desc: 'All records requiring follow-up with completion status and pastoral review tracking. For welfare team coordination.', icon: AlertTriangle, action: exportFollowUpReport },
    { title: 'Pastoral & Safeguarding Log', desc: 'Includes high/critical, staff-only, and pastoral-reviewed records. Restricted export — logged as sensitive.', icon: Shield, action: exportPastoralLog, sensitive: true },
  ];

  return (
    <div className="space-y-4">
      <Notice title="What leaves the building, and what does not">
        Every export is limited to your school and written to the audit trail. Staff-only records are
        held back unless you ask for them below, and any export that includes them is marked sensitive.
      </Notice>

      <FilterBar>
        <Field label="From" htmlFor="bex-from">
          <input id="bex-from" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="app-input scholr-focus" />
        </Field>
        <Field label="To" htmlFor="bex-to">
          <input id="bex-to" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="app-input scholr-focus" />
        </Field>
        <Field label="Type" htmlFor="bex-type">
          <SelectField
            id="bex-type" label="Record type" value={filterType} onChange={setFilterType}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'positive', label: 'Positive' },
              { value: 'concern', label: 'Concern' },
              { value: 'incident', label: 'Incident' },
              { value: 'note', label: 'Note' },
            ]}
          />
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.45rem', fontSize: '.85rem', color: 'var(--body)', cursor: 'pointer', paddingBottom: '.4rem' }}>
          <input
            type="checkbox"
            checked={includeStaffOnly}
            onChange={e => setIncludeStaffOnly(e.target.checked)}
            className="w-4 h-4 scholr-focus"
          />
          Include staff-only records
        </label>
      </FilterBar>

      {includeStaffOnly && (
        <Notice tone="crit" title="This export will be marked sensitive">
          Staff-only records are included. The audit trail will record who took this export and when.
        </Notice>
      )}

      <Group
        title="What you can export"
        action={
          <span className="scholr-label">
            {isLoading ? '…' : `${filteredCount} record${filteredCount === 1 ? '' : 's'} in scope`}
          </span>
        }
      >
        {EXPORTS.map(exp => (
          <Row
            key={exp.title}
            label={exp.title}
            detail={exp.desc}
          >
            {exp.sensitive && <StatusChip tone="crit">Sensitive</StatusChip>}
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
          Nothing matches these filters, so there is nothing to export.
        </p>
      )}
    </div>
  );
}
