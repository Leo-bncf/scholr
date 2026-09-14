import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download } from 'lucide-react';
import SuperAdminLoadingState from '@/components/admin/super-admin/SuperAdminLoadingState';
import SuperAdminShell from '@/components/admin/super-admin/SuperAdminShell';
import { Group, GroupEmpty, Segmented } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';
import StatRow from '@/components/app/StatRow';
import StatusChip from '@/components/app/StatusChip';
import Meter from '@/components/app/Meter';
import DataTable from '@/components/app/DataTable';
import { SelectField } from '@/components/app/Field';
import { useSuperAdminAccess } from '@/components/hooks/useSuperAdminAccess';
import { useSuperAdminAnalyticsQuery } from '@/components/hooks/useSuperAdminData';
import {
  getPlanPrice,
  getBillingStatusMeta,
  isPaidSchool,
  isAtRiskSchool,
} from '@/components/admin/super-admin/superAdminConfig';

const RANGE_OPTIONS = [
  { value: 90, label: '90 days' },
  { value: 180, label: '6 months' },
  { value: 365, label: '12 months' },
];

const REPORT_OPTIONS = [
  { value: 'schools', label: 'Schools' },
  { value: 'billing', label: 'Billing' },
  { value: 'adoption', label: 'Feature adoption' },
  { value: 'growth', label: 'Growth trends' },
];


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
        name: getBillingStatusMeta(status).label,
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

  const money = (n) => `€${Math.round(n).toLocaleString('en-IE')}`;

  // Recharts draws into SVG, and SVG resolves CSS custom properties in fill
  // and stroke — so the series follow the theme with no JS and no re-render.
  const axis = { stroke: 'var(--chart-axis)', fontSize: 11, tickLine: false, axisLine: false };
  const tooltip = {
    contentStyle: {
      background: 'var(--surface)',
      border: '1px solid var(--rule)',
      borderRadius: 'var(--radius-control)',
      fontSize: '.8rem',
      color: 'var(--ink)',
      boxShadow: 'var(--lift-md)',
    },
    labelStyle: { color: 'var(--muted)' },
    cursor: { fill: 'color-mix(in oklab, var(--ink) 5%, transparent)' },
  };

  const billingTotal = analytics.billingMix.reduce((sum, item) => sum + item.value, 0);

  return (
    <SuperAdminShell
      activeItem="analytics"
      currentUser={currentUser}
      title="Analytics"
      eyebrow="How the platform is moving"
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <Segmented
            label="Time range"
            value={rangeDays}
            onChange={(v) => setRangeDays(Number(v))}
            options={RANGE_OPTIONS}
          />
          <button
            type="button"
            className="pub-btn pub-btn-line scholr-focus"
            onClick={() => downloadCsv(`scholr-${reportType}-report.csv`, reportRows)}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      }
    >
      <StatRow>
        <StatCard label="Schools added" value={analytics.rangedSchools.length} hint={`in the last ${rangeDays} days`} />
        <StatCard label="People added" value={analytics.rangedMemberships.length} hint="new memberships" />
        <StatCard label="Activity" value={analytics.rangedAuditLogs.length} hint="audited events" />
        <StatCard
          label="Est. MRR"
          value={money(schools.filter((s) => s.billing_status === 'active').reduce((sum, s) => sum + getPlanPrice(s.plan), 0))}
          hint="from list prices, not Stripe"
        />
      </StatRow>

      <Group title="Growth" action={<span className="scholr-label">new schools and people per month</span>}>
        <div style={{ height: '17rem', padding: 'var(--space-md) .6rem var(--space-sm) 0' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.schoolGrowthSeries} barGap={2}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="month" {...axis} />
              <YAxis allowDecimals={false} width={32} {...axis} />
              <Tooltip {...tooltip} />
              <Legend wrapperStyle={{ fontSize: '.78rem', color: 'var(--muted)' }} />
              <Bar name="Schools" dataKey="newSchools" fill="var(--series-1)" radius={[3, 3, 0, 0]} />
              <Bar name="People" dataKey="newUsers" fill="var(--series-2)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Group>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <Group title="Feature adoption" action={<span className="scholr-label">schools using each area</span>}>
          {analytics.featureAdoption.length === 0 ? (
            <GroupEmpty>Nothing has been used yet.</GroupEmpty>
          ) : (
            <div style={{ height: '17rem', padding: 'var(--space-md) .9rem var(--space-sm) 0' }}>
              <ResponsiveContainer width="100%" height="100%">
                {/* One series, so no legend — the group title names it. */}
                <BarChart data={analytics.featureAdoption} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} {...axis} />
                  <YAxis type="category" dataKey="feature" width={110} {...axis} />
                  <Tooltip {...tooltip} />
                  <Bar dataKey="schools" fill="var(--series-1)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Group>

        {/* Billing state is a status, so it keeps the reserved palette and is
            read as parts of one whole. A pie would have made five slices of a
            handful of schools harder to compare, not easier. */}
        <Group title="Billing mix" action={<span className="scholr-label">{billingTotal} schools</span>}>
          {analytics.billingMix.length === 0 ? (
            <GroupEmpty>No school has a billing state yet.</GroupEmpty>
          ) : (
            <div className="px-4 py-3.5 flex flex-col gap-2.5">
              {analytics.billingMix.map((item) => (
                <div key={item.name}>
                  <div className="flex items-center gap-2">
                    <StatusChip tone={item.tone}>{item.name}</StatusChip>
                    <span
                      className="ml-auto text-sm scholr-num"
                      style={{ fontFamily: 'var(--font-mono)', color: 'var(--body)' }}
                    >
                      {item.value}
                    </span>
                  </div>
                  <div className="mt-1">
                    <Meter value={billingTotal ? (item.value / billingTotal) * 100 : 0} height={4} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Group>
      </div>

      {/* Two charts, not one with two y-axes. The old version plotted schools
          and euros against a left and a right scale, which lets you draw any
          crossing you like by choosing the ranges — it says nothing true. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        <Group
          title="Schools, if the last three months repeat"
          action={<span className="scholr-label">not a forecast</span>}
        >
          <div style={{ height: '13rem', padding: 'var(--space-md) .6rem var(--space-sm) 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.forecastSeries}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" {...axis} />
                <YAxis allowDecimals={false} width={32} {...axis} />
                <Tooltip {...tooltip} />
                <Line
                  type="monotone"
                  dataKey="projectedSchools"
                  name="Schools"
                  stroke="var(--series-1)"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: 'var(--series-1)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Group>

        <Group
          title="Run rate, on the same assumption"
          action={<span className="scholr-label">list prices</span>}
        >
          <div style={{ height: '13rem', padding: 'var(--space-md) .6rem var(--space-sm) 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.forecastSeries}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" {...axis} />
                <YAxis width={48} tickFormatter={(v) => money(v)} {...axis} />
                <Tooltip {...tooltip} formatter={(v) => money(v)} />
                <Line
                  type="monotone"
                  dataKey="projectedMRR"
                  name="MRR"
                  stroke="var(--series-3)"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 0, fill: 'var(--series-3)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Group>
      </div>

      <Group
        title="Export"
        action={
          <span style={{ minWidth: '11rem' }}>
            <SelectField
              value={reportType}
              onChange={setReportType}
              label="Report"
              options={REPORT_OPTIONS}
            />
          </span>
        }
      >
        {reportPreview.length === 0 ? (
          <GroupEmpty>That report has no rows yet.</GroupEmpty>
        ) : (
          <>
            <DataTable
              columns={Object.keys(reportPreview[0]).map((key) => ({
                key,
                header: key.replaceAll('_', ' '),
                render: (row) => String(row[key] ?? '—'),
              }))}
              rows={reportPreview}
              rowKey={(_, i) => i}
              empty="No rows."
            />
            <div style={{ padding: '.6rem .9rem', fontSize: '.78rem', color: 'var(--muted)' }}>
              Showing {reportPreview.length} of {reportRows.length}. Export CSV takes all of them.
            </div>
          </>
        )}
      </Group>
    </SuperAdminShell>
  );
}
