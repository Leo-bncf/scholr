// Servers — the machines themselves, through their out-of-band controllers.
//
// The controller reports every sensor it has, each with the threshold the
// chassis itself states, so this page shows them rather than collapsing the
// lot into one number: a PSU at 60 °C and a CPU at 60 °C are not the same
// news. Everything that changes a machine's state goes through a confirmation
// that names the machine and says what happens, because this page can power
// off the host the product runs on.
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Head, Sec, Figs, St, Skel, Meter, Dialog, useToast } from '@/components/console/kit';
import {
  useIlo, hottestSensor, fastestFan, sensorState, num,
} from '@/components/console/useConsoleData';
import * as fns from '@/data/functions';

export default function Servers() {
  const ilo = useIlo();
  const qc = useQueryClient();
  const toast = useToast();
  const [ask, setAsk] = useState(null);
  // Which machine's sensors are expanded. `null` means "decide from the fleet
  // size": with one or two machines the detail fits and the page is otherwise
  // mostly white space, so it starts open.
  const [open, setOpen] = useState(null);

  const act = useMutation({
    mutationFn: (payload) => fns.invoke('adminIlo', payload),
    onSuccess: (r, payload) => {
      qc.invalidateQueries({ queryKey: ['console', 'ilo'] });
      setAsk(null);
      toast(r?.ok === false ? (r.error || 'The controller refused that') : `Sent to ${payload.server}`,
        r?.ok === false ? 'bad' : 'ok');
    },
    onError: (e) => toast(e?.message || 'Could not reach the controller', 'bad'),
  });

  const data = ilo.data || {};
  const servers = data.servers || [];

  if (ilo.isError) {
    return (
      <Head title="Servers">
        <Sec>
          <p className="cons__empty">The controllers could not be reached: {ilo.error?.message}</p>
          <p className="cons__note">
            If <code>adminIlo</code> is not deployed to this project yet, run
            <code> npm run deploy:functions adminIlo</code>.
          </p>
        </Sec>
      </Head>
    );
  }

  if (data.configured === false) {
    return (
      <Head title="Servers">
        <Sec>
          <p className="cons__empty">
            No out-of-band controllers are configured on this deployment.
            {data.reason ? ` ${data.reason}` : ''}
          </p>
          <p className="cons__note">
            Set <code>ILO_HOSTS</code> and <code>ILO_USER</code>/<code>ILO_PASSWORD</code> (or{' '}
            <code>ILO_CREDS</code>). The controllers are LAN-only and present an internally
            signed certificate, so the runtime also needs <code>ILO_PROXY_MAP</code> pointing at
            the verifying relay — see <code>infra/README.md</code>.
          </p>
        </Sec>
      </Head>
    );
  }

  const unreachable = servers.filter((s) => !s.ok).length;
  const off = servers.filter((s) => s.ok && s.powerState && s.powerState !== 'On').length;
  const hottest = servers.map(hottestSensor).filter(Boolean)
    .reduce((a, b) => (!a || b.celsius > a.celsius ? b : a), null);
  const unwell = servers.filter((s) => s.ok && s.health && !/^ok$/i.test(s.health)).length;
  const draw = servers.reduce((n, s) => n + Number(s.watts || 0), 0);
  const capped = servers.filter((s) => s.powerCap).length;

  return (
    <Head title="Servers">
      <Sec action={
        <button type="button" className="cons__b" onClick={() => ilo.refetch()} disabled={ilo.isFetching}>
          {ilo.isFetching ? 'Reading…' : 'Re-read'}
        </button>
      }>
        <Figs items={[
          { label: 'Machines', value: ilo.isLoading ? '—' : servers.length,
            sub: unreachable ? `${unreachable} not answering` : 'all answering',
            state: unreachable ? 'bad' : undefined },
          { label: 'Powered off', value: ilo.isLoading ? '—' : off,
            sub: 'not running', state: off ? 'bad' : undefined },
          { label: 'Hottest sensor', value: hottest ? Math.round(hottest.celsius) : '—',
            unit: hottest ? '°C' : '', sub: hottest ? hottest.name : 'no reading',
            state: sensorState(hottest) === 'idle' ? undefined : sensorState(hottest) },
          { label: 'Reported faults', value: ilo.isLoading ? '—' : unwell,
            sub: 'chassis health not OK', state: unwell ? 'bad' : undefined },
          { label: 'Drawing', value: draw ? num(Math.round(draw)) : '—', unit: draw ? 'W' : '',
            sub: capped ? `${capped} capped` : 'no power cap set' },
        ]} />
      </Sec>

      <Sec title="The fleet" meta="read from each controller directly, not from a collector">
        {ilo.isLoading ? <Skel /> : servers.length === 0 ? (
          <p className="cons__empty">No controller answered.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr>
                  <th>Machine</th><th>Model</th><th>Power</th><th>Health</th>
                  <th className="num">Hottest</th><th className="num">Fans</th>
                  <th className="num">Draw</th><th>Do</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((s) => {
                  const hot = hottestSensor(s);
                  const fan = fastestFan(s);
                  const expanded = open === null ? servers.length <= 2 : open === s.label;
                  return (
                    <React.Fragment key={s.label}>
                      <tr>
                        <td className="name mono">{s.label}</td>
                        <td className="muted">{s.model || '—'}</td>
                        <td>
                          <St level={!s.ok ? 'bad' : s.powerState === 'On' ? 'idle' : 'bad'}>
                            {s.ok ? String(s.powerState || 'unknown').toLowerCase() : 'unreachable'}
                          </St>
                        </td>
                        <td>
                          <St level={!s.health ? 'idle' : /^ok$/i.test(s.health) ? 'idle' : 'bad'}>
                            {s.health || '—'}
                          </St>
                        </td>
                        <td className="num">
                          <St level={sensorState(hot)}>
                            {hot ? `${Math.round(hot.celsius)} °C` : '—'}
                          </St>
                        </td>
                        <td className="num muted">
                          {fan ? `${Math.round(fan.percent)}%` : '—'}
                        </td>
                        <td className="num muted">
                          {s.watts != null ? `${Math.round(s.watts)} W` : '—'}
                          {s.powerCap ? <span className="muted"> / {s.powerCap}</span> : null}
                        </td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          {s.ok && (
                            <>
                              <button type="button" className="cons__b"
                                onClick={() => setOpen(expanded ? 'none' : s.label)}>
                                {expanded ? 'Hide' : `Sensors (${(s.temps || []).length})`}
                              </button>
                              <button type="button" className="cons__b"
                                onClick={() => setAsk({ server: s.label, state: s.powerState })}>
                                Power…
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                      {expanded && (
                        <tr>
                          <td colSpan={8} style={{ paddingBottom: 14 }}>
                            <SensorDetail server={s} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="cons__note">
          Thresholds come from the chassis rather than from a number we picked, because a power
          supply and an inlet do not share a safe range. Fans are a percentage of full speed and
          are read-only on these controllers — the lever that changes anything is the power cap,
          and below that, the room.
        </p>
      </Sec>

      {ask && (
        <Dialog title={ask.server} meta="this acts on real hardware"
          onClose={() => setAsk(null)}
          footer={<button type="button" className="cons__b" onClick={() => setAsk(null)}>Cancel</button>}>
          <p>
            {ask.server} is currently <strong>{String(ask.state || 'in an unknown state').toLowerCase()}</strong>.
          </p>
          <p className="cons__note">
            A reset is a hard power cycle: anything running on this machine stops immediately,
            with no chance to write to disk. A shutdown asks the operating system first and is
            what you want unless the machine is already unresponsive.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="cons__b" disabled={act.isPending}
              onClick={() => act.mutate({ action: 'uid', server: ask.server, on: true })}>
              Flash the locator light
            </button>
            <button type="button" className="cons__b" disabled={act.isPending}
              onClick={() => act.mutate({ action: 'power', server: ask.server, verb: 'shutdown' })}>
              Ask it to shut down
            </button>
            <button type="button" className="cons__b cons__b--bad" disabled={act.isPending}
              onClick={() => act.mutate({ action: 'power', server: ask.server, verb: 'reset' })}>
              {act.isPending ? 'Sending…' : 'Hard reset'}
            </button>
          </div>
        </Dialog>
      )}
    </Head>
  );
}

/* Every sensor the chassis reports, hottest first, each against its own stated
   limit. This is the detail the single headline number throws away. */
function SensorDetail({ server }) {
  const temps = [...(server.temps || [])].sort((a, b) => b.celsius - a.celsius);
  const fans = server.fans || [];

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))' }}>
      <div>
        <p className="cons__note" style={{ marginTop: 0, fontWeight: 600 }}>
          Temperatures · {temps.length}
        </p>
        {temps.length === 0 ? <p className="cons__empty">None reported.</p> : (
          <table className="cons__t" style={{ minWidth: 0 }}>
            <tbody>
              {temps.map((t) => (
                <tr key={t.name}>
                  <td className="muted" style={{ maxWidth: 160 }}>{t.name}</td>
                  <td style={{ width: 120 }}>
                    <Meter value={t.celsius} max={t.warn || 100}
                      over={sensorState(t) !== 'idle'} />
                  </td>
                  <td className="num">
                    <St level={sensorState(t)}>{Math.round(t.celsius)} °C</St>
                  </td>
                  <td className="num muted">{t.warn ? `limit ${t.warn}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <p className="cons__note" style={{ marginTop: 0, fontWeight: 600 }}>
          Fans · {fans.length}
        </p>
        {fans.length === 0 ? <p className="cons__empty">None reported.</p> : (
          <table className="cons__t" style={{ minWidth: 0 }}>
            <tbody>
              {fans.map((f, i) => (
                <tr key={f.name || i}>
                  <td className="muted" style={{ maxWidth: 160 }}>{f.name || `Fan ${i + 1}`}</td>
                  <td style={{ width: 120 }}>
                    <Meter value={f.percent || 0} max={100} over={(f.percent || 0) >= 80} />
                  </td>
                  <td className="num">{f.percent != null ? `${Math.round(f.percent)}%` : '—'}</td>
                  <td className="num muted">
                    {f.health && !/^ok$/i.test(f.health) ? <St level="warn">{f.health}</St> : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
