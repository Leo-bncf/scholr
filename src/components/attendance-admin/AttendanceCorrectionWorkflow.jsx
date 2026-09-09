import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Search, PenLine, History, CheckCircle2, XCircle, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { logAudit, AuditActions, AuditLevels } from '@/components/utils/auditLogger';
import { useUser } from '@/components/auth/UserContext';
import * as attendancePoliciesData from '@/data/attendancePolicies';
import * as attendanceData from '@/data/attendance';
import * as classesData from '@/data/classes';

const STATUS_META = {
  present: { label: 'Present', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  absent:  { label: 'Absent',  icon: XCircle,      bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
  late:    { label: 'Late',    icon: Clock,         bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  excused: { label: 'Excused', icon: AlertCircle,   bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.absent;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.bg} ${meta.text} ${meta.border}`}>
      <Icon className="w-3 h-3" /> {meta.label}
    </span>
  );
}

export default function AttendanceCorrectionWorkflow({ schoolId }) {
  const queryClient = useQueryClient();
  const { user, membership } = useUser();
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 13), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [correcting, setCorrecting] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');
  const [expandedHistory, setExpandedHistory] = useState({});

  const { data: policy = {} } = useQuery({
    queryKey: ['attendance-policy', schoolId],
    queryFn: async () => {
      const p = await attendancePoliciesData.where({ school_id: schoolId });
      return p[0] || {};
    },
    enabled: !!schoolId,
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance-corrections', schoolId, dateFrom, dateTo],
    queryFn: () => attendanceData.whereRecords({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-for-corrections', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const classMap = Object.fromEntries(classes.map(c => [c.id, c.name]));

  const correctMutation = useMutation({
    mutationFn: async ({ record, newStatus, reason }) => {
      const correctionEntry = {
        corrected_at: new Date().toISOString(),
        corrected_by: user?.id || '',
        corrected_by_name: user?.full_name || user?.email || 'Admin',
        previous_status: record.status,
        new_status: newStatus,
        reason,
      };
      await attendanceData.update(record.id, {
        status: newStatus,
        correction_history: [...(record.correction_history || []), correctionEntry],
        last_corrected_at: correctionEntry.corrected_at,
        last_corrected_by: correctionEntry.corrected_by_name,
      });
      await logAudit({
        action: AuditActions.ATTENDANCE_UPDATED,
        entityType: 'AttendanceRecord',
        entityId: record.id,
        details: `Attendance corrected: ${record.student_name} on ${record.date} — ${record.status} → ${newStatus}. Reason: ${reason}`,
        level: AuditLevels.WARNING,
        schoolId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-corrections', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['school-attendance'] });
      setCorrecting(null);
      setNewStatus('');
      setReason('');
    },
  });

  const filtered = records.filter(r => {
    if (r.date < dateFrom || r.date > dateTo) return false;
    if (search && !r.student_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterClass !== 'all' && r.class_id !== filterClass) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const requireReason = policy.require_correction_reason !== false;

  const handleCorrect = () => {
    if (!newStatus) return;
    if (requireReason && !reason.trim()) return;
    correctMutation.mutate({ record: correcting, newStatus, reason });
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-48">
          <label className="text-xs font-semibold text-slate-600 block mb-1">Search Student</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Student name…" className="pl-9 h-9 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Class</label>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="excused">Excused</option>
          </select>
        </div>
        {filtered.length > 0 && (
          <span className="text-xs text-slate-500 self-end pb-2">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <PenLine className="w-10 h-10 mx-auto mb-2 text-slate-200" />
            <p className="text-sm">No records found for the selected filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Class</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Note</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">History</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(record => {
                const hasHistory = (record.correction_history || []).length > 0;
                const expanded = expandedHistory[record.id];
                return (
                  <React.Fragment key={record.id}>
                    <tr className={`hover:bg-slate-50 ${hasHistory ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-900">{record.student_name}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{record.date}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{classMap[record.class_id] || '—'}</td>
                      <td className="px-4 py-3 text-center"><StatusBadge status={record.status} /></td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate hidden lg:table-cell">{record.note || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {hasHistory ? (
                          <button
                            onClick={() => setExpandedHistory(prev => ({ ...prev, [record.id]: !prev[record.id] }))}
                            className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full hover:bg-amber-100"
                          >
                            <History className="w-3 h-3" />
                            {record.correction_history.length}
                            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setCorrecting(record); setNewStatus(record.status); setReason(''); }}
                          className="text-xs h-7"
                        >
                          <PenLine className="w-3 h-3 mr-1" /> Correct
                        </Button>
                      </td>
                    </tr>
                    {expanded && hasHistory && (
                      <tr>
                        <td colSpan={7} className="px-6 py-3 bg-amber-50 border-b border-amber-100">
                          <p className="text-xs font-bold text-amber-800 mb-2 flex items-center gap-1"><History className="w-3 h-3" /> Correction History</p>
                          <div className="space-y-1.5">
                            {record.correction_history.map((h, i) => (
                              <div key={i} className="text-xs text-slate-700 bg-white border border-amber-100 rounded px-3 py-1.5 flex flex-wrap gap-2 items-center">
                                <span className="font-semibold">{h.corrected_by_name}</span>
                                <span className="text-slate-400">{h.corrected_at ? format(new Date(h.corrected_at), 'dd MMM yyyy HH:mm') : ''}</span>
                                <StatusBadge status={h.previous_status} />
                                <span className="text-slate-400">→</span>
                                <StatusBadge status={h.new_status} />
                                {h.reason && <span className="text-slate-600 italic">"{h.reason}"</span>}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Correction Dialog */}
      <Dialog open={!!correcting} onOpenChange={() => setCorrecting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Correct Attendance Record</DialogTitle>
          </DialogHeader>
          {correcting && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-slate-900">{correcting.student_name}</p>
                <p className="text-slate-500">{correcting.date} · Current: <StatusBadge status={correcting.status} /></p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">New Status *</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                  Reason for Correction {requireReason ? '*' : '(optional)'}
                </label>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Explain why this record is being corrected…"
                  rows={3}
                />
                {requireReason && !reason.trim() && reason.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">A reason is required to save the correction.</p>
                )}
              </div>
              {requireReason && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <History className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">This correction will be permanently recorded in the audit trail and cannot be undone.</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrecting(null)}>Cancel</Button>
            <Button
              onClick={handleCorrect}
              disabled={!newStatus || (requireReason && !reason.trim()) || correctMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {correctMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}