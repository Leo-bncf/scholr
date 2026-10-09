// Camera — a look at the room, for when a number is not enough.
//
// The frame only refreshes while this tab is in front: React Query pauses a
// refetch interval in a background tab, which is what stops the console
// pulling a snapshot every ten seconds all night for nobody.
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Head, Sec, Figs, Skel, useToast } from '@/components/console/kit';
import { useCamera, ago } from '@/components/console/useConsoleData';
import * as fns from '@/data/functions';

const MOVES = [
  { dir: 'up', label: '↑' },
  { dir: 'left', label: '←' },
  { dir: 'right', label: '→' },
  { dir: 'down', label: '↓' },
];

export default function Camera() {
  const [live, setLive] = useState(true);
  const cam = useCamera(live);
  const toast = useToast();

  const move = useMutation({
    mutationFn: (direction) => fns.invoke('adminCamera', { action: 'move', direction }),
    onSuccess: (r) => {
      if (r?.ok === false) toast(r.error || 'The camera refused that', 'bad');
      setTimeout(() => cam.refetch(), 900);
    },
    onError: (e) => toast(e?.message || 'Could not reach the camera', 'bad'),
  });

  const data = cam.data || {};

  if (cam.isError) {
    return (
      <Head title="Camera">
        <Sec>
          <p className="cons__empty">The camera could not be reached: {cam.error?.message}</p>
          <p className="cons__note">
            If <code>adminCamera</code> is not deployed to this project yet, run
            <code> npm run deploy:functions adminCamera</code>.
          </p>
        </Sec>
      </Head>
    );
  }

  if (data.configured === false) {
    return (
      <Head title="Camera">
        <Sec>
          <p className="cons__empty">
            No camera is configured on this deployment.{data.reason ? ` ${data.reason}` : ''}
          </p>
          <p className="cons__note">
            Set <code>IMOU_APP_ID</code>, <code>IMOU_APP_SECRET</code>,{' '}
            <code>IMOU_DEVICE_ID</code> and <code>IMOU_REGION</code> in the edge runtime.
          </p>
        </Sec>
      </Head>
    );
  }

  const frame = data.frame || data.image || data.url || null;

  return (
    <Head title="Camera">
      <Sec action={
        <>
          <button type="button" className="cons__b" onClick={() => setLive((v) => !v)}>
            {live ? 'Pause' : 'Resume'}
          </button>
          <button type="button" className="cons__b" onClick={() => cam.refetch()}
            disabled={cam.isFetching}>
            {cam.isFetching ? 'Fetching…' : 'New frame'}
          </button>
        </>
      }>
        <Figs items={[
          { label: 'Feed', value: live ? 'live' : 'paused',
            sub: live ? 'a frame every 10s' : 'not refreshing' },
          { label: 'Frame', value: data.captured_at ? ago(data.captured_at) : cam.dataUpdatedAt
            ? ago(cam.dataUpdatedAt) : '—', sub: 'old' },
          { label: 'Camera', value: data.online === false ? 'offline' : 'online',
            state: data.online === false ? 'bad' : undefined },
        ]} />
      </Sec>

      <Sec title="The room">
        {cam.isLoading ? <Skel label="Fetching a frame" /> : !frame ? (
          <p className="cons__empty">
            The camera answered but sent no frame.{data.error ? ` ${data.error}` : ''}
          </p>
        ) : (
          <figure style={{ margin: 0 }}>
            <img src={frame} alt="The server room, moments ago"
              style={{ display: 'block', width: '100%', maxWidth: 760, border: '1px solid var(--rule)' }} />
            <figcaption className="cons__note">
              A still, not a stream. {live ? 'Refreshing while this tab is in front.' : 'Paused.'}
            </figcaption>
          </figure>
        )}

        <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
          {MOVES.map((m) => (
            <button key={m.dir} type="button" className="cons__b"
              disabled={move.isPending || data.online === false}
              onClick={() => move.mutate(m.dir)} aria-label={`Pan ${m.dir}`}>
              {m.label}
            </button>
          ))}
          <span className="cons__note" style={{ marginTop: 0, alignSelf: 'center' }}>
            Panning moves the physical camera, and it stays where you leave it.
          </span>
        </div>
      </Sec>
    </Head>
  );
}
