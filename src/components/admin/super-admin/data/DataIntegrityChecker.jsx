import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Wrench } from 'lucide-react';
import * as classesData from '@/data/classes';
import * as schoolsData from '@/data/schools';
import * as membershipsData from '@/data/memberships';
import * as submissionsData from '@/data/submissions';
import * as assignmentsData from '@/data/assignments';
import * as academics from '@/data/academics';

const CHECKS = [
  {
    id: 'orphaned_classes',
    label: 'Orphaned Classes',
    description: 'Classes referencing a school that no longer exists',
    severity: 'error',
    run: async () => {
      const [classes, schools] = await Promise.all([
        classesData.where({}, { order: 'created_at', ascending: false, limit: 2000 }),
        schoolsData.where({}, { order: 'created_at', ascending: false, limit: 500 }),
      ]);
      const schoolIds = new Set(schools.map(s => s.id));
      return classes.filter(c => !schoolIds.has(c.school_id))
        .map(c => ({ id: c.id, label: c.name, detail: `school_id: ${c.school_id}` }));
    },
  },
  {
    id: 'orphaned_memberships',
    label: 'Orphaned Memberships',
    description: 'School memberships referencing non-existent schools',
    severity: 'error',
    run: async () => {
      const [memberships, schools] = await Promise.all([
        membershipsData.where({}, { order: 'created_at', ascending: false, limit: 5000 }),
        schoolsData.where({}, { order: 'created_at', ascending: false, limit: 500 }),
      ]);
      const schoolIds = new Set(schools.map(s => s.id));
      return memberships.filter(m => !schoolIds.has(m.school_id))
        .map(m => ({ id: m.id, label: `${m.user_email || m.user_id} (${m.role})`, detail: `school_id: ${m.school_id}` }));
    },
  },
  {
    id: 'classes_no_subject',
    label: 'Classes Without a Subject',
    description: 'Active classes with no subject_id and no subject_teacher_assignments',
    severity: 'warning',
    run: async () => {
      const classes = await classesData.where({ status: 'active' });
      return classes.filter(c => {
        const hasSubject = !!c.subject_id;
        const hasAssignments = Array.isArray(c.subject_teacher_assignments) && c.subject_teacher_assignments.length > 0;
        return !hasSubject && !hasAssignments;
      }).map(c => ({ id: c.id, label: c.name, detail: `school_id: ${c.school_id}` }));
    },
  },
  {
    id: 'submissions_no_assignment',
    label: 'Submissions Without Assignment',
    description: 'Submission records referencing deleted or missing assignments',
    severity: 'warning',
    run: async () => {
      const [submissions, assignments] = await Promise.all([
        submissionsData.where({}, { order: 'created_at', ascending: false, limit: 2000 }),
        assignmentsData.where({}, { order: 'created_at', ascending: false, limit: 2000 }),
      ]);
      const assignmentIds = new Set(assignments.map(a => a.id));
      return submissions.filter(s => !assignmentIds.has(s.assignment_id))
        .map(s => ({ id: s.id, label: `${s.student_name || s.student_id}`, detail: `assignment_id: ${s.assignment_id}` }));
    },
  },
  {
    id: 'duplicate_memberships',
    label: 'Duplicate Memberships',
    description: 'Users with more than one active membership for the same school+role',
    severity: 'warning',
    run: async () => {
      const memberships = await membershipsData.where({ status: 'active' });
      const seen = {};
      const dupes = [];
      for (const m of memberships) {
        const key = `${m.user_id}__${m.school_id}__${m.role}`;
        if (seen[key]) {
          dupes.push({ id: m.id, label: `${m.user_email || m.user_id} — ${m.role}`, detail: `school_id: ${m.school_id}` });
        } else {
          seen[key] = true;
        }
      }
      return dupes;
    },
  },
  {
    id: 'schools_no_academic_year',
    label: 'Active Schools Without Academic Year',
    description: 'Schools marked active but missing any academic year record',
    severity: 'info',
    run: async () => {
      const [schools, years] = await Promise.all([
        schoolsData.where({ status: 'active' }),
        academics.whereAcademicYears({}, { order: 'created_at', ascending: false, limit: 2000 }),
      ]);
      const schoolsWithYear = new Set(years.map(y => y.school_id));
      return schools.filter(s => !schoolsWithYear.has(s.id))
        .map(s => ({ id: s.id, label: s.name, detail: s.country || '' }));
    },
  },
];

const severityStyle = {
  error: { badge: 'bg-red-100 text-red-700', icon: 'text-red-500', border: 'border-red-200 bg-red-50' },
  warning: { badge: 'bg-amber-100 text-amber-700', icon: 'text-amber-500', border: 'border-amber-200 bg-amber-50' },
  info: { badge: 'bg-blue-100 text-blue-700', icon: 'text-blue-400', border: 'border-blue-200 bg-blue-50' },
};

function CheckRow({ check, result, onRun, running }) {
  const [expanded, setExpanded] = useState(false);
  const s = severityStyle[check.severity];
  const issues = result?.issues || [];
  const ran = result !== undefined;

  return (
    <div className="border border-slate-200 rounded-md overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800">{check.label}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${s.badge}`}>{check.severity}</span>
            {ran && (
              issues.length === 0
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                : <AlertTriangle className={`w-3.5 h-3.5 ${s.icon}`} />
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{check.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {ran && issues.length > 0 && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
            >
              {issues.length} issue{issues.length > 1 ? 's' : ''}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
          <Button variant="outline" size="sm" onClick={() => onRun(check)} disabled={running} className="text-xs h-7 px-2.5 gap-1">
            {running ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
            {ran ? 'Re-run' : 'Run'}
          </Button>
        </div>
      </div>
      {expanded && issues.length > 0 && (
        <div className={`px-4 pb-3 pt-0 border-t border-slate-100 ${s.border}`}>
          <div className="max-h-40 overflow-auto space-y-1 mt-2">
            {issues.map(issue => (
              <div key={issue.id} className="flex items-center justify-between text-xs px-2 py-1.5 bg-white rounded border border-slate-100">
                <span className="font-medium text-slate-700 truncate">{issue.label}</span>
                <span className="text-slate-400 ml-2 flex-shrink-0">{issue.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DataIntegrityChecker() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState({});
  const [runningAll, setRunningAll] = useState(false);

  const runCheck = async (check) => {
    setRunning(prev => ({ ...prev, [check.id]: true }));
    const issues = await check.run();
    setResults(prev => ({ ...prev, [check.id]: { issues } }));
    setRunning(prev => ({ ...prev, [check.id]: false }));
  };

  const runAll = async () => {
    setRunningAll(true);
    for (const check of CHECKS) {
      await runCheck(check);
    }
    setRunningAll(false);
  };

  const totalIssues = Object.values(results).reduce((sum, r) => sum + (r?.issues?.length || 0), 0);
  const checksRan = Object.keys(results).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          {checksRan > 0 && (
            <p className={`text-sm font-semibold ${totalIssues === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {totalIssues === 0 ? '✓ No issues found' : `${totalIssues} issue${totalIssues > 1 ? 's' : ''} detected across ${checksRan} checks`}
            </p>
          )}
        </div>
        <Button
          onClick={runAll}
          disabled={runningAll}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs"
        >
          {runningAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
          Run All Checks
        </Button>
      </div>

      <div className="space-y-2">
        {CHECKS.map(check => (
          <CheckRow
            key={check.id}
            check={check}
            result={results[check.id]}
            onRun={runCheck}
            running={!!running[check.id]}
          />
        ))}
      </div>
    </div>
  );
}