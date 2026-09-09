import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Download,
  DollarSign,
  Users,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminPageHeader from '@/components/admin/super-admin/SuperAdminPageHeader';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import AnalyticsKpiCard from '@/components/admin/super-admin/AnalyticsKpiCard';
import AnalyticsChartCard from '@/components/admin/super-admin/AnalyticsChartCard';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import { useSuperAdminAnalyticsQuery } from '@/components/hooks/useSuperAdminData';
import {
  getPlanPrice,
  getBillingStatusMeta,
  isPaidSchool,
  isAtRiskSchool,
} from '@/components/admin/super-admin/superAdminConfig';

const RANGE_OPTIONS = [
  { value: 90, label: 'Last 90 days' },
  { value: 180, label: 'Last 6 months' },
  { value: 365, label: 'Last 12 months' },
];

const REPORT_OPTIONS = [
  { value: 'schools', label: 'Schools' },
  { value: 'billing', label: 'Billing' },
  { value: 'adoption', label: 'Feature Adoption' },
  { value: 'growth', label: 'Growth Trends' },
];

const CHART_COLORS = ['#4f46e5', '#0f766e', '#d97706', '#dc2626', '#7c3aed', '#2563eb'];

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date) {
  return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
}

function buildMonthBuckets(monthCount) {
  const start = startOfMonth(addMonths(new Date(), -(monthCount - 1)));
  return Array.from({ length: monthCount }, (_, index) => {
    const current = addMonths(start, index);
    return {
      key: monthKey(current),
      label: monthLabel(current),
      date: current,
    };
  });
}

function inRange(dateString, days) {
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n');
}

function downloadCsv(filename, rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default function SuperAdminAnalytics() {
  const navigate = useNavigate();
  const { currentUser, isChecking } = useSuperAdminAccess(navigate);
  const { data, isLoading } = useSuperAdminAnalyticsQuery({ enabled: !!currentUser });
  const [rangeDays, setRangeDays] = useState(180);
  const [reportType, setReportType] = useState('schools');

  const schools = data?.schools || [];
  const auditLogs = data?.auditLogs || [];
  // Only creation timestamps — the growth chart buckets these by month.
  const memberships = data?.membershipDates || [];
  // Adoption is computed in Postgres from the school_stats view.
  const featureAdoption = data?.featureAdoption || [];

  const analytics = useMemo(() => {
    const rangedSchools = schools.filter((school) => inRange(school.created_at, rangeDays));
    const rangedMemberships = memberships.filter((membership) => inRange(membership.created_at, rangeDays));
    const rangedAuditLogs = auditLogs.filter((log) => inRange(log.created_at, rangeDays));
    const monthBuckets = buildMonthBuckets(rangeDays >= 365 ? 12 : 6);

    const schoolGrowthSeries = monthBuckets.map((bucket) => {
      const newSchools = schools.filter((school) => monthKey(new Date(school.created_at)) === bucket.key).length;
      const newUsers = memberships.filter((membership) => monthKey(new Date(membership.created_at)) === bucket.key).length;
      const activityEvents = auditLogs.filter((log) => monthKey(new Date(log.created_at)) === bucket.key).length;
      return {
        month: bucket.label,
        newSchools,
        newUsers,
        activityEvents,
      };
    });


    const billingMix = ['trial', 'active', 'past_due', 'incomplete', 'canceled']
      .map((status) => ({
        name: getBillingStatusMeta(status, 'light').label,
        value: schools.filter((school) => (school.billing_status || 'trial') === status).length,
      }))
      .filter((item) => item.value > 0);

    const currentMRR = schools
      .filter((school) => school.billing_status === 'active')
      .reduce((sum, school) => sum + getPlanPrice(school.plan), 0);

    const growthValues = schoolGrowthSeries.map((row) => row.newSchools);
    const revenueSeries = monthBuckets.map((bucket) => ({
      month: bucket.label,
      mrrAdded: schools
        .filter((school) => isPaidSchool(school) && monthKey(new Date(school.created_at)) === bucket.key)
        .reduce((sum, school) => sum + getPlanPrice(school.plan), 0),
    }));
    const avgNewSchools = Math.max(0, Math.round(average(growthValues.slice(-3))));
    const avgMrrAdded = Math.max(0, Math.round(average(revenueSeries.map((row) => row.mrrAdded).slice(-3))));

    const forecastSeries = [
      { month: 'Current', projectedSchools: schools.length, projectedMRR: currentMRR, type: 'actual' },
      ...Array.from({ length: 3 }, (_, index) => ({
        month: `+${index + 1} mo`,
        projectedSchools: schools.length + avgNewSchools * (index + 1),
        projectedMRR: currentMRR + avgMrrAdded * (index + 1),
        type: 'forecast',
      })),
    ];

    const reportRows = {
      schools: schools.map((school) => ({
        school: school.name,
        plan: school.plan,
        status: school.status,
        billing_status: school.billing_status,
        city: school.city,
        country: school.country,
        created_at: school.created_at,
      })),
      billing: schools.map((school) => ({
        school: school.name,
        plan: school.plan,
        billing_status: school.billing_status,
        estimated_mrr: school.billing_status === 'active' ? getPlanPrice(school.plan) : 0,
        at_risk: isAtRiskSchool(school),
      })),
      adoption: featureAdoption.map((item) => ({
        feature: item.feature,
        adopted_schools: item.schools,
        adoption_rate_percent: item.adoptionRate,
      })),
      growth: schoolGrowthSeries.map((item) => ({
        month: item.month,
        new_schools: item.newSchools,
        new_users: item.newUsers,
        activity_events: item.activityEvents,
      })),
    };

    return {
      rangedSchools,
      rangedMemberships,
      rangedAuditLogs,
      schoolGrowthSeries,
      featureAdoption,
      billingMix,
      forecastSeries,
      reportRows,
    };
  }, [schools, memberships, auditLogs, classes, subjects, messages, attendanceRecords, behaviorRecords, casExperiences, rangeDays]);

  if (isChecking || isLoading) {
    return <SuperAdminLoadingState />;
  }

  if (!currentUser) {
    return null;
  }

  const reportRows = analytics.reportRows[reportType] || [];
  const reportPreview = reportRows.slice(0, 8);

  return (
    <SuperAdminShell activeItem="analytics" currentUser={currentUser}>
      <SuperAdminPageHeader
        title="Advanced Analytics & Reporting"
        subtitle="Deep dive dashboards, custom reports, and lightweight forecasting"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => downloadCsv(`super-admin-${reportType}-report.csv`, reportRows)}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <AnalyticsKpiCard
          title="Schools Added"
          value={analytics.rangedSchools.length}
          description={`Created in last ${rangeDays} days`}
          icon={Building2}
          iconClassName="text-indigo-500"
        />
        <AnalyticsKpiCard
          title="New Users"
          value={analytics.rangedMemberships.length}
          description={`Memberships created in last ${rangeDays} days`}
          icon={Users}
          iconClassName="text-emerald-500"
        />
        <AnalyticsKpiCard
          title="Activity Events"
          value={analytics.rangedAuditLogs.length}
          description="Audit events in selected period"
          icon={BarChart3}
          iconClassName="text-blue-500"
        />
        <AnalyticsKpiCard
          title="Current MRR"
          value={`$${schools.filter((school) => school.billing_status === 'active').reduce((sum, school) => sum + getPlanPrice(school.plan), 0).toLocaleString()}`}
          description="Estimated recurring revenue"
          icon={DollarSign}
          iconClassName="text-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <AnalyticsChartCard title="Platform Growth" subtitle="New schools, users, and activity over time">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.schoolGrowthSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="newSchools" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="newUsers" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsChartCard>

        <AnalyticsChartCard title="Feature Adoption" subtitle="How many schools are using each platform area">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.featureAdoption} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="feature" width={120} />
                <Tooltip />
                <Bar dataKey="schools" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsChartCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <AnalyticsChartCard title="Billing Mix" subtitle="Current subscription status distribution">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.billingMix} dataKey="value" nameKey="name" outerRadius={110} label>
                  {analytics.billingMix.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsChartCard>

        <AnalyticsChartCard title="Forecasting" subtitle="Simple projection of school growth and revenue run rate">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.forecastSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="projectedSchools" stroke="#4f46e5" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="projectedMRR" stroke="#d97706" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsChartCard>
      </div>

      <AnalyticsChartCard
        title="Custom Reports"
        subtitle="Choose a report type, preview it, and export the full dataset"
        actions={
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700"
          >
            {REPORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        }
      >
        {!reportPreview || reportPreview.length === 0 ? (
          <div className="text-sm text-slate-500 py-8 text-center">No report data available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  {reportPreview[0] && Object.keys(reportPreview[0]).map((key) => (
                    <th key={key} className="text-left py-2 pr-4 text-xs uppercase tracking-wide text-slate-500">{key.replaceAll('_', ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportPreview.map((row, index) => (
                  <tr key={index} className="border-b border-slate-100">
                    {row && Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex} className="py-2 pr-4 text-slate-700 whitespace-nowrap">{String(value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AnalyticsChartCard>
    </SuperAdminShell>
  );
}