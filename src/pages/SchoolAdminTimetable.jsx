import React, { useState } from 'react';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { useUser } from '@/components/auth/UserContext';
import {
  Activity, MapPin, Link2, Settings,
} from 'lucide-react';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import AdminTabNavigation from '@/components/admin/AdminTabNavigation';

import { useTimetableData, OVERRIDE_POLICY_CONFIG } from '@/components/timetable/useTimetableData';
import TimetableStructureTab from '@/components/timetable/TimetableStructureTab';
import SyncSettingsTab       from '@/components/timetable/SyncSettingsTab';
import SyncMonitorTab        from '@/components/timetable/SyncMonitorTab';
import ConflictResolutionTab from '@/components/timetable/ConflictResolutionTab';



export default function SchoolAdminTimetable() {
  const { user, school, schoolId } = useUser();
  const [activeTab, setActiveTab] = useState('structure');

  const {
    scheduleEntries, periods, rooms, syncHistory, settings,
    memberships, classes, isLoading, refetchAll,
  } = useTimetableData(schoolId);

  const overridePolicy = settings?.override_policy || 'allow_local_edits';
  const policyCfg = OVERRIDE_POLICY_CONFIG[overridePolicy];

  const lastSync = syncHistory[0];
  const openConflicts = syncHistory.reduce(
    (sum, s) => sum + (s.mapping_conflicts?.filter(c => !c.resolved).length || 0),
    0
  );
  const lastSyncFailed = lastSync?.status === 'failed';

  return (
    <RoleGuard allowedRoles={['school_admin', 'ib_coordinator', 'super_admin', 'admin']}>
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
            tabs={[
              { id: 'structure', label: 'Structure', icon: MapPin },
              { id: 'sync-settings', label: 'Sync Settings', icon: Settings },
              { id: 'monitor', label: 'Monitor & Logs', icon: Activity, badge: (openConflicts > 0 || lastSyncFailed) ? '!' : null },
              { id: 'conflicts', label: 'Conflict Resolution', icon: Link2, badge: openConflicts > 0 ? openConflicts : null },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            colorScheme="indigo"
            title="Timetable & Integration Controls"
            subtitle={`${scheduleEntries.filter(e => e.status === 'active').length} schedule entries · ${periods.length} periods · ${rooms.length} rooms`}
          />

          <div className="flex-1 p-6">
            {activeTab === 'structure' && (
              <TimetableStructureTab
                schoolId={schoolId}
                periods={periods}
                rooms={rooms}
                scheduleEntries={scheduleEntries}
                settings={settings}
              />
            )}
            {activeTab === 'sync-settings' && (
              <SyncSettingsTab
                schoolId={schoolId}
                settings={settings}
              />
            )}
            {activeTab === 'monitor' && (
              <SyncMonitorTab
                schoolId={schoolId}
                syncHistory={syncHistory}
                settings={settings}
                scheduleEntries={scheduleEntries}
                periods={periods}
                rooms={rooms}
              />
            )}
            {activeTab === 'conflicts' && (
              <ConflictResolutionTab
                schoolId={schoolId}
                syncHistory={syncHistory}
                settings={settings}
                memberships={memberships}
                classes={classes}
                rooms={rooms}
                periods={periods}
              />
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}