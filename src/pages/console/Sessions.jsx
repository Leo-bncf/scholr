// Sessions — who has actually been in.
//
// auth.users is not readable by any application role, and should not be: it
// holds password hashes and recovery tokens. This goes through a definer
// function that returns two timestamps per account and nothing else.
//
// The question worth asking here is not "how many people signed in" — it is
// "has anyone privileged signed in that I did not expect", which is why the
// privileged accounts are listed on their own at the top.
import React, { useMemo, useState } from 'react';
import { Head, Sec, Figs, St, Skel, Field } from '@/components/console/kit';
import { useSignIns, num, when, ago } from '@/components/console/useConsoleData';

const DAY = 24 * 3600_000;

export default function Sessions() {
  const signInsQ = useSignIns(200);
  const [q, setQ] = useState('');
  const [view, setView] = useState('all');

  const all = signInsQ.data || [];
  const now = Date.now();
  const since = (ts) => (ts ? now - new Date(ts).getTime() : Infinity);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((u) => {
      if (view === 'today' && since(u.last_sign_in_at) > DAY) return false;
      if (view === 'week' && since(u.last_sign_in_at) > 7 * DAY) return false;
      if (view === 'never' && u.last_sign_in_at) return false;
      if (view === 'privileged' && !['super_admin', 'admin'].includes(u.role)) return false;
      if (!needle) return true;
      return [u.email, u.full_name].filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
  }, [all, q, view]);

  const today = all.filter((u) => since(u.last_sign_in_at) <= DAY).length;
  const week = all.filter((u) => since(u.last_sign_in_at) <= 7 * DAY).length;
  const never = all.filter((u) => !u.last_sign_in_at).length;
  const unconfirmed = all.filter((u) => !u.confirmed).length;
  const privileged = all.filter((u) => ['super_admin', 'admin'].includes(u.role));

  if (signInsQ.isError) {
    return (
      <Head title="Sessions">
        <Sec>
          <p className="cons__empty">
            Sign-in history could not be read: {signInsQ.error?.message}
          </p>
          <p className="cons__note">
            <code>recent_sign_ins()</code> only answers a super admin. If it is missing, apply
            migration 0017 to this database.
          </p>
        </Sec>
      </Head>
    );
  }

  return (
    <Head title="Sessions">
      <Sec action={
        <button type="button" className="cons__b" onClick={() => signInsQ.refetch()}
          disabled={signInsQ.isFetching}>
          {signInsQ.isFetching ? 'Reading…' : 'Re-read'}
        </button>
      }>
        <Figs items={[
          { label: 'In today', value: signInsQ.isLoading ? '—' : today, sub: 'last 24 hours' },
          { label: 'This week', value: signInsQ.isLoading ? '—' : week },
          { label: 'Never signed in', value: signInsQ.isLoading ? '—' : never,
            sub: 'account exists, unused', state: never ? 'warn' : undefined },
          { label: 'Unconfirmed', value: signInsQ.isLoading ? '—' : unconfirmed,
            sub: 'email never verified', state: unconfirmed ? 'warn' : undefined },
          { label: 'Privileged', value: signInsQ.isLoading ? '—' : privileged.length,
            sub: 'super admin or admin' },
        ]} />
      </Sec>

      <Sec title="Privileged accounts"
        meta="the list worth reading line by line">
        {signInsQ.isLoading ? <Skel /> : privileged.length === 0 ? (
          <p className="cons__empty">No privileged account was returned.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>Who</th><th>Email</th><th>Role</th><th>Last in</th><th>Confirmed</th></tr></thead>
              <tbody>
                {privileged.map((u) => (
                  <tr key={u.user_id}>
                    <td className="name">{u.full_name || '—'}</td>
                    <td className="muted">{u.email}</td>
                    <td><St level="warn">{u.role}</St></td>
                    <td className="mono muted" title={when(u.last_sign_in_at)}>
                      {u.last_sign_in_at ? `${ago(u.last_sign_in_at)} ago` : 'never'}
                    </td>
                    <td>
                      <St level={u.confirmed ? 'idle' : 'warn'}>{u.confirmed ? 'yes' : 'no'}</St>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sec>

      <Sec title="Everyone" meta={`${rows.length} shown`}>
        <div className="cons__bar">
          <Field label="Find">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or email" />
          </Field>
          <Field label="Show">
            <select value={view} onChange={(e) => setView(e.target.value)}>
              <option value="all">Everyone</option>
              <option value="today">In today</option>
              <option value="week">In this week</option>
              <option value="never">Never signed in</option>
              <option value="privileged">Privileged only</option>
            </select>
          </Field>
        </div>

        {signInsQ.isLoading ? <Skel /> : rows.length === 0 ? (
          <p className="cons__empty">Nobody matches that.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr><th>Who</th><th>Email</th><th>Role</th><th>Last in</th><th>Account made</th></tr>
              </thead>
              <tbody>
                {rows.slice(0, 200).map((u) => (
                  <tr key={u.user_id}>
                    <td className="name">{u.full_name || '—'}</td>
                    <td className="muted">{u.email}</td>
                    <td className="muted">{u.role}</td>
                    <td className="mono muted" title={when(u.last_sign_in_at)}>
                      {u.last_sign_in_at ? `${ago(u.last_sign_in_at)} ago` : 'never'}
                    </td>
                    <td className="mono muted">{when(u.created_at, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 200 && (
              <p className="cons__note">Showing the first 200 of {num(rows.length)}.</p>
            )}
          </div>
        )}
        <p className="cons__note">
          This is sign-in recency, not live sessions: it says when an account last authenticated,
          not whether a tab is open right now.
        </p>
      </Sec>
    </Head>
  );
}
