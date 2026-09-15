import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';

/**
 * The six things a school admin does most.
 *
 * These are tasks, not pages. Two of them used to be the same destination
 * under two names — "Add user" and "Import CSV" both landed on Users, on the
 * directory tab, leaving you to find the right tab yourself. Now that the
 * frame keeps the tab in the URL, each one opens on the panel that does the
 * job.
 *
 * Six tiles in six hues came before this; Scholr has one accent and it is
 * spent on the alerts above, so these are hairline cells.
 */
const QUICK_ACTIONS = [
  { label: 'Invite staff',      sub: 'Send an account invitation', page: 'SchoolAdminUsers', tab: 'invitations' },
  { label: 'Import a roster',   sub: 'Bulk upload from CSV',       page: 'SchoolAdminUsers', tab: 'import' },
  { label: 'Create a class',    sub: 'New course or section',      page: 'SchoolAdminClasses' },
  { label: 'Take attendance',   sub: "Mark today's registers",     page: 'SchoolAdminAttendance' },
  { label: 'Check the timetable', sub: 'Clashes and free rooms',   page: 'SchoolAdminTimetable' },
  { label: 'Build a report',    sub: 'Export what leadership asks for', page: 'SchoolAdminReports', tab: 'build' },
];

export default function QuickActionsHub() {
  return (
    <div
      // Six items, three columns: the count has to divide the column count
      // exactly or the unfilled cells of the last row show the grid backdrop
      // as a grey slab.
      className="scholr-grid app-cols-6"
    >
      {QUICK_ACTIONS.map(({ label, sub, page, tab }) => (
        <Link
          key={label}
          to={createPageUrl(page) + (tab ? `?tab=${tab}` : '')}
          className="group scholr-focus px-4 py-3.5 flex items-center gap-2"
          style={{ textDecoration: 'none' }}
        >
          <span className="min-w-0">
            <span className="block text-sm font-medium" style={{ color: 'var(--ink)' }}>{label}</span>
            <span className="block text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</span>
          </span>
          <ArrowRight
            className="w-4 h-4 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: 'var(--brand)' }}
          />
        </Link>
      ))}
    </div>
  );
}
