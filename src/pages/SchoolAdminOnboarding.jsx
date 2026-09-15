import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import SetupWizard from '@/components/onboarding/SetupWizard';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import DemoDataControls from '@/components/onboarding/DemoDataControls';
import InvitationsManager from '@/components/onboarding/InvitationsManager';
import ParentLinkingPanel from '@/components/onboarding/ParentLinkingPanel';
import SchoolReadiness from '@/components/onboarding/SchoolReadiness';
import { Button } from '@/components/ui/button';

const TABS = [
  { value: 'wizard', label: 'Setup wizard' },
  { value: 'invites', label: 'Invite staff' },
  { value: 'parents', label: 'Parent access' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'demo', label: 'Demo data' },
];

/**
 * The first page a new school sees.
 *
 * Readiness sits above the tabs rather than inside one, because it is the
 * answer to the question the page exists for — how much is left — and it is
 * true whichever tab you are on.
 *
 * What went: an indigo gradient banner (the accent here is green), three
 * reassurance chips, and a full-page "Setup Complete!" takeover that hid every
 * tab the moment the wizard finished — including Invite staff, which is what
 * you actually do next. Finishing now shows a line, and the tabs stay.
 */
export default function SchoolAdminOnboarding() {
  const [tab, setTab] = useState('wizard');
  const navigate = useNavigate();
  const { school, schoolId } = useUser();
  const queryClient = useQueryClient();
  const [wizardComplete, setWizardComplete] = useState(false);

  const handleWizardComplete = () => {
    setWizardComplete(true);
    queryClient.invalidateQueries({ queryKey: ['onboarding-status', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['school-operations', schoolId] });
    setTab('invites');
  };

  return (
    <SchoolAdminPage
      title="Onboarding"
      eyebrow={school?.name ? `Setting up ${school.name}` : 'Set the school up, step by step'}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      actions={
        <Button variant="outline" onClick={() => navigate('/SchoolAdminDashboard')}>
          Go to dashboard
        </Button>
      }
      related={[
        ['SchoolAdminAcademicSetup', 'Academic setup'],
        ['SchoolAdminUsers', 'Users'],
        ['SchoolAdminSettings', 'Settings'],
      ]}
    >
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <SchoolReadiness schoolId={schoolId} />
      </div>

      {wizardComplete && tab !== 'wizard' && (
        <p
          style={{
            margin: '0 0 var(--space-md)', fontSize: '.86rem', color: 'var(--muted)',
            borderLeft: '2px solid var(--brand)', paddingLeft: '.7rem',
          }}
        >
          Setup saved. Invite your staff next — you can re-run the wizard from its tab at any time.
        </p>
      )}

      {tab === 'wizard' && <SetupWizard onComplete={handleWizardComplete} />}
      {tab === 'invites' && <InvitationsManager schoolId={schoolId} schoolName={school?.name} />}
      {tab === 'parents' && <ParentLinkingPanel schoolId={schoolId} />}
      {tab === 'checklist' && <OnboardingChecklist schoolId={schoolId} showWizard={null} />}
      {tab === 'demo' && (
        <DemoDataControls
          schoolId={schoolId}
          onRefresh={() => {
            queryClient.invalidateQueries({ queryKey: ['onboarding-status', schoolId] });
            queryClient.invalidateQueries({ queryKey: ['school-operations', schoolId] });
          }}
        />
      )}
    </SchoolAdminPage>
  );
}
