import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const integrations = [
  {
    name: 'Google Workspace',
    description: 'Drive, Docs, Slides integration for student submissions and teacher materials.',
    status: 'connected',
    icon: '🔵',
  },
  {
    name: 'Stripe Billing',
    description: 'Subscription management, invoicing, and payment processing for schools.',
    status: 'connected',
    icon: '💳',
  },
];

const statusConfig = {
  connected: { label: 'Connected', color: 'bg-green-100 text-green-700', Icon: CheckCircle2, iconColor: 'text-green-500' },
  degraded: { label: 'Degraded', color: 'bg-yellow-100 text-yellow-700', Icon: AlertCircle, iconColor: 'text-yellow-500' },
  disconnected: { label: 'Disconnected', color: 'bg-red-100 text-red-700', Icon: XCircle, iconColor: 'text-red-500' },
};

export default function IntegrationStatusCard() {
  return (
    <div className="space-y-4">
      {integrations.map((integration) => {
        const cfg = statusConfig[integration.status] || statusConfig.disconnected;
        const { Icon } = cfg;
        return (
          <div key={integration.name} className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
            <div className="text-2xl mt-0.5">{integration.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-900">{integration.name}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                  <cfg.Icon className={`w-3 h-3 ${cfg.iconColor}`} />
                  {cfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{integration.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}