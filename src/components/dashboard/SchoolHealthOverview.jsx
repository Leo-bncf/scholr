import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users, UserCheck, Users2, BookOpen, MessageSquare,
  CalendarDays, AlertTriangle, CheckCircle2, TrendingUp,
  TrendingDown, Minus, Clock, ArrowRight, GraduationCap,
  BarChart3, Activity,
} from 'lucide-react';

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, accent, linkTo, trend }) {
  const accents = {
    blue:    { border: 'border-l-blue-500',   icon: 'bg-blue-500',    text: 'text-blue-600',    soft: 'bg-blue-50'    },
    emerald: { border: 'border-l-emerald-500', icon: 'bg-emerald-500', text: 'text-emerald-600', soft: 'bg-emerald-50' },
    violet:  { border: 'border-l-violet-500',  icon: 'bg-violet-500',  text: 'text-violet-600',  soft: 'bg-violet-50'  },
    amber:   { border: 'border-l-amber-500',   icon: 'bg-amber-500',   text: 'text-amber-600',   soft: 'bg-amber-50'   },
  };
  const a = accents[accent] || accents.blue;

  const inner = (
    <div className={`bg-white border border-slate-200 border-l-4 ${a.border} rounded-xl shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all group`}>
      <div className={`w-12 h-12 ${a.icon} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 truncate">{label}</p>
        <p className="text-2xl font-black text-slate-900 tabular-nums leading-tight mt-0.5">{value ?? '—'}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{sub}</p>
      </div>
      {linkTo && (
        <ArrowRight className={`w-4 h-4 ${a.text} opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0`} />
      )}
    </div>
  );

  if (linkTo) {
    return <Link to={createPageUrl(linkTo)} className="block">{inner}</Link>;
  }
  return inner;
}

// ─── Signal Row with progress bar ────────────────────────────────────────────
function SignalRow({ label, value, max = 100, color, suffix = '%', nullLabel = 'No data yet', badge }) {
  if (value === null || value === undefined) {
    return (
      <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
        <span className="text-sm text-slate-600">{label}</span>
        <span className="text-xs text-slate-400 italic">{nullLabel}</span>
      </div>
    );
  }
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-700 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {badge}
          <span className="text-sm font-black text-slate-900 tabular-nums">{value}{suffix}</span>
        </div>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Status Badge helpers ─────────────────────────────────────────────────────
function StatusBadge({ good, warnThreshold, badThreshold, value, goodLabel = 'Healthy', warnLabel = 'Moderate', badLabel = 'Critical', lowerIsBetter = false }) {
  let level;
  if (lowerIsBetter) {
    level = value <= warnThreshold ? 'good' : value <= badThreshold ? 'warn' : 'bad';
  } else {
    level = value >= warnThreshold ? 'good' : value >= badThreshold ? 'warn' : 'bad';
  }

  if (level === 'good') return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> {goodLabel}
    </span>
  );
  if (level === 'warn') return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" /> {warnLabel}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <AlertTriangle className="w-3 h-3" /> {badLabel}
    </span>
  );
}

// ─── Class Coverage Card ──────────────────────────────────────────────────────
function ClassCoverageCard({ classes }) {
  const totalClasses = classes.length;
  const classesWithTeacher = classes.filter(c => {
    const legacyOk = c.teacher_ids && c.teacher_ids.length > 0;
    const assignmentsOk = c.subject_teacher_assignments &&
      c.subject_teacher_assignments.some(a => a.teacher_ids && a.teacher_ids.length > 0);
    return legacyOk || assignmentsOk;
  }).length;
  const classesWithStudents = classes.filter(c => (c.student_ids || []).length > 0).length;
  const totalStudentEnrollments = classes.reduce((sum, c) => sum + (c.student_ids || []).length, 0);
  const avgStudentsPerClass = totalClasses > 0 ? Math.round(totalStudentEnrollments / totalClasses) : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Class Coverage</h3>
          <p className="text-xs text-slate-400">Enrollment & teacher assignment health</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-black text-slate-900">{totalClasses}</p>
          <p className="text-xs text-slate-400 mt-0.5">Active Classes</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-2xl font-black text-slate-900">{avgStudentsPerClass}</p>
          <p className="text-xs text-slate-400 mt-0.5">Avg Students / Class</p>
        </div>
      </div>

      {totalClasses > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Teacher assigned</span>
            <span className="font-bold text-slate-900">{classesWithTeacher} / {totalClasses}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full">
            <div
              className={`h-2 rounded-full transition-all ${classesWithTeacher === totalClasses ? 'bg-emerald-500' : classesWithTeacher / totalClasses >= 0.8 ? 'bg-amber-400' : 'bg-red-400'}`}
              style={{ width: `${totalClasses > 0 ? Math.min(100, (classesWithTeacher / totalClasses) * 100) : 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm mt-3">
            <span className="text-slate-600">Has enrolled students</span>
            <span className="font-bold text-slate-900">{classesWithStudents} / {totalClasses}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full">
            <div
              className={`h-2 rounded-full transition-all ${classesWithStudents === totalClasses ? 'bg-emerald-500' : 'bg-amber-400'}`}
              style={{ width: `${totalClasses > 0 ? Math.min(100, (classesWithStudents / totalClasses) * 100) : 0}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-400 text-center py-4 italic">No active classes yet</p>
      )}

      <Link
        to={createPageUrl('SchoolAdminClasses')}
        className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 transition-colors"
      >
        Manage Classes <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ─── Activity Signals Card ────────────────────────────────────────────────────
function ActivitySignalsCard({ attendanceRate, missingWorkRate, messagingVolume }) {
  const attendanceColor = attendanceRate == null ? 'bg-slate-300' : attendanceRate >= 90 ? 'bg-emerald-500' : attendanceRate >= 75 ? 'bg-amber-400' : 'bg-red-400';
  const missingColor = missingWorkRate == null ? 'bg-slate-300' : missingWorkRate <= 10 ? 'bg-emerald-500' : missingWorkRate <= 30 ? 'bg-amber-400' : 'bg-red-400';

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <Activity className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Activity Signals</h3>
          <p className="text-xs text-slate-400">Rolling 30-day window</p>
        </div>
      </div>

      <SignalRow
        label="Attendance Rate"
        value={attendanceRate}
        color={attendanceColor}
        suffix="%"
        nullLabel="No attendance records yet"
        badge={attendanceRate !== null ? (
          <StatusBadge
            value={attendanceRate}
            warnThreshold={90}
            badThreshold={75}
            goodLabel="Good"
            warnLabel="Low"
            badLabel="Critical"
          />
        ) : null}
      />

      <SignalRow
        label="Missing Work Rate"
        value={missingWorkRate}
        color={missingColor}
        suffix="%"
        nullLabel="No assignments published yet"
        badge={missingWorkRate !== null ? (
          <StatusBadge
            value={missingWorkRate}
            warnThreshold={10}
            badThreshold={30}
            lowerIsBetter
            goodLabel="Low"
            warnLabel="Moderate"
            badLabel="High"
          />
        ) : null}
      />

      <div className="flex items-center justify-between py-3 mt-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-sm font-medium text-slate-700">Messaging Volume</span>
        </div>
        <div className="text-right">
          <span className="text-sm font-black text-slate-900 tabular-nums">{messagingVolume}</span>
          <span className="text-xs text-slate-400 ml-1">messages</span>
        </div>
      </div>

      <Link
        to={createPageUrl('SchoolAdminAttendance')}
        className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 transition-colors"
      >
        View Attendance Details <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ─── Upcoming Terms Card ──────────────────────────────────────────────────────
function ReportingWindowsCard({ upcomingTerms }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
          <CalendarDays className="w-4 h-4 text-violet-600" />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Reporting Windows</h3>
          <p className="text-xs text-slate-400">Upcoming term end dates</p>
        </div>
      </div>

      {upcomingTerms.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-28 text-center">
          <CalendarDays className="w-8 h-8 text-slate-200 mb-2" />
          <p className="text-sm text-slate-400">No upcoming terms configured</p>
          <Link to={createPageUrl('SchoolOnboarding')} className="text-xs text-indigo-600 hover:underline mt-1 font-semibold">
            Set up academic calendar →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingTerms.map(term => {
            const end = new Date(term.end_date);
            const daysLeft = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
            const urgent = daysLeft <= 14;
            const soon = daysLeft <= 30;
            return (
              <div key={term.id} className={`p-3.5 rounded-xl border ${urgent ? 'bg-red-50 border-red-200' : soon ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{term.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ends {end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-xl font-black tabular-nums ${urgent ? 'text-red-600' : soon ? 'text-amber-600' : 'text-slate-600'}`}>
                      {daysLeft}
                    </div>
                    <p className="text-xs text-slate-400 -mt-0.5">days left</p>
                  </div>
                </div>
                {urgent && (
                  <div className="mt-2 flex items-center gap-1 text-xs font-bold text-red-600">
                    <AlertTriangle className="w-3 h-3" /> Reports due soon — ensure grades are published
                  </div>
                )}
                {!urgent && soon && (
                  <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-700">
                    <Clock className="w-3 h-3" /> Approaching — review grading progress
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Link
        to={createPageUrl('SchoolAdminAcademicSetup')}
        className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-800 transition-colors"
      >
        Manage Academic Calendar <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ─── Member Breakdown Card ────────────────────────────────────────────────────
function MemberBreakdownCard({ members }) {
  const total = members.total || 0;
  const items = [
    { label: 'Students', count: members.students.length, icon: GraduationCap, color: 'bg-blue-500', soft: 'bg-blue-50 text-blue-700' },
    { label: 'Teachers & Staff', count: members.teachers.length, icon: UserCheck, color: 'bg-emerald-500', soft: 'bg-emerald-50 text-emerald-700' },
    { label: 'Parents', count: members.parents.length, icon: Users2, color: 'bg-violet-500', soft: 'bg-violet-50 text-violet-700' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-slate-600" />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Member Breakdown</h3>
          <p className="text-xs text-slate-400">{total} total active members</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map(item => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          const Icon = item.icon;
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 ${item.color} rounded flex items-center justify-center`}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.soft}`}>{pct}%</span>
                  <span className="text-sm font-black text-slate-900 tabular-nums w-8 text-right">{item.count}</span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to={createPageUrl('SchoolAdminUsers')}
        className="mt-4 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
      >
        Manage Users <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function SchoolHealthOverview({ data }) {
  const { members, classes, attendanceRate, missingWorkRate, messagingVolume, upcomingTerms } = data;

  const kpis = [
    { label: 'Students',         value: members.students.length,  sub: 'Active enrollments', icon: Users,        accent: 'blue',    linkTo: 'SchoolAdminUsers' },
    { label: 'Teachers & Staff', value: members.teachers.length,  sub: 'Active accounts',    icon: UserCheck,    accent: 'emerald', linkTo: 'SchoolAdminUsers' },
    { label: 'Parents',          value: members.parents.length,   sub: 'Linked accounts',    icon: Users2,       accent: 'violet',  linkTo: 'SchoolAdminUsers' },
    { label: 'Active Classes',   value: classes.length,           sub: 'Current academic year', icon: BookOpen, accent: 'amber',   linkTo: 'SchoolAdminClasses' },
  ];

  return (
    <div className="space-y-5">
      {/* KPI row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {kpis.map(k => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Detail cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MemberBreakdownCard members={members} />
        <ActivitySignalsCard
          attendanceRate={attendanceRate}
          missingWorkRate={missingWorkRate}
          messagingVolume={messagingVolume}
        />
        <ClassCoverageCard classes={classes} />
        <ReportingWindowsCard upcomingTerms={upcomingTerms} />
      </div>
    </div>
  );
}