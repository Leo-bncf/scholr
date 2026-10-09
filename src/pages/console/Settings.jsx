// Settings — the signed-in account, not the platform.
//
// This page used to hold the platform-wide switches. Those now live on the
// tabs they belong to (Schools, Adoption, Automation, Email). What a person
// opens "Settings" for is their own account: their name, how they sign in,
// their password, where they are signed in, and what their access is.
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Head, Sec, Figs, Skel, Field, St, useToast } from '@/components/console/kit';
import { when } from '@/components/console/useConsoleData';
import { useUser } from '@/components/auth/UserContext';
import * as session from '@/data/session';
import * as users from '@/data/users';

const ROLE = {
  super_admin: 'Super admin',
  admin: 'Admin',
};

const PROVIDER = { email: 'Email and password', google: 'Google' };

export default function Settings() {
  const { user, reload } = useUser();
  const qc = useQueryClient();
  const toast = useToast();

  const accountQ = useQuery({ queryKey: ['console', 'account'], queryFn: session.getAuthAccount });
  const adminsQ = useQuery({ queryKey: ['console', 'super-admins'], queryFn: users.listSuperAdmins });

  const [name, setName] = useState('');
  useEffect(() => { setName(user?.full_name || ''); }, [user?.full_name]);

  const [pw, setPw] = useState({ next: '', again: '' });

  const saveName = useMutation({
    mutationFn: () => session.updateMyProfile({ full_name: name.trim() }),
    onSuccess: () => { reload?.(); toast('Name saved'); },
    onError: (e) => toast(e?.message || 'Could not save your name', 'bad'),
  });

  const savePassword = useMutation({
    mutationFn: () => session.setPassword(pw.next),
    onSuccess: () => {
      setPw({ next: '', again: '' });
      qc.invalidateQueries({ queryKey: ['console', 'account'] });
      toast('Password updated');
    },
    onError: (e) => toast(e?.message || 'Could not change the password', 'bad'),
  });

  // Signing out was only possible from the app's own sidebar, never from the
  // console; this is its one clear exit.
  const signOut = useMutation({
    mutationFn: session.signOut,
    onSuccess: () => { window.location.href = '/'; },
    onError: (e) => toast(e?.message || 'Could not sign out', 'bad'),
  });

  const signOutOthers = useMutation({
    mutationFn: session.signOutOtherDevices,
    onSuccess: () => toast('Signed out everywhere else'),
    onError: (e) => toast(e?.message || 'Could not sign out other devices', 'bad'),
  });

  if (accountQ.isLoading || !user) {
    return <Head title="Settings"><Sec><Skel /></Sec></Head>;
  }

  const account = accountQ.data;
  const providers = account?.providers || [];
  const hasPassword = providers.includes('email');
  const others = (adminsQ.data || []).filter((a) => a.id !== user.id);
  const pwProblem = !pw.next ? null
    : pw.next.length < 10 ? 'Use at least 10 characters.'
      : pw.again && pw.again !== pw.next ? "The two passwords don't match." : null;
  const canSavePw = pw.next && pw.again === pw.next && !pwProblem;

  return (
    <Head title="Settings">
      <Sec>
        <div className="cons__out">
          <p>Signed in as <strong>{user.full_name || account?.email}</strong>{account?.email && user.full_name ? ` · ${account.email}` : ''}</p>
          <button type="button" className="cons__b cons__b--out" disabled={signOut.isPending} onClick={() => signOut.mutate()}>
            <PowerIcon />
            {signOut.isPending ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </Sec>

      <Sec>
        <Figs items={[
          { label: 'Access', value: ROLE[user.role] || user.role, sub: 'every school, every record',
            state: 'warn' },
          { label: 'Status', value: 'Active', sub: account?.createdAt ? `since ${when(account.createdAt)}` : undefined },
          { label: 'Last sign-in', value: account?.lastSignInAt ? when(account.lastSignInAt) : '—', sub: 'this account' },
          { label: 'Signs in with', value: providers.length || '—',
            sub: providers.map((p) => PROVIDER[p] || p).join(' · ') || 'unknown' },
        ]} />
      </Sec>

      <Sec title="Account"
        action={
          <button type="button" className="cons__b cons__b--go"
            disabled={!name.trim() || name.trim() === (user.full_name || '') || saveName.isPending}
            onClick={() => saveName.mutate()}>
            {saveName.isPending ? 'Saving…' : 'Save'}
          </button>
        }>
        <div className="cons__bar">
          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </Field>
          <Field label="Email">
            <input value={account?.email || user.email || ''} readOnly aria-readonly="true" />
          </Field>
        </div>
        <p className="cons__note">
          Your email is how you sign in, including with Google, so it can't be changed here.
        </p>
      </Sec>

      <Sec title={hasPassword ? 'Change password' : 'Set a password'}
        meta={hasPassword ? undefined : 'you sign in with Google only'}
        action={
          <button type="button" className="cons__b cons__b--go"
            disabled={!canSavePw || savePassword.isPending}
            onClick={() => savePassword.mutate()}>
            {savePassword.isPending ? 'Saving…' : hasPassword ? 'Change password' : 'Set password'}
          </button>
        }>
        <div className="cons__bar">
          <Field label="New password">
            <input type="password" autoComplete="new-password" value={pw.next}
              onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
          </Field>
          <Field label="Type it again">
            <input type="password" autoComplete="new-password" value={pw.again}
              onChange={(e) => setPw((p) => ({ ...p, again: e.target.value }))} />
          </Field>
        </div>
        <p className="cons__note" role={pwProblem ? 'alert' : undefined}>
          {pwProblem || (hasPassword
            ? 'This account can read every school. Use a long password you use nowhere else.'
            : 'A password lets you sign in with your email as well as with Google — useful if Google is ever unavailable.')}
        </p>
      </Sec>

      <Sec title="Where you're signed in"
        action={
          <button type="button" className="cons__b"
            disabled={signOutOthers.isPending}
            onClick={() => signOutOthers.mutate()}>
            {signOutOthers.isPending ? 'Signing out…' : 'Sign out everywhere else'}
          </button>
        }>
        <p className="cons__note">
          Ends every session on other browsers and devices. This one stays signed in. Do this if you
          signed in on a shared computer, or think someone else has your password.
        </p>
      </Sec>

      <Sec title="Others with this access" meta={adminsQ.isLoading ? undefined : `${others.length} besides you`}>
        {adminsQ.isLoading ? <Skel /> : others.length === 0 ? (
          <p className="cons__empty">Nobody else. If this account were locked out, no one could get into the console.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>Name</th><th>Email</th><th>Access</th></tr></thead>
              <tbody>
                {others.map((a) => (
                  <tr key={a.id}>
                    <td className="name">{a.full_name || '—'}</td>
                    <td className="muted">{a.email}</td>
                    <td><St level="warn">{ROLE[a.role] || a.role}</St></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Sec>

      <Sec title="Delete this account">
        <p className="cons__note">
          A super admin can't delete their own account — the platform refuses it, so it can never be
          left with nobody able to administer it. Ask {others.length ? others.map((a) => a.full_name || a.email).join(' or ') : 'another super admin'} to
          delete it on the <a href="/SuperAdminUsers">Users page</a>. Deleting removes the account
          and its sign-in for good; anything it changed stays in the audit trail.
        </p>
      </Sec>
    </Head>
  );
}

/** The power symbol, drawn like the console's other rail icons (stroked, 24px grid). */
function PowerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 2v10" />
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    </svg>
  );
}
