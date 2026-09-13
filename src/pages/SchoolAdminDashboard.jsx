import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/components/auth/UserContext';
import { useSchoolOperationsData } from '@/components/hooks/useSchoolOperationsData';
import { createPageUrl } from '@/utils';
import AppSidebar from '@/components/app/AppSidebar';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import { useCurriculum } from '@/hooks/useCurriculum';
import LoadingStateBase from '@/components/common/LoadingStateBase';
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
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="cobalt-label m-0">{title}</h2>
        {note && <p className="m-0 text-xs" style={{ color: 'var(--faint)' }}>{note}</p>}
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
      <div className="cobalt-page min-h-screen flex items-center justify-center p-6">
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
    <div className="cobalt-page min-h-screen">
      <AppSidebar
        links={SCHOOL_ADMIN_SIDEBAR_LINKS}
        role="school_admin"
        schoolName={school?.name}
        userName={user?.full_name}
        userId={user?.id}
        schoolId={schoolId}
      />

      <main className="md:ml-64 min-h-screen">
        <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col gap-6 md:gap-8">

          <header className="flex items-start gap-3">
            <div className="min-w-0">
              <p className="cobalt-label m-0">
                {school?.name} · {shortLabel} · {today}
              </p>
              <h1 className="cobalt-h1 m-0 mt-1.5 text-2xl md:text-3xl">Operations</h1>
            </div>
            <span className="ml-auto shrink-0 mt-1">
              <StatusChip tone={STATUS_TONE[statusKey] || 'mute'}>{statusKey}</StatusChip>
            </span>
          </header>

          {/* Only while setup is unfinished — the component hides itself once
              every step is done, so this is belt and braces. */}
          {data.setupDone < data.setupTotal && (
            <OnboardingChecklist
              schoolId={schoolId}
              showWizard={() => navigate('/SchoolAdminOnboarding')}
            />
          )}

          {/* Alerts before anything else: this page exists to answer "is
              anything broken", and putting the shortcuts first buries it. */}
          <Section title="Alerts">
            <OperationalAlerts data={data} />
          </Section>

          <Section title="Shortcuts">
            <QuickActionsHub />
          </Section>

          <Section title="School health" note="scoped to your school">
            <SchoolHealthOverview data={data} />
          </Section>

        </div>
      </main>
    </div>
  );
}
