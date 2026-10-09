// Room — the air in front of the machines, and the one unit that controls it.
//
// Inlet air is the number that matters, not CPU temperature: a hot CPU in cool
// air is a fan problem on one box, while hot inlet air is every box at once
// and the room losing. So inlet leads, and the trace is the worst reading per
// half hour rather than the average, because a room is judged on its peaks.
import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Head, Sec, Figs, St, Skel, Meter, Field, useToast } from '@/components/console/kit';
import {
  useClimate, useMetrics, useInletHistory, useIlo,
  hottestSensor, sensorState, tempState, when, ago,
} from '@/components/console/useConsoleData';
import * as fns from '@/data/functions';

function Trace({ points }) {
  // One point is not a trace. Drawing a path through a single reading gives an
  // empty box that looks like a broken chart rather than a thin dataset.
  if (!points || points.length < 2) return null;
  const w = 720;
  const h = 90;
  const temps = points.map((p) => p.c);
  const lo = Math.min(...temps) - 1;
  const hi = Math.max(...temps) + 1;
  const span = Math.max(1, hi - lo);
  const d = points.map((p, i) => {
    const x = (i / Math.max(1, points.length - 1)) * w;
    const y = h - ((p.c - lo) / span) * h;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  // 28 °C is where the room stops being comfortable for the hardware.
  const warnY = h - ((28 - lo) / span) * h;
  return (
    <figure style={{ margin: '4px 0 0' }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img"
        aria-label={`Inlet air over 24 hours, ${Math.min(...temps)} to ${Math.max(...temps)} degrees`}>
        {warnY > 0 && warnY < h && (
          <line x1="0" y1={warnY} x2={w} y2={warnY} stroke="var(--warn)"
            strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
        )}
        <path d={d} fill="none" stroke="var(--f-4)" strokeWidth="1.8"
          strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <figcaption className="cons__note">
        24 hours · {Math.min(...temps).toFixed(1)}–{Math.max(...temps).toFixed(1)} °C ·
        the dashed line is 28 °C
      </figcaption>
    </figure>
  );
}

export default function Room() {
  const climate = useClimate();
  const metrics = useMetrics();
  const history = useInletHistory();
  // The controllers are in the same room and already report its air. Reading
  // only server_metrics meant this page showed three dashes while the chassis
  // two metres away knew the answer.
  const ilo = useIlo();
  const qc = useQueryClient();
  const toast = useToast();
  const [target, setTarget] = useState('');

  const hosts = metrics.data || [];
  const machines = ilo.data?.servers || [];

  // Inlet air, best source first: a collector's BMC reading, then the sensor
  // the chassis calls an inlet, then what the air conditioner says about the
  // room. They measure slightly different things, so the page says which.
  const inlets = hosts.map((m) => m.ambient_temp).filter((v) => v != null).map(Number);
  // "Ambient" only. Matching /inlet/ as well pulled in "PS 1 Inlet" — the air
  // going into a power supply, which sits downstream of the fans and reads far
  // hotter than the room. That is how this figure first showed 52 °C in a room
  // that was 26.5 °C.
  const chassisInlets = machines.flatMap((m) => (m.temps || [])
    .filter((t) => /ambient/i.test(t.name)).map((t) => t.celsius));
  const roomAir = climate.data?.state?.current_temp;
  const inlet = inlets.length ? Math.max(...inlets)
    : chassisInlets.length ? Math.max(...chassisInlets)
    : roomAir != null ? Number(roomAir) : null;
  const inletFrom = inlets.length ? 'collector'
    : chassisInlets.length ? 'chassis inlet sensor'
    : roomAir != null ? 'the air conditioner' : null;

  const hottestCpu = useMemo(() => {
    const fromCollectors = hosts.map((m) => m.cpu_temp).filter((v) => v != null).map(Number);
    if (fromCollectors.length) return Math.max(...fromCollectors);
    const fromChassis = machines.map(hottestSensor).filter(Boolean).map((t) => t.celsius);
    return fromChassis.length ? Math.max(...fromChassis) : null;
  }, [hosts, machines]);

  const state = climate.data || {};
  const unit = state.state || {};
  const configured = state.configured !== false;

  const set = useMutation({
    mutationFn: (payload) => fns.invoke('adminClimate', { action: 'set', ...payload }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['console', 'climate'] });
      toast(r?.ok === false ? (r.error || 'The unit refused that') : 'Sent to the unit',
        r?.ok === false ? 'bad' : 'ok');
    },
    onError: (e) => toast(e?.message || 'Could not reach the air conditioning', 'bad'),
  });

  // Not deployed here, or it refused us — different from "deployed but no
  // credentials", and it must not render as an empty room.
  if (climate.isError) {
    return (
      <Head title="Room">
        <Sec>
          <p className="cons__empty">
            The air conditioning could not be reached: {climate.error?.message}
          </p>
          <p className="cons__note">
            If <code>adminClimate</code> is not deployed to this project yet, run
            <code> npm run deploy:functions adminClimate</code>.
          </p>
        </Sec>
      </Head>
    );
  }

  if (!configured) {
    return (
      <Head title="Room">
        <Sec>
          <p className="cons__empty">
            The air conditioning is not wired up on this deployment.
            {state.reason ? ` ${state.reason}` : ''}
          </p>
          <p className="cons__note">
            Set <code>TUYA_ACCESS_ID</code>, <code>TUYA_ACCESS_SECRET</code>,{' '}
            <code>TUYA_DEVICE_ID</code> and <code>TUYA_REGION</code> in the edge runtime, then
            re-open this page.
          </p>
        </Sec>
      </Head>
    );
  }

  const acOff = unit.power === false;
  const offline = state.device?.online === false;

  return (
    <Head title="Room">
      <Sec meta={state.measured_at ? `read ${ago(state.measured_at)} ago` : undefined}
        action={
          <button type="button" className="cons__b" onClick={() => { climate.refetch(); metrics.refetch(); }}
            disabled={climate.isFetching}>
            {climate.isFetching ? 'Reading…' : 'Re-read'}
          </button>
        }>
        <Figs items={[
          { label: 'Inlet air', value: inlet != null ? inlet.toFixed(1) : '—',
            unit: inlet != null ? '°C' : '', sub: inletFrom ? `from ${inletFrom}` : 'nothing reporting',
            state: tempState(inlet, true) === 'idle' ? undefined : tempState(inlet, true) },
          { label: 'Hottest CPU', value: hottestCpu != null ? Math.round(hottestCpu) : '—',
            unit: hottestCpu != null ? '°C' : '', sub: 'across the fleet',
            state: tempState(hottestCpu) === 'idle' ? undefined : tempState(hottestCpu) },
          { label: 'Air conditioning', value: offline ? 'offline' : acOff ? 'off' : 'on',
            sub: offline ? 'cannot be commanded' : unit.mode || '',
            state: offline || acOff ? 'warn' : undefined },
          { label: 'Set to', value: unit.set_point != null ? unit.set_point : '—',
            unit: unit.set_point != null ? '°C' : '', sub: 'target on the unit' },
          { label: 'Machines', value: ilo.isLoading ? '—' : machines.length,
            sub: hosts.length ? `${hosts.length} also pushing metrics` : 'via the controllers',
            state: !ilo.isLoading && machines.length === 0 ? 'warn' : undefined },
        ]} />
      </Sec>

      <Sec title="Inlet air, last 24 hours"
        meta={history.data?.length
          ? `${history.data.length} reading${history.data.length === 1 ? '' : 's'}`
          : undefined}>
        {history.isLoading ? <Skel /> : (history.data?.length ?? 0) < 2 ? (
          <p className="cons__empty">
            {history.data?.length === 1
              ? 'Only one reading so far — a trace needs at least two. '
              : 'No inlet readings yet. '}
            The collectors on the hosts push into <code>server_metrics</code> every 30 seconds;
            until they do, there is no history to draw.
          </p>
        ) : <Trace points={history.data} />}
      </Sec>

      {inlet != null && roomAir != null && Math.abs(inlet - Number(roomAir)) > 2 && (
        <Sec title="Why two different room temperatures">
          <p className="cons__note" style={{ marginTop: 0 }}>
            The air conditioner reports {roomAir} °C where its own sensor sits; the chassis
            reports {inlet.toFixed(1)} °C for the air actually arriving at the machines. The gap
            is the room, not a fault — the figure that matters for the hardware is the warmer
            one, because that is the air doing the cooling.
          </p>
        </Sec>
      )}

      <Sec title="The unit" meta={state.device?.name || undefined}
        action={
          <>
            <button type="button" className="cons__b" disabled={set.isPending || offline}
              onClick={() => set.mutate({ power: !acOff })}>
              {acOff ? 'Turn on' : 'Turn off'}
            </button>
          </>
        }>
        {offline && (
          <p className="cons__note">
            The unit is offline, so nothing here can be commanded. That is usually the plug or
            the Wi-Fi, not the air conditioner.
          </p>
        )}
        <div className="cons__scroll">
          <table className="cons__t">
            <thead><tr><th>Reading</th><th>State</th><th>Value</th></tr></thead>
            <tbody>
              <tr>
                <td className="name">Power</td>
                <td><St level={acOff ? 'warn' : 'idle'}>{acOff ? 'off' : 'on'}</St></td>
                <td className="mono muted">{unit.mode || '—'}</td>
              </tr>
              <tr>
                <td className="name">Set point</td>
                <td><St level="idle">target</St></td>
                <td className="mono muted">{unit.set_point != null ? `${unit.set_point} °C` : '—'}</td>
              </tr>
              <tr>
                <td className="name">Reported room temperature</td>
                <td><St level={tempState(unit.current_temp, true)}>
                  {unit.current_temp == null ? 'unknown'
                    : tempState(unit.current_temp, true) === 'idle' ? 'fine' : 'warm'}</St></td>
                <td className="mono muted">{unit.current_temp != null ? `${unit.current_temp} °C` : '—'}</td>
              </tr>
              <tr>
                <td className="name">Reachable</td>
                <td><St level={offline ? 'bad' : 'idle'}>{offline ? 'offline' : 'online'}</St></td>
                <td className="mono muted">{state.device?.id || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="cons__bar" style={{ marginTop: 12 }}>
          <Field label="Set the target (°C)">
            <input type="number" min="16" max="30" step="1" value={target}
              placeholder={unit.set_point ?? '24'}
              onChange={(e) => setTarget(e.target.value)} />
          </Field>
          <button type="button" className="cons__b cons__b--go"
            disabled={set.isPending || offline || target === ''}
            onClick={() => set.mutate({ set_point: Number(target) })}>
            {set.isPending ? 'Sending…' : 'Send to the unit'}
          </button>
        </div>
      </Sec>

      <Sec title="Machines in this room"
        meta={machines.length ? 'read from the controllers' : undefined}>
        {ilo.isLoading ? <Skel /> : machines.length === 0 ? (
          <p className="cons__empty">No controller is configured, so the machines cannot be read.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr>
                  <th>Machine</th><th>Power</th><th className="num">Hottest</th>
                  <th>Against its own limit</th><th className="num">Draw</th>
                </tr>
              </thead>
              <tbody>
                {machines.map((m) => {
                  const hot = hottestSensor(m);
                  return (
                    <tr key={m.label}>
                      <td className="name mono">{m.label}</td>
                      <td>
                        <St level={!m.ok ? 'bad' : m.powerState === 'On' ? 'idle' : 'bad'}>
                          {m.ok ? String(m.powerState || 'unknown').toLowerCase() : 'unreachable'}
                        </St>
                      </td>
                      <td className="num">
                        <St level={sensorState(hot)}>
                          {hot ? `${Math.round(hot.celsius)} °C` : '—'}
                        </St>
                        {hot?.name && <div className="muted" style={{ fontSize: '.6875rem' }}>{hot.name}</div>}
                      </td>
                      <td>
                        {hot
                          ? <Meter value={hot.celsius} max={hot.warn || 100}
                              over={sensorState(hot) !== 'idle'} />
                          : <span className="muted">—</span>}
                      </td>
                      <td className="num muted">{m.watts != null ? `${Math.round(m.watts)} W` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Sec>

      <Sec title="Operating system metrics" meta="newest reading from each collector">
        {metrics.isLoading ? <Skel /> : hosts.length === 0 ? (
          <p className="cons__empty">
            {metrics.isError
              ? `Host metrics could not be read: ${metrics.error?.message}. If migration 0016 has not been applied, the server_metrics table does not exist yet.`
              : 'No host is pushing metrics into this database yet.'}
          </p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr>
                  <th>Host</th><th className="num">CPU</th><th className="num">Inlet</th>
                  <th className="num">Load</th><th className="num">RAM</th>
                  <th className="num">Disk</th><th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {hosts.map((m) => (
                  <tr key={m.server_id}>
                    <td className="name mono">{m.server_id}</td>
                    <td className="num">
                      <St level={tempState(m.cpu_temp)}>
                        {m.cpu_temp != null ? `${Math.round(m.cpu_temp)} °C` : '—'}
                      </St>
                    </td>
                    <td className="num">
                      <St level={tempState(m.ambient_temp, true)}>
                        {m.ambient_temp != null ? `${Math.round(m.ambient_temp)} °C` : '—'}
                      </St>
                    </td>
                    <td className="num muted">{m.cpu_load_pct != null ? `${Math.round(m.cpu_load_pct)}%` : '—'}</td>
                    <td className="num muted">{m.ram_pct != null ? `${Math.round(m.ram_pct)}%` : '—'}</td>
                    <td className="num muted">{m.disk_pct != null ? `${Math.round(m.disk_pct)}%` : '—'}</td>
                    <td className="mono muted" title={when(m.ts)}>{ago(m.ts)} ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sec>
    </Head>
  );
}
