// Tickets — what schools have asked for, and whether anyone answered.
//
// Open is the only state that needs you, so open is the only state with
// colour, and the list is sorted so those sit at the top whatever you filter.
import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Head, Sec, Figs, St, Skel, Field, useToast } from '@/components/console/kit';
import { useTickets, ago, when } from '@/components/console/useConsoleData';
import * as supportTicketsData from '@/data/supportTickets';

const STATUS = {
  open: { label: 'Open', level: 'warn' },
  in_progress: { label: 'In progress', level: 'idle' },
  resolved: { label: 'Resolved', level: 'idle' },
};

// A high-priority ticket is the one thing in this column worth noticing.
const PRIORITY = { high: 'bad', medium: 'idle', low: 'idle' };

export default function Tickets() {
  const ticketsQ = useTickets();
  const qc = useQueryClient();
  const toast = useToast();
  const [view, setView] = useState('open');

  const move = useMutation({
    mutationFn: ({ id, status }) => supportTicketsData.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['console', 'tickets'] });
      toast('Ticket updated');
    },
    onError: (e) => toast(e?.message || 'Could not update the ticket', 'bad'),
  });

  const all = ticketsQ.data || [];
  const counts = useMemo(() => ({
    open: all.filter((t) => t.status === 'open').length,
    in_progress: all.filter((t) => t.status === 'in_progress').length,
    resolved: all.filter((t) => t.status === 'resolved').length,
    high: all.filter((t) => t.priority === 'high' && t.status !== 'resolved').length,
  }), [all]);

  const rows = useMemo(() => all
    .filter((t) => view === 'all' || t.status === view)
    .sort((a, b) => {
      const rank = (t) => (t.status === 'open' ? 0 : t.status === 'in_progress' ? 1 : 2);
      const pri = (t) => (t.priority === 'high' ? 0 : t.priority === 'medium' ? 1 : 2);
      return rank(a) - rank(b) || pri(a) - pri(b)
        || new Date(b.created_at || 0) - new Date(a.created_at || 0);
    }), [all, view]);

  const oldestOpen = useMemo(() => all
    .filter((t) => t.status === 'open')
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))[0], [all]);

  return (
    <Head title="Tickets">
      <Sec>
        <Figs items={[
          { label: 'Open', value: ticketsQ.isLoading ? '—' : counts.open,
            sub: 'nobody has replied', state: counts.open ? 'warn' : undefined },
          { label: 'In progress', value: ticketsQ.isLoading ? '—' : counts.in_progress },
          { label: 'Resolved', value: ticketsQ.isLoading ? '—' : counts.resolved },
          { label: 'High priority', value: ticketsQ.isLoading ? '—' : counts.high,
            sub: 'still not resolved', state: counts.high ? 'bad' : undefined },
          { label: 'Oldest open', value: oldestOpen ? ago(oldestOpen.created_at) : '—',
            sub: 'waiting this long' },
        ]} />
      </Sec>

      <Sec title="Queue" meta={`${rows.length} shown`}>
        <div className="cons__bar">
          <Field label="Show">
            <select value={view} onChange={(e) => setView(e.target.value)}>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="all">Everything</option>
            </select>
          </Field>
        </div>

        {ticketsQ.isLoading ? <Skel /> : rows.length === 0 ? (
          <p className="cons__empty">
            {view === 'open' ? 'Nothing is waiting on a reply.' : 'No ticket in that state.'}
          </p>
        ) : (
          <div className="cons__scroll">
            <table className="cons__t">
              <thead>
                <tr>
                  <th>Ticket</th><th>School</th><th>Priority</th><th>Status</th>
                  <th>Assignee</th><th>Opened</th><th />
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const st = STATUS[t.status] || { label: t.status || '—', level: 'idle' };
                  return (
                    <tr key={t.id}>
                      <td className="name">
                        {t.subject}
                        {t.ticket_id && <span className="muted mono"> · {t.ticket_id}</span>}
                      </td>
                      <td className="muted">{t.school || '—'}</td>
                      <td>
                        <St level={PRIORITY[t.priority] || 'idle'}>{t.priority || '—'}</St>
                      </td>
                      <td><St level={st.level}>{st.label}</St></td>
                      <td className="muted">{t.assignee || 'Unassigned'}</td>
                      <td className="mono muted" title={when(t.created_at)}>{ago(t.created_at)}</td>
                      <td>
                        {t.status !== 'resolved' && (
                          <button type="button" className="cons__b"
                            disabled={move.isPending}
                            onClick={() => move.mutate({
                              id: t.id,
                              status: t.status === 'open' ? 'in_progress' : 'resolved',
                            })}>
                            {t.status === 'open' ? 'Take it' : 'Resolve'}
                          </button>
                        )}
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
