import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  CalendarClock,
  CreditCard,
  FileText,
  Headphones,
  School,
  Settings,
  Users,
  Zap,
} from 'lucide-react';

const navItems = [
  { key: 'overview', label: 'Overview', page: 'SuperAdminDashboard', icon: Activity },
  { key: 'schools', label: 'Schools', page: 'SuperAdminSchools', icon: School },
  { key: 'users', label: 'Users', page: 'SuperAdminUsers', icon: Users },
  { key: 'timetables', label: 'Timetables', page: 'SuperAdminTimetables', icon: CalendarClock },
  { key: 'billing', label: 'Billing', page: 'SuperAdminBilling', icon: CreditCard },
  { key: 'analytics', label: 'Analytics', page: 'SuperAdminAnalytics', icon: BarChart3 },
  { key: 'automation', label: 'Automation', page: 'SuperAdminAutomation', icon: Zap },
  { key: 'settings', label: 'Settings', page: 'SuperAdminSettings', icon: Settings },
  { key: 'plans', label: 'Plans', page: 'SuperAdminPlans', icon: BookOpen },
  { key: 'audit-logs', label: 'Audit Logs', page: 'SuperAdminAuditLogs', icon: FileText },
  { key: 'support', label: 'Support', page: 'SuperAdminSupport', icon: Headphones },
];

export default function SuperAdminShell({ activeItem, currentUser, children }) {
  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between gap-4">
        <Link to={createPageUrl('Landing')} className="flex items-center gap-3 hover:opacity-90 transition-opacity min-w-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 font-semibold text-sm truncate">IB Platform</p>
            <p className="text-slate-500 text-xs truncate">Super Admin Console</p>
          </div>
        </Link>

        {currentUser ? (
          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden md:block text-slate-500 text-sm truncate max-w-[240px]">{currentUser.email}</span>
            <Button
              onClick={() => base44.auth.logout()}
              variant="ghost"
              size="sm"
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs"
            >
              Sign out
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex lg:w-56 bg-white border-r border-slate-200 p-4 flex-col gap-1 flex-shrink-0 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.key;

            return (
              <Link
                key={item.key}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}