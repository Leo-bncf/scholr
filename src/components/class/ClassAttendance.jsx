import React, { useState } from 'react';
import { useUser } from '@/components/auth/UserContext';
import { useQuery } from '@tanstack/react-query';
import AttendanceRecorder from '@/components/attendance/AttendanceRecorder';
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import * as attendanceData from '@/data/attendance';
import { Group, Row, GroupEmpty, Segmented } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';

const STATUS_META = {
  present: { label: 'Present', icon: CheckCircle2, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  absent:  { label: 'Absent',  icon: XCircle,      bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
  late:    { label: 'Late',    icon: Clock,         bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },
  excused: { label: 'Excused', icon: AlertCircle,   bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
};

function StudentAttendanceHistory({ classData, userId }) {
  const [range, setRange] = useState('30');

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['my-attendance', classData.id, userId],
    queryFn: () => attendanceData.whereRecords({
      school_id: classData.school_id,
      class_id: classData.id,
      student_id: userId,
    }),
    enabled: !!userId,
  });

  const cutoff = format(subDays(new Date(), parseInt(range)), 'yyyy-MM-dd');
  const filtered = records.filter(r => r.date >= cutoff).sort((a, b) => b.date.localeCompare(a.date));

  const counts = filtered.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
  const total = filtered.length;
  const rate = total > 0 ? Math.round((counts.present || 0) / total * 100) : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-base font-bold scholr-ink">My Attendance</h3>
        <select value={range} onChange={e => setRange(e.target.value)} className="px-3 py-1.5 border scholr-rule rounded-lg text-sm bg-white">
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <div key={key} className={`rounded-xl border p-4 ${meta.bg} ${meta.border}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${meta.text}`} />
                <span className={`text-xs font-semibold ${meta.text}`}>{meta.label}</span>
              </div>
              <p className={`text-2xl font-black ${meta.text}`}>{counts[key] || 0}</p>
            </div>
          );
        })}
      </div>

      {rate !== null && (
        <div className={`rounded-xl border p-4 flex items-center justify-between ${rate >= 90 ? 'bg-emerald-50 border-emerald-200' : rate >= 75 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
          <span className="text-sm font-semibold scholr-body">Attendance Rate</span>
          <span className={`text-2xl font-black ${rate >= 90 ? 'text-emerald-700' : rate >= 75 ? 'text-amber-700' : 'text-red-700'}`}>{rate}%</span>
        </div>
      )}

      {/* History List */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border scholr-rule">
          <p className="scholr-faint text-sm">No attendance records in this period.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border scholr-rule overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="scholr-sunk border-b scholr-rule">
                <th className="px-4 py-3 text-left text-xs font-semibold scholr-muted uppercase">Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold scholr-muted uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold scholr-muted uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y scholr-divide">
              {filtered.map(r => {
                const meta = STATUS_META[r.status] || STATUS_META.absent;
                const Icon = meta.icon;
                return (
                  <tr key={r.id} className="hover:scholr-sunk">
                    <td className="px-4 py-3 scholr-body font-medium">{r.date}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.bg} ${meta.text} ${meta.border}`}>
                        <Icon className="w-3 h-3" /> {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 scholr-faint text-xs italic">{r.note || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ClassAttendance({ classData, isTeacher, userId }) {
  const { membership } = useUser();
  if (!isTeacher) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <StudentAttendanceHistory classData={classData} userId={userId} />
      </div>
    );
  }
  return <TeacherAttendance classData={classData} userId={userId} teacherName={membership?.user_name} />;
}

/**
 * The register, and the registers already taken.
 *
 * "Trends" here used to render the student view with the teacher's own user
 * id — the teacher's personal attendance, which is always empty. It now lists
 * this class's past registers; opening one loads it for correction.
 */
function TeacherAttendance({ classData, userId, teacherName }) {
  const [view, setView] = useState('register');
  const [date, setDate] = useState(null);
  const from = format(subDays(new Date(), 60), 'yyyy-MM-dd');
  const to = format(new Date(), 'yyyy-MM-dd');

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['class-attendance-history', classData.id, from, to],
    queryFn: () => attendanceData.listForClassBetween(classData.id, from, to),
    enabled: view === 'history',
  });

  const days = Object.values(records.reduce((acc, r) => {
    const d = acc[r.date] || (acc[r.date] = { date: r.date, present: 0, late: 0, absent: 0, excused: 0 });
    d[r.status] = (d[r.status] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
      <div style={{ alignSelf: 'flex-start' }}>
        <Segmented
          label="Attendance views"
          value={view}
          onChange={setView}
          options={[{ value: 'register', label: 'Register' }, { value: 'history', label: 'Past registers' }]}
        />
      </div>

      {view === 'register' && (
        <AttendanceRecorder key={date || 'today'} classData={classData} teacherId={userId} teacherName={teacherName} initialDate={date || undefined} />
      )}

      {view === 'history' && (isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-lg) 0' }}>
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
        </div>
      ) : (
        <Group title="Last 60 days">
          {days.length === 0 ? (
            <GroupEmpty>No registers taken in the last 60 days.</GroupEmpty>
          ) : days.map((d) => (
            <Row
              key={d.date}
              onClick={() => { setDate(d.date); setView('register'); }}
              label={format(new Date(`${d.date}T12:00:00`), 'EEEE d MMMM')}
              detail={`${d.present} present · ${d.late} late · ${d.absent} absent${d.excused ? ` · ${d.excused} excused` : ''}`}
            >
              {d.absent > 0 ? <StatusChip tone="warn">{d.absent} absent</StatusChip> : <StatusChip tone="good">All in</StatusChip>}
            </Row>
          ))}
        </Group>
      ))}
    </div>
  );
}
