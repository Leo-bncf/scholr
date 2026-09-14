import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/components/auth/UserContext';
import { useSchoolOperationsData } from '@/components/hooks/useSchoolOperationsData';
import { createPageUrl } from '@/utils';
import AppSidebar from '@/components/app/AppSidebar';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import { useCurriculum } from '@/hooks/useCurriculum';
import LoadingStateBase from '@/components/common/LoadingStateBase';
import AppShell from '@/components/app/AppShell';
import SchoolHealthOverview from '@/components/dashboard/SchoolHealthOverview';
import OperationalAlerts from '@/components/dashboard/OperationalAlerts';
import QuickActionsHub from '@/components/dashboard/QuickActionsHub';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import StatusChip from '@/components/app/StatusChip';
import { format } from 'date-fns';
import { redirectToLogin } from '@/data/session';

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

export default function SchoolAdminDashboard() {
  const navigate = useNavigate();
  const { user, schoolId, loading: userLoading } = useUser();
  const { shortLabel } = useCurriculum();
  const { data, isLoading, isError } = useSchoolOperationsData(schoolId);

  useEffect(() => {
    if (!userLoading && !user) {
      redirectToLogin(createPageUrl('AppHome'));
    }
  }, [user, userLoading]);

  if (userLoading || !user) {
    return <LoadingStateBase />;
  }

  if (isLoading) {
    return <LoadingStateBase />;
  }

  if (isError || !data) {
    return (
      <div className="scholr-page min-h-screen flex items-center justify-center p-6">
        <div>
          <p className="m-0 font-medium" style={{ color: 'var(--ink)' }}>Couldn't load the dashboard.</p>
          <p className="m-0 mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Check your connection and refresh the page.
          </p>
        </div>
      </div>
    );
  }

  const school = data?.school;
  const today = format(new Date(), 'EEEE d MMMM yyyy');
  const statusKey = school?.status || 'onboarding';

  return (
    <>
      <AppSidebar
        links={SCHOOL_ADMIN_SIDEBAR_LINKS}
        role="school_admin"
        schoolName={school?.name}
        userName={user?.full_name}
        userId={user?.id}
        schoolId={schoolId}
      />
      <div className="app-offset">
        <AppShell
          eyebrow={`${school?.name} · ${shortLabel} · ${today}`}
          title="Operations"
          actions={<StatusChip tone={STATUS_TONE[statusKey] || 'mute'}>{statusKey}</StatusChip>}
        >
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
        </AppShell>
      </div>
    </>
  );
}
