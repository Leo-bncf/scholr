import React, { useState } from 'react';
import { usePlan } from './PlanProvider';
import { useUser } from '@/components/auth/UserContext';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, CreditCard, ExternalLink, Loader2 } from 'lucide-react';
import * as fns from '@/data/functions';

export default function BillingStatusBanner() {
  const plan = usePlan();
  const { schoolId, role } = useUser();
  const [loading, setLoading] = useState(false);
  const isAdmin = ['school_admin', 'super_admin', 'admin'].includes(role);

  // Only show for problematic billing states (not trial — TrialBanner handles that)
  if (!plan.billingStatus || plan.isTrial || (plan.isActive && !plan.school?.subscription_cancel_at_period_end)) return null;

  const handlePortal = async () => {
    setLoading(true);
    try {
      const response = await fns.invoke('createCustomerPortalSession', { schoolId });
      window.location.href = response.url;
    } catch {
      setLoading(false);
    }
  };

  const configs = {
    past_due: {
      bg: 'bg-amber-50 border-amber-400',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      title: 'Payment past due',
      message: 'Your last payment failed. Please update your payment method to avoid service interruption.',
      textColor: 'text-amber-900',
      showPortal: true,
    },
    unpaid: {
      bg: 'bg-red-50 border-red-400',
      icon: <XCircle className="w-5 h-5 text-red-600 shrink-0" />,
      title: 'Account suspended — payment outstanding',
      message: 'Access to premium features has been suspended. Update your billing to restore full access.',
      textColor: 'text-red-900',
      showPortal: true,
    },
    canceled: {
      bg: 'bg-slate-100 border-slate-400',
      icon: <XCircle className="w-5 h-5 text-slate-500 shrink-0" />,
      title: 'Subscription canceled',
      message: 'Your subscription has ended. Re-subscribe to restore access to premium modules and features.',
      textColor: 'text-slate-800',
      showPortal: false,
    },
    incomplete: {
      bg: 'bg-amber-50 border-amber-400',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      title: 'Subscription setup incomplete',
      message: 'Your subscription setup was not completed. Please complete payment to activate your plan.',
      textColor: 'text-amber-900',
      showPortal: true,
    },
    active_cancel_scheduled: {
      bg: 'bg-orange-50 border-orange-400',
      icon: <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />,
      title: 'Subscription scheduled to cancel',
      message: plan.school?.subscription_current_period_end
        ? `Your subscription will not renew after ${new Date(plan.school.subscription_current_period_end).toLocaleDateString()}. Reactivate to keep access.`
        : 'Your subscription is set to cancel at the end of the current period.',
      textColor: 'text-orange-900',
      showPortal: true,
    },
  };

  const statusKey = plan.isActive && plan.school?.subscription_cancel_at_period_end
    ? 'active_cancel_scheduled'
    : plan.billingStatus;

  const config = configs[statusKey];
  if (!config) return null;

  return (
    <div className={`border-l-4 rounded-lg p-4 mb-5 ${config.bg}`}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <p className={`font-semibold text-sm ${config.textColor}`}>{config.title}</p>
          <p className={`text-sm mt-0.5 ${config.textColor} opacity-90`}>{config.message}</p>
          {isAdmin && (
            <div className="mt-3 flex gap-2">
              {config.showPortal && (
                <Button size="sm" onClick={handlePortal} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 gap-1.5">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  Manage Billing
                </Button>
              )}
              {statusKey === 'canceled' && (
                <Button size="sm" variant="outline" onClick={handlePortal} disabled={loading} className="gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> Re-subscribe
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}