import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Trash2, AlertTriangle, CheckCircle2, Loader2, Database, Layers3, ShieldCheck } from 'lucide-react';

const demoHighlights = [
  '1 academic year + 2 terms',
  '6 IB subjects',
  '3 classes with teachers',
  'Sample assignments & grades',
];

const removalItems = [
  'Academic years and terms',
  'Subjects and classes',
  'Memberships and assignments',
  'Grades and attendance records',
];

function DemoActionCard({
  icon,
  title,
  badge,
  badgeClassName,
  description,
  items,
  action,
  actionVariant = 'default',
  actionClassName,
  confirm,
  onConfirm,
  onCancel,
  loading,
  disabled,
}) {
  const Icon = icon;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
          <Icon className="h-7 w-7 text-slate-700" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xl font-bold text-slate-900">{title}</h4>
            <Badge className={badgeClassName}>{badge}</Badge>
          </div>
          <p className="text-sm leading-7 text-slate-600">{description}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-50 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-slate-700 border border-slate-200">
              <Layers3 className="h-4 w-4 shrink-0 text-slate-400" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {!confirm ? (
          <Button variant={actionVariant} className={actionClassName} onClick={action} disabled={disabled || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            {loading ? 'Please wait…' : title}
          </Button>
        ) : (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-4">
            <p className="text-sm font-semibold text-red-700">This will remove demo-tagged records only. Continue?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>Cancel</Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={onConfirm} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {loading ? 'Removing…' : 'Yes, remove demo data'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DemoDataControls({ schoolId, onRefresh }) {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    setResult(null);
    try {
      const response = await base44.functions.invoke('seedSchoolDemoData', { schoolId });
      setResult({
        type: 'success',
        message: `Demo data seeded: ${response.data.stats?.subjects ?? 0} subjects, ${response.data.stats?.classes ?? 0} classes, ${response.data.stats?.memberships ?? 0} memberships created.`,
      });
      onRefresh?.();
    } catch (err) {
      setResult({ type: 'error', message: err?.response?.data?.error || 'Failed to seed demo data.' });
    } finally {
      setSeeding(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setResult(null);
    try {
      const response = await base44.functions.invoke('clearSchoolDemoData', { schoolId });
      setResult({ type: 'success', message: `Demo data cleared: ${response.data.deleted ?? 0} records removed.` });
      setConfirmClear(false);
      onRefresh?.();
    } catch (err) {
      setResult({ type: 'error', message: err?.response?.data?.error || 'Failed to clear demo data.' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100">
            <ShieldCheck className="h-7 w-7 text-emerald-700" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900">Demo and sample data</h3>
              <Badge className="bg-emerald-100 text-emerald-700 border-0">Safe sandbox</Badge>
            </div>
            <p className="text-sm leading-7 text-slate-600">
              Use this area to quickly load realistic school records for testing, onboarding, and walkthroughs. All generated items are tagged as demo data so they can be removed cleanly later.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <DemoActionCard
          icon={Database}
          title="Generate Demo Data"
          badge="Safe to run"
          badgeClassName="bg-indigo-100 text-indigo-700 border-0"
          description="Creates a realistic set of sample academic years, terms, subjects, classes, memberships, and assignments for training or demonstration purposes."
          items={demoHighlights}
          action={handleSeed}
          loading={seeding}
          disabled={clearing}
          actionClassName="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white"
        />

        <DemoActionCard
          icon={Trash2}
          title="Remove Demo Data"
          badge="Irreversible"
          badgeClassName="bg-red-100 text-red-700 border-0"
          description="Permanently removes all records tagged as demo data from this school. Only demo-tagged records are deleted and your real data stays untouched."
          items={removalItems}
          action={() => setConfirmClear(true)}
          actionVariant="outline"
          actionClassName="w-full h-12 border-red-200 text-red-700 hover:bg-red-50"
          confirm={confirmClear}
          onConfirm={handleClear}
          onCancel={() => setConfirmClear(false)}
          loading={clearing}
          disabled={seeding}
        />
      </div>

      {result && (
        <Alert className={result.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
          {result.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={result.type === 'success' ? 'text-emerald-800' : 'text-red-800'}>
            {result.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}