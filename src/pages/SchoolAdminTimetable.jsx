import React, { useState } from 'react';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import { useUser } from '@/components/auth/UserContext';


import { useTimetableData, OVERRIDE_POLICY_CONFIG } from '@/components/timetable/useTimetableData';
import TimetableStructureTab from '@/components/timetable/TimetableStructureTab';
import SyncSettingsTab       from '@/components/timetable/SyncSettingsTab';
import SyncMonitorTab        from '@/components/timetable/SyncMonitorTab';
import ConflictResolutionTab from '@/components/timetable/ConflictResolutionTab';

const TABS = [
  { value: 'structure', label: 'Structure' },
  { value: 'sync-settings', label: 'Sync' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'conflicts', label: 'Conflicts' },
];


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
    <SchoolAdminPage
      title="Timetable"
      eyebrow="As taught, and how it syncs"
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      allowedRoles={['school_admin', 'ib_coordinator', 'super_admin', 'admin']}
      related={[["SchoolAdminClasses","Classes"],["UnifiedCalendar","Calendar"],["SchoolAdminAcademicSetup","Academic setup"]]}
    >          <div className="flex-1 p-6">
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
    </SchoolAdminPage>
  );
}