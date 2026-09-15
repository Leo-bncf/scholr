import { Group, GroupEmpty } from '@/components/app/AppShell';
import DataTable from '@/components/app/DataTable';
import StatCard from '@/components/app/StatCard';
import Notice from '@/components/app/Notice';
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Printer, Download, GraduationCap, Loader2
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

  /* Colour marks what needs attention, not what is fine.
   *
   * Every numeric cell used to be coloured by its own threshold — green above
   * 70, amber above 50, red below; green above 90 for attendance — so a class
   * doing well rendered as a full grid of green, and a class in trouble as a
   * full grid of red. Either way the eye had nowhere to land. Now only the
   * bottom band of each scale is tinted. */
  const scoreTone = (v) => (v === null ? null : v < 50 ? 'crit' : v < 70 ? 'warn' : null);
  const rateTone = (v) => (v === null ? null : v < 75 ? 'crit' : v < 90 ? 'warn' : null);
  const tinted = (value, tone) => (
    <span style={tone ? { color: `var(--${tone})` } : undefined}>{value}</span>
  );

  return (
    <DataTable
      columns={[
        {
          key: 'student',
          header: 'Student',
          render: (row) => (
            <>
              <span style={{ display: 'block', color: 'var(--ink)' }}>{row.user_name || row.user_email}</span>
              <span style={{ display: 'block', fontSize: '.76rem', color: 'var(--muted)' }}>{row.user_email}</span>
            </>
          ),
        },
        { key: 'grade_level', header: 'Year', render: (row) => row.grade_level || '—' },
        { key: 'grades', header: 'Grades', num: true, render: (row) => row.gStats.count || '—' },
        {
          key: 'avg',
          header: 'Average',
          num: true,
          render: (row) => {
            if (!row.gStats.avg) return '—';
            const v = parseFloat(row.gStats.avg);
            return tinted(`${row.gStats.avg}%`, scoreTone(v));
          },
        },
        { key: 'sessions', header: 'Sessions', num: true, render: (row) => row.aStats.total || '—' },
        {
          key: 'rate',
          header: 'Attendance',
          num: true,
          render: (row) => {
            if (!row.aStats.rate) return '—';
            const v = parseFloat(row.aStats.rate);
            return tinted(`${row.aStats.rate}%`, rateTone(v));
          },
        },
        { key: 'absent', header: 'Absent', num: true, render: (row) => tinted(row.aStats.absent || 0, row.aStats.absent > 0 ? 'crit' : null) },
        { key: 'late', header: 'Late', num: true, render: (row) => tinted(row.aStats.late || 0, row.aStats.late > 0 ? 'warn' : null) },
      ]}
      rows={rows}
      rowKey={(row) => row.user_id}
      empty="Nobody is enrolled in this class yet."
    />
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
      <div className="bg-white rounded-xl border scholr-rule p-5">
        <h3 className="font-semibold scholr-ink mb-4 flex items-center gap-2">
          <GraduationCap className="w-4 h-4 scholr-accent" /> Class Progress Report Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <Label className="text-xs scholr-muted mb-1 block">Class *</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select a class…" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs scholr-muted mb-1 block">Term (optional)</Label>
            <Select value={termId} onValueChange={setTermId}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All terms" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs scholr-muted mb-1 block">Search Student</Label>
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter by name…" className="h-9 text-sm" />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mb-5 pt-2 border-t scholr-rule-soft">
          {[
            [includeGrades, setIncludeGrades, 'Include Grade Records'],
            [includeAttendance, setIncludeAttendance, 'Include Attendance Detail'],
            [includePredicted, setIncludePredicted, 'Include Predicted Grades (IB)'],
            [includeBehavior, setIncludeBehavior, 'Include Pastoral Notes'],
          ].map(([val, setter, label]) => (
            <div key={label} className="flex items-center gap-2">
              <Switch checked={val} onCheckedChange={setter} />
              <Label className="text-sm scholr-body cursor-pointer">{label}</Label>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={generatePerStudentPDF}
            disabled={!selectedClass || generating === 'pdf_students'}
            className="scholr-accent-sf hover:scholr-accent-sf"
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

      {cls && classStats && (
        <Group>
          <div className="scholr-grid app-cols-5">
            <StatCard label="Students" value={classStats.enrolled} hint="enrolled" />
            <StatCard label="Grades" value={classStats.gradeCount} hint="published" />
            <StatCard label="Average" value={classStats.avgScore ? `${classStats.avgScore}%` : '—'} hint="across the class" />
            <StatCard
              label="Attendance"
              value={classStats.rate ? `${classStats.rate}%` : '—'}
              tone={classStats.rate && parseFloat(classStats.rate) < 90 ? 'warn' : undefined}
              hint="of sessions"
            />
            <StatCard
              label="Absences"
              value={classStats.absent}
              tone={classStats.absent > 0 ? 'crit' : undefined}
              hint="recorded"
            />
          </div>
        </Group>
      )}

      {/* Student Progress Table */}
      <Group
        title="Each student"
        action={
          <span className="scholr-label">
            {cls
              ? `${filteredStudents.length} student${filteredStudents.length === 1 ? '' : 's'}${termId !== 'all' ? ` · ${terms.find(t => t.id === termId)?.name}` : ''}`
              : 'no class chosen'}
          </span>
        }
      >
        {!cls ? (
          <GroupEmpty>Pick a class above to see grades and attendance per student.</GroupEmpty>
        ) : filteredStudents.length === 0 ? (
          <GroupEmpty>{search ? 'No students match that search.' : 'Nobody is enrolled in this class yet.'}</GroupEmpty>
        ) : (
          <StudentProgressTable
            students={filteredStudents}
            grades={classGrades}
            attendance={classAttendance}
          />
        )}
      </Group>

      <Notice>
        The printable report opens in a new tab — use ⌘P or Ctrl+P to save it as a PDF. It includes
        published grades only, and never staff-only behaviour notes.
      </Notice>
    </div>
  );
}