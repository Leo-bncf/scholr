// Servers — the machines themselves, through their out-of-band controllers.
//
// Everything that changes a machine's state goes through a confirmation that
// names the machine and says what happens, because this page can power off the
// host the product is running on, and the browser's grey confirm box is not a
// good enough last word before that.
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Head, Sec, Figs, St, Skel, Meter, Dialog, useToast } from '@/components/console/kit';
import { useIlo, tempState, num } from '@/components/console/useConsoleData';
import * as fns from '@/data/functions';

export default function Servers() {
  const ilo = useIlo();
  const qc = useQueryClient();
  const toast = useToast();
  const [ask, setAsk] = useState(null); // { server, kind }

  const act = useMutation({
    mutationFn: (payload) => fns.invoke('adminIlo', payload),
    onSuccess: (r, payload) => {
      qc.invalidateQueries({ queryKey: ['console', 'ilo'] });
      setAsk(null);
      toast(r?.ok === false
        ? (r.error || 'The controller refused that')
        : `Sent to ${payload.server}`, r?.ok === false ? 'bad' : 'ok');
    },
    onError: (e) => toast(e?.message || 'Could not reach the controller', 'bad'),
  });

  const data = ilo.data || {};
  const servers = data.servers || [];

  if (ilo.isError) {
    return (
      <Head title="Servers">
        <Sec>
          <p className="cons__empty">
            The controllers could not be reached: {ilo.error?.message}
          </p>
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
            <code>ILO_CREDS</code>) in the edge runtime. The controllers are LAN-only, so a
            deployment outside the LAN also needs <code>ILO_PROXY</code>.
          </p>
        </Sec>
      </Head>
    );
  }

  const unreachable = servers.filter((s) => !s.ok).length;
  const off = servers.filter((s) => s.ok && s.powerState && s.powerState !== 'On').length;
  const hottest = servers.map((s) => s.temp).filter((t) => t != null).map(Number);
  const draw = servers.map((s) => s.watts).filter((w) => w != null)
    .reduce((a, b) => a + Number(b), 0);

  return (
    <Head title="Servers">
      <Sec action={
        <button type="button" className="cons__b" onClick={() => ilo.refetch()} disabled={ilo.isFetching}>
          {ilo.isFetching ? 'Reading…' : 'Re-read'}
        </button>
      }>
        <Figs items={[
          { label: 'Machines', value: ilo.isLoading ? '—' : servers.length },
          { label: 'Unreachable', value: ilo.isLoading ? '—' : unreachable,
            sub: 'controller not answering', state: unreachable ? 'bad' : undefined },
          { label: 'Powered off', value: ilo.isLoading ? '—' : off,
            sub: 'not running', state: off ? 'bad' : undefined },
          { label: 'Hottest', value: hottest.length ? Math.max(...hottest) : '—',
            unit: hottest.length ? '°C' : '',
            state: hottest.length && tempState(Math.max(...hottest)) !== 'idle'
              ? tempState(Math.max(...hottest)) : undefined },
          { label: 'Drawing', value: draw ? num(Math.round(draw)) : '—',
            unit: draw ? 'W' : '', sub: 'total, all chassis' },
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
                  <th>Machine</th><th>Controller</th><th>Power</th>
                  <th className="num">Temp</th><th className="num">Fans</th>
                  <th className="num">Draw</th><th>Do</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((s) => (
                  <tr key={s.label}>
                    <td className="name mono">{s.label}</td>
                    <td>
                      <St level={s.ok ? 'idle' : 'bad'}>{s.ok ? 'answering' : 'unreachable'}</St>
                    </td>
                    <td>
                      <St level={!s.ok ? 'idle' : s.powerState === 'On' ? 'idle' : 'bad'}>
                        {s.ok ? (s.powerState || 'unknown').toLowerCase() : '—'}
                      </St>
                    </td>
                    <td className="num">
                      <St level={tempState(s.temp)}>
                        {s.temp != null ? `${Math.round(s.temp)} °C` : '—'}
                      </St>
                    </td>
                    <td className="num">
                      {s.fanPct != null ? (
                        <>
                          <Meter value={s.fanPct} max={100} over={s.fanPct >= 80} />
                          <span className="muted mono"> {Math.round(s.fanPct)}%</span>
                        </>
                      ) : <span className="muted">—</span>}
                    </td>
                    <td className="num muted">{s.watts != null ? `${Math.round(s.watts)} W` : '—'}</td>
                    <td>
                      {s.ok && (
                        <button type="button" className="cons__b"
                          onClick={() => setAsk({ server: s.label, state: s.powerState })}>
                          Power…
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="cons__note">
          Fans are reported as a percentage of full speed. These chassis have no fan control
          worth the name — the lever that actually changes anything is the power cap, and
          below that, the room.
        </p>
      </Sec>

      {ask && (
        <Dialog title={`${ask.server}`}
          meta="this acts on real hardware"
          onClose={() => setAsk(null)}
          footer={<button type="button" className="cons__b" onClick={() => setAsk(null)}>Cancel</button>}>
          <p>
            {ask.server} is currently <strong>{(ask.state || 'in an unknown state').toLowerCase()}</strong>.
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
