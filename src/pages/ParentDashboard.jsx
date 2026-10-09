import React, { useState } from 'react';
import { LayoutDashboard } from 'lucide-react';

import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';

import AppSidebar from '@/components/app/AppSidebar';
import AppShell, { Group } from '@/components/app/AppShell';

import ChildSelector from '@/components/parent/ChildSelector';
import ChildOverviewHub from '@/components/parent/ChildOverviewHub';
import ChildGradesOverview from '@/components/parent/ChildGradesOverview';
import ChildAssignmentsOverview from '@/components/parent/ChildAssignmentsOverview';
import ChildAttendanceOverview from '@/components/parent/ChildAttendanceOverview';
import ChildBehaviorOverview from '@/components/parent/ChildBehaviorOverview';
import ChildPredictedGrades from '@/components/parent/ChildPredictedGrades';
import ChildReporting from '@/components/parent/ChildReporting';
import ParentMessaging from '@/components/parent/ParentMessaging';
import ParentDashboardHome from '@/components/parent/ParentDashboardHome';

import AnnouncementsFeed from '@/components/messaging/AnnouncementsFeed';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

const sidebarLinks = [
  {
    label: 'Dashboard',
    page: 'ParentDashboard',
    icon: LayoutDashboard,
  },
];

const TABS = [
  { value: 'home', label: 'Home' },
  { value: 'overview', label: 'Overview' },
  { value: 'grades', label: 'Grades' },
  { value: 'predicted', label: 'Predicted' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'messages', label: 'Messages' },
  { value: 'behavior', label: 'Behaviour' },
  { value: 'reporting', label: 'Reports' },
];

function Section({ title, children }) {
  return (
    <Group title={title}>
      <div className="p-4 sm:p-5 lg:p-6">
        {children}
      </div>
    </Group>
  );
}

export default function ParentDashboard() {
  const { user, school, schoolId } = useUser();
  const [selectedChildId, setSelectedChildId] = useState(null);

  return (
    <RoleGuard allowedRoles={['parent', 'super_admin', 'admin']}>
      <AppSidebar
        links={sidebarLinks}
        role="parent"
        schoolName={school?.name}
        userName={user?.full_name}
        userId={user?.id}
        schoolId={schoolId}
      />

      <div className="app-offset">
        <AppShell
          eyebrow={school?.name}
          title="Family portal"
        >
          <div className="flex flex-col gap-6 lg:gap-8">
            {/* Child selector */}
            <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Student
                </p>

                <h2 className="mt-1 text-lg font-semibold tracking-tight">
                  Who would you like to view?
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Select a child to view their school information.
                </p>
              </div>

              <ChildSelector
                parentId={user?.id}
                schoolId={schoolId}
                selectedChildId={selectedChildId}
                onSelectChild={setSelectedChildId}
              />
            </section>

            {selectedChildId ? (
              <Tabs
                defaultValue="home"
                className="flex flex-col gap-5 md:gap-6"
              >
                {/* View selector */}
                <section className="rounded-2xl border bg-card px-4 py-5 shadow-sm sm:px-6">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="max-w-xl">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Explore
                      </p>

                      <h2 className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                        Choose what you would like to view
                      </h2>

                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                        Select an option below to view your child&apos;s grades,
                        attendance, assignments, messages and more.
                      </p>
                    </div>

                    <div className="w-full overflow-x-auto pb-1">
                      <div className="flex min-w-max justify-center px-1">
                        <TabsList
                          className="
                            inline-flex h-auto
                            items-center justify-center gap-1
                            rounded-xl border
                            bg-muted/40
                            p-1.5
                          "
                        >
                          {TABS.map((tab) => (
                            <TabsTrigger
                              key={tab.value}
                              value={tab.value}
                              className="
                                rounded-lg px-3.5 py-2
                                text-sm font-medium
                                text-muted-foreground
                                transition-all
                                hover:bg-background/70
                                hover:text-foreground
                                data-[state=active]:bg-background
                                data-[state=active]:text-foreground
                                data-[state=active]:shadow-sm
                              "
                            >
                              {tab.label}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>
                    </div>
                  </div>
                </section>

                <TabsContent
                  value="home"
                  className="mt-0"
                >
                  <ParentDashboardHome
                    schoolId={schoolId}
                    studentId={selectedChildId}
                    parentUserId={user?.id}
                  />
                </TabsContent>

                <TabsContent
                  value="overview"
                  className="mt-0"
                >
                  <ChildOverviewHub
                    schoolId={schoolId}
                    studentId={selectedChildId}
                  />
                </TabsContent>

                <TabsContent
                  value="grades"
                  className="mt-0"
                >
                  <Section title="Grades & feedback">
                    <ChildGradesOverview
                      schoolId={schoolId}
                      studentId={selectedChildId}
                    />
                  </Section>
                </TabsContent>

                <TabsContent
                  value="predicted"
                  className="mt-0"
                >
                  <Section title="Predicted grades">
                    <ChildPredictedGrades
                      schoolId={schoolId}
                      studentId={selectedChildId}
                    />
                  </Section>
                </TabsContent>

                <TabsContent
                  value="assignments"
                  className="mt-0"
                >
                  <Section title="Assignments">
                    <ChildAssignmentsOverview
                      schoolId={schoolId}
                      studentId={selectedChildId}
                    />
                  </Section>
                </TabsContent>

                <TabsContent
                  value="attendance"
                  className="mt-0"
                >
                  <Section title="Attendance">
                    <ChildAttendanceOverview
                      schoolId={schoolId}
                      studentId={selectedChildId}
                    />
                  </Section>
                </TabsContent>

                <TabsContent
                  value="messages"
                  className="mt-0"
                >
                  <div className="grid gap-5 xl:grid-cols-2">
                    <Section title="Teachers">
                      <ParentMessaging
                        parentId={user?.id}
                        parentName={user?.full_name}
                        schoolId={schoolId}
                        studentId={selectedChildId}
                      />
                    </Section>

                    <Section title="Announcements">
                      <AnnouncementsFeed
                        schoolId={schoolId}
                        userId={user?.id}
                        classIds={[]}
                      />
                    </Section>
                  </div>
                </TabsContent>

                <TabsContent
                  value="behavior"
                  className="mt-0"
                >
                  <Section title="Behaviour & notes">
                    <ChildBehaviorOverview
                      schoolId={schoolId}
                      studentId={selectedChildId}
                    />
                  </Section>
                </TabsContent>

                <TabsContent
                  value="reporting"
                  className="mt-0"
                >
                  <ChildReporting
                    schoolId={schoolId}
                    studentId={selectedChildId}
                    studentName={user?.full_name}
                  />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="rounded-2xl border border-dashed bg-muted/20 px-6 py-12 text-center">
                <div className="mx-auto max-w-md">
                  <h2 className="text-lg font-semibold">
                    Select a child to get started
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Choose a child above to view their grades, assignments,
                    attendance, messages, behaviour and reports.
                  </p>
                </div>
              </div>
            )}
          </div>
        </AppShell>
      </div>
    </RoleGuard>
  );
}