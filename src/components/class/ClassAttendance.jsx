import React, { useState } from 'react';
import { useUser } from '@/components/auth/UserContext';
import { useQuery } from '@tanstack/react-query';
import AttendanceRecorder from '@/components/attendance/AttendanceRecorder';
import { CheckCircle2, XCircle, Clock, AlertCircle, BarChart2, PenSquare } from 'lucide-react';
import { format, subDays } from 'date-fns';
import * as attendanceData from '@/data/attendance';

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
        <h3 className="text-base font-bold text-slate-900">My Attendance</h3>
        <select value={range} onChange={e => setRange(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
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
          <span className="text-sm font-semibold text-slate-700">Attendance Rate</span>
          <span className={`text-2xl font-black ${rate >= 90 ? 'text-emerald-700' : rate >= 75 ? 'text-amber-700' : 'text-red-700'}`}>{rate}%</span>
        </div>
      )}

      {/* History List */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-400 text-sm">No attendance records in this period.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => {
                const meta = STATUS_META[r.status] || STATUS_META.absent;
                const Icon = meta.icon;
                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700 font-medium">{r.date}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.bg} ${meta.text} ${meta.border}`}>
                        <Icon className="w-3 h-3" /> {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs italic">{r.note || '—'}</td>
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
  const [tab, setTab] = useState(isTeacher ? 'mark' : 'history');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-900">Attendance</h2>
        {isTeacher && (
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setTab('mark')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === 'mark' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <PenSquare className="w-3.5 h-3.5" /> Mark Attendance
            </button>
            <button
              onClick={() => setTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === 'history' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <BarChart2 className="w-3.5 h-3.5" /> Trends
            </button>
          </div>
        )}
      </div>

      {tab === 'mark' && isTeacher && (
        <AttendanceRecorder
          classData={classData}
          teacherId={userId}
          teacherName={membership?.user_name}
        />
      )}

      {(tab === 'history' || !isTeacher) && (
        <StudentAttendanceHistory classData={classData} userId={userId} />
      )}
    </div>
  );
}