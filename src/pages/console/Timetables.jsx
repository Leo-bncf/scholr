// Timetables — read any school's week, by class, teacher or student.
//
// The school-side product draws the week as a card per day, which is right
// when you are living in it. Here it is one dense table: a super admin opens
// this to answer "is there actually a timetable in there, and does it look
// sane", and scrolling five columns of cards to find out is slower.
import React, { useMemo, useState } from 'react';
import { Head, Sec, Figs, St, Skel, Field } from '@/components/console/kit';
import { useSchools, num } from '@/components/console/useConsoleData';
import { useTimetableData } from '@/components/timetable/useTimetableData';

const DAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

const VIEWS = [
  { value: 'class', label: 'Class' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
];

function minutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export default function Timetables() {
  const schoolsQ = useSchools();
  const schools = schoolsQ.data || [];

  const [schoolId, setSchoolId] = useState('');
  const [view, setView] = useState('class');
  const [entityId, setEntityId] = useState('');

  const { scheduleEntries, rooms, classes, memberships, isLoading } = useTimetableData(schoolId);

  const classesById = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);
  const roomsById = useMemo(() => Object.fromEntries(rooms.map((r) => [r.id, r])), [rooms]);
  const peopleById = useMemo(
    () => Object.fromEntries(memberships.map((m) => [m.user_id, m])),
    [memberships],
  );

  const options = useMemo(() => {
    if (view === 'class') {
      return classes
        .map((c) => ({ id: c.id, label: c.name + (c.section ? ` – ${c.section}` : '') }))
        .sort((a, b) => a.label.localeCompare(b.label));
    }
    const roles = view === 'teacher' ? ['teacher', 'ib_coordinator'] : ['student'];
    return memberships
      .filter((m) => roles.includes(m.role))
      .map((m) => ({ id: m.user_id, label: m.user_name || m.user_email || 'Unnamed' }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [view, classes, memberships]);

  const entries = useMemo(() => {
    if (!entityId) return [];
    let rows;
    if (view === 'class') {
      rows = scheduleEntries.filter((e) => e.class_id === entityId);
    } else if (view === 'teacher') {
      rows = scheduleEntries.filter((e) => e.teacher_id === entityId
        || classesById[e.class_id]?.teacher_ids?.includes(entityId));
    } else {
      const ids = new Set(classes.filter((c) => c.student_ids?.includes(entityId)).map((c) => c.id));
      rows = scheduleEntries.filter((e) => ids.has(e.class_id));
    }
    return [...rows].sort((a, b) => {
      const da = DAYS.findIndex((d) => d.value === Number(a.day_of_week));
      const db = DAYS.findIndex((d) => d.value === Number(b.day_of_week));
      return da - db || minutes(a.start_time) - minutes(b.start_time);
    });
  }, [entityId, view, scheduleEntries, classesById, classes]);

  const pickSchool = (id) => { setSchoolId(id); setEntityId(''); };
  const pickView = (v) => { setView(v); setEntityId(''); };

  const daysUsed = new Set(entries.map((e) => Number(e.day_of_week))).size;
  const clash = useMemo(() => {
    // Two entries in the same day that overlap in time is the one thing on
    // this page that is actually wrong.
    const seen = {};
    let n = 0;
    for (const e of entries) {
      const day = Number(e.day_of_week);
      seen[day] = seen[day] || [];
      const s = minutes(e.start_time);
      const f = minutes(e.end_time);
      if (seen[day].some(([a, b]) => s < b && f > a)) n += 1;
      seen[day].push([s, f]);
    }
    return n;
  }, [entries]);

  return (
    <Head title="Timetables">
      <Sec>
        <div className="cons__bar">
          <Field label="School">
            <select value={schoolId} onChange={(e) => pickSchool(e.target.value)}>
              <option value="">Pick a school…</option>
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="By">
            <select value={view} onChange={(e) => pickView(e.target.value)}>
              {VIEWS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </Field>
          <Field label={view === 'class' ? 'Class' : view === 'teacher' ? 'Teacher' : 'Student'}>
            <select value={entityId} onChange={(e) => setEntityId(e.target.value)}
              disabled={!schoolId || isLoading}>
              <option value="">
                {!schoolId ? 'Pick a school first' : isLoading ? 'Loading…' : `Pick a ${view}…`}
              </option>
              {options.slice(0, 500).map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {schoolId && (
          <Figs items={[
            { label: 'Classes', value: isLoading ? '—' : num(classes.length) },
            { label: 'Scheduled', value: isLoading ? '—' : num(scheduleEntries.length),
              sub: 'entries in this school' },
            { label: 'Shown', value: entityId ? num(entries.length) : '—', sub: 'for this selection' },
            { label: 'Days used', value: entityId ? daysUsed : '—', sub: 'of the week' },
            { label: 'Overlaps', value: entityId ? clash : '—',
              sub: 'two lessons at once', state: clash > 0 ? 'bad' : undefined },
          ]} />
        )}
      </Sec>

      <Sec title="The week" meta={entityId ? options.find((o) => o.id === entityId)?.label : undefined}>
        {!schoolId ? (
          <p className="cons__empty">Pick a school, then a class, teacher or student.</p>
        ) : isLoading ? <Skel /> : !entityId ? (
          <p className="cons__empty">Pick a {view} to see their week.</p>
        ) : entries.length === 0 ? (
          <p className="cons__empty">
            Nothing is scheduled for this {view}. Either the school has not built a timetable yet,
            or this {view} is not on it.
          </p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr><th>Day</th><th>Time</th><th>Class</th><th>Teacher</th><th>Room</th><th>State</th></tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const cls = classesById[e.class_id];
                  const teachers = (cls?.teacher_ids || [])
                    .map((id) => peopleById[id]?.user_name).filter(Boolean);
                  return (
                    <tr key={e.id}>
                      <td className="muted">
                        {DAYS.find((d) => d.value === Number(e.day_of_week))?.label || '—'}
                      </td>
                      <td className="mono">{e.start_time} – {e.end_time}</td>
                      <td className="name">{e.class_name || cls?.name || 'Unnamed class'}</td>
                      <td className="muted">
                        {e.teacher_name || teachers.slice(0, 2).join(', ') || '—'}
                      </td>
                      <td className="muted">
                        {e.room_name || (e.room_id ? roomsById[e.room_id]?.name : '') || '—'}
                      </td>
                      <td>
                        <St level={!e.status || e.status === 'active' ? 'idle' : 'warn'}>
                          {e.status || 'active'}
                        </St>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Sec>
    </Head>
  );
}
