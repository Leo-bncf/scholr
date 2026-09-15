import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LogOut, Search } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';
import BellBoundary from '@/components/notifications/BellBoundary';
import { signOut } from '@/data/session';
import { preloadPage, preloadPages } from '@/lib/lazyPage';

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
 * Its ground is a step darker than the app's and the nav floats on it as a
 * group, so the chrome and the content speak the same inset-list language.
 * The shape is borrowed from Schedual, which solves this well.
 *
 * The search is not decoration: a school admin has fifteen destinations, and
 * filtering beats scrolling. ⌘K focuses it from anywhere.
 *
 * Active detection is an exact path match, and only the FIRST match is marked.
 * It used to be `pathname.includes(page)`, which lit up every SchoolAdmin*
 * route at once; and when two links legitimately pointed at one page, three
 * rows highlighted together.
 */
export default function AppSidebar({ links, role, schoolName, userName, userId, schoolId }) {
  const { pathname } = useLocation();
  const [query, setQuery] = useState('');
  const searchRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) setQuery('');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* And warm the whole menu once the browser is idle, so navigation is
     instant even when someone clicks without hovering first — from the
     command palette, a Next link, or the browser's back button. */
  useEffect(() => {
    preloadPages(links.map(l => l.page));
  }, [links]);

  const current = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const activePage = useMemo(() => {
    const hit = links.find(l => createPageUrl(l.page).replace(/^\/+/, '').toLowerCase() === current);
    return hit?.page;
  }, [links, current]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? links.filter(l => l.label.toLowerCase().includes(q)) : links;
  }, [links, query]);

  return (
    <aside
      className="hidden md:flex app-sidebar"
      style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '15.5rem', zIndex: 40,
        flexDirection: 'column', gap: 'var(--space-2xs)',
        padding: 'var(--space-2xs)', borderRight: '1px solid var(--rule)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.45rem .35rem .1rem' }}>
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
        {userId && schoolId && (
          <BellBoundary><NotificationBell userId={userId} schoolId={schoolId} /></BellBoundary>
        )}
      </div>

      <div className="app-navsearch" style={{ padding: '0 .35rem' }}>
        <Search className="app-navsearch__icon w-3.5 h-3.5" aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Filter navigation"
        />
        <kbd aria-hidden="true">⌘K</kbd>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 .35rem' }} aria-label="Main">
        {schoolName && (
          <p
            className="scholr-label"
            style={{ margin: '.5rem .25rem .4rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {schoolName}
          </p>
        )}
        <div className="app-nav-group">
          {shown.length === 0 ? (
            <p style={{ margin: 0, padding: 'var(--space-md) .6rem', textAlign: 'center', fontSize: '.8rem', color: 'var(--faint)' }}>
              Nothing matches “{query}”.
            </p>
          ) : (
            shown.map((link, i) => {
              /* A section label prints the first time a section appears.
                 Suppressed while searching: with the list already filtered,
                 a heading over one result each is noise and it breaks the run
                 of matches into fragments. A school admin has twenty-one
                 destinations — twice the super admin's — and the grouping is
                 what makes that scannable rather than a wall. */
              const heading = !query && link.section && link.section !== shown[i - 1]?.section
                ? link.section
                : null;
              return (
                <React.Fragment key={link.page + link.label}>
                  {heading && (
                    <p
                      className="scholr-label"
                      style={{ margin: i === 0 ? '.15rem .55rem .3rem' : '.7rem .55rem .3rem' }}
                    >
                      {heading}
                    </p>
                  )}
                  <Link
                    to={createPageUrl(link.page)}
                    className="app-nav-item scholr-focus"
                    aria-current={link.page === activePage ? 'page' : undefined}
                    /* Start fetching the route's chunk the moment the pointer
                       touches the link. A deliberate click is ~200ms behind the
                       hover, which is longer than any of these chunks take, so
                       the page is already in memory when the click lands and
                       Suspense never renders. Touch devices get onTouchStart,
                       and keyboard users get onFocus. */
                    onMouseEnter={() => preloadPage(link.page)}
                    onTouchStart={() => preloadPage(link.page)}
                    onFocus={() => preloadPage(link.page)}
                  >
                    <link.icon className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.label}</span>
                  </Link>
                </React.Fragment>
              );
            })
          )}
        </div>
      </nav>

      <div style={{ padding: '0 .35rem .1rem' }}>
        <div className="app-nav-group" style={{ padding: '.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.15rem .2rem .45rem' }}>
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
              <span style={{ display: 'block', fontSize: '.83rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userName || 'Signed in'}
              </span>
              <span style={{ display: 'block', fontSize: '.71rem', color: 'var(--muted)' }}>
                {ROLE_LABELS[role] || role}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => signOut()}
            className="app-nav-item scholr-focus"
            style={{ width: '100%', cursor: 'pointer', background: 'none' }}
          >
            <LogOut className="w-4 h-4 shrink-0" style={{ color: 'var(--muted)' }} />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
