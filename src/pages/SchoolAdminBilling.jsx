import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { useUser } from '@/components/auth/UserContext';
import { usePlan } from '@/components/plan/PlanProvider';
import { CreditCard, CheckCircle2, AlertCircle, Loader2,
  ExternalLink, ArrowUpCircle, RefreshCw, GraduationCap,
} from 'lucide-react';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AdminTabNavigation from '@/components/admin/AdminTabNavigation';
import TrialBanner from '@/components/plan/TrialBanner';
import BillingStatusBanner from '@/components/plan/BillingStatusBanner';
import StudentPricingUpgrade from '@/components/plan/StudentPricingUpgrade';
import { PLAN_LIMITS, PLAN_NAMES, PLAN_DESCRIPTIONS, calcAnnualCost, getUpgradePlans } from '@/components/plan/PlanConfig';
import { format } from 'date-fns';
import * as schoolsData from '@/data/schools';
import * as membershipsData from '@/data/memberships';
import * as fns from '@/data/functions';

const BILLING_STATUS_CONFIG = {
  trial:     { label: 'Free Trial',   color: 'bg-blue-100 text-blue-700 border-blue-200',    dot: 'bg-blue-500' },
  active:    { label: 'Active',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  past_due:  { label: 'Past Due',     color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  canceled:  { label: 'Canceled',     color: 'scholr-sunk scholr-muted scholr-rule', dot: 'bg-slate-400' },
  unpaid:    { label: 'Suspended',    color: 'bg-red-100 text-red-700 border-red-200',       dot: 'bg-red-500' },
  incomplete:{ label: 'Incomplete',   color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
};

function StatusPill({ status }) {
  const cfg = BILLING_STATUS_CONFIG[status] || { label: status, color: 'scholr-sunk scholr-muted', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${cfg.color}`}>
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
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
  const annualCost = purchasedStudents > 0 ? calcAnnualCost(currentPlan, purchasedStudents) : null;
  const studentPct = purchasedStudents > 0 ? Math.round((studentCount / purchasedStudents) * 100) : 0;
  const hasStudentWarning = purchasedStudents > 0 && studentPct >= 80;

  return (
    <RoleGuard allowedRoles={['school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen scholr-sunk">
        <AppSidebar links={SCHOOL_ADMIN_SIDEBAR_LINKS} role="school_admin" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />

        <main className="app-offset min-h-screen flex flex-col">
          <AdminTabNavigation
            tabs={[
              { id: 'status', label: 'Subscription', icon: CreditCard },
              { id: 'students', label: 'Student Slots', icon: GraduationCap, badge: hasStudentWarning ? '!' : null },
              ...(upgradePlans.length > 0 ? [{ id: 'upgrade', label: 'Upgrade / Change Plan', icon: ArrowUpCircle }] : []),
            ]}
            activeTab={billingTab}
            onTabChange={setBillingTab}
            title="Billing"
            subtitle="Per student, per year"
            rightContent={
              <Button size="sm" variant="ghost" onClick={() => refetch()} className="gap-1.5 scholr-muted">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </Button>
            }
          />

          <div className="flex-1 p-6 max-w-6xl space-y-5">
            <TrialBanner />
            <BillingStatusBanner />

            {message && (
              <Alert className={
                message.type === 'success' ? 'border-emerald-200 bg-emerald-50' :
                message.type === 'error' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
              }>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 scholr-muted" />}
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
                      <p className="text-xs scholr-faint uppercase tracking-wide font-semibold mb-2">Current Plan</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-3xl font-black scholr-ink">{PLAN_NAMES[currentPlan] || currentPlan}</h2>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold scholr-accent">€{planLimits.price_per_student}</span>
                          <span className="scholr-faint text-sm">/student/yr</span>
                        </div>
                      </div>
                      <p className="text-sm scholr-muted mt-1">{PLAN_DESCRIPTIONS[currentPlan]}</p>
                    </div>
                    {billingStatus && <StatusPill status={billingStatus} />}
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y scholr-rule-soft">
                    <div>
                      <p className="text-xs scholr-faint font-medium">Student Slots Purchased</p>
                      <p className="text-lg font-bold scholr-ink">{purchasedStudents > 0 ? purchasedStudents.toLocaleString() : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs scholr-faint font-medium">Annual Cost</p>
                      <p className="text-lg font-bold scholr-ink">{annualCost ? `€${annualCost.toLocaleString()}` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs scholr-faint font-medium">Teachers / Staff</p>
                      <p className="text-lg font-bold text-emerald-600">Unlimited</p>
                    </div>
                    <div>
                      <p className="text-xs scholr-faint font-medium">Classes</p>
                      <p className="text-lg font-bold text-emerald-600">Unlimited</p>
                    </div>
                    {billingStatus === 'trial' && schoolData?.trial_end_date && (
                      <div>
                        <p className="text-xs scholr-faint font-medium">Trial Ends</p>
                        <p className="text-base font-semibold text-blue-700">{format(new Date(schoolData.trial_end_date), 'dd MMM yyyy')}</p>
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
                        <ArrowUpCircle className="w-4 h-4" /> Change Plan
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
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="capitalize">{mod.replace(/_/g, ' ')}</span>
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
                        <div
                          className={`h-3 rounded-full transition-colors ${studentPct >= 95 ? 'bg-red-500' : studentPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(studentPct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs scholr-faint">
                        <span>{studentPct}% used</span>
                        <span>{Math.max(0, purchasedStudents - studentCount)} slots remaining</span>
                      </div>
                      {studentPct >= 80 && (
                        <Alert className="border-amber-200 bg-amber-50">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <AlertDescription className="text-amber-800 text-xs">
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
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <p>You purchase a set number of <strong>student slots</strong> per year — only student accounts count toward your quota.</p>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <p><strong>Teachers, coordinators, and admins are unlimited</strong> at no extra cost on all plans.</p>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
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
                <StudentPricingUpgrade schoolId={schoolId} currentPlan={currentPlan} currentStudents={purchasedStudents} />
              </div>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}