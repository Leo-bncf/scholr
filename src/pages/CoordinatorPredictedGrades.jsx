import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import AppShell, { Group, Row, GroupEmpty, Segmented } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import { Loader2 } from 'lucide-react';
import { getCoordinatorSidebarLinks } from '@/components/app/coordinatorSidebarLinks';
import { useCurriculum } from '@/hooks/useCurriculum';
import * as gradebookData from '@/data/gradebook';
import * as membershipsData from '@/data/memberships';
import * as classesData from '@/data/classes';

export default function CoordinatorPredictedGrades() {
  const { user, school, schoolId } = useUser();
  const { curriculum, config, isIBDP, gradeScale, shortLabel } = useCurriculum();
  const sidebarLinks = getCoordinatorSidebarLinks(curriculum, config);
  const [activeTab, setActiveTab] = useState('recent');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterClass, setFilterClass] = useState('all');

  const { data: predictions = [], isLoading: predsLoading } = useQuery({
    queryKey: ['all-predicted-grades', schoolId],
    queryFn: () => gradebookData.listPredicted(schoolId),
    enabled: !!schoolId,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['dp-students-pred', schoolId],
    queryFn: async () => {
      const memberships = await membershipsData.where({
        school_id: schoolId,
        role: 'student',
        status: 'active',
      });
      return memberships.filter(m => m.grade_level?.includes('DP') || true);
    },
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-pred', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const filteredPredictions = predictions.filter(p => {
    const gradeMatch = filterGrade === 'all' || p.predicted_ib_grade === Number(filterGrade);
    const classMatch = filterClass === 'all' || p.class_id === filterClass;
    return gradeMatch && classMatch;
  });

  const averagePredicted = predictions.length > 0
    ? (predictions.reduce((sum, p) => sum + p.predicted_ib_grade, 0) / predictions.length).toFixed(2)
    : '—';

  const highConfidence = predictions.filter(p => p.confidence_level === 'high').length;
  const lowConfidence = predictions.filter(p => p.confidence_level === 'low').length;

  const distribution = [7, 6, 5, 4, 3, 2, 1].map(grade => ({
    grade,
    count: predictions.filter(p => p.predicted_ib_grade === grade).length,
  }));

  const maxDistCount = Math.max(...distribution.map(d => d.count), 1);

  const isLoading = predsLoading || studentsLoading;

  return (
    <RoleGuard allowedRoles={['ib_coordinator', 'school_admin', 'super_admin', 'admin']}>
      <AppSidebar
        links={sidebarLinks}
        role="ib_coordinator"
        schoolName={school?.name}
        userName={user?.full_name}
        userId={user?.id}
        schoolId={schoolId}
      />
      <div className="app-offset">
        <AppShell
          eyebrow={`${shortLabel} · Grade Forecasts`}
          title={isIBDP ? 'Predicted IB Grades' : 'Grade Forecasts'}
          actions={
            <Segmented
              label="Views"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { label: 'Recent Entries', value: 'recent' },
                { label: 'Distribution Curve', value: 'distribution' },
                { label: 'By Student', value: 'by-student' },
              ]}
            />
          }
        >
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl) 0' }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
            </div>
          ) : (
            <>
              <StatRow>
                <StatCard label="Total Predictions" value={predictions.length} hint="across registered courses" />
                <StatCard label="Average Forecast" value={averagePredicted} hint={isIBDP ? 'out of 7 points' : gradeScale.displayLabel} />
                <StatCard label="High Confidence" value={highConfidence} hint="teacher certainty" />
                <StatCard label="Low Confidence" value={lowConfidence} hint="volatile trajectory" />
              </StatRow>

              {/* Tab 1: Recent Predictions */}
              {activeTab === 'recent' && (
                <Group
                  title="Recorded Grade Predictions"
                  action={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2xs)' }}>
                      <select
                        value={filterGrade}
                        onChange={e => setFilterGrade(e.target.value)}
                        className="scholr-focus"
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid var(--rule)',
                          background: 'var(--surface)',
                          color: 'var(--ink)',
                        }}
                      >
                        <option value="all">All Grades</option>
                        {[7, 6, 5, 4, 3, 2, 1].map(g => (
                          <option key={g} value={g}>Grade {g}</option>
                        ))}
                      </select>
                      <select
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                        className="scholr-focus"
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '6px',
                          border: '1px solid var(--rule)',
                          background: 'var(--surface)',
                          color: 'var(--ink)',
                        }}
                      >
                        <option value="all">All Classes</option>
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  }
                >
                  {filteredPredictions.length === 0 ? (
                    <GroupEmpty>No predicted grade records found matching the active filter.</GroupEmpty>
                  ) : (
                    filteredPredictions.map(pred => {
                      const confidenceTone = pred.confidence_level === 'high' ? 'good' : pred.confidence_level === 'low' ? 'warn' : 'info';
                      return (
                        <Row
                          key={pred.id}
                          label={pred.student_name || 'Candidate'}
                          detail={
                            <span>
                              {pred.class_name || pred.subject_name} · By {pred.teacher_name || 'Teacher'}
                              {pred.rationale && ` · "${pred.rationale.slice(0, 50)}${pred.rationale.length > 50 ? '...' : ''}"`}
                            </span>
                          }
                          value={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              {pred.confidence_level && (
                                <StatusChip tone={confidenceTone}>{pred.confidence_level}</StatusChip>
                              )}
                              <span
                                className="scholr-num"
                                style={{
                                  fontSize: '1.05rem',
                                  fontWeight: 700,
                                  color: pred.predicted_ib_grade <= 3 ? 'var(--warn)' : 'var(--ink)',
                                }}
                              >
                                Grade {pred.predicted_ib_grade}
                              </span>
                            </div>
                          }
                        />
                      );
                    })
                  )}
                </Group>
              )}

              {/* Tab 2: Grade Distribution Curve */}
              {activeTab === 'distribution' && (
                <Group title="Cohort Grade Distribution (1 to 7)">
                  <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {distribution.map(({ grade, count }) => {
                      const pct = Math.round((count / maxDistCount) * 100);
                      const isHigh = grade >= 6;
                      const isLow = grade <= 3;
                      const barColor = isHigh ? 'var(--brand)' : isLow ? 'var(--warn)' : 'var(--ink)';

                      return (
                        <div key={grade} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                          <span className="scholr-num" style={{ width: '4rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink)' }}>
                            Grade {grade}
                          </span>
                          <div style={{ flex: 1, height: '1.25rem', background: 'var(--paper)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--rule-soft)' }}>
                            <div
                              style={{
                                width: `${Math.max(pct, count > 0 ? 5 : 0)}%`,
                                height: '100%',
                                background: barColor,
                                borderRadius: '3px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <span className="scholr-num" style={{ width: '3rem', textAlign: 'right', fontSize: '0.88rem', color: 'var(--muted)' }}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Group>
              )}

              {/* Tab 3: By Student */}
              {activeTab === 'by-student' && (
                <Group title="Candidate Roster Progress">
                  {students.length === 0 ? (
                    <GroupEmpty>No candidates registered in this cohort.</GroupEmpty>
                  ) : (
                    students.map(student => {
                      const studentPreds = predictions.filter(p => p.student_id === student.user_id || p.student_id === student.id);
                      const avg = studentPreds.length > 0
                        ? (studentPreds.reduce((sum, p) => sum + p.predicted_ib_grade, 0) / studentPreds.length).toFixed(1)
                        : null;

                      return (
                        <Row
                          key={student.id}
                          label={student.user_name || student.full_name || student.email || 'Candidate'}
                          detail={`${studentPreds.length} grades predicted across subjects`}
                          value={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {avg ? (
                                <span className="scholr-num" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--ink)' }}>
                                  Avg {avg}
                                </span>
                              ) : (
                                <StatusChip tone="mute">pending</StatusChip>
                              )}
                            </div>
                          }
                        />
                      );
                    })
                  )}
                </Group>
              )}
            </>
          )}
        </AppShell>
      </div>
    </RoleGuard>
  );
}