import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Calendar, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import * as attendanceData from '@/data/attendance';

export default function ChildAttendanceOverview({ schoolId, studentId }) {
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['parent-child-attendance', schoolId, studentId],
    queryFn: () => attendanceData.whereRecords({
      school_id: schoolId,
      student_id: studentId
    }, { order: 'date', ascending: false }),
    enabled: !!schoolId && !!studentId,
  });

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  }

  if (attendanceRecords.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <Calendar className="w-10 h-10 mx-auto mb-2 text-slate-300" />
        <p className="text-sm">No attendance records yet</p>
      </div>
    );
  }

  const statusCounts = attendanceRecords.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'late': return <Clock className="w-4 h-4 text-amber-600" />;
      case 'excused': return <AlertCircle className="w-4 h-4 text-blue-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'absent': return 'bg-red-50 text-red-700 border-red-200';
      case 'late': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'excused': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const attendanceRate = ((statusCounts.present || 0) / attendanceRecords.length * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 rounded-lg border border-emerald-200 p-4">
          <p className="text-sm text-emerald-700 font-medium">Present</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{statusCounts.present || 0}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-700 font-medium">Absent</p>
          <p className="text-2xl font-bold text-red-900 mt-1">{statusCounts.absent || 0}</p>
        </div>
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-4">
          <p className="text-sm text-amber-700 font-medium">Late</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{statusCounts.late || 0}</p>
        </div>
        <div className="bg-indigo-50 rounded-lg border border-indigo-200 p-4">
          <p className="text-sm text-indigo-700 font-medium">Rate</p>
          <p className="text-2xl font-bold text-indigo-900 mt-1">{attendanceRate}%</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-slate-900 mb-3">Recent Records</h4>
        <div className="space-y-2">
          {attendanceRecords.slice(0, 10).map(record => (
            <div key={record.id} className={`rounded-lg border p-3 ${getStatusColor(record.status)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(record.status)}
                  <span className="font-medium capitalize">{record.status}</span>
                </div>
                <span className="text-xs">{record.date ? format(new Date(record.date), 'MMM d, yyyy') : ''}</span>
              </div>
              {record.note && (
                <p className="text-sm mt-2">{record.note}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}