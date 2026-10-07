import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import AppShell, { Group, Row, GroupEmpty, Segmented } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import CASProgressOverview from '@/components/ibcore/CASProgressOverview';
import CASExperienceCard from '@/components/ibcore/CASExperienceCard';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { getStudentSidebarLinks } from '@/components/app/studentSidebarLinks';
import * as casExperiencesData from '@/data/casExperiences';
import * as tokTasksData from '@/data/tokTasks';
import * as eeMilestonesData from '@/data/eeMilestones';

const milestoneOrder = [
  'initial_proposal', 'first_meeting', 'research_planning', 'first_draft',
  'interim_reflection', 'second_draft', 'final_draft', 'viva_voce'
];

const milestoneLabels = {
  initial_proposal: 'Initial Proposal',
  first_meeting: 'First Supervision Meeting',
  research_planning: 'Research Planning',
  first_draft: 'First Draft',
  interim_reflection: 'Interim Reflection (RPPF)',
  second_draft: 'Second Draft',
  final_draft: 'Final Draft',
  viva_voce: 'Viva Voce',
};

const tokTaskLabels = {
  exhibition_planning: 'Exhibition Planning',
  exhibition_draft: 'Exhibition Draft',
  exhibition_final: 'Exhibition Final',
  essay_planning: 'Essay Planning',
  essay_draft: 'Essay Draft',
  essay_final: 'Essay Final',
  presentation: 'Presentation',
  reflection: 'Reflection',
  reading: 'Reading',
  other: 'Other',
};

// ─── CAS View ─────────────────────────────────────────────────────────────────
function CASView({ schoolId, userId }) {
  const [filterStrand, setFilterStrand] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['student-cas', schoolId, userId],
    queryFn: () => casExperiencesData.where({ school_id: schoolId, student_id: userId }),
    enabled: !!schoolId && !!userId,
  });

  const filtered = experiences.filter(e => {
    const strandOk = filterStrand === 'all' || e.cas_strands?.includes(filterStrand);
    const statusOk = filterStatus === 'all' || e.status === filterStatus;
    return strandOk && statusOk;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <CASProgressOverview experiences={experiences} />

      <Group
        title="My CAS Experiences"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2xs)' }}>
            <select
              value={filterStrand}
              onChange={e => setFilterStrand(e.target.value)}
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
              <option value="all">All Strands</option>
              <option value="creativity">Creativity</option>
              <option value="activity">Activity</option>
              <option value="service">Service</option>
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
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
              <option value="all">All Status</option>
              <option value="planned">Planned</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        }
      >
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-xl) 0' }}>
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
          </div>
        ) : filtered.length === 0 ? (
          <GroupEmpty>No CAS experiences recorded for this filter. Start documenting your journey.</GroupEmpty>
        ) : (
          <div style={{ padding: 'var(--space-md)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
            {filtered.map(exp => (
              <CASExperienceCard key={exp.id} experience={exp} onViewDetails={() => {}} onEdit={() => {}} />
            ))}
          </div>
        )}
      </Group>

      <Group title="IB CAS Learning Requirements">
        <Row label="All Three Strands" detail="Substantive engagement across Creativity, Activity, Service" value="Mandatory" />
        <Row label="Seven Learning Outcomes" detail="Documented reflections covering LO1 through LO7" value="Verified" />
        <Row label="Collaborative CAS Project" detail="At least one sustained, collaborative project with measurable impact" value="Required" />
      </Group>
    </div>
  );
}

// ─── Extended Essay View ───────────────────────────────────────────────────────
function EEView({ schoolId, userId }) {
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['student-ee', schoolId, userId],
    queryFn: () => eeMilestonesData.where({ school_id: schoolId, student_id: userId }),
    enabled: !!schoolId && !!userId,
  });

  const sorted = [...milestones].sort(
    (a, b) => milestoneOrder.indexOf(a.milestone_type) - milestoneOrder.indexOf(b.milestone_type)
  );
  const latest = milestones[0];
  const approved = milestones.filter(m => m.status === 'approved').length;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl) 0' }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <StatRow>
        <StatCard label="Subject Area" value={latest?.subject_area || 'Pending'} hint="chosen discipline" />
        <StatCard label="Milestones" value={`${approved}/${Math.max(sorted.length, 8)}`} hint="approved by supervisor" />
        <StatCard label="Supervisor" value={latest?.supervisor_name || 'Assigned'} hint="faculty advisor" />
        <StatCard label="Target Word Count" value="4,000" hint="maximum limit" />
      </StatRow>

      {latest?.research_question && (
        <Group title="Research Question">
          <div style={{ padding: '0.85rem 1rem', fontStyle: 'italic', color: 'var(--ink)', fontSize: '0.92rem' }}>
            "{latest.research_question}"
          </div>
        </Group>
      )}

      <Group title="8-Stage Milestone Ladder">
        {sorted.length === 0 ? (
          <GroupEmpty>Your Extended Essay milestones will be scheduled by the IB coordinator.</GroupEmpty>
        ) : (
          sorted.map((ms, idx) => {
            const isApproved = ms.status === 'approved';
            const isSubmitted = ms.status === 'submitted';
            const tone = isApproved ? 'good' : isSubmitted ? 'info' : ms.status === 'needs_revision' ? 'warn' : 'mute';

            return (
              <Row
                key={ms.id}
                label={`${idx + 1}. ${milestoneLabels[ms.milestone_type] || ms.milestone_type}`}
                detail={ms.due_date ? `Due ${format(new Date(ms.due_date), 'd MMM yyyy')}` : undefined}
                value={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusChip tone={tone}>{ms.status}</StatusChip>
                  </div>
                }
              />
            );
          })
        )}
      </Group>
    </div>
  );
}

// ─── TOK View ─────────────────────────────────────────────────────────────────
function TOKView({ schoolId, userId }) {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['student-tok', schoolId, userId],
    queryFn: async () => {
      const [mine, classWide] = await Promise.all([
        tokTasksData.where({ school_id: schoolId, student_id: userId }),
        tokTasksData.where({ school_id: schoolId, is_class_wide: true }),
      ]);
      return [...mine, ...classWide];
    },
    enabled: !!schoolId && !!userId,
  });

  const completed = tasks.filter(t => ['graded', 'reviewed', 'approved'].includes(t.status));
  const pending = tasks.filter(t => t.status === 'pending');

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl) 0' }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      <StatRow>
        <StatCard label="Total Tasks" value={tasks.length} />
        <StatCard label="Pending" value={pending.length} />
        <StatCard label="Completed" value={completed.length} />
        <StatCard label="Core Components" value="Exhibition + Essay" hint="10 pts + 10 pts" />
      </StatRow>

      <Group title="Upcoming Theory of Knowledge Tasks">
        {pending.length === 0 ? (
          <GroupEmpty>All Theory of Knowledge milestones are currently up to date.</GroupEmpty>
        ) : (
          pending.map(task => (
            <Row
              key={task.id}
              label={task.title}
              detail={tokTaskLabels[task.task_type] || task.task_type}
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {task.due_date ? format(new Date(task.due_date), 'd MMM') : 'no date'}
                  </span>
                  <StatusChip tone="warn">pending</StatusChip>
                </div>
              }
            />
          ))
        )}
      </Group>

      <Group title="All TOK Tasks & Submissions">
        {tasks.length === 0 ? (
          <GroupEmpty>No TOK tasks registered yet.</GroupEmpty>
        ) : (
          tasks.map(task => {
            const isDone = ['graded', 'reviewed'].includes(task.status);
            return (
              <Row
                key={task.id}
                label={task.title}
                detail={tokTaskLabels[task.task_type] || task.task_type}
                value={
                  <StatusChip tone={isDone ? 'good' : 'mute'}>
                    {task.status}
                  </StatusChip>
                }
              />
            );
          })
        )}
      </Group>
    </div>
  );
}

// ─── Main Student IB Core Page ────────────────────────────────────────────────
const VALID_TABS = ['cas', 'ee', 'tok'];

export default function StudentIBCore() {
  const { user, school, schoolId, curriculum } = useUser();
  const studentLinks = getStudentSidebarLinks(curriculum);
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    VALID_TABS.includes(tabParam) ? tabParam : 'cas'
  );

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    setSearchParams(prev => {
      const updated = new URLSearchParams(prev);
      updated.set('tab', nextTab);
      return updated;
    }, { replace: true });
  };

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <AppSidebar
        links={studentLinks}
        role="student"
        schoolName={school?.name}
        userName={user?.full_name}
        userId={user?.id}
        schoolId={schoolId}
      />
      <div className="app-offset">
        <AppShell
          eyebrow="IB DP Core Curriculum"
          title="Core Programme"
          actions={
            <Segmented
              label="Core Modules"
              value={activeTab}
              onChange={handleTabChange}
              options={[
                { label: 'CAS Portfolio', value: 'cas' },
                { label: 'Extended Essay', value: 'ee' },
                { label: 'Theory of Knowledge', value: 'tok' },
              ]}
            />
          }
        >
          {activeTab === 'cas' && <CASView schoolId={schoolId} userId={user?.id} />}
          {activeTab === 'ee' && <EEView schoolId={schoolId} userId={user?.id} />}
          {activeTab === 'tok' && <TOKView schoolId={schoolId} userId={user?.id} />}
        </AppShell>
      </div>
    </RoleGuard>
  );
}