import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Printer, Download, Users, BarChart3, GraduationCap, Loader2
} from 'lucide-react';
import { generatePrintableHTML, printHTML, buildCSV, downloadCSV, COLUMNS } from './reportUtils';
import { format } from 'date-fns';
import { logAudit, AuditActions } from '@/components/utils/auditLogger';

// ── Helpers ──────────────────────────────────────────────────────────────────

function calcAttendanceStats(records) {
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = records.filter(r => r.status === 'absent').length;
  const late = records.filter(r => r.status === 'late').length;
  const excused = records.filter(r => r.status === 'excused').length;
  const rate = total > 0 ? ((present / total) * 100).toFixed(1) : null;
  return { total, present, absent, late, excused, rate };
}

function calcGradeStats(records) {
  const published = records.filter(g => g.status === 'published');
  if (published.length === 0) return { count: 0, avg: null, ibGrades: [] };
  const scores = published.filter(g => g.score != null && g.max_score).map(g => (g.score / g.max_score) * 100);
  const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
  const ibGrades = published.filter(g => g.ib_grade).map(g => g.ib_grade);
  return { count: published.length, avg, ibGrades };
}

// ── Summary table for class-wide view ───────────────────────────────────────

function StudentProgressTable({ students, grades, attendance }) {
  const rows = useMemo(() => students.map(s => {
    const sGrades = grades.filter(g => g.student_id === s.user_id);
    const sAttendance = attendance.filter(a => a.student_id === s.user_id);
    const gStats = calcGradeStats(sGrades);
    const aStats = calcAttendanceStats(sAttendance);
    return { ...s, gStats, aStats };
  }), [students, grades, attendance]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Student</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase hidden md:table-cell">Grade Level</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Grades</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Avg Score</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Attendance</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Rate</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Absent</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase hidden lg:table-cell">Late</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map(row => {
            const rate = row.aStats.rate ? parseFloat(row.aStats.rate) : null;
            const rateColor = rate === null ? 'text-slate-400' : rate >= 90 ? 'text-emerald-700 font-semibold' : rate >= 75 ? 'text-amber-700 font-semibold' : 'text-red-700 font-semibold';
            return (
              <tr key={row.user_id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{row.user_name || row.user_email}</p>
                  <p className="text-xs text-slate-400">{row.user_email}</p>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell">{row.grade_level || '—'}</td>
                <td className="px-4 py-3 text-center text-slate-700">{row.gStats.count || '—'}</td>
                <td className="px-4 py-3 text-center">
                  {row.gStats.avg ? (
                    <span className={`font-semibold ${parseFloat(row.gStats.avg) >= 70 ? 'text-emerald-700' : parseFloat(row.gStats.avg) >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                      {row.gStats.avg}%
                    </span>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-3 text-center text-slate-700">{row.aStats.total || '—'}</td>
                <td className={`px-4 py-3 text-center ${rateColor}`}>{row.aStats.rate ? `${row.aStats.rate}%` : '—'}</td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  {row.aStats.absent > 0 ? <span className="text-red-600 font-medium">{row.aStats.absent}</span> : <span className="text-slate-400">0</span>}
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  {row.aStats.late > 0 ? <span className="text-amber-600 font-medium">{row.aStats.late}</span> : <span className="text-slate-400">0</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClassProgressReport({
  memberships, classes, grades, attendance, behavior,
  predictedGrades, terms, cohorts, school, schoolId, userName,
}) {
  const [selectedClass, setSelectedClass] = useState('');
  const [termId, setTermId] = useState('all');
  const [includeGrades, setIncludeGrades] = useState(true);
  const [includeAttendance, setIncludeAttendance] = useState(true);
  const [includeBehavior, setIncludeBehavior] = useState(false);
  const [includePredicted, setIncludePredicted] = useState(false);
  const [generating, setGenerating] = useState(null);
  const [search, setSearch] = useState('');

  const cls = useMemo(() => classes.find(c => c.id === selectedClass), [classes, selectedClass]);

  const classStudents = useMemo(() => {
    if (!cls) return [];
    return memberships.filter(m => cls.student_ids?.includes(m.user_id) && m.role === 'student');
  }, [cls, memberships]);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return classStudents;
    const q = search.toLowerCase();
    return classStudents.filter(s => (s.user_name || '').toLowerCase().includes(q) || (s.user_email || '').toLowerCase().includes(q));
  }, [classStudents, search]);

  const classGrades = useMemo(() => {
    let g = grades.filter(g => g.class_id === selectedClass && !g.is_template);
    if (termId !== 'all') g = g.filter(gr => gr.term_id === termId);
    return g;
  }, [grades, selectedClass, termId]);

  const classAttendance = useMemo(() => {
    let a = attendance.filter(a => a.class_id === selectedClass);
    return a;
  }, [attendance, selectedClass]);

  // Class-wide stats
  const classStats = useMemo(() => {
    if (!cls) return null;
    const enrolled = classStudents.length;
    const publishedGrades = classGrades.filter(g => g.status === 'published');
    const scores = publishedGrades.filter(g => g.score != null && g.max_score).map(g => (g.score / g.max_score) * 100);
    const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : null;
    const aStats = calcAttendanceStats(classAttendance);
    return { enrolled, gradeCount: publishedGrades.length, avgScore, ...aStats };
  }, [cls, classStudents, classGrades, classAttendance]);

  // ── Generate per-student PDF ────────────────────────────────────────────────
  const generatePerStudentPDF = () => {
    if (!selectedClass) { alert('Please select a class.'); return; }
    setGenerating('pdf_students');
    try {
      const allSections = [];

      // Cover page section
      allSections.push({
        type: 'info',
        title: 'Class Information',
        items: [
          { label: 'Class', value: cls?.name || '—' },
          { label: 'Section', value: cls?.section || '—' },
          { label: 'Room', value: cls?.room || '—' },
          { label: 'Students Enrolled', value: classStudents.length },
          { label: 'Term', value: termId !== 'all' ? terms.find(t => t.id === termId)?.name || '—' : 'All Terms' },
          { label: 'Report Date', value: format(new Date(), 'dd MMM yyyy') },
        ],
      });

      if (classStats) {
        allSections.push({
          type: 'stats',
          title: 'Class Overview',
          stats: [
            { label: 'Students', value: classStats.enrolled },
            { label: 'Published Grades', value: classStats.gradeCount },
            { label: 'Avg Score', value: classStats.avgScore ? `${classStats.avgScore}%` : '—' },
            { label: 'Attendance Records', value: classStats.total },
            { label: 'Overall Att. Rate', value: classStats.rate ? `${classStats.rate}%` : '—' },
          ],
        });
      }

      // One section per student
      classStudents.forEach(student => {
        const sGrades = classGrades.filter(g => g.student_id === student.user_id);
        const sAttendance = classAttendance.filter(a => a.student_id === student.user_id);
        const gStats = calcGradeStats(sGrades);
        const aStats = calcAttendanceStats(sAttendance);
        const sPG = predictedGrades.filter(p => p.student_id === student.user_id && p.class_id === selectedClass);
        const sBehavior = behavior.filter(b => b.student_id === student.user_id && !b.staff_only);

        allSections.push({
          type: 'info',
          title: `${student.user_name || student.user_email}`,
          items: [
            { label: 'Email', value: student.user_email || '—' },
            { label: 'Grade Level', value: student.grade_level || '—' },
            { label: 'Avg Score', value: gStats.avg ? `${gStats.avg}%` : '—' },
            { label: 'Grades Recorded', value: gStats.count },
            { label: 'Attendance Rate', value: aStats.rate ? `${aStats.rate}%` : '—' },
            { label: 'Sessions Present', value: `${aStats.present} / ${aStats.total}` },
            { label: 'Absent', value: aStats.absent },
            { label: 'Late', value: aStats.late },
          ],
        });

        if (includeGrades && sGrades.filter(g => g.status === 'published').length > 0) {
          allSections.push({
            type: 'table',
            title: `${student.user_name} — Grade Records`,
            columns: COLUMNS.grades,
            rows: sGrades.filter(g => g.status === 'published'),
          });
        }

        if (includeAttendance && sAttendance.length > 0) {
          allSections.push({
            type: 'table',
            title: `${student.user_name} — Attendance`,
            columns: COLUMNS.attendance,
            rows: sAttendance.slice(0, 100),
          });
        }

        if (includePredicted && sPG.length > 0) {
          allSections.push({
            type: 'table',
            title: `${student.user_name} — Predicted Grades`,
            columns: COLUMNS.predicted_grades,
            rows: sPG,
          });
        }

        if (includeBehavior && sBehavior.length > 0) {
          allSections.push({
            type: 'table',
            title: `${student.user_name} — Pastoral Notes`,
            columns: COLUMNS.behavior.filter(c => !['pastoral_reviewed', 'recorded_by_name'].includes(c.key)),
            rows: sBehavior,
          });
        }
      });

      const html = generatePrintableHTML({
        title: 'Class Progress Report',
        subtitle: cls?.name,
        schoolName: school?.name || 'School',
        sections: allSections,
        generatedBy: userName,
      });
      printHTML(html);
      logAudit({ action: AuditActions.DATA_EXPORT, entityType: 'class_progress_report', entityId: selectedClass, details: `Printed class progress report for ${cls?.name}`, schoolId });
    } finally {
      setGenerating(null);
    }
  };

  // ── Generate class progress CSV ─────────────────────────────────────────────
  const exportProgressCSV = () => {
    if (!selectedClass) { alert('Please select a class.'); return; }
    setGenerating('csv');
    try {
      const rows = classStudents.map(student => {
        const sGrades = classGrades.filter(g => g.student_id === student.user_id && g.status === 'published');
        const sAtt = classAttendance.filter(a => a.student_id === student.user_id);
        const gStats = calcGradeStats(sGrades);
        const aStats = calcAttendanceStats(sAtt);
        const sPG = predictedGrades.find(p => p.student_id === student.user_id && p.class_id === selectedClass);
        return {
          student_name: student.user_name || '',
          student_email: student.user_email || '',
          grade_level: student.grade_level || '',
          class_name: cls?.name || '',
          grades_count: gStats.count,
          avg_score_pct: gStats.avg ?? '',
          ib_grades: gStats.ibGrades.join('; '),
          predicted_ib_grade: sPG?.predicted_ib_grade ?? '',
          attendance_total: aStats.total,
          attendance_present: aStats.present,
          attendance_absent: aStats.absent,
          attendance_late: aStats.late,
          attendance_excused: aStats.excused,
          attendance_rate_pct: aStats.rate ?? '',
        };
      });

      const columns = [
        { key: 'student_name', label: 'Student Name' },
        { key: 'student_email', label: 'Email' },
        { key: 'grade_level', label: 'Grade Level' },
        { key: 'class_name', label: 'Class' },
        { key: 'grades_count', label: 'Published Grades' },
        { key: 'avg_score_pct', label: 'Avg Score (%)' },
        { key: 'ib_grades', label: 'IB Grades' },
        { key: 'predicted_ib_grade', label: 'Predicted IB Grade' },
        { key: 'attendance_total', label: 'Total Sessions' },
        { key: 'attendance_present', label: 'Present' },
        { key: 'attendance_absent', label: 'Absent' },
        { key: 'attendance_late', label: 'Late' },
        { key: 'attendance_excused', label: 'Excused' },
        { key: 'attendance_rate_pct', label: 'Attendance Rate (%)' },
      ];

      const csv = buildCSV(rows, columns);
      downloadCSV(csv, `class_progress_${cls?.name?.replace(/\s+/g, '_') || 'export'}`);
      logAudit({ action: AuditActions.DATA_EXPORT, entityType: 'class_progress_csv', entityId: selectedClass, details: `Exported class progress CSV for ${cls?.name}`, schoolId });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Config Panel */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-600" /> Class Progress Report Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Class *</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a class…" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Term (optional)</Label>
            <Select value={termId} onValueChange={setTermId}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All terms" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Search Student</Label>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by name…" className="h-9 text-sm" />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mb-5 pt-2 border-t border-slate-100">
          {[
            [includeGrades, setIncludeGrades, 'Include Grade Records'],
            [includeAttendance, setIncludeAttendance, 'Include Attendance Detail'],
            [includePredicted, setIncludePredicted, 'Include Predicted Grades (IB)'],
            [includeBehavior, setIncludeBehavior, 'Include Pastoral Notes'],
          ].map(([val, setter, label]) => (
            <div key={label} className="flex items-center gap-2">
              <Switch checked={val} onCheckedChange={setter} />
              <Label className="text-sm text-slate-700 cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={generatePerStudentPDF}
            disabled={!selectedClass || generating === 'pdf_students'}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {generating === 'pdf_students' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />}
            Print / Save as PDF
          </Button>
          <Button
            variant="outline"
            onClick={exportProgressCSV}
            disabled={!selectedClass || generating === 'csv'}
          >
            {generating === 'csv' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
            Export Progress CSV
          </Button>
        </div>
      </div>

      {/* Class Stats Summary */}
      {cls && classStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Students', value: classStats.enrolled, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
            { label: 'Published Grades', value: classStats.gradeCount, color: 'bg-violet-50 text-violet-700 border-violet-200' },
            { label: 'Avg Score', value: classStats.avgScore ? `${classStats.avgScore}%` : '—', color: 'bg-sky-50 text-sky-700 border-sky-200' },
            { label: 'Attendance Rate', value: classStats.rate ? `${classStats.rate}%` : '—', color: classStats.rate && parseFloat(classStats.rate) >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200' },
            { label: 'Total Absences', value: classStats.absent, color: classStats.absent > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border p-4 ${color}`}>
              <p className="text-xl font-black">{value}</p>
              <p className="text-xs font-medium mt-1 opacity-80">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Student Progress Table */}
      {cls && filteredStudents.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-800">Student Progress Summary</h3>
              <Badge variant="outline" className="text-xs">{filteredStudents.length} students</Badge>
            </div>
            {termId !== 'all' && (
              <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs">
                {terms.find(t => t.id === termId)?.name}
              </Badge>
            )}
          </div>
          <StudentProgressTable
            students={filteredStudents}
            grades={classGrades}
            attendance={classAttendance}
          />
        </div>
      ) : cls ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400">{search ? 'No students match your search.' : 'No students enrolled in this class.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <BarChart3 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium">Select a class to view progress</p>
          <p className="text-slate-400 text-sm mt-1">Choose a class above to see per-student grades and attendance summary.</p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
        <Printer className="w-4 h-4 shrink-0 mt-0.5" />
        <p>The PDF report opens in a new tab — use Ctrl+P / ⌘P to save as PDF. Only <strong>published</strong> grades are included. Staff-only behavior notes are excluded.</p>
      </div>
    </div>
  );
}