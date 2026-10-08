// The console frame: the rail, the account block, and the outlet.
//
// One route per area rather than one long page, so a section is somewhere you
// can bookmark, reload and land back into. The rail is grouped into five
// families, and each family carries one value of the brand green rather than a
// colour of its own — colour in this product marks a state somebody has to act
// on, and a rail painted in six hues spends that signal on decoration.
import React from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Toasts, Mark } from './kit';
import {
  useConsoleGate, useHeadline, useClimate, useIlo, useNas, useMetrics, tempState,
  useErrors, useReadiness,
} from './useConsoleData';
import { useUser } from '@/components/auth/UserContext';
import '@/styles/scholr-console.css';

/* Every page, imported statically. Each used to be its own lazy chunk, so a
   tab click meant a download and a full-screen loader — eleven times over, for
   pages a super admin moves between constantly. They are small and share one
   data layer, so they ship together: one chunk when the console first opens,
   nothing after. ConsoleShell itself stays lazy in App.jsx, so none of this
   reaches a parent, a teacher, or the public site. */
import Overview from '@/pages/console/Overview';
import Schools from '@/pages/console/Schools';
import SchoolDetail from '@/pages/console/SchoolDetail';
import Revenue from '@/pages/console/Revenue';
import People from '@/pages/console/People';
import Timetables from '@/pages/console/Timetables';
import Analytics from '@/pages/console/Analytics';
import Health from '@/pages/console/Health';
import Database from '@/pages/console/Database';
import Tickets from '@/pages/console/Tickets';
import Trail from '@/pages/console/Trail';
import Tools from '@/pages/console/Tools';
import Settings from '@/pages/console/Settings';
import Room from '@/pages/console/Room';
import Servers from '@/pages/console/Servers';
import Camera from '@/pages/console/Camera';
import Nas from '@/pages/console/Nas';
import Backups from '@/pages/console/Backups';
import Bugs from '@/pages/console/Bugs';
import Email from '@/pages/console/Email';
import SessionsPage from '@/pages/console/Sessions';
import Automation from '@/pages/console/Automation';

const I = {
  home:    <path d="M3 12h4l3 8 4-16 3 8h4" />,
  school:  <path d="M3 21h18M5 21V8l7-5 7 5v13M10 21v-6h4v6" />,
  money:   <><path d="M3 18l5-6 4 3 5-8" /><path d="M3 21h18" /></>,
  people:  <><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5.2a3.2 3.2 0 0 1 0 5.6M18 20a6 6 0 0 0-3-5.2" /></>,
  clock:   <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  chart:   <><path d="M3 21h18" /><path d="M6 21V10M11 21V5M16 21v-8M21 21v-5" /></>,
  health:  <path d="M3 12h4l2-4 3 8 2-5 2 3h5" />,
  db:      <><ellipse cx="12" cy="5.5" rx="8" ry="3" /><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  ticket:  <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4L3 21l1.1-3.4A8.4 8.4 0 1 1 21 11.5z" />,
  trail:   <><path d="M5 3h10l4 4v14H5z" /><path d="M15 3v4h4M9 12h6M9 16h6" /></>,
  tools:   <><path d="M14.7 6.3a4 4 0 0 0 5.3 5.3l-8 8a2.8 2.8 0 0 1-4-4z" /><path d="M14.7 6.3L18 3l3 3-3.3 3.3" /></>,
  room:    <><path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z" /></>,
  hw:      <><rect x="2" y="4" width="20" height="7" rx="1" /><rect x="2" y="13" width="20" height="7" rx="1" /><path d="M6 7.5h.01M6 16.5h.01" /></>,
  cam:     <><path d="M2 7h11v10H2z" /><path d="M13 11l7-4v10l-7-4z" /></>,
  nas:     <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M7 6h.01M7 12h.01M7 18h.01" /></>,
  backup:  <><path d="M21 12a9 9 0 1 1-2.6-6.3" /><path d="M21 3v6h-6" /></>,
  bug:     <><path d="M12 2l10 19H2z" /><path d="M12 9v5M12 17.5h.01" /></>,
  mail:    <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2.5 6.5L12 13l9.5-6.5" /></>,
  sess:    <><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>,
  auto:    <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></>,
  cog:     <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" /></>,
};

const GROUPS = [
  { fam: null, items: [{ to: '', label: 'Overview', icon: I.home, fam: '--r-5', end: true }] },
  { label: 'Schools', fam: '--r-5', items: [
    { to: 'schools', label: 'Schools', icon: I.school, flag: 'cap' },
    { to: 'revenue', label: 'Revenue', icon: I.money, flag: 'billing' },
    { to: 'people', label: 'People', icon: I.people },
  ] },
  { label: 'Teaching', fam: '--r-4', items: [
    { to: 'timetables', label: 'Timetables', icon: I.clock },
    { to: 'analytics', label: 'Adoption', icon: I.chart },
  ] },
  { label: 'The room', fam: '--r-3', items: [
    { to: 'room', label: 'Room', icon: I.room, flag: 'room' },
    { to: 'servers', label: 'Servers', icon: I.hw, flag: 'ilo' },
    { to: 'camera', label: 'Camera', icon: I.cam },
    { to: 'nas', label: 'NAS', icon: I.nas, flag: 'nas' },
  ] },
  { label: 'Platform', fam: '--r-3', items: [
    { to: 'health', label: 'Health', icon: I.health, flag: 'health' },
    { to: 'database', label: 'Database', icon: I.db },
    { to: 'backups', label: 'Backups', icon: I.backup, flag: 'backups' },
    { to: 'automation', label: 'Automation', icon: I.auto },
  ] },
  { label: 'Support', fam: '--r-2', items: [
    { to: 'tickets', label: 'Tickets', icon: I.ticket, flag: 'tickets' },
    { to: 'bugs', label: 'Bugs', icon: I.bug, flag: 'bugs' },
    { to: 'email', label: 'Email', icon: I.mail, flag: 'email' },
  ] },
  { label: 'System', fam: '--r-1', items: [
    { to: 'trail', label: 'Trail', icon: I.trail },
    { to: 'sessions', label: 'Sessions', icon: I.sess },
    { to: 'tools', label: 'Tools', icon: I.tools },
  ] },
];

export const CONSOLE_BASE = '/AdminConsole';
const BASE = CONSOLE_BASE;

export default function ConsoleShell() {
  // The console does not run inside the app Layout, so the super-admin check
  // lives here. It asks the database — `is_super_admin()` is the same function
  // RLS enforces with, so the console and the data cannot disagree.
  const gate = useConsoleGate();
  const h = useHeadline();
  const climate = useClimate();
  const ilo = useIlo();
  const nas = useNas();
  const metrics = useMetrics();
  const errors = useErrors(300);
  const readiness = useReadiness();

  const inlets = (metrics.data || []).map((m) => m.ambient_temp)
    .filter((v) => v != null).map(Number);
  const hotInlet = inlets.length && tempState(Math.max(...inlets), true) !== 'idle';

  // A dot in the rail is not decoration: it is the one place that says a
  // section has something waiting, so you do not have to open seven pages to
  // find out that none of them need you.
  const flags = {
    // The air conditioning being off is worth a dot even before anything is
    // hot: it is the thing that becomes an emergency while nobody is looking.
    room: (climate.data?.configured !== false && climate.data?.state?.power === false) ? 'warn'
      : hotInlet ? 'warn' : null,
    ilo: (ilo.data?.servers || []).some((s) => !s.ok) ? 'bad'
      : (ilo.data?.servers || []).some((s) => s.ok && s.powerState && s.powerState !== 'On') ? 'bad'
      : null,
    // A missed backup on a RAID 0 host is red, not amber.
    nas: nas.data?.alerts?.some((a) => a.level === 'red') ? 'bad'
      : nas.data?.alerts?.length ? 'warn' : null,
    backups: nas.data?.configured !== false
      && (nas.data?.status?.backup_age_h == null
        || nas.data.status.backup_age_h > (nas.data?.limits?.backup_max_age_h ?? 36))
      ? 'bad' : null,
    // Something broke for a real person in the last day.
    bugs: (errors.data || []).some((e) =>
      new Date(e.created_at).getTime() > Date.now() - 24 * 3600_000) ? 'warn' : null,
    // Nothing can be sent at all, which is worth a permanent dot until fixed.
    email: (readiness.data?.checks || []).some((c) =>
      /smtp|email/i.test(c.name) && c.status !== 'pass') ? 'warn' : null,
    cap: h.overCap.length > 0 ? 'warn' : null,
    billing: h.atRisk.length > 0 ? 'warn' : null,
    health: h.healthQ.isError ? 'bad' : (h.coldCache || h.tightConns) ? 'warn' : null,
    tickets: h.waiting > 0 ? 'warn' : null,
  };

  // Fail closed. A failed check sends you out rather than in.
  if (gate.isLoading) {
    return (
      <div className="cons" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p className="cons__load"><i aria-hidden="true" />Confirming this account may open the console…</p>
      </div>
    );
  }
  if (gate.data !== true) return <Navigate to="/" replace />;

  return (
    <Toasts>
      <div className="cons">
        <div className="cons__app">
          <aside className="cons__rail">
            <NavLink to="/" className="cons__brand" aria-label="Back to the site">
              <Mark size={30} />
              <span><b>scholr</b><small>platform console</small></span>
            </NavLink>

            <nav className="cons__nav" aria-label="Console">
              {GROUPS.map((g, gi) => (
                <React.Fragment key={g.label || `g${gi}`}>
                  {g.label && (
                    <div className="cons__grp" style={{ '--fam': `var(${g.fam})` }}>{g.label}</div>
                  )}
                  {g.items.map((it) => (
                    <NavLink key={it.to} end={it.end}
                      to={it.to ? `${BASE}/${it.to}` : BASE}
                      style={{ '--fam': `var(${it.fam || g.fam || '--r-5'})` }}
                      className={({ isActive }) => (isActive ? 'on' : undefined)}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">{it.icon}</svg>
                      {it.label}
                      {it.flag && flags[it.flag] && <span className={`n ${flags[it.flag]}`} />}
                    </NavLink>
                  ))}
                </React.Fragment>
              ))}
            </nav>

            <AccountBlock base={BASE} />
          </aside>

          <div className="cons__main">
            <Routes>
              <Route index element={<Overview />} />
              <Route path="schools" element={<Schools />} />
              <Route path="schools/:schoolId" element={<SchoolDetail />} />
              <Route path="revenue" element={<Revenue />} />
              <Route path="people" element={<People />} />
              <Route path="timetables" element={<Timetables />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="room" element={<Room />} />
              <Route path="servers" element={<Servers />} />
              <Route path="camera" element={<Camera />} />
              <Route path="nas" element={<Nas />} />
              <Route path="backups" element={<Backups />} />
              <Route path="automation" element={<Automation />} />
              <Route path="bugs" element={<Bugs />} />
              <Route path="email" element={<Email />} />
              <Route path="sessions" element={<SessionsPage />} />
              <Route path="health" element={<Health />} />
              <Route path="database" element={<Database />} />
              <Route path="tickets" element={<Tickets />} />
              <Route path="trail" element={<Trail />} />
              <Route path="tools" element={<Tools />} />
              <Route path="settings" element={<Settings />} />
              {/* An unknown console path lands on the Overview rather than the
                  app's 404, which would drop the operator out of the panel. */}
              <Route path="*" element={<Navigate to={BASE} replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </Toasts>
  );
}

function AccountBlock({ base }) {
  const { user } = useUser() || {};
  const initials = (user?.full_name || user?.email || '?')
    .split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();

  return (
    <div className="cons__acct">
      <NavLink to={`${base}/settings`} className={({ isActive }) => (isActive ? 'on' : undefined)}>
        <span className="who">{initials}</span>
        <span className="nm">
          <b>{user?.full_name || user?.email || 'Signed in'}</b>
          <span>super admin</span>
        </span>
        <svg className="cog" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3L17 7M7 17l-1.7 1.7" />
        </svg>
      </NavLink>
      <p className="prov">console · reads production</p>
    </div>
  );
}
