import React, { useState } from 'react';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import ChildSelector from '@/components/parent/ChildSelector';
import ChildOverviewHub from '@/components/parent/ChildOverviewHub';
import ChildGradesOverview from '@/components/parent/ChildGradesOverview';
import ChildAssignmentsOverview from '@/components/parent/ChildAssignmentsOverview';
import ChildAttendanceOverview from '@/components/parent/ChildAttendanceOverview';
import ChildBehaviorOverview from '@/components/parent/ChildBehaviorOverview';
import ChildPredictedGrades from '@/components/parent/ChildPredictedGrades';
import ChildReporting from '@/components/parent/ChildReporting';
import ParentMessaging from '@/components/parent/ParentMessaging';
import { LayoutDashboard, Users, MessageSquare, BarChart3, ClipboardCheck, Calendar, FileText, Megaphone, Home } from 'lucide-react';
import ParentDashboardHome from '@/components/parent/ParentDashboardHome';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnnouncementsFeed from '@/components/messaging/AnnouncementsFeed';

const sidebarLinks = [
  { label: 'Dashboard', page: 'ParentDashboard', icon: LayoutDashboard },
];

export default function ParentDashboard() {
  const { user, school, schoolId } = useUser();
  const [selectedChildId, setSelectedChildId] = useState(null);

  return (
    <RoleGuard allowedRoles={['parent', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={sidebarLinks} role="parent" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Parent Portal</h1>
              <p className="text-xs md:text-sm text-slate-600 mb-6">Monitor your child's academic progress and school activities</p>
              
              <ChildSelector
                parentId={user?.id}
                schoolId={schoolId}
                selectedChildId={selectedChildId}
                onSelectChild={setSelectedChildId}
              />
            </div>

            {selectedChildId ? (
              <Tabs defaultValue="home" className="space-y-6">
                <TabsList className="bg-white border border-slate-200 w-full justify-start overflow-x-auto flex-wrap md:flex-nowrap">
                  <TabsTrigger value="home" className="text-xs md:text-sm">
                    <Home className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Home</span>
                  </TabsTrigger>
                  <TabsTrigger value="overview" className="text-xs md:text-sm">
                    <LayoutDashboard className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger value="grades" className="text-xs md:text-sm">
                    <BarChart3 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Grades</span>
                  </TabsTrigger>
                  <TabsTrigger value="predicted" className="text-xs md:text-sm">
                    <BarChart3 className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Predicted</span>
                  </TabsTrigger>
                  <TabsTrigger value="assignments" className="text-xs md:text-sm">
                    <ClipboardCheck className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Assignments</span>
                  </TabsTrigger>
                  <TabsTrigger value="attendance" className="text-xs md:text-sm">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Attendance</span>
                  </TabsTrigger>
                  <TabsTrigger value="messages" className="text-xs md:text-sm">
                    <MessageSquare className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Messages</span>
                  </TabsTrigger>
                  <TabsTrigger value="behavior" className="text-xs md:text-sm">
                    <FileText className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Behavior</span>
                  </TabsTrigger>
                  <TabsTrigger value="reporting" className="text-xs md:text-sm">
                    <FileText className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">Reporting</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="home">
                  <ParentDashboardHome
                    schoolId={schoolId}
                    studentId={selectedChildId}
                    parentUserId={user?.id}
                  />
                </TabsContent>

                <TabsContent value="overview">
                  <ChildOverviewHub schoolId={schoolId} studentId={selectedChildId} />
                </TabsContent>

                <TabsContent value="grades">
                  <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6 uppercase tracking-wide">Grades & Feedback</h2>
                    <ChildGradesOverview schoolId={schoolId} studentId={selectedChildId} />
                  </div>
                </TabsContent>

                <TabsContent value="predicted">
                  <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6 uppercase tracking-wide">Predicted IB Grades</h2>
                    <ChildPredictedGrades schoolId={schoolId} studentId={selectedChildId} />
                  </div>
                </TabsContent>

                <TabsContent value="assignments">
                  <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6 uppercase tracking-wide">Assignments Overview</h2>
                    <ChildAssignmentsOverview schoolId={schoolId} studentId={selectedChildId} />
                  </div>
                </TabsContent>

                <TabsContent value="attendance">
                  <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6 uppercase tracking-wide">Attendance Records</h2>
                    <ChildAttendanceOverview schoolId={schoolId} studentId={selectedChildId} />
                  </div>
                </TabsContent>

                <TabsContent value="messages">
                  <div className="space-y-6">
                    <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-6">
                      <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Teacher Communication</h2>
                      </div>
                      <ParentMessaging
                        parentId={user?.id}
                        parentName={user?.full_name}
                        schoolId={schoolId}
                        studentId={selectedChildId}
                      />
                    </div>

                    <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <Megaphone className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Announcements</h2>
                      </div>
                      <AnnouncementsFeed schoolId={schoolId} userId={user?.id} classIds={[]} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="behavior">
                  <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-6">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6 uppercase tracking-wide">Behavior & Notes</h2>
                    <ChildBehaviorOverview schoolId={schoolId} studentId={selectedChildId} />
                  </div>
                </TabsContent>

                <TabsContent value="reporting">
                  <ChildReporting schoolId={schoolId} studentId={selectedChildId} studentName={user?.full_name} />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="bg-white rounded-md border border-slate-200 shadow-sm p-8 md:p-12 text-center">
                <Users className="w-12 md:w-16 h-12 md:h-16 text-slate-300 mx-auto mb-4" />
                <h2 className="text-lg md:text-xl font-semibold text-slate-900 mb-2 uppercase tracking-wide">Select a Child</h2>
                <p className="text-xs md:text-sm text-slate-600">Choose a child from the dropdown above to view their information</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}