import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { useUser } from '@/components/auth/UserContext';
import AdminTabNavigation from '@/components/admin/AdminTabNavigation';
import {
  UserCheck, Mail, Upload, ShieldCheck
} from 'lucide-react';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';

import UserDirectoryTab    from '@/components/users/UserDirectoryTab';
import InvitationsTab      from '@/components/users/InvitationsTab';
import BulkImportTab       from '@/components/users/BulkImportTab';
import MembershipHealthTab from '@/components/users/MembershipHealthTab';
import * as membershipsData from '@/data/memberships';
import * as userInvitationsData from '@/data/userInvitations';



export default function SchoolAdminUsers() {
  const { user, school, schoolId } = useUser();
  const [tab, setTab] = useState('directory');

  const { data: memberships = [] } = useQuery({
    queryKey: ['school-memberships', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ['user-invitations', schoolId],
    queryFn: () => userInvitationsData.where({ school_id: schoolId, status: 'pending' }, { order: 'created_at', ascending: false, limit: 50 }),
    enabled: !!schoolId,
  });

  const pendingInviteCount = invitations.filter(
    i => i.status === 'pending' && new Date(i.expires_at) > new Date()
  ).length;

  const TABS = [
    { id: 'directory', label: 'Directory', icon: UserCheck },
    { id: 'invitations', label: 'Invitations', icon: Mail, badge: pendingInviteCount > 0 ? pendingInviteCount : null },
    { id: 'import', label: 'Bulk Import', icon: Upload },
    { id: 'health', label: 'Membership Health', icon: ShieldCheck },
  ];

  return (
    <RoleGuard allowedRoles={['school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar
          links={SCHOOL_ADMIN_SIDEBAR_LINKS}
          role="school_admin"
          schoolName={school?.name}
          userName={user?.full_name}
          userId={user?.id}
          schoolId={schoolId}
        />

        <main className="md:ml-64 min-h-screen flex flex-col">
          <AdminTabNavigation
            tabs={TABS}
            activeTab={tab}
            onTabChange={setTab}
            colorScheme="emerald"
            title="User & Membership Administration"
            subtitle={`${memberships.length} members · ${school?.name}`}
            rightContent={
              pendingInviteCount > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-lg">
                  <Mail className="w-3.5 h-3.5" />
                  {pendingInviteCount} pending invitation{pendingInviteCount !== 1 ? 's' : ''}
                </div>
              )
            }
          />

          {/* Tab Content */}
          <div className="flex-1 p-6">
            {tab === 'directory' && <UserDirectoryTab schoolId={schoolId} />}
            {tab === 'invitations' && <InvitationsTab schoolId={schoolId} schoolName={school?.name} />}
            {tab === 'import' && <BulkImportTab schoolId={schoolId} schoolName={school?.name} />}
            {tab === 'health' && <MembershipHealthTab schoolId={schoolId} />}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}