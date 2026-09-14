import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LogOut } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import { signOut } from '@/data/session';

const ROLE_LABELS = {
  super_admin: 'Platform admin',
  school_admin: 'School admin',
  ib_coordinator: 'Coordinator',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

/**
 * The signed-in sidebar.
 *
 * A translucent material rather than a flat white panel, so the page tints it
 * as content scrolls past. The selected item is a filled inset row — not a
 * coloured left stripe, which is both a named tell and, at this size, harder
 * to see than a fill.
 *
 * Active detection is an exact path match. It used to be
 * `pathname.includes(page)`, which lit up several items at once: every
 * SchoolAdmin* route contains "SchoolAdmin", so a school admin saw four
 * selected rows.
 *
 * Only the FIRST match is marked. Two links can legitimately resolve to the
 * same page while a section is being built out, and when that happened on the
 * coordinator nav three rows highlighted at once. The list is the thing to
 * fix, but the chrome should not multiply the mistake.
 */
export default function AppSidebar({ links, role, schoolName, userName, userId, schoolId }) {
  const { pathname } = useLocation();
  const current = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();

  return (
    <aside
      className="hidden md:flex app-material"
      style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '15.5rem', zIndex: 40,
        flexDirection: 'column', borderRight: '1px solid var(--material-edge)',
      }}
    >
      <div style={{ padding: 'var(--space-sm) var(--space-sm) var(--space-2xs)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <Link
            to={createPageUrl('AppHome')}
            className="scholr-focus"
            style={{ display: 'flex', alignItems: 'center', gap: '.55rem', minWidth: 0, flex: 1, textDecoration: 'none' }}
          >
            <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--brand)', position: 'relative', flex: 'none' }}>
              <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)' }} />
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)', fontWeight: 650, fontSize: '1.02rem',
                letterSpacing: '-.035em', color: 'var(--ink)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              Scholr
            </span>
          </Link>
          {userId && schoolId && <NotificationBell userId={userId} schoolId={schoolId} />}
        </div>
        {schoolName && (
          <p
            className="scholr-label"
            style={{ margin: '.55rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {schoolName}
          </p>
        )}
      </div>

      <nav
        style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2xs) var(--space-2xs)', display: 'flex', flexDirection: 'column', gap: '1px' }}
      >
        {(() => {
          const activeIndex = links.findIndex(
            l => createPageUrl(l.page).replace(/^\/+/, '').toLowerCase() === current,
          );
          return links.map((link, i) => {
          const isActive = i === activeIndex;
          return (
            <Link
              key={link.page}
              to={createPageUrl(link.page)}
              className="app-nav-item scholr-focus"
              aria-current={isActive ? 'page' : undefined}
            >
              <link.icon className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.label}</span>
            </Link>
          );
          });
        })()}
      </nav>

      <div style={{ padding: 'var(--space-2xs)', borderTop: '1px solid var(--rule-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.4rem .6rem' }}>
          <span
            style={{
              width: 28, height: 28, borderRadius: '50%', flex: 'none',
              background: 'var(--brand-sf)', color: 'var(--brand)',
              display: 'grid', placeItems: 'center',
              fontSize: '.72rem', fontWeight: 600, fontFamily: 'var(--font-mono)',
            }}
          >
            {userName?.[0]?.toUpperCase() || '?'}
          </span>
          <span style={{ minWidth: 0 }}>
            <span
              style={{ display: 'block', fontSize: '.85rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {userName || 'Signed in'}
            </span>
            <span style={{ display: 'block', fontSize: '.72rem', color: 'var(--muted)' }}>
              {ROLE_LABELS[role] || role}
            </span>
          </span>
        </div>
        <button type="button" onClick={() => signOut()} className="app-nav-item scholr-focus" style={{ width: '100%', cursor: 'pointer', background: 'none', border: 'none' }}>
          <LogOut className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
