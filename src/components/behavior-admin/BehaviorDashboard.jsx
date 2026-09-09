import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Loader2, Search, AlertTriangle, Smile, FileText, AlertCircle, Eye, EyeOff, Clock, CheckCircle2 } from 'lucide-react';
import { format, subDays } from 'date-fns';
import * as behaviorRecordsData from '@/data/behaviorRecords';
import * as classesData from '@/data/classes';
import * as behaviorPoliciesData from '@/data/behaviorPolicies';

const TYPE_META = {
  positive: { label: 'Positive', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: Smile },
  concern:  { label: 'Concern',  bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   icon: AlertTriangle },
  incident: { label: 'Incident', bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     icon: AlertCircle },
  note:     { label: 'Note',     bg: 'bg-slate-50',   text: 'text-slate-700',   border: 'border-slate-200',   icon: FileText },
};

const SEV_META = {
  low:      { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  medium:   { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  high:     { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
  critical: { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200' },
};

function StatCard({ label, value, accent, icon: Icon }) {
  const a = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    red:     'bg-red-50 border-red-200 text-red-900',
    amber:   'bg-amber-50 border-amber-200 text-amber-900',
    violet:  'bg-violet-50 border-violet-200 text-violet-900',
    slate:   'bg-slate-50 border-slate-200 text-slate-900',
  };
  return (
    <div className={`rounded-xl border p-5 ${a[accent] || a.slate}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium opacity-70">{label}</p>
        {Icon && <Icon className="w-4 h-4 opacity-50" />}
      </div>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}

export default function BehaviorDashboard({ schoolId, isPastoral = false }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expandedId, setExpandedId] = useState(null);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['behavior-admin', schoolId],
    queryFn: () => behaviorRecordsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: classes = [] } = useQuery({
    queryKey: ['classes-behavior', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
    enabled: !!schoolId,
  });

  const { data: policy = {} } = useQuery({
    queryKey: ['behavior-policy', schoolId],
    queryFn: async () => {
      const p = await behaviorPoliciesData.where({ school_id: schoolId });
      return p[0] || {};
    },
    enabled: !!schoolId,
  });

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (!isPastoral && r.staff_only) return false;
      if (r.date < dateFrom || r.date > dateTo) return false;
      if (filterType !== 'all' && r.type !== filterType) return false;
      if (filterSeverity !== 'all' && r.severity !== filterSeverity) return false;
      if (filterCategory !== 'all' && r.category !== filterCategory) return false;
      if (filterClass !== 'all' && r.class_id !== filterClass) return false;
      if (search && !r.student_name?.toLowerCase().includes(search.toLowerCase()) && !r.title?.toLowerCase().includes(search.toLowerCase()) && !r.recorded_by_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [records, dateFrom, dateTo, filterType, filterSeverity, filterCategory, filterClass, search, isPastoral]);

  const counts = filtered.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {});
  const pendingFollowUp = filtered.filter(r => r.follow_up_required && !r.follow_up_completed).length;
  const pendingPastoral = filtered.filter(r => !r.pastoral_reviewed && (r.severity === 'high' || r.severity === 'critical')).length;
  const categories = [...new Set(records.map(r => r.category).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Incidents" value={counts.incident || 0} accent="red" icon={AlertCircle} />
        <StatCard label="Concerns" value={counts.concern || 0} accent="amber" icon={AlertTriangle} />
        <StatCard label="Positive Records" value={counts.positive || 0} accent="emerald" icon={Smile} />
        {isPastoral ? (
          <StatCard label="Pending Pastoral Review" value={pendingPastoral} accent={pendingPastoral > 0 ? 'violet' : 'slate'} icon={AlertTriangle} />
        ) : (
          <StatCard label="Pending Follow-up" value={pendingFollowUp} accent={pendingFollowUp > 0 ? 'amber' : 'slate'} icon={Clock} />
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-44">
          <label className="text-xs font-semibold text-slate-600 block mb-1">Search</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Student, title, staff…" className="pl-9 h-9 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Type</label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="all">All Types</option>
            <option value="positive">Positive</option>
            <option value="concern">Concern</option>
            <option value="incident">Incident</option>
            <option value="note">Note</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Severity</label>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="all">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Category</label>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-1">Class</label>
          <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white">
            <option value="all">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Records list */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" />
            <p className="text-sm">No behavior records match the selected filters.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Title / Category</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Severity</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Visibility</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Recorded By</th>
                {isPastoral && <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Reviewed</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(record => {
                const tm = TYPE_META[record.type] || TYPE_META.note;
                const sm = record.severity ? (SEV_META[record.severity] || SEV_META.low) : null;
                const expanded = expandedId === record.id;
                const TypeIcon = tm.icon;
                return (
                  <React.Fragment key={record.id}>
                    <tr
                      className={`hover:bg-slate-50 cursor-pointer ${record.staff_only ? 'bg-rose-50/30' : ''}`}
                      onClick={() => setExpandedId(expanded ? null : record.id)}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{record.student_name}</td>
                      <td className="px-4 py-3 text-slate-500">{record.date}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 truncate max-w-xs">{record.title}</p>
                        {record.category && <p className="text-xs text-slate-400 capitalize mt-0.5">{record.category.replace(/_/g,' ')}</p>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tm.bg} ${tm.text} ${tm.border}`}>
                          <TypeIcon className="w-3 h-3" />{tm.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {sm ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${sm.bg} ${sm.text} ${sm.border}`}>{record.severity}</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.staff_only ? (
                          <span className="inline-flex items-center gap-1 text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full"><EyeOff className="w-3 h-3" /> Staff only</span>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`text-xs ${record.visible_to_student ? 'text-blue-600' : 'text-slate-300'}`} title="Student"><Eye className="w-3.5 h-3.5" /></span>
                            <span className={`text-xs ${record.visible_to_parent ? 'text-emerald-600' : 'text-slate-300'}`} title="Parent"><Eye className="w-3.5 h-3.5" /></span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{record.recorded_by_name}</td>
                      {isPastoral && (
                        <td className="px-4 py-3 text-center">
                          {record.pastoral_reviewed
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            : (record.severity === 'high' || record.severity === 'critical')
                              ? <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" />
                              : <span className="text-slate-300 text-xs">—</span>
                          }
                        </td>
                      )}
                    </tr>
                    {expanded && (
                      <tr>
                        <td colSpan={isPastoral ? 8 : 7} className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {record.description && (
                              <div className="col-span-2">
                                <p className="text-xs font-bold text-slate-500 mb-1 uppercase">Description</p>
                                <p className="text-slate-700">{record.description}</p>
                              </div>
                            )}
                            {record.action_taken && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 mb-1 uppercase">Action Taken</p>
                                <p className="text-slate-700">{record.action_taken}</p>
                              </div>
                            )}
                            {record.follow_up_required && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 mb-1 uppercase">Follow-up</p>
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${record.follow_up_completed ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                  {record.follow_up_completed ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  {record.follow_up_completed ? 'Completed' : 'Pending'}
                                </span>
                                {record.follow_up_note && <p className="text-xs text-slate-600 mt-1">{record.follow_up_note}</p>}
                              </div>
                            )}
                            {record.pastoral_reviewed && (
                              <div>
                                <p className="text-xs font-bold text-slate-500 mb-1 uppercase">Pastoral Review</p>
                                <p className="text-xs text-slate-600">Reviewed by {record.pastoral_reviewed_by} on {record.pastoral_reviewed_at ? format(new Date(record.pastoral_reviewed_at), 'dd MMM yyyy') : ''}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-slate-400 text-right">{filtered.length} records shown</p>
    </div>
  );
}