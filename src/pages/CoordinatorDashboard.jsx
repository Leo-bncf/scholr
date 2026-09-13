import React from 'react';
import { useQuery } from '@tanstack/react-query';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import { Panel, PanelRow, PanelEmpty } from '@/components/app/Panel';
import { useUser } from '@/components/auth/UserContext';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getCoordinatorSidebarLinks } from '@/components/app/coordinatorSidebarLinks';
import { useCurriculum } from '@/hooks/useCurriculum';
import AssignmentCompletionChart from '@/components/coordinator/AssignmentCompletionChart';
import * as membershipsData from '@/data/memberships';
import * as classesData from '@/data/classes';
import * as academics from '@/data/academics';
import * as assignmentsData from '@/data/assignments';
import * as submissionsData from '@/data/submissions';

export default function CoordinatorDashboard() {
  const { user, school, schoolId } = useUser();
  const { curriculum, config, coordinatorLabel, shortLabel } = useCurriculum();
  const sidebarLinks = getCoordinatorSidebarLinks(curriculum, config);

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ['school-memberships-coord', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['school-classes-coord', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['school-subjects-coord', schoolId],
    queryFn: () => academics.whereSubjects({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['school-assignments-coord', schoolId],
    queryFn: () => assignmentsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['school-submissions-coord', schoolId],
    queryFn: () => submissionsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const students = memberships.filter(m => m.role === 'student');
  const teachers = memberships.filter(m => m.role === 'teacher');

  const assignmentCompletionData = classes
    .map((currentClass) => {
      const classAssignments = assignments.filter((assignment) => assignment.class_id === currentClass.id);
      const classStudents = currentClass.student_ids || [];
      const expectedSubmissions = classAssignments.length * classStudents.length;
      const submittedCount = submissions.filter(
        (submission) => submission.class_id === currentClass.id && ['submitted', 'graded', 'returned', 'resubmitted', 'late'].includes(submission.status)
      ).length;

      return {
        // No truncation: the chart lays names out horizontally now, so they fit.
        name: currentClass.name,
        completionRate: expectedSubmissions > 0 ? Math.round((submittedCount / expectedSubmissions) * 100) : 0,
      };
    })
    .filter((item) => item.completionRate > 0)
    .slice(0, 6);

  const cohorts = Object.entries(
    students.reduce((acc, s) => {
      const level = s.grade_level || 'Unassigned';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b));

  return (
    <RoleGuard allowedRoles={['ib_coordinator', 'school_admin', 'super_admin', 'admin']}>
      <div className="scholr-page min-h-screen">
        <AppSidebar links={sidebarLinks} role="ib_coordinator" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <header className="mb-6 md:mb-8">
              <p className="scholr-label m-0">
                {school?.name} · {shortLabel} · {format(new Date(), 'd MMMM yyyy')}
              </p>
              <h1 className="scholr-h1 m-0 mt-1.5 text-2xl md:text-3xl">{coordinatorLabel}</h1>
            </header>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--brand)' }} />
              </div>
            ) : (
              <div className="flex flex-col gap-5 md:gap-6">
                <StatRow>
                  <StatCard label="Students" value={students.length} />
                  <StatCard label="Teachers" value={teachers.length} />
                  <StatCard label="Active classes" value={classes.length} />
                  <StatCard label="Subjects" value={subjects.length} />
                </StatRow>

                {/* The dark beat: the programme, at the grain a coordinator
                    actually signs off on. */}
                <Panel title="Cohorts" dark>
                  {cohorts.length === 0 ? (
                    <p className="m-0 text-sm" style={{ color: 'var(--faint)' }}>
                      No students enrolled yet.
                    </p>
                  ) : (
                    <div
                      className="grid gap-x-8 gap-y-0"
                      style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(14rem, 100%), 1fr))' }}
                    >
                      {cohorts.map(([level, count]) => (
                        <div
                          key={level}
                          className="flex items-baseline gap-3 py-2"
                          style={{ borderBottom: '1px solid var(--rule-soft)' }}
                        >
                          <span className="text-sm" style={{ color: 'var(--ink)' }}>{level}</span>
                          <span
                            className="ml-auto text-sm scholr-num"
                            style={{ fontFamily: 'var(--font-mono)', color: 'var(--body)' }}
                          >
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                  <AssignmentCompletionChart data={assignmentCompletionData} />

                  <Panel title="Subjects">
                    {subjects.length === 0 ? (
                      <PanelEmpty>No subjects configured for this programme yet.</PanelEmpty>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {subjects.slice(0, 10).map(s => (
                          <PanelRow
                            key={s.id}
                            name={s.name}
                            detail={s.ib_group?.replace(/_/g, ' ') || ''}
                          >
                            {/* HL/SL is an attribute of the subject, not a
                                health status, so it wears the neutral chip —
                                the reserved colours stay for good/warn/crit. */}
                            {s.level !== 'na' && s.level ? <StatusChip>{s.level}</StatusChip> : null}
                          </PanelRow>
                        ))}
                      </div>
                    )}
                  </Panel>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
