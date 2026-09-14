import React from 'react';
import {
  Activity, BarChart3, CalendarClock, CreditCard, FileText,
  Headphones, HeartPulse, School, Settings, Users,
} from 'lucide-react';
import AppSidebar from '@/components/app/AppSidebar';
import AppShell from '@/components/app/AppShell';

/**
 * The platform console.
 *
 * This used to carry its own chrome — a white top bar with a wordmark, plus a
 * separate slate side rail — written before AppSidebar existed and never
 * revisited. Twelve pages hung off it, so a super admin saw a completely
 * different product from the one everyone else uses: none of the material,
 * none of the grouped lists, none of the nav search.
 *
 * It is the same sidebar and the same shell as the rest of the app now. The
 * only thing it keeps of its own is the destination list, because those pages
 * genuinely exist only here.
 */
const NAV = [
  { key: 'overview',   label: 'Overview',   page: 'SuperAdminDashboard',  icon: Activity },
  { key: 'schools',    label: 'Schools',    page: 'SuperAdminSchools',    icon: School },
  { key: 'users',      label: 'Users',      page: 'SuperAdminUsers',      icon: Users },
  { key: 'timetables', label: 'Timetables', page: 'SuperAdminTimetables', icon: CalendarClock },
  { key: 'billing',    label: 'Billing',    page: 'SuperAdminBilling',    icon: CreditCard },
  { key: 'analytics',  label: 'Analytics',  page: 'SuperAdminAnalytics',  icon: BarChart3 },
  { key: 'health',     label: 'Health',     page: 'SuperAdminHealth',     icon: HeartPulse },
  { key: 'audit-logs', label: 'Audit log',  page: 'SuperAdminAuditLogs',  icon: FileText },
  { key: 'support',    label: 'Support',    page: 'SuperAdminSupport',    icon: Headphones },
  { key: 'settings',   label: 'Settings',   page: 'SuperAdminSettings',   icon: Settings },
];

export default function SuperAdminShell({ activeItem, currentUser, title, eyebrow, actions, children }) {
  return (
    <>
      <AppSidebar
        links={NAV}
        role="super_admin"
        schoolName="Every school"
        userName={currentUser?.full_name || currentUser?.email}
      />
      <div className="app-offset">
        <AppShell
          title={title || NAV.find(n => n.key === activeItem)?.label || 'Platform'}
          eyebrow={eyebrow}
          actions={actions}
        >
          {children}
        </AppShell>
      </div>
    </>
  );
}
