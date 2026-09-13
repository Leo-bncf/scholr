/**
 * Marketing screenshots, rendered from the real product.
 *
 * The landing page needs pictures of the software. Drawing them in a design
 * tool means they are wrong the day after they are made, and taking them by
 * hand means someone has to log in as six different people. So they are
 * generated: this file renders the actual dashboard components with plausible
 * data, and `npm run shots` drives a headless browser over it and writes the
 * PNGs into public/marketing/.
 *
 * Nothing imports this file, so it is tree-shaken out of the app bundle. It is
 * only ever loaded by shots.html, which Vite does not build.
 *
 * The data is invented, but the components are not — if the gradebook changes
 * shape, the picture on the website changes with it.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getDay, format } from 'date-fns';
import '@/index.css';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import Meter from '@/components/app/Meter';
import { Panel, PanelRow } from '@/components/app/Panel';
import TodaySchedule from '@/components/timetable/TodaySchedule';

const SCHOOL = 'sch', USER = 'usr';

// Pin the clock so "now" always falls inside a lesson and the shots are
// byte-identical between runs.
const RealDate = Date;
const FROZEN = () => new RealDate(new RealDate().setHours(9, 45, 0, 0));
globalThis.Date = class extends RealDate {
  constructor(...a) { return a.length ? new RealDate(...a) : FROZEN(); }
  static now() { return FROZEN().getTime(); }
};

const at = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
qc.setQueryData(['today-schedule', SCHOOL, USER, getDay(new Date())], [
  { id: '1', class_name: 'Mathematics HL — DP1', start_time: at(8, 30), end_time: at(9, 20), room_name: 'B204' },
  { id: '2', class_name: 'Theory of Knowledge', start_time: at(9, 30), end_time: at(10, 20), room_name: 'A101' },
  { id: '3', class_name: 'Mathematics SL — MYP5', start_time: at(11, 0), end_time: at(11, 50), room_name: 'B204' },
  { id: '4', class_name: 'Extended Essay supervision', start_time: at(14, 0), end_time: at(14, 50), room_name: 'Library' },
]);

const NAV = {
  teacher: ['Dashboard', 'My classes', 'Gradebook', 'Attendance', 'Assignments', 'Messages', 'Reports'],
  coordinator: ['Dashboard', 'Cohorts', 'Predicted grades', 'IB Core', 'Subjects', 'Reports'],
};

function Chrome({ nav, school, who, children }) {
  return (
    <div className="scholr-page" style={{ display: 'flex', minHeight: '840px' }}>
      <aside style={{ width: 236, flex: 'none', borderRight: '1px solid var(--rule)', background: 'var(--surface)', padding: '1.1rem .9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '0 .35rem 1.2rem' }}>
          <span style={{ width: 26, height: 26, borderRadius: 8, background: 'var(--brand)', position: 'relative', display: 'block' }}>
            <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)' }} />
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 650, letterSpacing: '-.035em', color: 'var(--ink)' }}>Scholr</span>
        </div>
        {nav.map((n, i) => (
          <div key={n} style={{
            padding: '.45rem .55rem', borderRadius: 'var(--radius-control)', fontSize: '.87rem',
            color: i === 0 ? 'var(--brand)' : 'var(--muted)', fontWeight: i === 0 ? 550 : 400,
            background: i === 0 ? 'var(--brand-sf)' : 'transparent', marginBottom: 2,
          }}>{n}</div>
        ))}
        <div style={{ marginTop: '1.4rem', padding: '0 .55rem' }}>
          <p className="scholr-label" style={{ margin: 0 }}>{school}</p>
          <p style={{ margin: '.3rem 0 0', fontSize: '.8rem', color: 'var(--muted)' }}>{who}</p>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '1.6rem 1.8rem', display: 'flex', flexDirection: 'column', gap: '1.1rem', minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}

function TeacherShot() {
  return (
    <Chrome nav={NAV.teacher} school="St Columba's College" who="Aoife Ní Bhriain · Teacher">
      <header>
        <p className="scholr-label" style={{ margin: 0 }}>{format(new Date(), 'EEEE d MMMM')}</p>
        <h1 className="scholr-h1" style={{ margin: '.4rem 0 0', fontSize: '1.7rem' }}>Good morning, Aoife</h1>
      </header>
      <StatRow>
        <StatCard label="My classes" value={6} />
        <StatCard label="Students" value={148} hint="across those classes" />
        <StatCard label="Live assignments" value={9} />
        <StatCard label="To grade" value={23} hint="oldest 3 days" />
      </StatRow>
      <Panel title="Today" dark>
        <TodaySchedule schoolId={SCHOOL} userId={USER} userRole="teacher" />
      </Panel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
        <Panel title="To grade">
          <PanelRow name="Paper 2 mock — calculus" detail="DP1"><StatusChip tone="warn">12 waiting</StatusChip></PanelRow>
          <PanelRow name="TOK essay draft" detail="DP1"><StatusChip tone="warn">8 waiting</StatusChip></PanelRow>
          <PanelRow name="Vectors problem set" detail="MYP5"><StatusChip tone="crit">3 late</StatusChip></PanelRow>
        </Panel>
        <Panel title="Coming up">
          <PanelRow name="Report deadline" detail="DP1" value="in 9 days" />
          <PanelRow name="Parents' evening" detail="whole school" value="24 Sept" />
          <PanelRow name="EE first drafts" detail="DP2" value="2 Oct" />
        </Panel>
      </div>
    </Chrome>
  );
}

function CoordinatorShot() {
  const bar = (pct) => <span style={{ display: 'block', width: '6rem' }}><Meter value={pct} height={4} /></span>;
  return (
    <Chrome nav={NAV.coordinator} school="St Columba's College" who="Cormac Doyle · DP coordinator">
      <header>
        <p className="scholr-label" style={{ margin: 0 }}>Diploma Programme · DP2</p>
        <h1 className="scholr-h1" style={{ margin: '.4rem 0 0', fontSize: '1.7rem' }}>Cohort</h1>
      </header>
      <StatRow>
        <StatCard label="Students" value={44} />
        <StatCard label="Predicted mean" value="34.2" hint="of 45 points" />
        <StatCard label="Subjects" value={19} />
        <StatCard label="At risk" value={5} hint="two or more below target" />
      </StatRow>
      <Panel title="Extended Essay" dark>
        <PanelRow name="Proposal approved" detail="41 of 44">{bar(93)}</PanelRow>
        <PanelRow name="First draft in" detail="29 of 44">{bar(66)}</PanelRow>
        <PanelRow name="Viva booked" detail="12 of 44">{bar(27)}</PanelRow>
      </Panel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.1rem' }}>
        <Panel title="Predicted vs target">
          <PanelRow name="Mathematics HL" detail="9 students" value="5.8 / 6.0" />
          <PanelRow name="Biology HL" detail="14 students" value="5.1 / 5.5" />
          <PanelRow name="English A SL" detail="21 students" value="5.6 / 5.5" />
        </Panel>
        <Panel title="Needs a conversation">
          <PanelRow name="Student 0412" detail="3 subjects below"><StatusChip tone="crit">Review</StatusChip></PanelRow>
          <PanelRow name="Student 0388" detail="2 subjects below"><StatusChip tone="warn">Watch</StatusChip></PanelRow>
          <PanelRow name="Student 0431" detail="EE overdue"><StatusChip tone="warn">Chase</StatusChip></PanelRow>
        </Panel>
      </div>
    </Chrome>
  );
}

const SHOTS = { 'teacher-dashboard': TeacherShot, 'coordinator-cohort': CoordinatorShot };
const which = new URLSearchParams(location.search).get('shot') || 'teacher-dashboard';
const Shot = SHOTS[which] || TeacherShot;

createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={qc}><MemoryRouter><Shot /></MemoryRouter></QueryClientProvider>
);
