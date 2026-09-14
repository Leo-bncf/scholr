import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';

/**
 * The six things a school admin does most.
 *
 * Previously six tiles in six different hues, each with a filled icon chip —
 * which made the row the loudest thing on a page whose actual job is to
 * surface problems. Cobalt has one accent, so these are hairline cells and the
 * colour is spent on the alerts instead.
 */
const QUICK_ACTIONS = [
  { label: 'Add user',        sub: 'Invite staff or students', link: 'SchoolAdminUsers' },
  { label: 'Create class',    sub: 'New course or section',    link: 'SchoolAdminClasses' },
  { label: 'Assign teachers', sub: 'Staff into classes',       link: 'SchoolAdminEnrollments' },
  { label: 'Import CSV',      sub: 'Bulk upload users',        link: 'SchoolAdminUsers' },
  { label: 'Sync timetable',  sub: 'Run a schedule sync',      link: 'SchoolAdminTimetable' },
  { label: 'Export reports',  sub: 'Download school data',     link: 'SchoolAdminReports' },
];

export default function QuickActionsHub() {
  return (
    <div
      // Six items, three columns: the count has to divide the column count
      // exactly or the unfilled cells of the last row show the grid backdrop
      // as a grey slab.
      className="scholr-grid app-cols-6"
    >
      {QUICK_ACTIONS.map(({ label, sub, link }) => (
        <Link
          key={label}
          to={createPageUrl(link)}
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
