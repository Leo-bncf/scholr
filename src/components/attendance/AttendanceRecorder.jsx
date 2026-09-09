import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle, Save, Users } from 'lucide-react';
import { format } from 'date-fns';
import * as attendancePoliciesData from '@/data/attendancePolicies';
import * as membershipsData from '@/data/memberships';

const DEFAULT_STATUSES = [
  { key: 'present', label: 'Present', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-300', activeBg: 'bg-emerald-500 text-white' },
  { key: 'absent',  label: 'Absent',  icon: XCircle,      color: 'text-red-600',     bg: 'bg-red-50 border-red-300',     activeBg: 'bg-red-500 text-white' },
  { key: 'late',    label: 'Late',    icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-300', activeBg: 'bg-amber-500 text-white' },
  { key: 'excused', label: 'Excused', icon: AlertCircle,   color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-300',   activeBg: 'bg-blue-500 text-white' },
];

function StatusButton({ status, selected, onClick }) {
  const Icon = status.icon;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
        selected ? status.activeBg + ' border-transparent shadow-sm' : status.bg + ' ' + status.color + ' hover:opacity-80'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {status.label}
    </button>
  );
}

export default function AttendanceRecorder({ classData, teacherId, teacherName }) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState({});
  const [notes, setNotes] = useState({});
  const [expandedNote, setExpandedNote] = useState(null);

  const { data: policy } = useQuery({
    queryKey: ['attendance-policy', classData.school_id],
    queryFn: async () => {
      const p = await attendancePoliciesData.where({ school_id: classData.school_id });
      return p[0] || null;
    },
  });

  // Build status list from policy codes or fallback
  const statuses = useMemo(() => {
    if (policy?.codes?.length) {
      return policy.codes.filter(c => c.active !== false).map(c => ({
        key: c.key,
        label: c.label,
        icon: c.key === 'present' ? CheckCircle2 : c.key === 'absent' ? XCircle : c.key === 'late' ? Clock : AlertCircle,
        color: `text-${c.color || 'slate'}-600`,
        bg: `bg-${c.color || 'slate'}-50 border-${c.color || 'slate'}-300`,
        activeBg: `bg-${c.color || 'slate'}-500 text-white`,
        requiresNote: c.requires_note,
      }));
    }
    return DEFAULT_STATUSES;
  }, [policy]);

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['class-students-attendance', classData.id],
    queryFn: async () => {
      const members = await membershipsData.where({
        school_id: classData.school_id,
        status: 'active'
      });
      return members.filter(m => classData.student_ids?.includes(m.user_id));
    },
  });

  const { data: existingRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: ['class-attendance-records', classData.id, selectedDate],
    queryFn: () => attendanceData.whereRecords({
      school_id: classData.school_id,
      class_id: classData.id,
      date: selectedDate
    }),
    enabled: !!selectedDate,
  });

  useEffect(() => {
    const initialData = {};
    const initialNotes = {};
    existingRecords.forEach(record => {
      initialData[record.student_id] = record.status;
      if (record.note) initialNotes[record.student_id] = record.note;
    });
    setAttendanceData(initialData);
    setNotes(initialNotes);
  }, [existingRecords]);

  const saveMutation = useMutation({
    mutationFn: async (records) => {
      const promises = records.map(record => {
        const existing = existingRecords.find(r => r.student_id === record.student_id);
        if (existing) {
          return attendanceData.update(existing.id, record);
        }
        return attendanceData.create(record);
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['parent-child-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-dashboard'] });
    },
  });

  const handleSave = () => {
    const records = students
      .filter(s => attendanceData[s.user_id])
      .map(s => ({
        school_id: classData.school_id,
        class_id: classData.id,
        student_id: s.user_id,
        student_name: s.user_name || s.user_email,
        date: selectedDate,
        status: attendanceData[s.user_id],
        note: notes[s.user_id] || '',
        recorded_by: teacherId,
      }));
    saveMutation.mutate(records);
  };

  const markAll = (status) => {
    const newData = {};
    students.forEach(s => { newData[s.user_id] = status; });
    setAttendanceData(newData);
  };

  const statusCounts = useMemo(() => {
    const counts = {};
    Object.values(attendanceData).forEach(s => { counts[s] = (counts[s] || 0) + 1; });
    return counts;
  }, [attendanceData]);

  const markedCount = Object.keys(attendanceData).length;
  const allMarked = markedCount === students.length && students.length > 0;

  if (loadingStudents) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
        <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">No students enrolled in this class.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-4 items-end justify-between">
        <div className="flex items-center gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          {loadingRecords && <Loader2 className="w-4 h-4 animate-spin text-slate-400 mt-5" />}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1">Mark all:</span>
            {DEFAULT_STATUSES.map(s => (
              <button
                key={s.key}
                onClick={() => markAll(s.key)}
                title={`Mark all ${s.label}`}
                className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all ${s.bg} ${s.color} hover:opacity-80`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending || markedCount === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
        </div>
      </div>

      {/* Summary row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-slate-500 font-medium">{markedCount}/{students.length} marked</span>
        {DEFAULT_STATUSES.map(s => (statusCounts[s.key] || 0) > 0 && (
          <span key={s.key} className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${s.bg} ${s.color}`}>
            <s.icon className="w-3 h-3" /> {statusCounts[s.key]} {s.label}
          </span>
        ))}
        {!allMarked && markedCount > 0 && (
          <span className="text-xs text-amber-600 font-medium">{students.length - markedCount} not yet marked</span>
        )}
        {allMarked && <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> All students marked</span>}
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Student</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map(student => {
              const current = attendanceData[student.user_id];
              return (
                <tr key={student.user_id} className={`${current ? '' : 'bg-slate-50/50'} hover:bg-slate-50 transition-colors`}>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{student.user_name || student.user_email}</p>
                      {student.grade_level && <p className="text-xs text-slate-400">{student.grade_level}</p>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1.5">
                      {DEFAULT_STATUSES.map(s => (
                        <StatusButton
                          key={s.key}
                          status={s}
                          selected={current === s.key}
                          onClick={() => setAttendanceData({ ...attendanceData, [student.user_id]: s.key })}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {expandedNote === student.user_id ? (
                      <div className="flex gap-2 items-start">
                        <Textarea
                          value={notes[student.user_id] || ''}
                          onChange={e => setNotes({ ...notes, [student.user_id]: e.target.value })}
                          placeholder="Add a note…"
                          rows={2}
                          className="text-xs flex-1"
                          autoFocus
                        />
                        <button onClick={() => setExpandedNote(null)} className="text-xs text-slate-400 hover:text-slate-600 mt-1">Done</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setExpandedNote(student.user_id)}
                        className="text-xs text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {notes[student.user_id] ? (
                          <span className="text-slate-600 italic">"{notes[student.user_id]}"</span>
                        ) : '+ add note'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {saveMutation.isSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
          <p className="text-sm font-medium text-emerald-800 flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Attendance saved successfully
          </p>
        </div>
      )}
    </div>
  );
}