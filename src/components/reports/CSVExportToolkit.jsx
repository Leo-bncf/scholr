import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, FileSpreadsheet, Info } from 'lucide-react';
import { buildCSV, downloadCSV, COLUMNS } from './reportUtils';
import { logAudit, AuditActions } from '@/components/utils/auditLogger';

function ExportCard({ title, description, recordCount, badge, onExport, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            {badge && <Badge variant="outline" className="text-xs">{badge}</Badge>}
          </div>
          <p className="text-sm text-slate-500 mb-2">{description}</p>
          <p className="text-xs text-slate-400">{recordCount} record{recordCount !== 1 ? 's' : ''} available</p>
        </div>
        <Button
          size="sm"
          onClick={onExport}
          disabled={loading || recordCount === 0}
          className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />}
          Export CSV
        </Button>
      </div>
    </div>
  );
}

export default function CSVExportToolkit({
  memberships, classes, grades, attendance, behavior,
  predictedGrades, casExperiences, terms, cohorts,
  schoolId, userName,
}) {
  const [filters, setFilters] = useState({ classId: 'all', termId: 'all', cohortId: 'all', dateFrom: '', dateTo: '', role: 'all' });
  const [exporting, setExporting] = useState(null);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  // Filtered datasets
  const filteredStudents = useMemo(() => {
    let base = memberships.filter(m => m.role === 'student');
    if (filters.cohortId !== 'all') {
      const cohort = cohorts.find(c => c.id === filters.cohortId);
      if (cohort) base = base.filter(m => cohort.student_ids?.includes(m.user_id));
    }
    return base;
  }, [memberships, filters.cohortId, cohorts]);

  const filteredTeachers = useMemo(() =>
    memberships.filter(m => ['teacher', 'ib_coordinator', 'school_admin'].includes(m.role)),
    [memberships]);

  const filteredClasses = useMemo(() => {
    let base = classes;
    if (filters.cohortId !== 'all') {
      const cohort = cohorts.find(c => c.id === filters.cohortId);
      if (cohort) base = base.filter(cl => cl.student_ids?.some(sid => cohort.student_ids?.includes(sid)));
    }
    return base;
  }, [classes, filters.cohortId, cohorts]);

  const enrollmentRows = useMemo(() => {
    const rows = [];
    filteredClasses.forEach(cls => {
      (cls.student_ids || []).forEach(sid => {
        const mem = memberships.find(m => m.user_id === sid);
        if (!mem) return;
        rows.push({
          class_name: cls.name,
          student_name: mem.user_name || '',
          student_email: mem.user_email || '',
          grade_level: mem.grade_level || '',
          teacher_name: '',
        });
      });
    });
    return rows;
  }, [filteredClasses, memberships]);

  const filteredGrades = useMemo(() => {
    let base = grades.filter(g => !g.is_template);
    if (filters.classId !== 'all') base = base.filter(g => g.class_id === filters.classId);
    if (filters.termId !== 'all') base = base.filter(g => g.term_id === filters.termId);
    if (filters.dateFrom) base = base.filter(g => g.created_at >= filters.dateFrom);
    if (filters.dateTo) base = base.filter(g => g.created_at <= filters.dateTo);
    return base;
  }, [grades, filters]);

  const filteredAttendance = useMemo(() => {
    let base = [...attendance];
    if (filters.classId !== 'all') base = base.filter(a => a.class_id === filters.classId);
    if (filters.dateFrom) base = base.filter(a => a.date >= filters.dateFrom);
    if (filters.dateTo) base = base.filter(a => a.date <= filters.dateTo);
    return base;
  }, [attendance, filters]);

  const filteredBehavior = useMemo(() => {
    let base = [...behavior];
    if (filters.dateFrom) base = base.filter(b => b.date >= filters.dateFrom);
    if (filters.dateTo) base = base.filter(b => b.date <= filters.dateTo);
    return base;
  }, [behavior, filters]);

  const filteredPG = useMemo(() => {
    let base = [...predictedGrades];
    if (filters.classId !== 'all') base = base.filter(p => p.class_id === filters.classId);
    if (filters.termId !== 'all') base = base.filter(p => p.term_id === filters.termId);
    return base;
  }, [predictedGrades, filters]);

  const filteredCAS = useMemo(() => {
    let base = [...casExperiences];
    if (filters.dateFrom) base = base.filter(c => !c.start_date || c.start_date >= filters.dateFrom);
    return base;
  }, [casExperiences, filters]);

  const doExport = async (key, rows, filename) => {
    if (!rows || rows.length === 0) { alert('No data to export with current filters.'); return; }
    setExporting(key);
    try {
      const csv = buildCSV(rows, COLUMNS[key] || Object.keys(rows[0]).map(k => ({ key: k, label: k })));
      downloadCSV(csv, filename);
      await logAudit({ action: AuditActions.DATA_EXPORT, entityType: key, entityId: schoolId, details: `Exported ${rows.length} ${key} records`, schoolId });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-slate-800">Export Filters</h3>
          <span className="text-xs text-slate-400 flex items-center gap-1"><Info className="w-3 h-3" /> Filters apply to all exports below</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Class</Label>
            <Select value={filters.classId} onValueChange={v => setFilter('classId', v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Term</Label>
            <Select value={filters.termId} onValueChange={v => setFilter('termId', v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All terms" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Cohort</Label>
            <Select value={filters.cohortId} onValueChange={v => setFilter('cohortId', v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All cohorts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cohorts</SelectItem>
                {cohorts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Date From</Label>
            <Input type="date" className="h-8 text-sm" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-slate-500 mb-1 block">Date To</Label>
            <Input type="date" className="h-8 text-sm" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} />
          </div>
        </div>
      </div>

      {/* User Exports */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5" /> People & Enrollment</h3>
        <div className="space-y-3">
          <ExportCard title="Student Directory" description="Name, email, grade level, cohort, enrollment status" recordCount={filteredStudents.length} badge="Cohort filtered" onExport={() => doExport('students', filteredStudents, 'student_directory')} loading={exporting === 'students'} />
          <ExportCard title="Staff Directory" description="Teachers, coordinators, admins with department and role" recordCount={filteredTeachers.length} onExport={() => doExport('teachers', filteredTeachers, 'staff_directory')} loading={exporting === 'teachers'} />
          <ExportCard title="All Users" description="Complete user list across all roles" recordCount={memberships.length} onExport={() => doExport('all_users', memberships, 'all_users')} loading={exporting === 'all_users'} />
          <ExportCard title="Class Enrollments" description="Student-to-class mapping with teacher and grade level" recordCount={enrollmentRows.length} badge="Cohort filtered" onExport={() => doExport('enrollments', enrollmentRows, 'class_enrollments')} loading={exporting === 'enrollments'} />
          <ExportCard title="Class Roster" description="Classes with student counts, teachers, and rooms" recordCount={filteredClasses.length} onExport={() => doExport('classes', filteredClasses, 'class_roster')} loading={exporting === 'classes'} />
        </div>
      </div>

      {/* Academic Exports */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5" /> Academic</h3>
        <div className="space-y-3">
          <ExportCard title="Grade Records" description="All assessment scores, IB grades, status, and comments" recordCount={filteredGrades.length} badge="Class + Term filtered" onExport={() => doExport('grades', filteredGrades, 'grade_records')} loading={exporting === 'grades'} />
          <ExportCard title="Predicted Grades" description="Teacher-entered IB predicted grades with confidence and rationale" recordCount={filteredPG.length} badge="IB" onExport={() => doExport('predicted_grades', filteredPG, 'predicted_grades')} loading={exporting === 'predicted_grades'} />
        </div>
      </div>

      {/* Attendance */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5" /> Attendance</h3>
        <div className="space-y-3">
          <ExportCard title="Attendance Records" description="All attendance entries with status, reason, and correction history" recordCount={filteredAttendance.length} badge="Class + Date filtered" onExport={() => doExport('attendance', filteredAttendance, 'attendance_records')} loading={exporting === 'attendance'} />
        </div>
      </div>

      {/* Pastoral */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5" /> Pastoral & IB Core</h3>
        <div className="space-y-3">
          <ExportCard title="Behavior Records" description="Incidents, concerns, positive notes, actions taken, and follow-up status" recordCount={filteredBehavior.length} badge="Date filtered" onExport={() => doExport('behavior', filteredBehavior, 'behavior_records')} loading={exporting === 'behavior'} />
          <ExportCard title="CAS Experiences" description="Student CAS activity log with strands, hours, supervisor, and approval status" recordCount={filteredCAS.length} badge="IB Core" onExport={() => doExport('cas', filteredCAS, 'cas_experiences')} loading={exporting === 'cas'} />
        </div>
      </div>
    </div>
  );
}