import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { UserX, RefreshCw, CreditCard,
  ArrowRight, CheckCircle2, ShieldAlert, ChevronDown, ChevronUp,
  GraduationCap, BookOpen, Clock, TrendingDown, Info,
} from 'lucide-react';

function buildAlerts(data) {
  const { studentsWithoutClasses, classesWithoutTeachers, failedSyncs, school, setupSteps, setupDone, setupTotal, members, missingWorkRate, attendanceRate } = data;
  const alerts = [];

  if (classesWithoutTeachers.length > 0) {
    alerts.push({
      id: 'no-teacher',
      severity: 'error',
      icon: BookOpen,
      title: `${classesWithoutTeachers.length} Class${classesWithoutTeachers.length > 1 ? 'es' : ''} Without a Teacher`,
      desc: 'Students in these classes have no assigned teacher — attendance, grading, and assignments are blocked.',
      detail: classesWithoutTeachers.slice(0, 8).map(c => c.name).join(', ') + (classesWithoutTeachers.length > 8 ? ` +${classesWithoutTeachers.length - 8} more` : ''),
      action: 'Assign Teachers',
      link: 'SchoolAdminEnrollments',
    });
  }

  if (studentsWithoutClasses.length > 0) {
    alerts.push({
      id: 'no-enroll',
      severity: 'warning',
      icon: UserX,
      title: `${studentsWithoutClasses.length} Student${studentsWithoutClasses.length > 1 ? 's' : ''} Not Enrolled`,
      desc: 'These students cannot access assignments, attendance, or grades until they are enrolled in at least one class.',
      detail: studentsWithoutClasses.slice(0, 8).map(s => s.user_name || s.user_email).join(', ') + (studentsWithoutClasses.length > 8 ? ` +${studentsWithoutClasses.length - 8} more` : ''),
      action: 'Manage Enrollments',
      link: 'SchoolAdminEnrollments',
    });
  }

  if (attendanceRate !== null && attendanceRate < 75) {
    alerts.push({
      id: 'attendance-low',
      severity: 'error',
      icon: TrendingDown,
      title: `Attendance Rate Critical — ${attendanceRate}%`,
      desc: 'School-wide attendance has dropped below 75% in the last 30 days. Immediate review recommended.',
      detail: null,
      action: 'View Attendance',
      link: 'SchoolAdminAttendance',
    });
  } else if (attendanceRate !== null && attendanceRate < 90) {
    alerts.push({
      id: 'attendance-warn',
      severity: 'warning',
      icon: Clock,
      title: `Attendance Rate Below Target — ${attendanceRate}%`,
      desc: 'School-wide attendance is between 75–90% over the last 30 days. Consider reviewing chronic absentees.',
      detail: null,
      action: 'View Attendance',
      link: 'SchoolAdminAttendance',
    });
  }

  if (missingWorkRate !== null && missingWorkRate > 30) {
    alerts.push({
      id: 'missing-work',
      severity: 'warning',
      icon: GraduationCap,
      title: `High Missing Work Rate — ${missingWorkRate}%`,
      desc: 'More than 30% of expected submissions are outstanding. Follow up with students and teachers.',
      detail: null,
      action: 'View Classes',
      link: 'SchoolAdminClasses',
    });
  }

  if (failedSyncs && failedSyncs.length > 0) {
    alerts.push({
      id: 'sync-error',
      severity: 'error',
      icon: RefreshCw,
      title: `Timetable Sync Error${failedSyncs.length > 1 ? 's' : ''} Detected`,
      desc: `${failedSyncs.length} timetable sync${failedSyncs.length > 1 ? 's' : ''} failed. Schedule data may be outdated.`,
      detail: null,
      action: 'View Timetable',
      link: 'SchoolAdminTimetable',
    });
  }

  if (school?.billing_status === 'past_due') {
    alerts.push({
      id: 'billing',
      severity: 'error',
      icon: CreditCard,
      title: 'Subscription Payment Past Due',
      desc: 'Your payment is overdue. Update your payment method now to avoid service interruption.',
      detail: null,
      action: 'Manage Billing',
      link: 'SchoolAdminBilling',
    });
  }

  if (school?.billing_status === 'unpaid' || school?.billing_status === 'incomplete') {
    alerts.push({
      id: 'billing-unpaid',
      severity: 'error',
      icon: ShieldAlert,
      title: 'Subscription Unpaid — Action Required',
      desc: 'Your subscription is currently unpaid. Platform access may be restricted immediately.',
      detail: null,
      action: 'Manage Billing',
      link: 'SchoolAdminBilling',
    });
  }



  return alerts;
}

const severityStyles = {
  error: {
    container: 'bg-red-50 border-red-200',
    leftBar: 'bg-red-500',
    icon: 'text-red-500',
    iconBg: 'bg-red-100',
    title: 'text-red-900',
    desc: 'text-red-700',
    detail: 'text-red-700 bg-red-100 border-red-200',
    action: 'bg-red-600 hover:bg-red-700 text-white',
    badge: 'bg-red-500',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200',
    leftBar: 'bg-amber-500',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-100',
    title: 'text-amber-900',
    desc: 'text-amber-700',
    detail: 'text-amber-700 bg-amber-100 border-amber-200',
    action: 'bg-amber-600 hover:bg-amber-700 text-white',
    badge: 'bg-amber-500',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    leftBar: 'bg-blue-500',
    icon: 'text-blue-500',
    iconBg: 'bg-blue-100',
    title: 'text-blue-900',
    desc: 'text-blue-700',
    detail: 'text-blue-700 bg-blue-100 border-blue-200',
    action: 'bg-blue-600 hover:bg-blue-700 text-white',
    badge: 'bg-blue-500',
  },
};

function AlertCard({ alert }) {
  const [expanded, setExpanded] = useState(false);
  const s = severityStyles[alert.severity];
  const Icon = alert.icon;

  return (
    <div className={`border rounded-xl overflow-hidden shadow-sm ${s.container}`}>
      <div className="flex gap-0">
        {/* Left color bar */}
        <div className={`w-1 flex-shrink-0 ${s.leftBar}`} />
        <div className="flex items-start gap-3 p-4 flex-1">
          {/* Icon */}
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${s.iconBg}`}>
            <Icon className={`w-4 h-4 ${s.icon}`} />
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold leading-snug ${s.title}`}>{alert.title}</p>
            <p className={`text-xs mt-1 leading-relaxed ${s.desc}`}>{alert.desc}</p>

            {alert.detail && (
              <div className="mt-2">
                <button
                  onClick={() => setExpanded(e => !e)}
                  className={`flex items-center gap-1 text-xs font-semibold ${s.icon} opacity-80 hover:opacity-100 transition-opacity`}
                >
                  {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {expanded ? 'Hide details' : 'Show affected items'}
                </button>
                {expanded && (
                  <div className={`mt-2 px-3 py-2 rounded-lg border text-xs font-medium leading-relaxed ${s.detail}`}>
                    {alert.detail}
                  </div>
                )}
              </div>
            )}
          </div>
          {/* CTA */}
          <Link
            to={createPageUrl(alert.link)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${s.action} whitespace-nowrap shadow-sm mt-0.5`}
          >
            {alert.action}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OperationalAlerts({ data }) {
  const alerts = buildAlerts(data);
  const errorCount = alerts.filter(a => a.severity === 'error').length;
  const warnCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-900">All Systems Operational</p>
          <p className="text-xs text-emerald-700 mt-0.5">No issues detected. Attendance, enrollments, billing, and timetable are all healthy.</p>
        </div>
        <div className="ml-auto flex-shrink-0">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary pill bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {errorCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {errorCount} critical {errorCount === 1 ? 'issue' : 'issues'}
          </span>
        )}
        {warnCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {warnCount} {warnCount === 1 ? 'warning' : 'warnings'}
          </span>
        )}
        {infoCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
            <Info className="w-3 h-3" />
            {infoCount} {infoCount === 1 ? 'notice' : 'notices'}
          </span>
        )}
      </div>

      {/* Alert cards — errors first, then warnings, then info */}
      {['error', 'warning', 'info'].flatMap(sev =>
        alerts.filter(a => a.severity === sev).map(alert => (
          <AlertCard key={alert.id} alert={alert} />
        ))
      )}
    </div>
  );
}