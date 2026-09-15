import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Group } from '@/components/app/AppShell';

/**
 * One measure across a handful of categories.
 *
 * The grid was #e2e8f0 and the bars #147056 — two fixed light-mode hex codes,
 * so in dark mode the grid was a bright line and the bar was the one thing
 * that happened to still work. Recharts resolves CSS custom properties in
 * stroke and fill, so the theme carries them with no JS.
 */
export default function ReportingChartPanel({ title, data = [], dataKey = 'value', labelKey = 'label' }) {
  return (
    <Group title={title}>
      <div style={{ padding: '.9rem .9rem .6rem' }}>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
            <XAxis dataKey={labelKey} tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--chart-axis)' }} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'var(--chart-grid)' }} />
            <Bar dataKey={dataKey} fill="var(--brand)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Group>
  );
}
