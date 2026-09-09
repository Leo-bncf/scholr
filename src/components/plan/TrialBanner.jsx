import React, { useState } from 'react';
import { usePlan } from './PlanProvider';
import { useUser } from '@/components/auth/UserContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CreditCard, X } from 'lucide-react';
import * as fns from '@/data/functions';

export default function TrialBanner() {
  const plan = usePlan();
  const { schoolId, role } = useUser();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!plan.isTrial || dismissed) return null;

  const isExpiringSoon = plan.daysLeftInTrial !== null && plan.daysLeftInTrial <= 7;
  const isAdmin = ['school_admin', 'super_admin', 'admin'].includes(role);

  const handleSubscribe = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const response = await fns.invoke('createCheckoutSession', {
        schoolId,
        plan: plan.plan,
      });
      window.location.href = response.url;
    } catch (error) {
      console.error('Subscription error:', error);
      setLoading(false);
    }
  };

  return (
    <Alert
      className={`relative border-l-4 ${
        isExpiringSoon
          ? 'bg-amber-50 border-amber-400'
          : 'bg-blue-50 border-blue-400'
      }`}
    >
      <div className="flex items-start gap-3">
        {isExpiringSoon ? (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        ) : (
          <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertDescription
            className={isExpiringSoon ? 'text-amber-900' : 'text-blue-900'}
          >
            <strong>
              {isExpiringSoon
                ? `Trial expires in ${plan.daysLeftInTrial} day${plan.daysLeftInTrial === 1 ? '' : 's'}!`
                : `You're on a free trial`}
            </strong>
            {' '}
            {plan.trialEndsAt && (
              <span>
                (ends {plan.trialEndsAt.toLocaleDateString()})
              </span>
            )}
            {isAdmin ? (
              <span> Subscribe now to continue using all features after your trial ends.</span>
            ) : (
              <span> Contact your school administrator to subscribe.</span>
            )}
          </AlertDescription>
          {isAdmin && (
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              size="sm"
              className="mt-3 bg-indigo-600 hover:bg-indigo-700"
            >
              <CreditCard className="w-3.5 h-3.5 mr-2" />
              Subscribe Now
            </Button>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </Alert>
  );
}