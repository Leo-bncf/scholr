import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import StatusChip from '@/components/app/StatusChip';
import { useUser } from '@/components/auth/UserContext';

import UserDirectoryTab from '@/components/users/UserDirectoryTab';
import InvitationsTab from '@/components/users/InvitationsTab';
import BulkImportTab from '@/components/users/BulkImportTab';
import MembershipHealthTab from '@/components/users/MembershipHealthTab';
import * as membershipsData from '@/data/memberships';
import * as userInvitationsData from '@/data/userInvitations';

/**
 * Everyone attached to the school.
 *
 * Uses the shared school-admin frame, so the title, the tabs and the sidebar
 * behave exactly as they do on every other page in this section. It used to
 * assemble its own: RoleGuard, a sunk background div, AppSidebar, then
 * AdminTabNavigation with its own title and subtitle — a fourth of the
 * twenty-two pages did that, and no two did it quite alike.
 */
export default function SchoolAdminUsers() {
  const { school, schoolId } = useUser();
  const [tab, setTab] = useState('directory');

  const { data: memberships = [] } = useQuery({
    queryKey: ['school-memberships', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ['user-invitations', schoolId],
    queryFn: () => userInvitationsData.where(
      { school_id: schoolId, status: 'pending' },
      { order: 'created_at', ascending: false, limit: 50 },
    ),
    enabled: !!schoolId,
  });

  const pendingInviteCount = invitations.filter(
    i => i.status === 'pending' && new Date(i.expires_at) > new Date(),
  ).length;

  const TABS = [
    { value: 'directory', label: 'Directory' },
    { value: 'invitations', label: pendingInviteCount > 0 ? `Invitations ${pendingInviteCount}` : 'Invitations' },
    { value: 'import', label: 'Bulk import' },
    { value: 'health', label: 'Health' },
  ];

  return (
    <SchoolAdminPage
      title="Users"
      eyebrow={`${memberships.length} ${memberships.length === 1 ? 'member' : 'members'}`}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      actions={
        pendingInviteCount > 0 ? (
          <StatusChip tone="warn">
            {pendingInviteCount} pending invitation{pendingInviteCount === 1 ? '' : 's'}
          </StatusChip>
        ) : null
      }
      /* Adding a person rarely ends on this page: they need a class, and the
         class needs the timetable to know where it meets. */
      related={[
        ['SchoolAdminClasses', 'Enrol students'],
        ['SchoolAdminClasses', 'Classes'],
        ['SchoolAdminOnboarding', 'Onboarding'],
      ]}
    >
      {tab === 'directory' && <UserDirectoryTab schoolId={schoolId} />}
      {tab === 'invitations' && <InvitationsTab schoolId={schoolId} schoolName={school?.name} />}
      {tab === 'import' && <BulkImportTab schoolId={schoolId} schoolName={school?.name} />}
      {tab === 'health' && <MembershipHealthTab schoolId={schoolId} />}
    </SchoolAdminPage>
  );
}
