import { Group, GroupEmpty } from '@/components/app/AppShell';
import { Field, SelectField, FilterBar } from '@/components/app/Field';
import StatCard from '@/components/app/StatCard';
import Meter from '@/components/app/Meter';
import Notice from '@/components/app/Notice';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { generatePrintableHTML, printHTML, COLUMNS } from './reportUtils';

/**
 * IB grades 1–7, as a histogram.
 *
 * Seven bars in seven hues — two reds, two ambers, two greens and an indigo —
 * turned an ordinal scale into a categorical one, and made the shape of the
 * distribution the last thing you noticed. A histogram is one series: the
 * height IS the encoding, and the axis is already labelled 1 to 7.
 */
function GradeDistributionBar({ grades }) {
  const counts = [1, 2, 3, 4, 5, 6, 7].map(g => ({ grade: g, count: grades.filter(p => p.predicted_ib_grade === g).length }));
  const max = Math.max(...counts.map(c => c.count), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height: '4rem' }}>
      {counts.map(({ grade, count }) => (
        <div key={grade} className="flex flex-col items-center gap-0.5 flex-1">
          <span className="scholr-num" style={{ fontFamily: 'var(--font-mono)', fontSize: '.72rem', color: 'var(--muted)' }}>
            {count > 0 ? count : ''}
          </span>
          <div
            style={{
              width: '100%',
              borderRadius: '3px 3px 0 0',
              background: 'var(--brand)',
              height: `${Math.max((count / max) * 48, count > 0 ? 4 : 0)}px`,
            }}
          />
          <span className="scholr-label" style={{ margin: 0 }}>{grade}</span>
        </div>
      ))}
    </div>
  );
}

/** A proportion with its label and its figure. */
function CohortProgressBar({ label, value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '.6rem' }}>
        <span style={{ fontSize: '.88rem', color: 'var(--ink)' }}>{label}</span>
        <span
          className="scholr-num"
          style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '.82rem', color: 'var(--body)' }}
        >
          {value} of {total}
        </span>
        <span className="scholr-label" style={{ minWidth: '2.6rem', textAlign: 'right' }}>{pct}%</span>
      </div>
      <div style={{ marginTop: '.25rem' }}>
        <Meter value={pct} height={4} />
      </div>
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
    <div className="space-y-4">
      <Group
        title="Predicted grades"
        action={
          <Button size="sm" variant="outline" onClick={printPGReport} disabled={printing === 'pg'} className="shrink-0 gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
        }
      >
        <p style={{ margin: 0, padding: '.6rem .9rem 0', fontSize: '.82rem', color: 'var(--muted)' }}>
          How much of the cohort has a predicted grade entered, and how those grades fall.
        </p>

        <div className="px-4 py-3">
          <FilterBar>
            <Field label="Cohort" htmlFor="pg-cohort">
              <SelectField
                id="pg-cohort" label="Cohort" value={pgFilters.cohortId} onChange={v => setPGFilter('cohortId', v)}
                options={[{ value: 'all', label: 'All students' }, ...cohorts.map(c => ({ value: c.id, label: c.name }))]}
              />
            </Field>
            <Field label="Term" htmlFor="pg-term">
              <SelectField
                id="pg-term" label="Term" value={pgFilters.termId} onChange={v => setPGFilter('termId', v)}
                options={[{ value: 'all', label: 'All terms' }, ...terms.map(t => ({ value: t.id, label: t.name }))]}
              />
            </Field>
          </FilterBar>

          <div className="scholr-grid app-cols-4">
            <StatCard label="Entered" value={filteredPG.length} hint="predicted grades" />
            <StatCard label="Covered" value={`${studentsWithPG.size}/${cohortStudents.length}`} hint="students" />
            <StatCard
              label="Complete"
              value={`${pgCompletionPct}%`}
              tone={pgCompletionPct >= 80 ? undefined : 'warn'}
              hint="of the cohort"
            />
            <StatCard label="Average" value={avgPG || '—'} hint="predicted grade" />
          </div>

          <div style={{ marginTop: 'var(--space-md)' }}>
            <p className="scholr-label" style={{ margin: '0 0 .5rem' }}>Distribution, 1 to 7</p>
            <GradeDistributionBar grades={filteredPG} />
          </div>

          <div style={{ marginTop: 'var(--space-md)' }}>
            <p className="scholr-label" style={{ margin: '0 0 .5rem' }}>Teacher confidence</p>
            <div style={{ display: 'flex', gap: '1.6rem' }}>
              {[['high', 'High'], ['medium', 'Medium'], ['low', 'Low']].map(([key, label]) => (
                <span key={key} style={{ display: 'flex', alignItems: 'baseline', gap: '.4rem' }}>
                  <span className="scholr-num" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: 'var(--ink)' }}>
                    {byConfidence[key]}
                  </span>
                  <span className="scholr-label" style={{ margin: 0 }}>{label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {missingPG.length > 0 && (
          <div className="px-4 pb-3">
            <Notice tone="warn" title={`${missingPG.length} student${missingPG.length !== 1 ? 's have' : ' has'} no predicted grade yet`}>
              {missingPG.slice(0, 20).map(s => s.user_name || s.user_email).join(', ')}
              {missingPG.length > 20 && `, and ${missingPG.length - 20} more`}.
            </Notice>
          </div>
        )}
      </Group>

      <Group
        title="CAS"
        action={
          <Button size="sm" variant="outline" onClick={printCASReport} disabled={printing === 'cas'} className="shrink-0 gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
        }
      >
        <p style={{ margin: 0, padding: '.6rem .9rem 0', fontSize: '.82rem', color: 'var(--muted)' }}>
          Creativity, activity and service — who is taking part, and what has been approved.
        </p>

        <div className="px-4 py-3">
          <div className="scholr-grid app-cols-3">
            <StatCard label="Experiences" value={casExperiences.length} hint="logged in total" />
            <StatCard label="Taking part" value={casStudents.size} hint="students" />
            <StatCard label="All three strands" value={casWithAllStrands} hint="students" />
            <StatCard label="Approved" value={casExperiences.filter(c => c.status === 'approved').length} hint="signed off" />
            <StatCard
              label="Waiting"
              value={casExperiences.filter(c => c.status === 'ongoing').length}
              tone={casExperiences.filter(c => c.status === 'ongoing').length > 0 ? 'warn' : undefined}
              hint="need review"
            />
            <StatCard label="Planned" value={casExperiences.filter(c => c.status === 'planned').length} hint="not started" />
          </div>

          <div style={{ marginTop: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: '.7rem' }}>
            <p className="scholr-label" style={{ margin: 0 }}>Students taking part, by strand</p>
            {['creativity', 'activity', 'service'].map(strand => {
              const count = new Set(casExperiences.filter(c => c.cas_strands?.includes(strand)).map(c => c.student_id)).size;
              return (
                <CohortProgressBar
                  key={strand}
                  label={strand.charAt(0).toUpperCase() + strand.slice(1)}
                  value={count}
                  total={students.length}
                />
              );
            })}
          </div>
        </div>
      </Group>

      <Group title="By cohort">
        <p style={{ margin: 0, padding: '.6rem .9rem 0', fontSize: '.82rem', color: 'var(--muted)' }}>
          Completion against each cohort&apos;s own size.
        </p>
        {cohorts.length === 0 ? (
          <GroupEmpty>
            No cohorts set up yet. Add them under Academic setup to see this broken down.
          </GroupEmpty>
        ) : (
          cohorts.filter(c => c.status === 'active').map(cohort => {
            const cohortStudentIds = new Set(cohort.student_ids || []);
            const csCount = [...cohortStudentIds].length;
            const pgCount = new Set(predictedGrades.filter(p => cohortStudentIds.has(p.student_id)).map(p => p.student_id)).size;
            const casCount = new Set(casExperiences.filter(c => cohortStudentIds.has(c.student_id)).map(c => c.student_id)).size;
            return (
              <div key={cohort.id} style={{ padding: '.8rem .9rem', borderTop: '1px solid var(--rule-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '.5rem', marginBottom: '.6rem' }}>
                  <span style={{ fontSize: '.92rem', color: 'var(--ink)' }}>{cohort.name}</span>
                  <span className="scholr-label" style={{ margin: 0 }}>{csCount} students</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                  <CohortProgressBar label="Predicted grades in" value={pgCount} total={csCount} />
                  <CohortProgressBar label="Active in CAS" value={casCount} total={csCount} />
                </div>
              </div>
            );
          })
        )}
      </Group>
    </div>
  );
}
