import React from 'react';
import { Group } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';

/**
 * The three headline coverage figures.
 *
 * Three separate bordered cards with their own shadows, sitting above a page
 * already made of groups — so the same information was presented in two
 * containment styles a scroll apart. One group, three tiles.
 */
export default function CoverageSummaryCards({ stats = [] }) {
  if (stats.length === 0) return null;
  return (
    <Group>
      <div className="scholr-grid app-cols-3">
        {stats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} hint={item.helper} />
        ))}
      </div>
    </Group>
  );
}
