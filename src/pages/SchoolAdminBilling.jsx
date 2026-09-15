import StatusChip from '@/components/app/StatusChip';
import React, { useState, useEffect } from 'react';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import { humanise } from '@/lib/labels';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import { usePlan } from '@/components/plan/PlanProvider';
import { CreditCard, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, ArrowUpCircle, GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TrialBanner from '@/components/plan/TrialBanner';
import BillingStatusBanner from '@/components/plan/BillingStatusBanner';
import StudentPricingUpgrade from '@/components/plan/StudentPricingUpgrade';
import { PLAN_LIMITS, getUpgradePlans } from '@/components/plan/PlanConfig';
import { annualCost as costForSeats, effectiveRate, formatMoney, formatRate } from '@/lib/pricing';
import { format } from 'date-fns';
import * as schoolsData from '@/data/schools';
import * as membershipsData from '@/data/memberships';
import * as fns from '@/data/functions';

const TABS = [
  { value: 'status', label: 'Subscription' },
  { value: 'students', label: 'Student slots' },
  { value: 'upgrade', label: 'Change seats' },
];
/* A paid-up subscription is the ordinary case and needs no green pill. Only
   the three states that cost the school something carry colour. */
const BILLING_STATUS_CONFIG = {
  trial:      { label: 'Free trial', tone: null },
  active:     { label: 'Active',     tone: null },
  past_due:   { label: 'Past due',   tone: 'warn' },
  canceled:   { label: 'Cancelled',  tone: 'mute' },
  unpaid:     { label: 'Suspended',  tone: 'crit' },
  incomplete: { label: 'Incomplete', tone: 'warn' },
};

function StatusPill({ status }) {
  const cfg = BILLING_STATUS_CONFIG[status] || { label: status, tone: null };
  return cfg.tone
    ? <StatusChip tone={cfg.tone}>{cfg.label}</StatusChip>
    : <span style={{ fontSize: '.86rem', color: 'var(--muted)' }}>{cfg.label}</span>;
}

export default function SchoolAdminBilling() {
  const { user, school, schoolId } = useUser();
  const plan = usePlan();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [billingTab, setBillingTab] = useState('status');

  const { data: schoolData, refetch } = useQuery({
    queryKey: ['school-billing', schoolId],
    queryFn: async () => {
      const schools = await schoolsData.where({ id: schoolId });
      if (!schools || schools.length === 0) throw new Error('School not found');
      return schools[0];
    },
    enabled: !!schoolId,
  });

  const { data: studentCount = 0 } = useQuery({
    queryKey: ['student-count', schoolId],
    queryFn: async () => {
      const students = await membershipsData.where({ school_id: schoolId, role: 'student', status: 'active' });
      return students.length;
    },
    enabled: !!schoolId,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      setMessage({ type: 'success', text: 'Subscription activated successfully! Your plan has been updated.' });
      refetch();
    } else if (params.get('canceled')) {
      setMessage({ type: 'info', text: 'Checkout was canceled — no changes were made.' });
    }
  }, [refetch]);

  const handleManageBilling = async () => {
    setLoading(true);
    try {
      const response = await fns.invoke('createCustomerPortalSession', { schoolId });
      const url = response?.url;
      if (!url) throw new Error('No portal URL returned');
      window.location.href = url;
    } catch {
      setMessage({ type: 'error', text: 'Failed to open billing portal. Please try again.' });
      setLoading(false);
    }
  };

  const currentPlan = schoolData?.plan || 'starter';
  const billingStatus = schoolData?.billing_status;
  const hasStripeSubscription = !!schoolData?.stripe_subscription_id;
  const upgradePlans = getUpgradePlans(currentPlan);
  const planLimits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.starter;
  const purchasedStudents = schoolData?.max_students || 0;
  // One product, priced on the roll — there is no plan to name and no flat
  // per-student rate to print. The rate a school actually pays is blended
  // across the bands, so it is derived rather than looked up.
  const annualCost = purchasedStudents > 0 ? costForSeats(purchasedStudents) : null;
  const studentPct = purchasedStudents > 0 ? Math.round((studentCount / purchasedStudents) * 100) : 0;
  const hasStudentWarning = purchasedStudents > 0 && studentPct >= 80;

  return (
    <SchoolAdminPage
      title="Billing"
      eyebrow="Your seats and what they cost"
      tabs={TABS}
      activeTab={billingTab}
      onTabChange={setBillingTab}
      related={[["SchoolAdminUsers","Users"],["SchoolAdminSettings","Settings"],["SchoolAdminSupport","Support"]]}
    >          <div className="flex-1 p-6 max-w-6xl space-y-5">
            <TrialBanner />
            <BillingStatusBanner />

            {message && (
              <Alert className={
                message.type === 'success' ? 'border-emerald-200 bg-emerald-50' :
                message.type === 'error' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
              }>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4 scholr-muted" />}
                <AlertDescription className={message.type === 'success' ? 'text-emerald-800' : message.type === 'error' ? 'text-red-800' : 'text-blue-800'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            {/* ── SUBSCRIPTION STATUS ── */}
            {billingTab === 'status' && (
              <div className="grid md:grid-cols-3 gap-5 mt-2">
                <div className="md:col-span-2 bg-white rounded-xl border scholr-rule p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs scholr-faint uppercase tracking-wide font-semibold mb-2">Your subscription</p>
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <h2 className="text-3xl font-black scholr-ink">
                          {annualCost ? formatMoney(annualCost) : '—'}
                        </h2>
                        <span className="scholr-faint text-sm">a year</span>
                      </div>
                      <p className="text-sm scholr-muted mt-1">
                        {purchasedStudents > 0
                          ? `${purchasedStudents.toLocaleString()} student seats · ${formatRate(effectiveRate(purchasedStudents))} each, blended across the bands`
                          : 'No student seats purchased yet.'}
                      </p>
                    </div>
                    {billingStatus && <StatusPill status={billingStatus} />}
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y scholr-rule-soft">
                    <div>
                      <p className="text-xs scholr-faint font-medium">Student Slots Purchased</p>
                      <p className="text-lg font-bold scholr-ink">{purchasedStudents > 0 ? purchasedStudents.toLocaleString() : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs scholr-faint font-medium">Per student</p>
                      <p className="text-lg font-bold scholr-ink">
                        {purchasedStudents > 0 ? formatRate(effectiveRate(purchasedStudents)) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs scholr-faint font-medium">Teachers / Staff</p>
                      <p className="text-lg font-bold" style={{ color: 'var(--good)' }}>Unlimited</p>
                    </div>
                    <div>
                      <p className="text-xs scholr-faint font-medium">Classes</p>
                      <p className="text-lg font-bold" style={{ color: 'var(--good)' }}>Unlimited</p>
                    </div>
                    {billingStatus === 'trial' && schoolData?.trial_end_date && (
                      <div>
                        <p className="text-xs scholr-faint font-medium">Trial Ends</p>
                        <p className="text-base font-semibold" style={{ color: 'var(--ink)' }}>{format(new Date(schoolData.trial_end_date), 'dd MMM yyyy')}</p>
                      </div>
                    )}
                    {billingStatus === 'active' && schoolData?.subscription_current_period_end && (
                      <div>
                        <p className="text-xs scholr-faint font-medium">
                          {schoolData.subscription_cancel_at_period_end ? 'Cancels On' : 'Next Renewal'}
                        </p>
                        <p className={`text-base font-semibold ${schoolData.subscription_cancel_at_period_end ? 'text-orange-600' : 'scholr-ink'}`}>
                          {format(new Date(schoolData.subscription_current_period_end), 'dd MMM yyyy')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs scholr-faint font-medium">Billing Email</p>
                      <p className="text-sm scholr-body">{schoolData?.billing_email || school?.email || '—'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    {hasStripeSubscription && (
                      <Button onClick={handleManageBilling} disabled={loading} className="scholr-accent-sf hover:scholr-accent-sf gap-1.5">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                        Manage Billing in Stripe
                      </Button>
                    )}
                    {!hasStripeSubscription && (
                      <Button onClick={() => setBillingTab('upgrade')} className="scholr-accent-sf hover:scholr-accent-sf gap-1.5">
                        <CreditCard className="w-4 h-4" /> Activate Subscription
                      </Button>
                    )}
                    {upgradePlans.length > 0 && (
                      <Button variant="outline" onClick={() => setBillingTab('upgrade')} className="gap-1.5">
                        <ArrowUpCircle className="w-4 h-4" /> Change seats
                      </Button>
                    )}
                  </div>
                </div>

                {/* Included modules sidebar */}
                <div className="bg-white rounded-xl border scholr-rule p-5">
                  <p className="text-xs font-semibold scholr-faint uppercase tracking-wide mb-3">Included Modules</p>
                  <div className="space-y-1.5">
                    {(planLimits.modules || []).map(mod => (
                      <div key={mod} className="flex items-center gap-2 text-sm scholr-body">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{humanise(mod)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STUDENT SLOTS ── */}
            {billingTab === 'students' && (
              <div className="grid md:grid-cols-2 gap-5 mt-2">
                <div className="bg-white rounded-xl border scholr-rule p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg scholr-accent-sf flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 scholr-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold scholr-ink">Student Slots</p>
                      <p className="text-xs scholr-faint">Purchased vs. enrolled students</p>
                    </div>
                  </div>

                  {purchasedStudents > 0 ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="scholr-muted">Active students</span>
                        <span className="font-semibold scholr-ink">{studentCount} / {purchasedStudents}</span>
                      </div>
                      <div className="w-full scholr-sunk rounded-full h-3">
                        {/* Three fixed hues at 95 / 80 / below. The bar is the
                            only signal here, and it now follows the theme. */}
                        <div
                          className="h-3 rounded-full transition-colors"
                          style={{
                            width: `${Math.min(studentPct, 100)}%`,
                            background: studentPct >= 95 ? 'var(--crit)' : studentPct >= 80 ? 'var(--warn)' : 'var(--brand)',
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs scholr-faint">
                        <span>{studentPct}% used</span>
                        <span>{Math.max(0, purchasedStudents - studentCount)} slots remaining</span>
                      </div>
                      {studentPct >= 80 && (
                        <Alert className="border-amber-200 bg-amber-50">
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription className="text-xs">
                            <strong>Approaching student limit.</strong> Contact your account manager or upgrade your plan to add more slots.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-sm scholr-faint">
                      No student slots purchased yet.{' '}
                      <button onClick={() => setBillingTab('upgrade')} className="scholr-accent underline font-medium">Activate subscription →</button>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border scholr-rule p-5 space-y-4">
                  <p className="text-xs font-semibold scholr-faint uppercase tracking-wide">How student billing works</p>
                  <div className="space-y-3 text-sm scholr-muted">
                    <div className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--ink)' }} />
                      <p>You purchase a set number of <strong>student slots</strong> per year — only student accounts count toward your quota.</p>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--good)' }} />
                      <p><strong>Teachers, coordinators, and admins are unlimited</strong> at no extra cost on all plans.</p>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--ink)' }} />
                      <p>You'll receive warnings at <strong>80%</strong> and <strong>95%</strong> of capacity so you can act before hitting the limit.</p>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full scholr-sunk mt-1.5 shrink-0" />
                      <p>Need more slots mid-year? Contact us or manage your subscription via Stripe to update the quantity.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── UPGRADE ── */}
            {billingTab === 'upgrade' && (
              <div className="mt-2">
                <StudentPricingUpgrade schoolId={schoolId} currentStudents={purchasedStudents} />
              </div>
            )}
          </div>
    </SchoolAdminPage>
  );
}