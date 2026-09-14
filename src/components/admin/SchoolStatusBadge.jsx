import React from 'react';
import StatusChip from '@/components/app/StatusChip';
import { getBillingStatusMeta, getSchoolStatusMeta } from '@/components/admin/super-admin/superAdminConfig';

/**
 * A school's two states side by side: where it is in its lifecycle, and
 * whether it is paying.
 *
 * Both used to be shadcn Badges carrying a Tailwind class string from the
 * config. They now go through StatusChip, so they draw from the same reserved
 * good/warn/crit palette as every other state in the product instead of
 * inventing their own.
 */
export default function SchoolStatusBadge({ status, billingStatus }) {
  const statusMeta = getSchoolStatusMeta(status);
  const billingMeta = getBillingStatusMeta(billingStatus);

  return (
    <div className="flex items-center gap-2">
      <StatusChip tone={statusMeta.tone}>{statusMeta.label}</StatusChip>
      {billingStatus && <StatusChip tone={billingMeta.tone}>{billingMeta.label}</StatusChip>}
    </div>
  );
}
