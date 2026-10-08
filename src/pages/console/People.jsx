// People — every account on the platform, which is the one list RLS cannot
// give you: the profiles policy only exposes people you share a school with,
// so enumerating the platform goes through an edge function that checks the
// caller is a super admin before using the service role.
import React, { useMemo, useState } from 'react';
import { Head, Sec, Figs, St, Skel, Field } from '@/components/console/kit';
import { useHeadline, useUsers, num, when } from '@/components/console/useConsoleData';

const ROLE_LABEL = {
  super_admin: 'Super admin',
  admin: 'Admin',
  school_admin: 'School admin',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
};

export default function People() {
  const h = useHeadline();
  const usersQ = useUsers();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');

  const schoolNames = useMemo(
    () => Object.fromEntries(h.schools.map((s) => [s.id, s.name])),
    [h.schools],
  );

  const users = useMemo(() => {
    const all = usersQ.data?.users || [];
    const needle = q.trim().toLowerCase();
    return all
      .filter((u) => {
        if (role !== 'all' && u.role !== role) return false;
        if (!needle) return true;
        return [u.full_name, u.email].filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle));
      })
      .sort((a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || ''));
  }, [usersQ.data, q, role]);

  const byRole = useMemo(() => {
    const counts = {};
    for (const u of usersQ.data?.users || []) {
      counts[u.role || 'unknown'] = (counts[u.role || 'unknown'] || 0) + 1;
    }
    return counts;
  }, [usersQ.data]);

  const privileged = (byRole.super_admin || 0) + (byRole.admin || 0);

  return (
    <Head title="People">
      <Sec>
        <Figs items={[
          { label: 'Accounts', value: usersQ.isLoading ? '—' : num(usersQ.data?.users?.length ?? 0) },
          { label: 'Memberships', value: h.loading ? '—' : num(h.members), sub: 'active, across all schools' },
          { label: 'Privileged', value: usersQ.isLoading ? '—' : privileged,
            sub: 'super admin or admin' },
          { label: 'School admins', value: usersQ.isLoading ? '—' : num(byRole.school_admin || 0) },
          { label: 'Teachers', value: usersQ.isLoading ? '—' : num(byRole.teacher || 0) },
        ]} />
      </Sec>

      <Sec title="Every account" meta={usersQ.isError ? undefined : `${users.length} shown`}>
        {usersQ.isError ? (
          <p className="cons__empty">
            The platform user list could not be read. `listAllUsers` is an edge function — if it
            is not deployed, this page has nothing to show and the rest of the console is
            unaffected.
          </p>
        ) : (
          <>
            <div className="cons__bar">
              <Field label="Find">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or email" />
              </Field>
              <Field label="Role">
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="all">Every role</option>
                  {Object.entries(ROLE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>
            </div>

            {usersQ.isLoading ? <Skel /> : users.length === 0 ? (
              <p className="cons__empty">No account matches that.</p>
            ) : (
              <div className="cons__scroll">
                <table className="cons__t">
                  <thead>
                    <tr><th>Person</th><th>Email</th><th>Role</th><th>School</th><th>Joined</th></tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 200).map((u) => (
                      <tr key={u.id}>
                        <td className="name">{u.full_name || '—'}</td>
                        <td className="muted">{u.email || '—'}</td>
                        <td>
                          {/* A privileged role is the one thing on this list
                              worth noticing at a glance. */}
                          <St level={u.role === 'super_admin' || u.role === 'admin' ? 'warn' : 'idle'}>
                            {ROLE_LABEL[u.role] || u.role || '—'}
                          </St>
                        </td>
                        <td className="muted">
                          {u.active_school_id ? (schoolNames[u.active_school_id] || 'Unknown') : '—'}
                        </td>
                        <td className="mono muted">{when(u.created_at, false)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length > 200 && (
                  <p className="cons__note">Showing the first 200 of {num(users.length)}. Narrow with the filters.</p>
                )}
              </div>
            )}
          </>
        )}
      </Sec>
    </Head>
  );
}
