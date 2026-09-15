import React, { useState } from 'react';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import GradingRules from '@/components/rules/GradingRules';
import MessagingRules from '@/components/rules/MessagingRules';
import RecordsRules from '@/components/rules/RecordsRules';

/**
 * Everything the school decides in advance, in one place.
 *
 * This was three pages — Gradebook rules, Messaging rules and Governance —
 * with thirteen tabs between them, and no way for a school admin to know which
 * of the three held the setting they were after. They are all the same kind of
 * thing: a decision made once that the software then enforces.
 *
 * Three tabs, and inside each one the panels are stacked rather than nested in
 * further tabs. A settings page is read top to bottom; making someone click
 * twice to reach a switch also hid how much policy there was to review.
 *
 * Each section keeps its own query and its own Save, because they write to
 * three different policy records. Saving grading rules does not touch
 * messaging.
 */
const TABS = [
  { value: 'grading', label: 'Grading' },
  { value: 'messaging', label: 'Messaging' },
  { value: 'records', label: 'Records and privacy' },
];

export default function SchoolAdminRules() {
  const [tab, setTab] = useState('grading');

  return (
    <SchoolAdminPage
      title="Rules"
      eyebrow="Decisions the software enforces for you"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      allowedRoles={['school_admin', 'super_admin', 'admin', 'ib_coordinator']}
      related={[
        ['SchoolAdminSettings', 'Settings'],
        ['SchoolAdminUsers', 'Users'],
        ['SchoolAdminReports', 'Reports'],
      ]}
    >
      {tab === 'grading' && <GradingRules />}
      {tab === 'messaging' && <MessagingRules />}
      {tab === 'records' && <RecordsRules />}
    </SchoolAdminPage>
  );
}
