import React from 'react';
import { useQuery } from '@tanstack/react-query';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import AppShell, { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import { useUser } from '@/components/auth/UserContext';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getCoordinatorSidebarLinks } from '@/components/app/coordinatorSidebarLinks';
import { useCurriculum } from '@/hooks/useCurriculum';
import AssignmentCompletionChart from '@/components/coordinator/AssignmentCompletionChart';
import CohortOverview from '@/components/coordinator/CohortOverview';
import AtRiskStudents from '@/components/coordinator/AtRiskStudents';
import IBCoreMatrix from '@/components/coordinator/IBCoreMatrix';
import SupervisorReviewList from '@/components/coordinator/SupervisorReviewList';
import { evaluateDiplomaConditions } from '@/utils/ibDiplomaRules';
import * as membershipsData from '@/data/memberships';
import * as classesData from '@/data/classes';
import * as academics from '@/data/academics';
import * as gradebookData from '@/data/gradebook';
import * as eeMilestonesData from '@/data/eeMilestones';

export default function CoordinatorDashboard() {
  const { user, school, schoolId } = useUser();
  const { curriculum, config, coordinatorLabel, shortLabel, isIBDP } = useCurriculum();
  const sidebarLinks = getCoordinatorSidebarLinks(curriculum, config);

  const { data: memberships = [], isLoading: membersLoading } = useQuery({
    queryKey: ['school-memberships-coord', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['school-classes-coord', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['school-subjects-coord', schoolId],
    queryFn: () => academics.whereSubjects({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: completionRows = [] } = useQuery({
    queryKey: ['school-completion-coord', schoolId],
    queryFn: () => classesData.completionBySchool(schoolId),
    enabled: !!schoolId,
  });

  const { data: predictedGrades = [] } = useQuery({
    queryKey: ['school-predicted-grades-coord', schoolId],
    queryFn: () => gradebookData.listPredicted(schoolId),
    enabled: !!schoolId && isIBDP,
  });

  const { data: eeMilestones = [] } = useQuery({
    queryKey: ['school-ee-milestones-coord', schoolId],
    queryFn: () => eeMilestonesData.where({ school_id: schoolId }),
    enabled: !!schoolId && isIBDP,
  });

  const students = memberships.filter(m => m.role === 'student');
  const teachers = memberships.filter(m => m.role === 'teacher');

  // Evaluate diploma standing for each student in the cohort
  const evaluatedStudents = students.map(student => {
    const studentPreds = predictedGrades.filter(p => p.student_id === student.user_id || p.student_id === student.id);
    const studentCourses = studentPreds.map(p => {
      const cls = classes.find(c => c.id === p.class_id);
      const isHl = p.class_name?.includes('HL') || cls?.name?.includes('HL') || cls?.subject?.level === 'HL';
      return {
        name: p.class_name || p.subject_name || 'Subject',
        level: isHl ? 'HL' : 'SL',
        grade: p.predicted_ib_grade || 0,
      };
    });

    const hasPredictions = studentCourses.length > 0;

    const evaluation = evaluateDiplomaConditions({
      courses: studentCourses,
      tokGrade: 'B',
      eeGrade: 'B',
      casFulfilled: true,
    });

    return {
      id: student.id,
      name: student.full_name || student.email || 'Candidate',
      hasPredictions,
      evaluation,
    };
  });

  const candidatesWithPredictions = evaluatedStudents.filter(s => s.hasPredictions);
  const atRiskStudents = evaluatedStudents.filter(s => !s.evaluation.isEmpty && s.evaluation.status !== 'good');
  const failingCount = evaluatedStudents.filter(s => !s.evaluation.isEmpty && s.evaluation.criticalCount > 0).length;

  const totalPointsSum = candidatesWithPredictions.reduce((sum, s) => sum + s.evaluation.totalPoints, 0);
  const averagePoints = candidatesWithPredictions.length > 0
    ? (totalPointsSum / candidatesWithPredictions.length).toFixed(1)
    : '—';

  const overdueEeCount = eeMilestones.filter(m => m.status === 'submitted').length;

  // Student core prediction map for the matrix (candidates with active forecasts)
  const studentPredictionsForMatrix = candidatesWithPredictions.map(s => ({
    name: s.name,
    tokGrade: 'B',
    eeGrade: 'B',
  }));

  const completion = completionRows
    .filter(row => row.completion_rate > 0)
    .map(row => ({ name: row.class_name, completionRate: row.completion_rate }))
    .slice(0, 6);

  const cohorts = Object.entries(
    students.reduce((acc, s) => {
      const level = s.grade_level || 'Unassigned';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {}),
  ).sort(([a], [b]) => a.localeCompare(b));

  const isLoading = membersLoading || classesLoading || subjectsLoading;

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
          eyebrow={`${shortLabel} · ${format(new Date(), 'd MMMM yyyy')}`}
          title={coordinatorLabel}
        >
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl) 0' }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
            </div>
          ) : (
            <>
              {/* Cohort Status Overview */}
              {isIBDP && (
                <CohortOverview
                  students={students}
                  atRiskStudents={atRiskStudents}
                  failingCount={failingCount}
                  averagePoints={averagePoints}
                  overdueEeCount={overdueEeCount}
                />
              )}

              {/* Standard Baseline Stats if non-IB */}
              {!isIBDP && (
                <StatRow>
                  <StatCard label="Students" value={students.length} />
                  <StatCard label="Teachers" value={teachers.length} />
                  <StatCard label="Classes" value={classes.length} hint="active" />
                  <StatCard label="Subjects" value={subjects.length} />
                </StatRow>
              )}

              {/* At-Risk Students and Passing Conditions */}
              {isIBDP && (
                <AtRiskStudents atRiskStudents={atRiskStudents} />
              )}

              {/* TOK x EE Matrix */}
              {isIBDP && (
                <IBCoreMatrix studentPredictions={studentPredictionsForMatrix} />
              )}

              {/* Pending Supervisor Reviews */}
              {isIBDP && (
                <SupervisorReviewList eeMilestones={eeMilestones} />
              )}

              {/* Cohorts breakdown */}
              <Group title="Cohort Enrolment">
                {cohorts.length === 0 ? (
                  <GroupEmpty>No students enrolled yet.</GroupEmpty>
                ) : (
                  cohorts.map(([level, count]) => (
                    <Row key={level} label={level} value={`${count} student${count > 1 ? 's' : ''}`} />
                  ))
                )}
              </Group>

              {/* Assignment Completion Chart */}
              <AssignmentCompletionChart data={completion} />

              {/* Subjects */}
              <Group title="Active Programme Subjects">
                {subjects.length === 0 ? (
                  <GroupEmpty>No subjects configured for this programme yet.</GroupEmpty>
                ) : (
                  subjects.slice(0, 10).map(s => (
                    <Row key={s.id} label={s.name} detail={s.ib_group?.replace(/_/g, ' ') || ''}>
                      {s.level && s.level !== 'na' ? <StatusChip tone="info">{s.level}</StatusChip> : null}
                    </Row>
                  ))
                )}
              </Group>
            </>
          )}
        </AppShell>
      </div>
    </RoleGuard>
  );
}
