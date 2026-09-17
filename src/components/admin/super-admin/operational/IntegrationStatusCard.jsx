import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

/**
 * External integrations, with adjectives that are true.
 *
 * This previously labelled Google Workspace and Stripe "Connected" outright.
 * Neither is: the Drive/Docs functions are not deployed to this server, and
 * Stripe has no billing credentials set (billing endpoints return 503). The
 * only thing worth reading from storage is whether each surface is switched
 * on in platform_config — so status is derived here from that, and the
 * capability gap is stated rather than papered over.
 */
const integrations = [
  {
    name: 'Google Workspace',
    description: 'Drive, Docs, Slides integration for student submissions and teacher materials.',
    icon: '🔵',
    derive: (integrationSettings) => {
      if (!integrationSettings?.google_drive_enabled) {
        return { status: 'disabled', reason: 'Turned off in platform configuration.' };
      }
      return {
        status: 'unavailable',
        reason: 'The Drive/Docs edge functions are not deployed on this server yet, so nothing can connect.',
      };
    },
  },
  {
    name: 'Stripe Billing',
    description: 'Subscription management, invoicing, and payment processing for schools.',
    icon: '💳',
    derive: (integrationSettings) => {
      if (!integrationSettings?.stripe_billing_enabled) {
        return { status: 'disabled', reason: 'Turned off in platform configuration.' };
      }
      return {
        status: 'unconfigured',
        reason: 'No billing credentials are set on this server — billing endpoints return 503.',
      };
    },
  },
];

const statusConfig = {
  disabled: { label: 'Disabled', color: 'bg-slate-100 text-slate-700', Icon: XCircle, iconColor: 'text-slate-500' },
  unavailable: { label: 'Not available', color: 'bg-yellow-100 text-yellow-700', Icon: AlertCircle, iconColor: 'text-yellow-500' },
  unconfigured: { label: 'Not configured', color: 'bg-red-100 text-red-700', Icon: XCircle, iconColor: 'text-red-500' },
};

export default function IntegrationStatusCard({ integrationSettings }) {
  return (
    <div className="space-y-4">
      {integrations.map((integration) => {
        const { status, reason } = integration.derive(integrationSettings);
        const cfg = statusConfig[status];
        const { Icon } = cfg;
        return (
          <div key={integration.name} className="flex items-start gap-4 p-4 rounded-lg border scholr-rule scholr-sunk">
            <div className="text-2xl mt-0.5">{integration.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold scholr-ink">{integration.name}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                  <cfg.Icon className={`w-3 h-3 ${cfg.iconColor}`} />
                  {cfg.label}
                </span>
              </div>
              <p className="text-xs scholr-muted mt-0.5">{integration.description}</p>
              <p className="text-xs scholr-muted mt-1" style={{ color: 'var(--faint)' }}>{reason}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}