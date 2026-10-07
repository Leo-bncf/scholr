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
import { format } from 'date-fns';
import { getCoordinatorSidebarLinks } from '@/components/app/coordinatorSidebarLinks';
import { useCurriculum } from '@/hooks/useCurriculum';
import * as casExperiencesData from '@/data/casExperiences';
import * as eeMilestonesData from '@/data/eeMilestones';
import * as tokTasksData from '@/data/tokTasks';
import * as membershipsData from '@/data/memberships';

export default function CoordinatorIBCore() {
  const { user, school, schoolId } = useUser();
  const { curriculum, config, shortLabel } = useCurriculum();
  const sidebarLinks = getCoordinatorSidebarLinks(curriculum, config);
  const [activeTab, setActiveTab] = useState('cas');

  const { data: casSummary } = useQuery({
    queryKey: ['all-cas-summary', schoolId],
    queryFn: () => casExperiencesData.summaryForSchool(schoolId),
    enabled: !!schoolId,
  });

  const { data: recentCompleted = [], isLoading: casLoading } = useQuery({
    queryKey: ['all-cas-recent', schoolId],
    queryFn: () => casExperiencesData.listRecentlyCompleted(schoolId, { limit: 10 }),
    enabled: !!schoolId,
  });

  const { data: eeMilestones = [], isLoading: eeLoading } = useQuery({
    queryKey: ['all-ee', schoolId],
    queryFn: () => eeMilestonesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: tokTasks = [], isLoading: tokLoading } = useQuery({
    queryKey: ['all-tok', schoolId],
    queryFn: () => tokTasksData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['dp-students-coord-core', schoolId],
    queryFn: async () => {
      const memberships = await membershipsData.where({ school_id: schoolId, role: 'student' });
      return memberships.filter(m => m.grade_level?.includes('DP') || true);
    },
    enabled: !!schoolId,
  });

  const casStats = {
    total: casSummary?.total ?? 0,
    approved: casSummary?.approved ?? 0,
    pending: casSummary?.pending ?? 0,
    creativity: casSummary?.creativity ?? 0,
    activity: casSummary?.activity ?? 0,
    service: casSummary?.service ?? 0,
  };

  const eePendingReview = eeMilestones.filter(m => m.status === 'submitted');

  const isLoading = casLoading || eeLoading || tokLoading || studentsLoading;

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
          eyebrow={`${shortLabel} · Core Programme Oversight`}
          title="IB Core Operations"
          actions={
            <Segmented
              label="Core Views"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { label: 'CAS Portfolio', value: 'cas' },
                { label: 'Extended Essay', value: 'ee' },
                { label: 'Theory of Knowledge', value: 'tok' },
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
                <StatCard label="DP Candidates" value={students.length} hint="registered in cohort" />
                <StatCard label="CAS Experiences" value={casStats.total} hint={`${casStats.approved} approved`} />
                <StatCard label="EE Submissions" value={eePendingReview.length} hint="awaiting review" />
                <StatCard label="TOK Tasks" value={tokTasks.length} hint="exhibition & essay" />
              </StatRow>

              {/* CAS View */}
              {activeTab === 'cas' && (
                <>
                  <Group title="Strand Activity Balance">
                    <Row label="Creativity Experiences" detail="Arts, creative thinking, design projects" value={casStats.creativity} />
                    <Row label="Activity Experiences" detail="Physical exertion contributing to a healthy lifestyle" value={casStats.activity} />
                    <Row label="Service Experiences" detail="Unpaid, voluntary engagement with real community benefit" value={casStats.service} />
                  </Group>

                  <Group title="Recent Experiences Awaiting Approval">
                    {recentCompleted.length === 0 ? (
                      <GroupEmpty>No CAS experiences currently awaiting approval.</GroupEmpty>
                    ) : (
                      recentCompleted.map(exp => (
                        <Row
                          key={exp.id}
                          label={exp.title}
                          detail={`${exp.student_name || 'Candidate'} · ${exp.cas_strands?.join(', ') || 'Strand unassigned'}`}
                          value={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <StatusChip tone={exp.status === 'approved' ? 'good' : exp.status === 'completed' ? 'warn' : 'info'}>
                                {exp.status}
                              </StatusChip>
                            </div>
                          }
                        />
                      ))
                    )}
                  </Group>
                </>
              )}

              {/* EE View */}
              {activeTab === 'ee' && (
                <Group title="Extended Essay Submissions Awaiting Supervisor Action">
                  {eePendingReview.length === 0 ? (
                    <GroupEmpty>All submitted Extended Essay milestones have been reviewed.</GroupEmpty>
                  ) : (
                    eePendingReview.map(ms => (
                      <Row
                        key={ms.id}
                        label={ms.student_name || 'Candidate'}
                        detail={`${ms.milestone_type?.replace(/_/g, ' ')} · Supervisor: ${ms.supervisor_name || 'Unassigned'}`}
                        value={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                              {ms.due_date ? format(new Date(ms.due_date), 'd MMM') : ''}
                            </span>
                            <StatusChip tone="warn">submitted</StatusChip>
                          </div>
                        }
                      />
                    ))
                  )}
                </Group>
              )}

              {/* TOK View */}
              {activeTab === 'tok' && (
                <Group title="Theory of Knowledge Submissions & Graded Tasks">
                  {tokTasks.length === 0 ? (
                    <GroupEmpty>No Theory of Knowledge tasks scheduled yet.</GroupEmpty>
                  ) : (
                    tokTasks.slice(0, 10).map(task => {
                      const isGraded = ['graded', 'reviewed'].includes(task.status);
                      return (
                        <Row
                          key={task.id}
                          label={task.title}
                          detail={`${task.task_type?.replace(/_/g, ' ')} · ${task.student_name || 'Class-wide'}`}
                          value={
                            <StatusChip tone={isGraded ? 'good' : task.status === 'submitted' ? 'info' : 'warn'}>
                              {task.status}
                            </StatusChip>
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