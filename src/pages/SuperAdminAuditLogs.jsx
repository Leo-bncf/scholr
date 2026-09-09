import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Search,
  Shield,
} from 'lucide-react';
import { format } from 'date-fns';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminPageHeader from '@/components/admin/super-admin/SuperAdminPageHeader';
import SuperAdminPagination from '@/components/admin/super-admin/SuperAdminPagination';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import {
  usePaginatedItems,
  useSuperAdminAuditLogsQuery,
  useSuperAdminSchoolsQuery,
} from '@/components/hooks/useSuperAdminData';

const PAGE_SIZE = 50;

const levelColors = {
  info: 'bg-blue-900/50 text-blue-300 border-blue-800',
  warning: 'bg-amber-900/50 text-amber-300 border-amber-800',
  critical: 'bg-red-900/50 text-red-300 border-red-800',
};

const levelIcons = { info: Info, warning: AlertTriangle, critical: AlertCircle };

export default function SuperAdminAuditLogs() {
  const navigate = useNavigate();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  const [page, setPage] = useState(1);

  const { data: logs = [], isLoading } = useSuperAdminAuditLogsQuery({ enabled: !!currentUser });
  const { data: schools = [], isLoading: isLoadingSchools } = useSuperAdminSchoolsQuery({ enabled: !!currentUser });

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = !searchQuery ||
        log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
      const matchesSchool = filterSchool === 'all' || log.school_id === filterSchool;
      return matchesSearch && matchesLevel && matchesSchool;
    });
  }, [filterLevel, filterSchool, logs, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterLevel, filterSchool]);

  const { paginatedItems, totalItems, totalPages, page: safePage } = usePaginatedItems(filteredLogs, PAGE_SIZE, page);

  if (isChecking || isLoading || isLoadingSchools) {
    return <SuperAdminLoadingState />;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <SuperAdminShell activeItem="audit-logs" currentUser={currentUser}>
      <SuperAdminPageHeader
        title="Audit Logs"
        subtitle="Platform-wide activity monitoring and security audit trail"
      />

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Info', count: logs.filter((log) => log.level === 'info').length, icon: Info, color: 'text-blue-500', border: 'border-slate-200' },
          { label: 'Warnings', count: logs.filter((log) => log.level === 'warning').length, icon: AlertTriangle, color: 'text-amber-500', border: 'border-slate-200' },
          { label: 'Critical', count: logs.filter((log) => log.level === 'critical').length, icon: AlertCircle, color: 'text-red-500', border: 'border-red-200' },
        ].map(({ label, count, icon: Icon, color, border }) => (
          <div key={label} className={`bg-white border ${border} shadow-sm rounded-xl p-4 flex items-center gap-3`}>
            <Icon className={`w-5 h-5 ${color}`} />
            <div>
              <p className="text-slate-500 text-xs">{label}</p>
              <p className="text-xl font-bold text-slate-900">{count}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 mb-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, user, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1 font-medium">Level</p>
            <div className="flex gap-1">
              {['all', 'info', 'warning', 'critical'].map((level) => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                    filterLevel === level
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {level === 'all' ? 'All Levels' : level}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1 font-medium">School</p>
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Schools</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200">
          <span className="text-sm text-slate-500">
            <strong className="text-slate-900">{totalItems}</strong> matching log entries
          </span>
        </div>

        {paginatedItems.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No audit logs found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedItems.map((log) => {
              const LevelIcon = levelIcons[log.level] || Info;

              return (
                <div key={log.id} className="px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      log.level === 'critical'
                        ? 'bg-red-50 text-red-600'
                        : log.level === 'warning'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-blue-50 text-blue-600'
                    }`}>
                      <LevelIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-slate-900">{log.action?.replace(/_/g, ' ').toUpperCase()}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${levelColors[log.level] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {log.level}
                        </span>
                      </div>
                      {log.details && <p className="text-xs text-slate-600 mb-2">{log.details}</p>}
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {log.user_email && <span>By: {log.user_email}</span>}
                        {log.entity_type && <span>Entity: {log.entity_type}</span>}
                        <span>{format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <SuperAdminPagination
          page={safePage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>
    </SuperAdminShell>
  );
}