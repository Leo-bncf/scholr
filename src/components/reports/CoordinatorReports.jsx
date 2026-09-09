import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Printer, TrendingUp, GraduationCap, AlertTriangle, BarChart3 } from 'lucide-react';
import { generatePrintableHTML, printHTML, COLUMNS } from './reportUtils';

function GradeDistributionBar({ grades }) {
  const counts = [1,2,3,4,5,6,7].map(g => ({ grade: g, count: grades.filter(p => p.predicted_ib_grade === g).length }));
  const max = Math.max(...counts.map(c => c.count), 1);
  const colors = { 1: 'bg-red-400', 2: 'bg-red-300', 3: 'bg-amber-400', 4: 'bg-amber-300', 5: 'bg-emerald-400', 6: 'bg-emerald-500', 7: 'bg-indigo-500' };
  return (
    <div className="flex items-end gap-1.5 h-16">
      {counts.map(({ grade, count }) => (
        <div key={grade} className="flex flex-col items-center gap-0.5 flex-1">
          <span className="text-xs text-slate-500">{count > 0 ? count : ''}</span>
          <div className={`w-full rounded-sm ${colors[grade]} transition-all`} style={{ height: `${Math.max((count / max) * 48, count > 0 ? 4 : 0)}px` }} />
          <span className="text-xs font-semibold text-slate-600">{grade}</span>
        </div>
      ))}
    </div>
  );
}

function CohortProgressBar({ label, value, total, color = 'bg-indigo-500' }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-36 shrink-0">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-semibold text-slate-700 w-16 text-right">{value}/{total} ({pct}%)</span>
    </div>
  );
}

export default function CoordinatorReports({ memberships, classes, grades, predictedGrades, casExperiences, terms, cohorts, school, userName }) {
  const [pgFilters, setPGFilters] = useState({ cohortId: 'all', termId: 'all' });
  const [printing, setPrinting] = useState(null);

  const students = useMemo(() => memberships.filter(m => m.role === 'student'), [memberships]);

  const setPGFilter = (k, v) => setPGFilters(f => ({ ...f, [k]: v }));

  // Predicted grades filtered
  const filteredPG = useMemo(() => {
    let base = [...predictedGrades];
    if (pgFilters.termId !== 'all') base = base.filter(p => p.term_id === pgFilters.termId);
    if (pgFilters.cohortId !== 'all') {
      const cohort = cohorts.find(c => c.id === pgFilters.cohortId);
      if (cohort) base = base.filter(p => cohort.student_ids?.includes(p.student_id));
    }
    return base;
  }, [predictedGrades, pgFilters, cohorts]);

  // Students in cohort
  const cohortStudents = useMemo(() => {
    if (pgFilters.cohortId === 'all') return students;
    const cohort = cohorts.find(c => c.id === pgFilters.cohortId);
    return cohort ? students.filter(s => cohort.student_ids?.includes(s.user_id)) : students;
  }, [students, pgFilters.cohortId, cohorts]);

  // Students with at least one predicted grade
  const studentsWithPG = useMemo(() => new Set(filteredPG.map(p => p.student_id)), [filteredPG]);
  const pgCompletionPct = cohortStudents.length > 0 ? Math.round((studentsWithPG.size / cohortStudents.length) * 100) : 0;

  // Average predicted grade
  const avgPG = filteredPG.length > 0
    ? (filteredPG.reduce((s, p) => s + (p.predicted_ib_grade || 0), 0) / filteredPG.length).toFixed(2)
    : null;

  // Missing predicted grades
  const missingPG = cohortStudents.filter(s => !studentsWithPG.has(s.user_id));

  // CAS analysis
  const casStudents = new Set(casExperiences.map(c => c.student_id));
  const casApproved = new Set(casExperiences.filter(c => c.status === 'approved').map(c => c.student_id));
  const casWithAllStrands = useMemo(() => {
    const byStudent = {};
    casExperiences.forEach(c => {
      if (!byStudent[c.student_id]) byStudent[c.student_id] = new Set();
      (c.cas_strands || []).forEach(s => byStudent[c.student_id].add(s));
    });
    return Object.entries(byStudent).filter(([, strands]) =>
      strands.has('creativity') && strands.has('activity') && strands.has('service')
    ).length;
  }, [casExperiences]);

  // Confidence breakdown
  const byConfidence = {
    high: filteredPG.filter(p => p.confidence_level === 'high').length,
    medium: filteredPG.filter(p => p.confidence_level === 'medium').length,
    low: filteredPG.filter(p => p.confidence_level === 'low').length,
  };

  // Print predicted grades report
  const printPGReport = () => {
    setPrinting('pg');
    try {
      const sections = [
        {
          type: 'info',
          title: 'Report Configuration',
          items: [
            { label: 'Cohort', value: pgFilters.cohortId !== 'all' ? cohorts.find(c => c.id === pgFilters.cohortId)?.name || '—' : 'All Students' },
            { label: 'Term', value: pgFilters.termId !== 'all' ? terms.find(t => t.id === pgFilters.termId)?.name || '—' : 'All Terms' },
            { label: 'Students in Scope', value: cohortStudents.length },
            { label: 'Students with PG Entered', value: studentsWithPG.size },
          ],
        },
        {
          type: 'stats',
          title: 'Summary',
          stats: [
            { label: 'PG Entered', value: filteredPG.length },
            { label: 'Students Covered', value: studentsWithPG.size },
            { label: 'Completion', value: `${pgCompletionPct}%` },
            { label: 'Average Grade', value: avgPG || '—' },
            { label: 'High Confidence', value: byConfidence.high },
            { label: 'Missing PG', value: missingPG.length },
          ],
        },
        { type: 'table', title: 'Predicted Grade Records', columns: COLUMNS.predicted_grades, rows: filteredPG },
        ...(missingPG.length > 0 ? [{
          type: 'table',
          title: 'Students Missing Predicted Grades',
          columns: [{ key: 'user_name', label: 'Name' }, { key: 'user_email', label: 'Email' }, { key: 'grade_level', label: 'Grade Level' }],
          rows: missingPG,
        }] : []),
      ];
      const html = generatePrintableHTML({
        title: 'Predicted Grade Status Report',
        subtitle: pgFilters.cohortId !== 'all' ? cohorts.find(c => c.id === pgFilters.cohortId)?.name : 'All Cohorts',
        schoolName: school?.name || 'School',
        sections,
        generatedBy: userName,
      });
      printHTML(html);
    } finally {
      setPrinting(null);
    }
  };

  const printCASReport = () => {
    setPrinting('cas');
    try {
      const sections = [
        {
          type: 'stats',
          title: 'CAS Completion Overview',
          stats: [
            { label: 'Total Experiences', value: casExperiences.length },
            { label: 'Students with CAS', value: casStudents.size },
            { label: 'All 3 Strands Covered', value: casWithAllStrands },
            { label: 'Approved Experiences', value: casExperiences.filter(c => c.status === 'approved').length },
            { label: 'Pending Approval', value: casExperiences.filter(c => c.status === 'ongoing').length },
          ],
        },
        { type: 'table', title: 'CAS Experience Log', columns: COLUMNS.cas, rows: casExperiences },
      ];
      const html = generatePrintableHTML({
        title: 'IB CAS Completion Report',
        schoolName: school?.name || 'School',
        sections,
        generatedBy: userName,
      });
      printHTML(html);
    } finally {
      setPrinting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Predicted Grades Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-violet-50 rounded-lg p-2">
              <TrendingUp className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Predicted Grade Status Tracker</h3>
              <p className="text-sm text-slate-500">Monitor PG entry completion and distribution across the cohort</p>
            </div>
          </div>
          <Button size="sm" onClick={printPGReport} disabled={printing === 'pg'} className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
            <Printer className="w-4 h-4 mr-1" /> Print Report
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <Label className="text-xs text-slate-400 mb-1 block">Cohort</Label>
            <Select value={pgFilters.cohortId} onValueChange={v => setPGFilter('cohortId', v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All cohorts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {cohorts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label className="text-xs text-slate-400 mb-1 block">Term</Label>
            <Select value={pgFilters.termId} onValueChange={v => setPGFilter('termId', v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All terms" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'PGs Entered', value: filteredPG.length, color: 'text-indigo-700 bg-indigo-50' },
            { label: 'Students Covered', value: `${studentsWithPG.size}/${cohortStudents.length}`, color: 'text-emerald-700 bg-emerald-50' },
            { label: 'Completion', value: `${pgCompletionPct}%`, color: pgCompletionPct >= 80 ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50' },
            { label: 'Average Grade', value: avgPG || '—', color: 'text-violet-700 bg-violet-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-lg p-3 text-center ${color}`}>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Grade distribution */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Grade Distribution (1–7)</p>
          <GradeDistributionBar grades={filteredPG} />
        </div>

        {/* Confidence */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Teacher Confidence</p>
          <div className="flex gap-3">
            {[['high', 'High', 'bg-emerald-500'], ['medium', 'Medium', 'bg-amber-400'], ['low', 'Low', 'bg-red-400']].map(([key, label, color]) => (
              <div key={key} className="flex-1 bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{byConfidence[key]}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Missing PG */}
        {missingPG.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">{missingPG.length} student{missingPG.length !== 1 ? 's' : ''} missing predicted grade entry</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {missingPG.slice(0, 20).map(s => (
                <Badge key={s.user_id} variant="outline" className="text-xs border-amber-300 text-amber-800 bg-white">
                  {s.user_name || s.user_email}
                </Badge>
              ))}
              {missingPG.length > 20 && <Badge variant="outline" className="text-xs">+{missingPG.length - 20} more</Badge>}
            </div>
          </div>
        )}
      </div>

      {/* CAS Completion */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 rounded-lg p-2">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">IB CAS Completion Indicators</h3>
              <p className="text-sm text-slate-500">Track CAS strand coverage and approval status across all students</p>
            </div>
          </div>
          <Button size="sm" onClick={printCASReport} disabled={printing === 'cas'} className="bg-indigo-600 hover:bg-indigo-700 shrink-0">
            <Printer className="w-4 h-4 mr-1" /> Print Report
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total Experiences', value: casExperiences.length, color: 'text-indigo-700 bg-indigo-50' },
            { label: 'Students Active', value: casStudents.size, color: 'text-emerald-700 bg-emerald-50' },
            { label: 'All 3 Strands', value: casWithAllStrands, color: 'text-violet-700 bg-violet-50' },
            { label: 'Approved', value: casExperiences.filter(c => c.status === 'approved').length, color: 'text-emerald-700 bg-emerald-50' },
            { label: 'Pending Review', value: casExperiences.filter(c => c.status === 'ongoing').length, color: 'text-amber-700 bg-amber-50' },
            { label: 'Planned', value: casExperiences.filter(c => c.status === 'planned').length, color: 'text-slate-600 bg-slate-50' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-lg p-3 text-center ${color}`}>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Strand Coverage (students participating)</p>
          {['creativity', 'activity', 'service'].map(strand => {
            const count = new Set(casExperiences.filter(c => c.cas_strands?.includes(strand)).map(c => c.student_id)).size;
            return (
              <CohortProgressBar
                key={strand}
                label={strand.charAt(0).toUpperCase() + strand.slice(1)}
                value={count}
                total={students.length}
                color={strand === 'creativity' ? 'bg-violet-500' : strand === 'activity' ? 'bg-emerald-500' : 'bg-sky-500'}
              />
            );
          })}
        </div>
      </div>

      {/* Cohort Academic Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-sky-50 rounded-lg p-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Cohort Progress Summary</h3>
            <p className="text-sm text-slate-500">High-level completion and engagement indicators per cohort</p>
          </div>
        </div>

        {cohorts.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">No cohorts configured. Set up cohorts in Academic Setup to see cohort-level breakdowns.</p>
        ) : (
          <div className="space-y-4">
            {cohorts.filter(c => c.status === 'active').map(cohort => {
              const cohortStudentIds = new Set(cohort.student_ids || []);
              const csCount = [...cohortStudentIds].length;
              const pgCount = new Set(predictedGrades.filter(p => cohortStudentIds.has(p.student_id)).map(p => p.student_id)).size;
              const casCount = new Set(casExperiences.filter(c => cohortStudentIds.has(c.student_id)).map(c => c.student_id)).size;
              return (
                <div key={cohort.id} className="border border-slate-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" style={cohort.color ? { backgroundColor: cohort.color } : {}} />
                      <h4 className="font-semibold text-slate-800">{cohort.name}</h4>
                      <Badge variant="outline" className="text-xs">{csCount} students</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <CohortProgressBar label="Predicted Grades" value={pgCount} total={csCount} color="bg-violet-500" />
                    <CohortProgressBar label="CAS Active" value={casCount} total={csCount} color="bg-emerald-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}