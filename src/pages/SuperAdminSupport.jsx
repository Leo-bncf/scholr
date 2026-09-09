import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Ticket,
} from 'lucide-react';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminPageHeader from '@/components/admin/super-admin/SuperAdminPageHeader';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import * as supportTicketsData from '@/data/supportTickets';

// ─── Sample data (KB only) ────────────────────────────────────────────────────



const PRIORITY_META = {
  high: { label: 'High', color: 'bg-red-100 text-red-700 border-red-200' },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  low: { label: 'Low', color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

const STATUS_META = {
  open: { label: 'Open', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  in_progress: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

// ─── Ticket Management ────────────────────────────────────────────────────────

function TicketManagement() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    supportTicketsData.where({}, { order: 'created_at', ascending: false, limit: 200 }).then((data) => {
      setTickets(data);
      setLoading(false);
    });
  }, []);

  const filtered = tickets.filter((t) => {
    const matchSearch = t.subject.toLowerCase().includes(search.toLowerCase()) || t.school.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  const handleStatusChange = async (id, status) => {
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
    await supportTicketsData.update(id, { status });
  };

  const openCount = tickets.filter((t) => t.status === 'open').length;
  const inProgressCount = tickets.filter((t) => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Open', value: openCount, color: 'text-rose-600' },
          { label: 'In Progress', value: inProgressCount, color: 'text-indigo-600' },
          { label: 'Resolved', value: resolvedCount, color: 'text-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'open', 'in_progress', 'resolved'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {['all', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${filterPriority === p ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {p === 'all' ? 'All Priority' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket list */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">No tickets match your filters.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((ticket) => {
              const isExpanded = expandedId === ticket.id;
              const pm = PRIORITY_META[ticket.priority] || PRIORITY_META.low;
              const sm = STATUS_META[ticket.status] || STATUS_META.open;
              return (
                <div key={ticket.id} className="p-4">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : ticket.id)}>
                    <Ticket className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-slate-400">{ticket.ticket_id}</span>
                        <span className="text-sm font-medium text-slate-800 truncate">{ticket.subject}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{ticket.school} · {ticket.created_at ? ticket.created_at.slice(0, 10) : ''}</p>
                    </div>
                    <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full border font-medium ${pm.color}`}>{pm.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sm.color}`}>{sm.label}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pl-7 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        <div><p className="text-slate-400">Assignee</p><p className="text-slate-700 font-medium">{ticket.assignee}</p></div>
                        <div><p className="text-slate-400">Created</p><p className="text-slate-700 font-medium">{ticket.created}</p></div>
                        <div><p className="text-slate-400">Priority</p><p className="text-slate-700 font-medium capitalize">{ticket.priority}</p></div>
                      </div>
                      <div className="flex gap-2 flex-wrap pt-1">
                        <span className="text-xs text-slate-500 self-center">Change status:</span>
                        {['open', 'in_progress', 'resolved'].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(ticket.id, s)}
                            disabled={ticket.status === s}
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium capitalize transition-colors ${ticket.status === s ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-default' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                          >
                            {s === 'in_progress' ? 'In Progress' : s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuperAdminSupport() {
  const navigate = useNavigate();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);

  if (isChecking) return <SuperAdminLoadingState />;
  if (!currentUser) return null;

  return (
    <SuperAdminShell activeItem="support" currentUser={currentUser}>
      <SuperAdminPageHeader
        title="Support Tools"
        subtitle="Manage and resolve issues reported by schools"
      />
      <TicketManagement />
    </SuperAdminShell>
  );
}