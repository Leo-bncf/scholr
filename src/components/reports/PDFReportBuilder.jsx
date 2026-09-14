import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Printer, FileText, Users, GraduationCap, Loader2 } from 'lucide-react';
import { generatePrintableHTML, printHTML, COLUMNS } from './reportUtils';
import { format } from 'date-fns';

function ReportTypeCard({ icon: Icon, title, description, badge, children, onGenerate, generating }) {
  return (
    <div className="bg-white rounded-xl border scholr-rule p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="scholr-accent-sf rounded-lg p-2">
          <Icon className="w-5 h-5 scholr-accent" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold scholr-ink">{title}</h3>
            {badge && <Badge variant="outline" className="text-xs">{badge}</Badge>}
          </div>
          <p className="text-sm scholr-muted mt-0.5">{description}</p>
        </div>
      </div>
      <div className="space-y-3 mb-4">{children}</div>
      <Button onClick={onGenerate} disabled={generating} className="w-full scholr-accent-sf hover:scholr-accent-sf">
        {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />}
        Generate & Print
      </Button>
    </div>
  );
}

export default function PDFReportBuilder({
  memberships, classes, grades, attendance, behavior,
  predictedGrades, casExperiences, terms, cohorts,
  school, userName,
}) {
  const [generating, setGenerating] = useState(null);

  // Student Progress Snapshot state
  const [progressOpts, setProgressOpts] = useState({ studentId: '', classId: 'all', termId: 'all', includeGrades: true, includeAttendance: true, includeBehavior: false });
  // Term Report state
  const [termOpts, setTermOpts] = useState({ termId: '', cohortId: 'all', includeGrades: true, includeAttendance: true, includeBehavior: false, includePredicted: false });
  // Class Report state
  const [classOpts, setClassOpts] = useState({ classId: '', includeGrades: true, includeAttendance: true });

  const students = useMemo(() => memberships.filter(m => m.role === 'student'), [memberships]);

  const setProgressOpt = (k, v) => setProgressOpts(o => ({ ...o, [k]: v }));
  const setTermOpt = (k, v) => setTermOpts(o => ({ ...o, [k]: v }));
  const setClassOpt = (k, v) => setClassOpts(o => ({ ...o, [k]: v }));

  // ── Student Progress Snapshot ────────────────────────────────────────────
  const generateProgressSnapshot = () => {
    if (!progressOpts.studentId) { alert('Please select a student.'); return; }
    setGenerating('progress');
    try {
      const student = memberships.find(m => m.user_id === progressOpts.studentId);
      const studentGrades = grades.filter(g =>
        g.student_id === progressOpts.studentId && !g.is_template &&
        (progressOpts.classId === 'all' || g.class_id === progressOpts.classId) &&
        (progressOpts.termId === 'all' || g.term_id === progressOpts.termId) &&
        g.status === 'published'
      );
      const studentAttendance = attendance.filter(a =>
        a.student_id === progressOpts.studentId &&
        (progressOpts.classId === 'all' || a.class_id === progressOpts.classId)
      );
      const studentBehavior = behavior.filter(b =>
        b.student_id === progressOpts.studentId && !b.staff_only
      );

      const sections = [
        {
          type: 'info',
          title: 'Student Information',
          items: [
            { label: 'Name', value: student?.user_name || '—' },
            { label: 'Email', value: student?.user_email || '—' },
            { label: 'Grade Level', value: student?.grade_level || '—' },
            { label: 'Report Generated', value: format(new Date(), 'dd MMM yyyy') },
          ],
        },
      ];

      if (progressOpts.includeAttendance) {
        const present = studentAttendance.filter(a => a.status === 'present').length;
        const total = studentAttendance.length;
        sections.push({
          type: 'stats',
          title: 'Attendance Summary',
          stats: [
            { label: 'Total Sessions', value: total },
            { label: 'Present', value: present },
            { label: 'Absent', value: studentAttendance.filter(a => a.status === 'absent').length },
            { label: 'Late', value: studentAttendance.filter(a => a.status === 'late').length },
            { label: 'Attendance Rate', value: total > 0 ? `${((present / total) * 100).toFixed(1)}%` : '—' },
          ],
        });
      }

      if (progressOpts.includeGrades && studentGrades.length > 0) {
        sections.push({
          type: 'table',
          title: 'Academic Performance',
          columns: COLUMNS.grades,
          rows: studentGrades,
        });
      }

      if (progressOpts.includeBehavior && studentBehavior.length > 0) {
        sections.push({
          type: 'table',
          title: 'Behavior & Pastoral Notes',
          description: 'Staff-only records are excluded.',
          columns: COLUMNS.behavior.filter(c => !['pastoral_reviewed', 'recorded_by_name'].includes(c.key)),
          rows: studentBehavior,
        });
      }

      const html = generatePrintableHTML({
        title: 'Student Progress Snapshot',
        subtitle: student?.user_name,
        schoolName: school?.name || 'School',
        sections,
        generatedBy: userName,
      });
      printHTML(html);
    } finally {
      setGenerating(null);
    }
  };

  // ── Term Report ──────────────────────────────────────────────────────────
  const generateTermReport = () => {
    if (!termOpts.termId) { alert('Please select a term.'); return; }
    setGenerating('term');
    try {
      const term = terms.find(t => t.id === termOpts.termId);
      let cohortStudents = students;
      if (termOpts.cohortId !== 'all') {
        const cohort = cohorts.find(c => c.id === termOpts.cohortId);
        if (cohort) cohortStudents = students.filter(s => cohort.student_ids?.includes(s.user_id));
      }
      const studentIds = new Set(cohortStudents.map(s => s.user_id));

      const termGrades = grades.filter(g => g.term_id === termOpts.termId && !g.is_template && studentIds.has(g.student_id) && g.status === 'published');
      const termAttendance = attendance.filter(a => studentIds.has(a.student_id));

      const sections = [
        {
          type: 'info',
          title: 'Report Details',
          items: [
            { label: 'Term', value: term?.name || '—' },
            { label: 'Term Period', value: `${term?.start_date || '—'} → ${term?.end_date || '—'}` },
            { label: 'Cohort', value: termOpts.cohortId !== 'all' ? cohorts.find(c => c.id === termOpts.cohortId)?.name || '—' : 'All Students' },
            { label: 'Students Covered', value: cohortStudents.length },
          ],
        },
        {
          type: 'stats',
          title: 'Term Overview',
          stats: [
            { label: 'Students', value: cohortStudents.length },
            { label: 'Classes', value: classes.length },
            { label: 'Grades Recorded', value: termGrades.length },
            { label: 'Attendance Records', value: termAttendance.length },
            {
              label: 'Overall Attendance Rate',
              value: termAttendance.length > 0
                ? `${((termAttendance.filter(a => a.status === 'present').length / termAttendance.length) * 100).toFixed(1)}%`
                : '—'
            },
          ],
        },
      ];

      if (termOpts.includeGrades && termGrades.length > 0) {
        sections.push({ type: 'table', title: 'Grade Records', columns: COLUMNS.grades, rows: termGrades });
      }

      if (termOpts.includeAttendance && termAttendance.length > 0) {
        sections.push({ type: 'table', title: 'Attendance Records', columns: COLUMNS.attendance, rows: termAttendance.slice(0, 500) });
      }

      if (termOpts.includePredicted) {
        const pg = predictedGrades.filter(p => p.term_id === termOpts.termId && studentIds.has(p.student_id));
        if (pg.length > 0) {
          sections.push({ type: 'table', title: 'Predicted Grades (IB)', columns: COLUMNS.predicted_grades, rows: pg });
        }
      }

      if (termOpts.includeBehavior) {
        const beh = behavior.filter(b => studentIds.has(b.student_id) && !b.staff_only);
        if (beh.length > 0) {
          sections.push({ type: 'table', title: 'Behavior Summary', columns: COLUMNS.behavior, rows: beh });
        }
      }

      const html = generatePrintableHTML({
        title: `${term?.name || 'Term'} Report`,
        subtitle: termOpts.cohortId !== 'all' ? cohorts.find(c => c.id === termOpts.cohortId)?.name : 'All Students',
        schoolName: school?.name || 'School',
        sections,
        generatedBy: userName,
      });
      printHTML(html);
    } finally {
      setGenerating(null);
    }
  };

  // ── Class Report ─────────────────────────────────────────────────────────
  const generateClassReport = () => {
    if (!classOpts.classId) { alert('Please select a class.'); return; }
    setGenerating('class');
    try {
      const cls = classes.find(c => c.id === classOpts.classId);
      const classStudents = memberships.filter(m => cls?.student_ids?.includes(m.user_id));
      const classGrades = grades.filter(g => g.class_id === classOpts.classId && !g.is_template && g.status === 'published');
      const classAttendance = attendance.filter(a => a.class_id === classOpts.classId);

      const avgScore = classGrades.length > 0
        ? (classGrades.reduce((s, g) => s + (g.percentage ?? (g.score != null && g.max_score ? (g.score / g.max_score) * 100 : 0)), 0) / classGrades.length).toFixed(1)
        : null;

      const sections = [
        {
          type: 'info',
          title: 'Class Information',
          items: [
            { label: 'Class Name', value: cls?.name || '—' },
            { label: 'Section', value: cls?.section || '—' },
            { label: 'Room', value: cls?.room || '—' },
            { label: 'Students Enrolled', value: classStudents.length },
          ],
        },
        {
          type: 'stats',
          title: 'Class Summary',
          stats: [
            { label: 'Students', value: classStudents.length },
            { label: 'Grades Recorded', value: classGrades.length },
            { label: 'Avg Score', value: avgScore ? `${avgScore}%` : '—' },
            { label: 'Attendance Records', value: classAttendance.length },
            {
              label: 'Attendance Rate',
              value: classAttendance.length > 0
                ? `${((classAttendance.filter(a => a.status === 'present').length / classAttendance.length) * 100).toFixed(1)}%`
                : '—'
            },
          ],
        },
        {
          type: 'table',
          title: 'Student List',
          columns: [
            { key: 'user_name', label: 'Name' },
            { key: 'user_email', label: 'Email' },
            { key: 'grade_level', label: 'Grade Level' },
          ],
          rows: classStudents,
        },
      ];

      if (classOpts.includeGrades && classGrades.length > 0) {
        sections.push({ type: 'table', title: 'Grade Records', columns: COLUMNS.grades, rows: classGrades });
      }

      if (classOpts.includeAttendance && classAttendance.length > 0) {
        sections.push({ type: 'table', title: 'Attendance Records', columns: COLUMNS.attendance, rows: classAttendance.slice(0, 500) });
      }

      const html = generatePrintableHTML({
        title: 'Class Report',
        subtitle: cls?.name,
        schoolName: school?.name || 'School',
        sections,
        generatedBy: userName,
      });
      printHTML(html);
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
        <Printer className="w-4 h-4 shrink-0 mt-0.5" />
        <p>PDF reports open a print-ready document in a new tab. Use your browser's Print dialog (Ctrl+P / ⌘P) to save as PDF. Reports respect role-based visibility rules — only published grades are included.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Student Progress Snapshot */}
        <ReportTypeCard
          icon={GraduationCap}
          title="Student Progress Snapshot"
          description="Individual student report with grades, attendance, and optional pastoral notes."
          badge="Individual"
          onGenerate={generateProgressSnapshot}
          generating={generating === 'progress'}
        >
          <div>
            <Label className="text-xs scholr-muted mb-1 block">Student *</Label>
            <Select value={progressOpts.studentId} onValueChange={v => setProgressOpt('studentId', v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select student..." /></SelectTrigger>
              <SelectContent>
                {students.map(s => <SelectItem key={s.user_id} value={s.user_id}>{s.user_name || s.user_email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs scholr-muted mb-1 block">Class (optional)</Label>
              <Select value={progressOpts.classId} onValueChange={v => setProgressOpt('classId', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs scholr-muted mb-1 block">Term (optional)</Label>
              <Select value={progressOpts.termId} onValueChange={v => setProgressOpt('termId', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All terms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            {[['includeGrades', 'Include Grades'], ['includeAttendance', 'Include Attendance'], ['includeBehavior', 'Include Behavior Notes']].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm scholr-body">{label}</Label>
                <Switch checked={progressOpts[key]} onCheckedChange={v => setProgressOpt(key, v)} />
              </div>
            ))}
          </div>
        </ReportTypeCard>

        {/* Term Report */}
        <ReportTypeCard
          icon={FileText}
          title="Term Report"
          description="School-wide or cohort-specific summary for a given term."
          badge="Cohort / Term"
          onGenerate={generateTermReport}
          generating={generating === 'term'}
        >
          <div>
            <Label className="text-xs scholr-muted mb-1 block">Term *</Label>
            <Select value={termOpts.termId} onValueChange={v => setTermOpt('termId', v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select term..." /></SelectTrigger>
              <SelectContent>
                {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs scholr-muted mb-1 block">Cohort (optional)</Label>
            <Select value={termOpts.cohortId} onValueChange={v => setTermOpt('cohortId', v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All students" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {cohorts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            {[['includeGrades', 'Include Grades'], ['includeAttendance', 'Include Attendance'], ['includePredicted', 'Include Predicted Grades (IB)'], ['includeBehavior', 'Include Behavior']].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm scholr-body">{label}</Label>
                <Switch checked={termOpts[key]} onCheckedChange={v => setTermOpt(key, v)} />
              </div>
            ))}
          </div>
        </ReportTypeCard>

        {/* Class Report */}
        <ReportTypeCard
          icon={Users}
          title="Class Report"
          description="Full class roster, performance summary, and attendance overview."
          badge="Class"
          onGenerate={generateClassReport}
          generating={generating === 'class'}
        >
          <div>
            <Label className="text-xs scholr-muted mb-1 block">Class *</Label>
            <Select value={classOpts.classId} onValueChange={v => setClassOpt('classId', v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select class..." /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 pt-1">
            {[['includeGrades', 'Include Grade Records'], ['includeAttendance', 'Include Attendance']].map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm scholr-body">{label}</Label>
                <Switch checked={classOpts[key]} onCheckedChange={v => setClassOpt(key, v)} />
              </div>
            ))}
          </div>
        </ReportTypeCard>
      </div>
    </div>
  );
}