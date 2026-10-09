import React from 'react';
import StatRow from '@/components/app/StatRow';
import StatCard from '@/components/app/StatCard';

/**
 * CohortOverview
 *
 * Top-level status overview for the graduating DP cohort.
 * Computes passing forecast, critical failing condition counts, and core milestones.
 */
export default function CohortOverview({
  students = [],
  atRiskStudents = [],
  failingCount = 0,
  averagePoints = '—',
  overdueEeCount = 0,
}) {
  const cohortSize = students.length;
  const passingRate = cohortSize > 0
    ? `${Math.round(((cohortSize - failingCount) / cohortSize) * 100)}%`
    : '—';
  const passingHint = cohortSize > 0
    ? `${cohortSize - failingCount} on track to award`
    : 'awaiting candidates';

  return (
    <StatRow>
      <StatCard
        label="Cohort Size"
        value={cohortSize}
        hint="registered DP candidates"
      />
      <StatCard
        label="Passing Forecast"
        value={passingRate}
        hint={passingHint}
      />
      <StatCard
        label="Failing Conditions"
        value={failingCount}
        hint={failingCount > 0 ? 'attention required' : 'all candidates on track'}
      />
      <StatCard
        label="Predicted Average"
        value={averagePoints}
        hint="cohort diploma points"
      />
      <StatCard
        label="EE Drafts Overdue"
        value={overdueEeCount}
        hint="supervisor review pending"
      />
    </StatRow>
  );
}
