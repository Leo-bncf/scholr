import React from 'react';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  HelpCircle, Bug, Activity
} from 'lucide-react';
import HelpCenter from '@/components/support/HelpCenter';
import IssueReporter from '@/components/support/IssueReporter';
import SystemStatus from '@/components/support/SystemStatus';

export default function SchoolAdminSupport() {
  const { user, school, schoolId } = useUser();

  return (
    <RoleGuard allowedRoles={['school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen scholr-sunk">
        <AppSidebar
          links={SCHOOL_ADMIN_SIDEBAR_LINKS}
          role="school_admin"
          schoolName={school?.name}
          userName={user?.full_name}
          userId={user?.id}
          schoolId={schoolId}
        />

        <main className="app-offset">
          <div className="bg-white border-b scholr-rule px-6 py-4 sticky top-0 z-10 shadow-sm">
            <h1 className="text-base font-black scholr-ink tracking-tight">Support</h1>
            <p className="text-xs scholr-faint mt-0.5">Guides, issue reporting, and platform status for {school?.name || 'your school'}</p>
          </div>

          <div className="p-6 max-w-5xl">
            <Tabs defaultValue="help">
              <TabsList className="bg-white border scholr-rule h-auto mb-6">
                <TabsTrigger value="help" className="text-xs gap-1.5 data-[state=active]:scholr-accent-sf data-[state=active]:scholr-accent">
                  <HelpCircle className="w-3.5 h-3.5" /> Help Center
                </TabsTrigger>
                <TabsTrigger value="report" className="text-xs gap-1.5 data-[state=active]:scholr-accent-sf data-[state=active]:scholr-accent">
                  <Bug className="w-3.5 h-3.5" /> Contact Support
                </TabsTrigger>
                <TabsTrigger value="status" className="text-xs gap-1.5 data-[state=active]:scholr-accent-sf data-[state=active]:scholr-accent">
                  <Activity className="w-3.5 h-3.5" /> System Status
                </TabsTrigger>
              </TabsList>

              <TabsContent value="help">
                <HelpCenter />
              </TabsContent>

              <TabsContent value="report">
                <IssueReporter schoolId={schoolId} user={user} school={school} />
              </TabsContent>

              <TabsContent value="status">
                <SystemStatus schoolId={schoolId} school={school} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}