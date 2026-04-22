import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, GraduationCap, Users, BookOpen, Zap, CreditCard } from 'lucide-react';
import { PLAN_LIMITS, PLAN_NAMES, PLAN_DESCRIPTIONS, calcAnnualCost } from './PlanConfig';

const PLANS = [
  {
    key: 'starter',
    color: 'border-slate-200',
    highlight: false,
  },
  {
    key: 'growth',
    color: 'border-indigo-300',
    highlight: true,
  },
  {
    key: 'enterprise',
    color: 'border-slate-200',
    highlight: false,
  },
];

const PLAN_MIN_STUDENTS = { starter: 1, growth: 201, enterprise: 601 };
const PLAN_MAX_STUDENTS = { starter: 200, growth: 600, enterprise: 2000 };

export default function StudentPricingUpgrade({ schoolId, currentPlan, currentStudents }) {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan || 'growth');
  const [studentCount, setStudentCount] = useState(() => {
    if (currentStudents > 0) return currentStudents;
    if (currentPlan === 'growth') return 300;
    if (currentPlan === 'enterprise') return 700;
    return 100;
  });
  const [loading, setLoading] = useState(false);

  const limits = PLAN_LIMITS[selectedPlan];
  const annualTotal = calcAnnualCost(selectedPlan, studentCount);
  const monthlyEstimate = Math.round(annualTotal / 12);

  const handleCheckout = async () => {
    if (window.self !== window.top) {
      alert('Checkout is only available from the published app, not the preview.');
      return;
    }
    setLoading(true);
    try {
      const response = await base44.functions.invoke('createCheckoutSession', {
        schoolId,
        plan: selectedPlan,
        studentCount,
      });
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      setLoading(false);
    }
  };

  const clampStudentCount = (plan, val) => {
    const min = PLAN_MIN_STUDENTS[plan];
    const max = PLAN_MAX_STUDENTS[plan];
    return Math.min(Math.max(val, min), max);
  };

  const handlePlanSelect = (planKey) => {
    setSelectedPlan(planKey);
    setStudentCount(prev => clampStudentCount(planKey, prev));
  };

  return (
    <div className="space-y-6">
      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map(({ key, color, highlight, badge }) => {
          const l = PLAN_LIMITS[key];
          const isSelected = selectedPlan === key;
          return (
            <button
              key={key}
              onClick={() => handlePlanSelect(key)}
              className={`text-left p-5 rounded-xl border-2 transition-all ${
                isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : `${color} bg-white hover:border-indigo-200 hover:shadow-sm`
              }`}
            >
              {badge && (
                <div className="flex justify-end mb-2">
                  <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs">{badge}</Badge>
                </div>
              )}
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{PLAN_NAMES[key]}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-black text-slate-900">€{l.price_per_student}</span>
                <span className="text-slate-400 text-sm">/student/yr</span>
              </div>
              <p className="text-xs text-slate-500">{PLAN_DESCRIPTIONS[key]}</p>

              <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{l.max_students === -1 ? 'Unlimited students' : `Up to ${l.max_students} students`}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Unlimited teachers & staff</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Unlimited classes</span>
                </div>
                {l.features.advanced_analytics && (
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Advanced analytics + parent portal</span>
                  </div>
                )}
              </div>

              {isSelected && (
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                  <CheckCircle2 className="w-4 h-4" /> Selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Student count configurator */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <p className="text-sm font-semibold text-slate-700 mb-4">How many students does your school have?</p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStudentCount(v => clampStudentCount(selectedPlan, v - 10))}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold text-lg leading-none"
            >−</button>
            <input
              type="number"
              min={PLAN_MIN_STUDENTS[selectedPlan]}
              max={PLAN_MAX_STUDENTS[selectedPlan]}
              value={studentCount}
              onChange={e => setStudentCount(clampStudentCount(selectedPlan, parseInt(e.target.value) || PLAN_MIN_STUDENTS[selectedPlan]))}
              className="w-24 text-center text-xl font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={() => setStudentCount(v => clampStudentCount(selectedPlan, v + 10))}
              className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold text-lg leading-none"
            >+</button>
            <span className="text-slate-500 text-sm">students</span>
          </div>

          {/* Quick-select buttons */}
          <div className="flex gap-2 flex-wrap">
            {selectedPlan === 'starter' && [50, 100, 150, 200].map(n => (
              <button key={n} onClick={() => setStudentCount(n)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${studentCount === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                {n}
              </button>
            ))}
            {selectedPlan === 'growth' && [250, 300, 400, 500, 600].map(n => (
              <button key={n} onClick={() => setStudentCount(n)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${studentCount === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                {n}
              </button>
            ))}
            {selectedPlan === 'enterprise' && [700, 800, 1000, 1500, 2000].map(n => (
              <button key={n} onClick={() => setStudentCount(n)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${studentCount === n ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing summary */}
        <div className="mt-5 flex items-end gap-6 flex-wrap">
          <div>
            <p className="text-xs text-slate-400">Annual total</p>
            <p className="text-3xl font-black text-slate-900">€{annualTotal.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-0.5">≈ €{monthlyEstimate.toLocaleString()}/month</p>
          </div>
          <div className="pb-1 text-sm text-slate-500">
            {studentCount} students × €{PLAN_LIMITS[selectedPlan].price_per_student}/student/yr
          </div>
          <div className="ml-auto">
            <Button
              onClick={handleCheckout}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 gap-2 px-6"
              size="lg"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              Subscribe — €{annualTotal.toLocaleString()}/yr
            </Button>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        14-day free trial included. Annual billing. Cancel anytime via Stripe portal. Prices in EUR, excl. VAT.
      </p>
    </div>
  );
}