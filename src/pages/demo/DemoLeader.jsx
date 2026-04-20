import React, { useState, useMemo } from 'react';
import DemoShell from '@/components/demo-sandbox/DemoShell';
import AppStyleCard from '@/components/demo-sandbox/AppStyleCard';
import LeaderFilters from '@/components/demo-sandbox/leader/LeaderFilters';
import SubjectPerformanceOverview from '@/components/demo-sandbox/leader/SubjectPerformanceOverview';
import AtRiskStudentsList from '@/components/demo-sandbox/leader/AtRiskStudentsList';
import TrendChangesPanel from '@/components/demo-sandbox/leader/TrendChangesPanel';
import {
  LEADER, SCHOOL_METRICS, getAtRiskStudents, getSubjectPerformance, getSubject,
} from '@/components/demo-sandbox/mockSchoolData';
import {
  BarChart3, AlertTriangle, TrendingDown, Users, GraduationCap,
  Telescope, Target,
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, sub }) {
  const colors = {
    indigo:  'bg-indigo-50 text-indigo-600',
    amber:   'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose:    'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 md:p-5">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-md flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-xl md:text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
          {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function DemoLeader() {
  const [filters, setFilters] = useState({ yearGroup: 'All', subjectId: 'All' });

  const atRisk = useMemo(() => getAtRiskStudents(filters), [filters]);
  const subjectPerf = useMemo(() => getSubjectPerformance(filters), [filters]);
  const decliningCount = subjectPerf.filter((s) => s.trend === 'down').length;

  const filterLabel = useMemo(() => {
    const y = filters.yearGroup === 'All' ? 'All year groups' : filters.yearGroup;
    const s = filters.subjectId === 'All' ? 'all subjects' : getSubject(filters.subjectId)?.name;
    return `${y} · ${s}`;
  }, [filters]);

  return (
    <DemoShell roleKey="leader">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">School performance overview</h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          {LEADER.title} · {LEADER.name}
        </p>
      </div>

      {/* Diagnostic hero — the core leader question */}
      <div data-tour="leader-hero" className="mb-6 rounded-md border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-4 md:p-5 flex items-center gap-4 shadow-sm">
        <div className="h-11 w-11 rounded-md bg-white/10 text-white flex items-center justify-center flex-shrink-0">
          <Telescope className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-300">Where are problems emerging?</p>
          <p className="text-sm md:text-base font-semibold text-white truncate">
            {decliningCount} subjects declining · {atRisk.length} students flagged · {filterLabel}
          </p>
        </div>
      </div>

      <div data-tour="leader-filters">
        <LeaderFilters
          yearGroup={filters.yearGroup}
          subjectId={filters.subjectId}
          onChange={setFilters}
        />
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Students" value={SCHOOL_METRICS.totalStudents} icon={GraduationCap} color="indigo" />
        <StatCard label="Avg predicted" value={SCHOOL_METRICS.avgPredictedGrade} icon={BarChart3} color="emerald" sub="IB 1–7 scale" />
        <StatCard label="Subjects declining" value={decliningCount} icon={TrendingDown} color="rose" sub="term-over-term" />
        <StatCard label="At-risk students" value={atRisk.length} icon={AlertTriangle} color="amber" sub="across flags" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div data-tour="leader-subjects">
            <AppStyleCard
              title="Subject performance overview"
              icon={BarChart3}
              action={<span className="text-xs font-medium text-slate-500">Sorted by current average</span>}
            >
              <SubjectPerformanceOverview yearGroup={filters.yearGroup} subjectId={filters.subjectId} />
            </AppStyleCard>
          </div>

          <AppStyleCard
            title="Trend changes over time"
            icon={Target}
            action={<span className="text-xs font-medium text-slate-500">Last 4 terms</span>}
          >
            <TrendChangesPanel yearGroup={filters.yearGroup} subjectId={filters.subjectId} />
          </AppStyleCard>
        </div>

        <div className="space-y-6">
          <div data-tour="leader-atrisk">
            <AppStyleCard
              title="At-risk students"
              icon={AlertTriangle}
              action={<span className="text-xs font-medium text-slate-500">{atRisk.length} flagged</span>}
            >
              <AtRiskStudentsList yearGroup={filters.yearGroup} subjectId={filters.subjectId} />
            </AppStyleCard>
          </div>

          <AppStyleCard title="School at a glance" icon={Users}>
            <div className="p-4 md:p-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Teachers</p>
                <p className="text-lg font-bold text-slate-900">{SCHOOL_METRICS.totalTeachers}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Active classes</p>
                <p className="text-lg font-bold text-slate-900">{SCHOOL_METRICS.activeClasses}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Attendance</p>
                <p className="text-lg font-bold text-emerald-600">{SCHOOL_METRICS.attendanceRate}%</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Open tickets</p>
                <p className="text-lg font-bold text-slate-900">{SCHOOL_METRICS.openSupportTickets}</p>
              </div>
            </div>
          </AppStyleCard>
        </div>
      </div>
    </DemoShell>
  );
}