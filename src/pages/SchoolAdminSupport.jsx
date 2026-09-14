import React from 'react';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard, Users, BookOpen, Calendar, CreditCard,
  FileText, Settings, Shield, MessageSquare, GraduationCap,
  HelpCircle, Bug, Activity
} from 'lucide-react';
import HelpCenter from '@/components/support/HelpCenter';
import IssueReporter from '@/components/support/IssueReporter';
import SystemStatus from '@/components/support/SystemStatus';

const sidebarLinks = [
  { label: 'Dashboard',        page: 'SchoolAdminDashboard',      icon: LayoutDashboard },
  { label: 'Users',            page: 'SchoolAdminUsers',           icon: Users },
  { label: 'Classes',          page: 'SchoolAdminClasses',         icon: BookOpen },
  { label: 'Academic Setup',   page: 'SchoolAdminAcademicSetup',   icon: GraduationCap },
  { label: 'Attendance',       page: 'SchoolAdminAttendance',      icon: Calendar },
  { label: 'Reports',          page: 'SchoolAdminReports',         icon: FileText },
  { label: 'Governance',       page: 'SchoolAdminGovernance',      icon: Shield },
  { label: 'Messaging Policy', page: 'SchoolAdminMessagingPolicy', icon: MessageSquare },
  { label: 'Billing',          page: 'SchoolAdminBilling',         icon: CreditCard },
  { label: 'Settings',         page: 'SchoolAdminSettings',        icon: Settings },
];

export default function SchoolAdminSupport() {
  const { user, school, schoolId } = useUser();

  return (
    <RoleGuard allowedRoles={['school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar
          links={sidebarLinks}
          role="school_admin"
          schoolName={school?.name}
          userName={user?.full_name}
          userId={user?.id}
          schoolId={schoolId}
        />

        <main className="app-offset">
          <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
            <h1 className="text-base font-black text-slate-900 tracking-tight">Support & Help</h1>
            <p className="text-xs text-slate-400 mt-0.5">Guides, issue reporting, and platform status for {school?.name || 'your school'}</p>
          </div>

          <div className="p-6 max-w-5xl">
            <Tabs defaultValue="help">
              <TabsList className="bg-white border border-slate-200 h-auto mb-6">
                <TabsTrigger value="help" className="text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                  <HelpCircle className="w-3.5 h-3.5" /> Help Center
                </TabsTrigger>
                <TabsTrigger value="report" className="text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                  <Bug className="w-3.5 h-3.5" /> Contact Support
                </TabsTrigger>
                <TabsTrigger value="status" className="text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
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