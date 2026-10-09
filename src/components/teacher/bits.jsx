import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import StatusChip from '@/components/app/StatusChip';

/** The two or three facts that tell a teacher a class needs them. */
export function ClassSignals({ row }) {
  const chips = [];
  if (row.teachesToday && !row.registerTaken) chips.push(<StatusChip key="reg" tone="warn">Register</StatusChip>);
  if (row.toMark) chips.push(<StatusChip key="mark" tone="info">{row.toMark} to mark</StatusChip>);
  if (row.missing) chips.push(<StatusChip key="miss" tone="mute">{row.missing} missing</StatusChip>);
  if (chips.length === 0) return <StatusChip tone="mute">Up to date</StatusChip>;
  return <>{chips}</>;
}

export function GroupLink({ to, children }) {
  return (
    <Link
      to={to}
      className="scholr-focus"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '.25rem', fontSize: '.8rem', color: 'var(--brand)', textDecoration: 'none' }}
    >
      {children}
      <ArrowRight className="w-3.5 h-3.5" />
    </Link>
  );
}

/** The loading state for a whole page section. */
export function PageLoading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl) 0' }} role="status" aria-label="Loading">
      <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--brand)' }} />
    </div>
  );
}
