// Adoption — which parts of the product schools actually use.
//
// No charts. Every figure here is "how many schools have any rows for this",
// which is a proportion against a known total, and a proportion against a
// known total is a bar in a table, not a canvas and a chart library.
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Head, Sec, Figs, St, Skel, Meter } from '@/components/console/kit';
import { useHeadline, num } from '@/components/console/useConsoleData';
import PlatformConfigSection from '@/components/console/PlatformConfigSection';

const B = '/AdminConsole';

// Column on school_stats → what a school had to do to make it non-zero.
const FEATURES = [
  { column: 'subjects', label: 'Subjects', note: 'curriculum set up' },
  { column: 'classes', label: 'Classes', note: 'teaching groups built' },
  { column: 'academic_years', label: 'Academic years', note: 'calendar started' },
  { column: 'terms', label: 'Terms', note: 'calendar finished' },
  { column: 'messages', label: 'Messaging', note: 'anyone sent a message' },
  { column: 'attendance_records', label: 'Attendance', note: 'a register was taken' },
  { column: 'behavior_records', label: 'Behaviour', note: 'a note was recorded' },
  { column: 'cas_experiences', label: 'CAS', note: 'IB core in use' },
];

export default function Analytics() {
  const h = useHeadline();
  const total = h.stats.length;

  const rows = useMemo(() => FEATURES.map((f) => {
    const using = h.stats.filter((s) => Number(s[f.column] ?? 0) > 0).length;
    return { ...f, using, pct: total ? Math.round((using / total) * 100) : 0 };
  }), [h.stats, total]);

  // A school that signed up and built nothing is the one row worth chasing.
  const empty = useMemo(() => h.stats
    .filter((s) => Number(s.classes ?? 0) === 0 && Number(s.subjects ?? 0) === 0)
    .map((s) => h.schools.find((x) => x.id === s.school_id))
    .filter(Boolean), [h.stats, h.schools]);

  const dormant = useMemo(() => h.stats
    .filter((s) => Number(s.classes ?? 0) > 0
      && Number(s.attendance_records ?? 0) === 0
      && Number(s.messages ?? 0) === 0)
    .map((s) => h.schools.find((x) => x.id === s.school_id))
    .filter(Boolean), [h.stats, h.schools]);

  return (
    <Head title="Adoption">
      <Sec>
        <Figs items={[
          { label: 'Schools counted', value: h.loading ? '—' : total },
          { label: 'Set up', value: h.loading ? '—' : total - empty.length,
            sub: 'have subjects or classes' },
          { label: 'Built nothing', value: h.loading ? '—' : empty.length,
            sub: 'signed up, never started', state: empty.length ? 'warn' : undefined },
          { label: 'Not teaching', value: h.loading ? '—' : dormant.length,
            sub: 'classes but no daily use', state: dormant.length ? 'warn' : undefined },
          { label: 'People', value: h.loading ? '—' : num(h.members), sub: 'active memberships' },
        ]} />
      </Sec>

      <Sec title="What gets used" meta={total ? `out of ${total} schools` : undefined}>
        {h.loading ? <Skel /> : total === 0 ? (
          <p className="cons__empty">No school has any stats yet.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr>
                  <th>Feature</th><th className="num">Schools</th>
                  <th>Share</th><th className="num">%</th><th>What it means</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.column}>
                    <td className="name">{r.label}</td>
                    <td className="num">{r.using}</td>
                    <td><Meter value={r.using} max={total} /></td>
                    <td className="num">{r.pct}%</td>
                    <td className="muted">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sec>

      {empty.length > 0 && (
        <Sec title="Signed up and built nothing" meta="no subjects, no classes">
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>School</th><th>Status</th><th /></tr></thead>
              <tbody>
                {empty.map((s) => (
                  <tr key={s.id}>
                    <td className="name">{s.name}</td>
                    <td><St level="warn">{s.status || '—'}</St></td>
                    <td><Link className="cons__link" to={`${B}/schools/${s.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sec>
      )}

      {dormant.length > 0 && (
        <Sec title="Built classes but never taught with it"
          meta="no register taken, no message sent">
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>School</th><th>Status</th><th /></tr></thead>
              <tbody>
                {dormant.map((s) => (
                  <tr key={s.id}>
                    <td className="name">{s.name}</td>
                    <td><St level="warn">{s.status || '—'}</St></td>
                    <td><Link className="cons__link" to={`${B}/schools/${s.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sec>
      )}

      <PlatformConfigSection kind="features" />
    </Head>
  );
}
