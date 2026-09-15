import { Group, Row } from '@/components/app/AppShell';
import { Field, SelectField, SearchField, FilterBar } from '@/components/app/Field';
import DataTable from '@/components/app/DataTable';
import StatusChip from '@/components/app/StatusChip';
import Notice from '@/components/app/Notice';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, PenLine, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { logAudit, AuditActions, AuditLevels } from '@/components/utils/auditLogger';
import { useUser } from '@/components/auth/UserContext';
import * as attendancePoliciesData from '@/data/attendancePolicies';
import * as attendanceData from '@/data/attendance';
import * as classesData from '@/data/classes';

/* Present is the expected outcome; giving it a green badge means a register of
   ordinary days reads as a wall of colour and the one absence does not stand
   out. Excused is settled, so it is neutral too. */
const STATUS_META = {
  present: { label: 'Present', tone: null },
  absent:  { label: 'Absent',  tone: 'crit' },
  late:    { label: 'Late',    tone: 'warn' },
  excused: { label: 'Excused', tone: 'mute' },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.absent;
  if (!meta.tone) return <span style={{ fontSize: '.86rem', color: 'var(--body)' }}>{meta.label}</span>;
  return <StatusChip tone={meta.tone}>{meta.label}</StatusChip>;
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
    <div className="space-y-4">
      <FilterBar>
        <Field label="Student" htmlFor="cor-q">
          <SearchField id="cor-q" label="Search students" value={search} onChange={setSearch} placeholder="Student name…" />
        </Field>
        <Field label="From" htmlFor="cor-from">
          <input id="cor-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="app-input scholr-focus" />
        </Field>
        <Field label="To" htmlFor="cor-to">
          <input id="cor-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="app-input scholr-focus" />
        </Field>
        <Field label="Class" htmlFor="cor-class">
          <SelectField
            id="cor-class" label="Class" value={filterClass} onChange={setFilterClass}
            options={[{ value: 'all', label: 'All classes' }, ...classes.map(c => ({ value: c.id, label: c.name }))]}
          />
        </Field>
        <Field label="Status" htmlFor="cor-status">
          <SelectField
            id="cor-status" label="Status" value={filterStatus} onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'present', label: 'Present' },
              { value: 'absent', label: 'Absent' },
              { value: 'late', label: 'Late' },
              { value: 'excused', label: 'Excused' },
            ]}
          />
        </Field>
      </FilterBar>

      <Group
        title="Records"
        action={<span className="scholr-label">{filtered.length} in range</span>}
      >
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin scholr-accent" /></div>
        ) : (
          <DataTable
            columns={[
              { key: 'student_name', header: 'Student' },
              { key: 'date', header: 'Date' },
              { key: 'class', header: 'Class', render: (r) => classMap[r.class_id] || '—' },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              { key: 'note', header: 'Note', render: (r) => r.note || '—' },
              {
                key: 'history',
                header: 'Corrected',
                /* The row used to be tinted amber when it had been corrected,
                   which put the emphasis on the correction rather than on the
                   record. It is a fact about the row, so it is a cell. */
                render: (r) => {
                  const history = r.correction_history || [];
                  if (history.length === 0) return '—';
                  return (
                    <button
                      type="button"
                      onClick={() => setExpandedHistory(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                      className="scholr-focus"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '.25rem',
                        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                        font: 'inherit', fontSize: '.82rem', color: 'var(--brand)',
                      }}
                      aria-expanded={!!expandedHistory[r.id]}
                    >
                      {history.length} time{history.length === 1 ? '' : 's'}
                      {expandedHistory[r.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  );
                },
              },
              {
                key: 'actions',
                header: '',
                render: (r) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setCorrecting(r); setNewStatus(r.status); setReason(''); }}
                    className="text-xs h-7"
                  >
                    <PenLine className="w-3 h-3 mr-1" /> Correct
                  </Button>
                ),
              },
            ]}
            rows={filtered}
            rowKey={(r) => r.id}
            empty="No attendance records match these filters."
          />
        )}
      </Group>

      {/* The expanded history sits below the table rather than inside it: a row
          spanning every column inside a <tbody> broke the column widths, and a
          screen reader read it as a data row. */}
      {filtered.filter(r => expandedHistory[r.id] && (r.correction_history || []).length > 0).map(r => (
        <Group key={r.id} title={`${r.student_name} — ${r.date}`} action={<span className="scholr-label">correction history</span>}>
          {r.correction_history.map((h, i) => (
            <Row
              key={i}
              label={<>{h.previous_status} → {h.new_status}</>}
              detail={[
                h.corrected_by_name,
                h.corrected_at ? format(new Date(h.corrected_at), 'd MMM yyyy HH:mm') : null,
                h.reason ? `“${h.reason}”` : null,
              ].filter(Boolean).join(' · ')}
            />
          ))}
        </Group>
      ))}

      {/* Correction Dialog */}
      <Dialog open={!!correcting} onOpenChange={() => setCorrecting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Correct Attendance Record</DialogTitle>
          </DialogHeader>
          {correcting && (
            <div className="space-y-4">
              <div className="scholr-sunk rounded-lg p-3 text-sm">
                <p className="font-semibold scholr-ink">{correcting.student_name}</p>
                <p className="scholr-muted">{correcting.date} · Current: <StatusBadge status={correcting.status} /></p>
              </div>
              <div>
                <label className="text-sm font-semibold scholr-body block mb-1.5">New Status *</label>
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
                <label className="text-sm font-semibold scholr-body block mb-1.5">
                  Reason for Correction {requireReason ? '*' : '(optional)'}
                </label>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Explain why this record is being corrected…"
                  rows={3}
                />
                {requireReason && !reason.trim() && reason.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--crit)' }}>A reason is required to save the correction.</p>
                )}
              </div>
              {requireReason && (
                <Notice tone="warn">
                  This correction is written to the audit trail permanently and cannot be undone.
                </Notice>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrecting(null)}>Cancel</Button>
            <Button
              onClick={handleCorrect}
              disabled={!newStatus || (requireReason && !reason.trim()) || correctMutation.isPending}
              className="scholr-accent-sf hover:scholr-accent-sf"
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