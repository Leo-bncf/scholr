import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import SetupWizard from '@/components/onboarding/SetupWizard';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import DemoDataControls from '@/components/onboarding/DemoDataControls';
import InvitationsManager from '@/components/onboarding/InvitationsManager';
import ParentLinkingPanel from '@/components/onboarding/ParentLinkingPanel';
import SchoolReadiness from '@/components/onboarding/SchoolReadiness';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard, Users, BookOpen, Calendar, CreditCard,
  FileText, Settings, Sparkles, CheckSquare, FlaskConical,
  ArrowLeft, Shield, MessageSquare, GraduationCap, Clock, Link2, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export default function SchoolAdminOnboarding() {
  const navigate = useNavigate();
  const { user, school, schoolId } = useUser();
  const queryClient = useQueryClient();
  const [wizardComplete, setWizardComplete] = useState(false);

  const handleWizardComplete = () => {
    setWizardComplete(true);
    queryClient.invalidateQueries({ queryKey: ['onboarding-status', schoolId] });
    queryClient.invalidateQueries({ queryKey: ['school-operations', schoolId] });
  };

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

        <main className="md:ml-64">
          <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/SchoolAdminDashboard')}
                  className="gap-1.5 text-slate-500"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
                </Button>
                <div className="w-px h-5 bg-slate-200" />
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div>
                    <h1 className="text-sm font-black text-slate-900">School Setup & Onboarding</h1>
                    <p className="text-xs text-slate-400">Get your school operational in minutes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 max-w-6xl">
            {!wizardComplete ? (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-6 text-white">
                  <h2 className="text-xl font-black mb-1">Welcome to {school?.name || 'your school'}!</h2>
                  <p className="text-indigo-100 text-sm max-w-xl">
                    Let's get your school configured and your team activated. Follow the wizard, then invite users and link parents to their children.
                  </p>
                  <div className="flex gap-4 mt-4 text-xs text-indigo-200">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Takes ~5 minutes to configure</span>
                    <span className="flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5" /> Save progress at any step</span>
                    <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> IB-ready presets included</span>
                  </div>
                </div>

                <SchoolReadiness schoolId={schoolId} />

                <Tabs defaultValue="wizard">
                  <TabsList className="bg-white border border-slate-200 flex-wrap h-auto">
                    <TabsTrigger value="wizard" className="gap-1.5 text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                      <Sparkles className="w-3.5 h-3.5" /> Setup Wizard
                    </TabsTrigger>
                    <TabsTrigger value="invites" className="gap-1.5 text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                      <Mail className="w-3.5 h-3.5" /> Users & Invites
                    </TabsTrigger>
                    <TabsTrigger value="parents" className="gap-1.5 text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                      <Link2 className="w-3.5 h-3.5" /> Parent Links
                    </TabsTrigger>
                    <TabsTrigger value="checklist" className="gap-1.5 text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                      <CheckSquare className="w-3.5 h-3.5" /> Checklist
                    </TabsTrigger>
                    <TabsTrigger value="demo" className="gap-1.5 text-xs data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                      <FlaskConical className="w-3.5 h-3.5" /> Demo Data
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="wizard" className="mt-5">
                    <SetupWizard onComplete={handleWizardComplete} />
                  </TabsContent>

                  <TabsContent value="invites" className="mt-5">
                    <InvitationsManager schoolId={schoolId} schoolName={school?.name} />
                  </TabsContent>

                  <TabsContent value="parents" className="mt-5">
                    <ParentLinkingPanel schoolId={schoolId} />
                  </TabsContent>

                  <TabsContent value="checklist" className="mt-5">
                    <OnboardingChecklist
                      schoolId={schoolId}
                      showWizard={null}
                    />
                  </TabsContent>

                  <TabsContent value="demo" className="mt-5">
                    <DemoDataControls
                      schoolId={schoolId}
                      onRefresh={() => {
                        queryClient.invalidateQueries({ queryKey: ['onboarding-status', schoolId] });
                        queryClient.invalidateQueries({ queryKey: ['school-operations', schoolId] });
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <Sparkles className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Setup Complete!</h2>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  Your school is now configured. You can refine settings at any time from the admin panels.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate('/SchoolAdminDashboard')} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => setWizardComplete(false)} className="gap-1.5">
                    <Sparkles className="w-4 h-4" /> Re-run Wizard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}