// Email — whether this deployment can send anything at all, and what is
// queued up behind that answer.
//
// There is no outbound log table, so this does not pretend to be one. It
// reports what the runtime is configured for and what is waiting on it, which
// is the honest version: every pending invitation below is a person who was
// told an email was on its way.
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Head, Sec, Figs, St, Skel } from '@/components/console/kit';
import { useReadiness, useInvitations, useSchools, when, ago } from '@/components/console/useConsoleData';

const B = '/AdminConsole';

export default function Email() {
  const ready = useReadiness();
  const invitesQ = useInvitations();
  const schoolsQ = useSchools();

  const schoolNames = useMemo(
    () => Object.fromEntries((schoolsQ.data || []).map((s) => [s.id, s.name])),
    [schoolsQ.data],
  );

  const checks = ready.data?.checks || [];
  const smtp = checks.find((c) => /smtp|email/i.test(c.name));
  const smtpOk = smtp?.status === 'pass';

  const invites = invitesQ.data || [];
  const pending = invites.filter((i) => i.status === 'pending');
  const expired = pending.filter((i) => i.expires_at && new Date(i.expires_at) < new Date());
  const accepted = invites.filter((i) => i.status === 'accepted');

  return (
    <Head title="Email">
      <Sec action={
        <button type="button" className="cons__b" onClick={() => ready.refetch()}
          disabled={ready.isFetching}>
          {ready.isFetching ? 'Checking…' : 'Re-check'}
        </button>
      }>
        <Figs items={[
          { label: 'Outbound mail', value: ready.isLoading ? '—' : smtpOk ? 'configured' : 'off',
            sub: smtpOk ? 'SMTP credentials present' : 'nothing can be sent',
            state: ready.isLoading ? undefined : smtpOk ? undefined : 'bad' },
          { label: 'Waiting', value: invitesQ.isLoading ? '—' : pending.length,
            sub: 'invitations not accepted',
            state: pending.length && !smtpOk ? 'warn' : undefined },
          { label: 'Expired', value: invitesQ.isLoading ? '—' : expired.length,
            sub: 'past their date', state: expired.length ? 'warn' : undefined },
          { label: 'Accepted', value: invitesQ.isLoading ? '—' : accepted.length },
        ]} />
      </Sec>

      {!ready.isLoading && !smtpOk && (
        <Sec title="Nothing is being sent">
          <p className="cons__empty">
            SMTP is not configured on this deployment, so every invitation below was created
            but never delivered. The link still works — somebody has to pass it on by hand.
          </p>
          <p className="cons__note">
            {smtp?.missing?.length
              ? <>Missing or placeholder: <code>{smtp.missing.join('</code>, <code>')}</code>.</>
              : 'Set SMTP_HOST, SMTP_USER and SMTP_PASS in the edge runtime.'}
          </p>
        </Sec>
      )}

      <Sec title="What the runtime is configured for"
        meta={ready.data?.readyForDeployment === false ? 'not ready to deploy' : undefined}>
        {ready.isLoading ? <Skel /> : ready.isError ? (
          <p className="cons__empty">
            The readiness check could not be read: {ready.error?.message}
          </p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>Area</th><th>State</th><th>Missing</th></tr></thead>
              <tbody>
                {checks.map((c) => (
                  <tr key={c.name}>
                    <td className="name">{c.name}</td>
                    <td>
                      <St level={c.status === 'pass' ? 'idle' : c.status === 'warn' ? 'warn' : 'bad'}>
                        {c.status === 'pass' ? 'configured' : c.status}
                      </St>
                    </td>
                    <td className="muted mono">
                      {Array.isArray(c.missing) && c.missing.length ? c.missing.join(', ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sec>

      <Sec title="Invitations" meta={`${invites.length} most recent`}
        action={<Link className="cons__b" to={`${B}/people`}>People</Link>}>
        {invitesQ.isLoading ? <Skel /> : invites.length === 0 ? (
          <p className="cons__empty">Nobody has been invited yet.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr><th>Who</th><th>Role</th><th>School</th><th>Status</th><th>Sent</th><th>Expires</th></tr>
              </thead>
              <tbody>
                {invites.slice(0, 60).map((i) => {
                  const isExpired = i.status === 'pending' && i.expires_at
                    && new Date(i.expires_at) < new Date();
                  return (
                    <tr key={i.id}>
                      <td className="name">{i.email}</td>
                      <td className="muted">{i.role}</td>
                      <td className="muted">
                        {i.school_id ? (schoolNames[i.school_id] || 'Unknown') : '—'}
                      </td>
                      <td>
                        <St level={isExpired ? 'warn' : i.status === 'cancelled' ? 'warn' : 'idle'}>
                          {isExpired ? 'expired' : i.status}
                        </St>
                      </td>
                      <td className="mono muted" title={when(i.created_at)}>{ago(i.created_at)}</td>
                      <td className="mono muted">{i.expires_at ? when(i.expires_at, false) : '—'}</td>
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
