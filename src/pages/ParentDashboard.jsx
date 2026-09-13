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
import { LayoutDashboard } from 'lucide-react';
import ParentDashboardHome from '@/components/parent/ParentDashboardHome';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnnouncementsFeed from '@/components/messaging/AnnouncementsFeed';
import { Panel } from '@/components/app/Panel';

const sidebarLinks = [
  { label: 'Dashboard', page: 'ParentDashboard', icon: LayoutDashboard },
];

// Labels, not icons. Nine tabs of small glyphs are a memory test; at this count
// the words are both shorter to parse and the thing that survives on a phone,
// where the icon-plus-hidden-label version collapsed to nine identical squares.
const TABS = [
  { value: 'home', label: 'Home' },
  { value: 'overview', label: 'Overview' },
  { value: 'grades', label: 'Grades' },
  { value: 'predicted', label: 'Predicted' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'messages', label: 'Messages' },
  { value: 'behavior', label: 'Behaviour' },
  { value: 'reporting', label: 'Reporting' },
];

export default function ParentDashboard() {
  const { user, school, schoolId } = useUser();
  const [selectedChildId, setSelectedChildId] = useState(null);

  return (
    <RoleGuard allowedRoles={['parent', 'super_admin', 'admin']}>
      <div className="cobalt-page min-h-screen">
        <AppSidebar links={sidebarLinks} role="parent" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />

        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-6xl mx-auto flex flex-col gap-5 md:gap-6">
            <header>
              <p className="cobalt-label m-0">{school?.name}</p>
              <h1 className="cobalt-h1 m-0 mt-1.5 text-2xl md:text-3xl">Family portal</h1>
            </header>

            <ChildSelector
              parentId={user?.id}
              schoolId={schoolId}
              selectedChildId={selectedChildId}
              onSelectChild={setSelectedChildId}
            />

            {selectedChildId ? (
              <Tabs defaultValue="home" className="flex flex-col gap-5 md:gap-6">
                <TabsList className="cobalt-tabs w-full overflow-x-auto">
                  {TABS.map(t => (
                    <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
                  ))}
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
                  <Panel title="Grades & feedback">
                    <div className="p-4">
                      <ChildGradesOverview schoolId={schoolId} studentId={selectedChildId} />
                    </div>
                  </Panel>
                </TabsContent>

                <TabsContent value="predicted">
                  <Panel title="Predicted grades">
                    <div className="p-4">
                      <ChildPredictedGrades schoolId={schoolId} studentId={selectedChildId} />
                    </div>
                  </Panel>
                </TabsContent>

                <TabsContent value="assignments">
                  <Panel title="Assignments">
                    <div className="p-4">
                      <ChildAssignmentsOverview schoolId={schoolId} studentId={selectedChildId} />
                    </div>
                  </Panel>
                </TabsContent>

                <TabsContent value="attendance">
                  <Panel title="Attendance">
                    <div className="p-4">
                      <ChildAttendanceOverview schoolId={schoolId} studentId={selectedChildId} />
                    </div>
                  </Panel>
                </TabsContent>

                <TabsContent value="messages">
                  <div className="flex flex-col gap-5 md:gap-6">
                    <Panel title="Teachers">
                      <div className="p-4">
                        <ParentMessaging
                          parentId={user?.id}
                          parentName={user?.full_name}
                          schoolId={schoolId}
                          studentId={selectedChildId}
                        />
                      </div>
                    </Panel>

                    <Panel title="Announcements">
                      <div className="p-4">
                        <AnnouncementsFeed schoolId={schoolId} userId={user?.id} classIds={[]} />
                      </div>
                    </Panel>
                  </div>
                </TabsContent>

                <TabsContent value="behavior">
                  <Panel title="Behaviour & notes">
                    <div className="p-4">
                      <ChildBehaviorOverview schoolId={schoolId} studentId={selectedChildId} />
                    </div>
                  </Panel>
                </TabsContent>

                <TabsContent value="reporting">
                  <ChildReporting schoolId={schoolId} studentId={selectedChildId} studentName={user?.full_name} />
                </TabsContent>
              </Tabs>
            ) : (
              <Panel title="No child selected">
                <p className="px-4 py-6 m-0 text-sm" style={{ color: 'var(--faint)' }}>
                  Pick a child above to see their grades, attendance and messages.
                </p>
              </Panel>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
