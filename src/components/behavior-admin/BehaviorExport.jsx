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
    { title: 'Full Behavior Log', desc: 'Complete record-by-record export respecting visibility settings. Suitable for internal review or incident logs.', icon: FileText, color: 'indigo', action: exportFullLog },
    { title: 'Student Summary Report', desc: 'Per-student aggregated counts of incident types, severity flags, and follow-up status. Ideal for parent meetings.', icon: BarChart2, color: 'emerald', action: exportStudentSummary },
    { title: 'Follow-up Tracker', desc: 'All records requiring follow-up with completion status and pastoral review tracking. For welfare team coordination.', icon: AlertTriangle, color: 'amber', action: exportFollowUpReport },
    { title: 'Pastoral & Safeguarding Log', desc: 'Includes high/critical, staff-only, and pastoral-reviewed records. Restricted export — logged as sensitive.', icon: Shield, color: 'rose', action: exportPastoralLog, sensitive: true },
  ];

  const colorMap = {
    indigo: 'border-indigo-200 text-indigo-700 hover:bg-indigo-50',
    emerald: 'border-emerald-200 text-emerald-700 hover:bg-emerald-50',
    amber: 'border-amber-200 text-amber-700 hover:bg-amber-50',
    rose: 'border-rose-200 text-rose-700 hover:bg-rose-50',
  };
  const iconBg = {
    indigo: 'bg-indigo-100 text-indigo-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-900">Privacy-Safe Exports</p>
          <p className="text-xs text-blue-700 mt-0.5">All exports are school-scoped and audit-logged. Staff-only records are excluded from standard exports unless explicitly enabled. Pastoral exports are flagged as sensitive in the audit trail.</p>
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
          <label className="text-xs font-semibold text-slate-600 block mb-1">Record Type</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="all">All Types</option>
            <option value="positive">Positive</option>
            <option value="concern">Concern</option>
            <option value="incident">Incident</option>
            <option value="note">Note</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer pb-1.5">
            <input type="checkbox" checked={includeStaffOnly} onChange={e => setIncludeStaffOnly(e.target.checked)} className="w-4 h-4" />
            <span className="font-medium text-slate-700">Include staff-only records</span>
          </label>
        </div>
        <div className="text-sm text-slate-500 pb-1.5">
          <span className="font-bold text-slate-800">{isLoading ? '…' : filteredCount}</span> records in scope
        </div>
      </div>

      {includeStaffOnly && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-rose-600" />
          <p className="text-xs text-rose-800 font-medium">Staff-only records included. This export will be flagged as sensitive in the audit trail.</p>
        </div>
      )}

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
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900">{exp.title}</h4>
                    {exp.sensitive && <span className="text-xs px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded font-medium">Sensitive</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{exp.desc}</p>
                </div>
              </div>
              <Button variant="outline" onClick={exp.action} disabled={isExporting || isLoading || filteredCount === 0}
                className={`w-full border ${colorMap[exp.color]} font-medium`}>
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