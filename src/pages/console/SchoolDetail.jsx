// One school: what it is, what it has built, who is in it, and the two
// controls that change its life — status and contracted roll.
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Head, Sec, Figs, St, Skel, Dialog, Field, useToast } from '@/components/console/kit';
import { money, num, when } from '@/components/console/useConsoleData';
import { useSuperAdminSchoolDetailQuery } from '@/components/hooks/useSuperAdminData';
import {
  SCHOOL_STATUS_OPTIONS, getBillingStatusMeta, getSchoolStatusMeta,
} from '@/components/admin/super-admin/superAdminConfig';
import * as schoolsData from '@/data/schools';
import * as admin from '@/data/admin';
import { annualCost } from '@/lib/pricing';

const B = '/AdminConsole';

export default function SchoolDetail() {
  const { schoolId } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);

  const { data, isLoading, isError } = useSuperAdminSchoolDetailQuery(schoolId);

  const save = useMutation({
    mutationFn: async (patch) => {
      const next = await schoolsData.update(schoolId, patch);
      // A privileged change that is not written down did not happen, as far
      // as anyone reviewing the platform later is concerned.
      await admin.recordAuditLog({
        school_id: schoolId,
        action: 'school.updated_from_console',
        entity_type: 'school',
        entity_id: schoolId,
        details: Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(', '),
        level: patch.status === 'suspended' ? 'warning' : 'info',
      }).catch(() => {});
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['console'] });
      qc.invalidateQueries({ queryKey: ['super-admin'] });
      setEditing(false);
      toast('Saved');
    },
    onError: (e) => toast(e?.message || 'Could not save', 'bad'),
  });

  if (isLoading) return <Head title="School"><Sec><Skel /></Sec></Head>;
  if (isError || !data?.school) {
    return (
      <Head title="School">
        <Sec>
          <p className="cons__empty">
            That school could not be read. <Link className="cons__link" to={`${B}/schools`}>Back to schools</Link>
          </p>
        </Sec>
      </Head>
    );
  }

  const { school, stats, members } = data;
  const st = getSchoolStatusMeta(school.status);
  const bl = getBillingStatusMeta(school.billing_status);
  const cap = Number(school.max_students || 0);
  const roll = stats.staff ?? 0;
  const over = cap > 0 && roll > cap;

  const built = [
    ['Academic years', stats.academicYears],
    ['Terms', stats.terms],
    ['Subjects', stats.subjects],
    ['Classes', stats.classes],
  ];

  return (
    <Head title={school.name}>
      <Sec meta={[school.city, school.country].filter(Boolean).join(', ') || undefined}
        action={
          <>
            <Link className="cons__b" to={`${B}/schools`}>All schools</Link>
            <button type="button" className="cons__b cons__b--go" onClick={() => setEditing(true)}>
              Change
            </button>
          </>
        }>
        <Figs items={[
          { label: 'Status', value: st.label, state: st.tone === 'crit' ? 'bad' : undefined },
          { label: 'Billing', value: bl.label, state: bl.tone === 'crit' ? 'bad' : bl.tone === 'warn' ? 'warn' : undefined },
          { label: 'People', value: num(roll),
            sub: cap > 0 ? `of ${num(cap)} contracted` : 'no cap set',
            state: over ? 'warn' : undefined },
          { label: 'Per year', value: cap > 0 ? money(annualCost(cap)) : '—', sub: 'list price' },
          { label: 'Joined', value: when(school.created_at, false) },
        ]} />
      </Sec>

      <Sec title="What they have built"
        meta="how far past sign-up this school actually got">
        <div className="cons__scroll">
          <table className="cons__t">
            <thead><tr><th>Thing</th><th className="num">Rows</th><th>State</th></tr></thead>
            <tbody>
              {built.map(([label, n]) => (
                <tr key={label}>
                  <td className="name">{label}</td>
                  <td className="num">{num(n)}</td>
                  <td><St level={n > 0 ? 'idle' : 'warn'}>{n > 0 ? 'set up' : 'empty'}</St></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Sec>

      <Sec title="Members" meta={`${members.length} on the roll`}>
        {members.length === 0 ? (
          <p className="cons__empty">Nobody has joined this school yet.</p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead><tr><th>Person</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                {members.slice(0, 50).map((m) => (
                  <tr key={m.id}>
                    <td className="name">{m.user_name || '—'}</td>
                    <td className="muted">{m.user_email || '—'}</td>
                    <td className="muted">{m.role || '—'}</td>
                    <td>
                      <St level={m.status === 'active' || m.status === 'invited' ? 'idle' : 'warn'}>
                        {m.status || '—'}
                      </St>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {members.length > 50 && (
              <p className="cons__note">
                Showing the first 50. The full roll is in the school's own Users page.
              </p>
            )}
          </div>
        )}
      </Sec>

      {editing && (
        <Dialog title={`Change ${school.name}`}
          meta="writes to production"
          onClose={() => setEditing(false)}
          footer={
            <>
              <button type="button" className="cons__b" onClick={() => setEditing(false)}>Cancel</button>
              <button type="button" className="cons__b cons__b--go" form="school-edit"
                onClick={() => document.getElementById('school-edit')?.requestSubmit()}
                disabled={save.isPending}>
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </>
          }>
          <form id="school-edit" onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const maxStudents = f.get('max_students');
            save.mutate({
              status: f.get('status'),
              max_students: maxStudents === '' ? null : Number(maxStudents),
            });
          }} style={{ display: 'grid', gap: 12 }}>
            <Field label="Status">
              <select name="status" defaultValue={school.status || 'onboarding'}>
                {SCHOOL_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Contracted roll (max students)">
              <input name="max_students" type="number" min="0" step="1"
                defaultValue={school.max_students ?? ''} placeholder="No cap" />
            </Field>
            <p className="cons__note">
              Suspending a school signs everyone there out of the product. Billing status is
              owned by Stripe and is not editable here.
            </p>
          </form>
        </Dialog>
      )}
    </Head>
  );
}
