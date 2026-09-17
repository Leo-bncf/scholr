import React from 'react';
import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { createPageUrl } from '@/utils';

/**
 * System health.
 *
 * This previously fabricated latency, error-rate, active-user and uptime
 * figures from Math.random() and labelled API Gateway and File Storage
 * "Operational" without measuring them. A screen that invents numbers is worse
 * than one that admits it has none, and the real metrics already live on the
 * dedicated Health page (read live from Postgres through platform_health()).
 * So this panel now points there and claims nothing of its own.
 */
export default function SystemHealthPanel() {
  return (
    <div className="rounded-lg border scholr-rule scholr-sunk p-4">
      <p className="text-xs font-semibold scholr-body mb-2 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Live metrics live on the Health page
      </p>
      <p className="text-sm scholr-body" style={{ color: 'var(--muted)' }}>
        Uptime, connection-pool pressure, cache hit ratio and tenancy are read
        live from Postgres on{' '}
        <Link
          to={createPageUrl('SuperAdminHealth')}
          className="scholr-focus"
          style={{ color: 'var(--brand)', textDecoration: 'none' }}
        >
          the dedicated Health page
        </Link>
        . Anything this console does not measure — request latency, error
        rate, file storage, backups — is listed there as not measured rather
        than guessed.
      </p>
    </div>
  );
}