import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import React, { useState } from 'react';
import { useUser } from '@/components/auth/UserContext';

import HelpCenter from '@/components/support/HelpCenter';
import IssueReporter from '@/components/support/IssueReporter';
import SystemStatus from '@/components/support/SystemStatus';

const TABS = [
  { value: 'help', label: 'Help centre' },
  { value: 'report', label: 'Report an issue' },
  { value: 'status', label: 'Status' },
];

export default function SchoolAdminSupport() {
  const [tab, setTab] = useState('help');
  const { user, school, schoolId } = useUser();

  return (
    <SchoolAdminPage
      title="Support"
      eyebrow="Guides, reporting an issue, platform status"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      related={[
        ['SchoolAdminOnboarding', 'Onboarding'],
        ['SchoolAdminSettings', 'Settings'],
        ['SchoolAdminGovernance', 'Governance'],
      ]}
    >
      {tab === 'help' && <HelpCenter />}
      {tab === 'report' && <IssueReporter schoolId={schoolId} user={user} school={school} />}
      {tab === 'status' && <SystemStatus schoolId={schoolId} school={school} />}
    </SchoolAdminPage>
  );
}