import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/components/auth/UserContext';
import { useSchoolOperationsData } from '@/components/hooks/useSchoolOperationsData';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import { useCurriculum } from '@/hooks/useCurriculum';
import LoadingStateBase from '@/components/common/LoadingStateBase';
import SchoolHealthOverview from '@/components/dashboard/SchoolHealthOverview';
import OperationalAlerts from '@/components/dashboard/OperationalAlerts';
import QuickActionsHub from '@/components/dashboard/QuickActionsHub';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import StatusChip from '@/components/app/StatusChip';
import { format } from 'date-fns';

// A school's lifecycle state. Only `suspended` is actually wrong, so it is the
// only one that draws from the reserved status palette.
const STATUS_TONE = { active: 'good', onboarding: 'info', suspended: 'crit' };

function Section({ title, note, children }) {
  return (
    <section>
      <div className="app-group-head">
        <h2 className="scholr-label" style={{ margin: 0 }}>{title}</h2>
        {note && <p style={{ margin: 0, fontSize: '.78rem', color: 'var(--faint)' }}>{note}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * The school-admin dashboard.
 *
 * On the shared frame like every other page in the section, which is not only
 * tidiness: loading and errors used to return before the sidebar rendered, so
 * a slow query or a dropped connection replaced the whole application with a
 * bare spinner and no way out but the back button. Both states now sit inside
 * the frame, and the navigation stays put.
 *
 * The signed-out redirect is gone too — RoleGuard already does it, and doing
 * it twice raced.
 */
export default function SchoolAdminDashboard() {
  const navigate = useNavigate();
  const { user, schoolId } = useUser();
  const { shortLabel } = useCurriculum();
  const { data, isLoading, isError } = useSchoolOperationsData(schoolId);

  const school = data?.school;
  const today = format(new Date(), 'EEEE d MMMM yyyy');
  const statusKey = school?.status || 'onboarding';
  const eyebrow = school?.name
    ? `${school.name} · ${shortLabel} · ${today}`
    : today;

  return (
    <SchoolAdminPage
      title="Operations"
      eyebrow={eyebrow}
      actions={school ? <StatusChip tone={STATUS_TONE[statusKey] || 'mute'}>{statusKey}</StatusChip> : null}
      /* The dashboard is a starting point, so it points at the three places a
         morning check most often ends up. */
      related={[
        ['SchoolAdminAttendance', 'Attendance'],
        ['SchoolAdminUsers', 'Users'],
        ['SchoolAdminReports', 'Reports'],
      ]}
    >
      {isLoading || !user ? (
        <LoadingStateBase />
      ) : isError || !data ? (
        <div style={{ padding: 'var(--space-lg) 0' }}>
          <p className="m-0 font-medium" style={{ color: 'var(--ink)' }}>Couldn&apos;t load the dashboard.</p>
          <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Check your connection and refresh the page. Everything in the sidebar still works.
          </p>
        </div>
      ) : (
        <>
          {/* Only while setup is unfinished — the component hides itself once
              every step is done, so this is belt and braces. */}
          {data.setupDone < data.setupTotal && (
            <OnboardingChecklist schoolId={schoolId} showWizard={() => navigate('/SchoolAdminOnboarding')} />
          )}

          {/* Alerts first: this page exists to answer "is anything broken",
              and putting the shortcuts above it buries the answer. */}
          <Section title="Alerts">
            <OperationalAlerts data={data} />
          </Section>

          <Section title="Shortcuts">
            <QuickActionsHub />
          </Section>

          <Section title="School health" note="scoped to your school">
            <SchoolHealthOverview data={data} />
          </Section>
        </>
      )}
    </SchoolAdminPage>
  );
}
