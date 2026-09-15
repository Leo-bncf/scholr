import React from 'react';
import { Group } from '@/components/app/AppShell';
import StatCard from '@/components/app/StatCard';

/**
 * The four headline figures above a built report.
 *
 * Four separate bordered cards on a page already made of groups — the same
 * information presented in two containment styles a scroll apart.
 */
export default function ReportingSummaryCards({ cards = [] }) {
  if (cards.length === 0) return null;
  return (
    <Group>
      <div className="scholr-grid app-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} hint={card.helper} />
        ))}
      </div>
    </Group>
  );
}
