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
import AppShell, { Group } from '@/components/app/AppShell';

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
      <AppSidebar links={sidebarLinks} role="parent" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
      <div className="app-offset">
        <AppShell eyebrow={school?.name} title="Family portal">
            <ChildSelector
              parentId={user?.id}
              schoolId={schoolId}
              selectedChildId={selectedChildId}
              onSelectChild={setSelectedChildId}
            />

            {selectedChildId ? (
              <Tabs defaultValue="home" className="flex flex-col gap-5 md:gap-6">
                <TabsList className="scholr-tabs w-full overflow-x-auto">
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
                  <Group title="Grades & feedback">
                    <div className="p-4">
                      <ChildGradesOverview schoolId={schoolId} studentId={selectedChildId} />
                    </div>
                  </Group>
                </TabsContent>

                <TabsContent value="predicted">
                  <Group title="Predicted grades">
                    <div className="p-4">
                      <ChildPredictedGrades schoolId={schoolId} studentId={selectedChildId} />
                    </div>
                  </Group>
                </TabsContent>

                <TabsContent value="assignments">
                  <Group title="Assignments">
                    <div className="p-4">
                      <ChildAssignmentsOverview schoolId={schoolId} studentId={selectedChildId} />
                    </div>
                  </Group>
                </TabsContent>

                <TabsContent value="attendance">
                  <Group title="Attendance">
                    <div className="p-4">
                      <ChildAttendanceOverview schoolId={schoolId} studentId={selectedChildId} />
                    </div>
                  </Group>
                </TabsContent>

                <TabsContent value="messages">
                  <div className="flex flex-col gap-5 md:gap-6">
                    <Group title="Teachers">
                      <div className="p-4">
                        <ParentMessaging
                          parentId={user?.id}
                          parentName={user?.full_name}
                          schoolId={schoolId}
                          studentId={selectedChildId}
                        />
                      </div>
                    </Group>

                    <Group title="Announcements">
                      <div className="p-4">
                        <AnnouncementsFeed schoolId={schoolId} userId={user?.id} classIds={[]} />
                      </div>
                    </Group>
                  </div>
                </TabsContent>

                <TabsContent value="behavior">
                  <Group title="Behaviour & notes">
                    <div className="p-4">
                      <ChildBehaviorOverview schoolId={schoolId} studentId={selectedChildId} />
                    </div>
                  </Group>
                </TabsContent>

                <TabsContent value="reporting">
                  <ChildReporting schoolId={schoolId} studentId={selectedChildId} studentName={user?.full_name} />
                </TabsContent>
              </Tabs>
            ) : (
              <Group title="No child selected">
                <p className="px-4 py-6 m-0 text-sm" style={{ color: 'var(--faint)' }}>
                  Pick a child above to see their grades, attendance and messages.
                </p>
              </Group>
            )}
        </AppShell>
      </div>
    </RoleGuard>
  );
}
