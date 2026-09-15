import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, AlertTriangle, CheckCircle2, Loader2, Database, Layers3, ShieldCheck } from 'lucide-react';
import * as fns from '@/data/functions';

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
    <div className="rounded-3xl border scholr-rule bg-white p-6 md:p-7 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl scholr-sunk">
          <Icon className="h-7 w-7 scholr-body" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-xl font-bold scholr-ink">{title}</h4>
            <Badge className={badgeClassName}>{badge}</Badge>
          </div>
          <p className="text-sm leading-7 scholr-muted">{description}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl scholr-sunk p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm scholr-body border scholr-rule">
              <Layers3 className="h-4 w-4 shrink-0 scholr-faint" />
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
          <div className="rounded-lg p-4 space-y-4" style={{ borderLeft: '2px solid var(--crit)', background: 'var(--crit-sf)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--crit)' }}>This will remove demo-tagged records only. Continue?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>Cancel</Button>
              <Button className="flex-1" style={{ background: 'var(--crit)', color: 'var(--surface)' }} onClick={onConfirm} disabled={loading}>
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
      const response = await fns.invoke('seedSchoolDemoData', { schoolId });
      setResult({
        type: 'success',
        message: `Demo data seeded: ${response.stats?.subjects ?? 0} subjects, ${response.stats?.classes ?? 0} classes, ${response.stats?.memberships ?? 0} memberships created.`,
      });
      onRefresh?.();
    } catch (err) {
      setResult({ type: 'error', message: err?.message || 'Failed to seed demo data.' });
    } finally {
      setSeeding(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setResult(null);
    try {
      const response = await fns.invoke('clearSchoolDemoData', { schoolId });
      setResult({ type: 'success', message: `Demo data cleared: ${response.deleted ?? 0} records removed.` });
      setConfirmClear(false);
      onRefresh?.();
    } catch (err) {
      setResult({ type: 'error', message: err?.message || 'Failed to clear demo data.' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* A three-stop gradient in a rounded-3xl card, the only one of its
          shape in the product. */}
      <div className="app-group" style={{ padding: '1.2rem 1.3rem' }}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl scholr-sunk">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold scholr-ink">Demo and sample data</h3>
              <Badge className="scholr-sunk scholr-muted border-0">Safe sandbox</Badge>
            </div>
            <p className="text-sm leading-7 scholr-muted">
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
          badgeClassName="scholr-accent-sf scholr-accent border-0"
          description="Creates a realistic set of sample academic years, terms, subjects, classes, memberships, and assignments for training or demonstration purposes."
          items={demoHighlights}
          action={handleSeed}
          loading={seeding}
          disabled={clearing}
          actionClassName="w-full h-12 pub-btn pub-btn-primary"
        />

        <DemoActionCard
          icon={Trash2}
          title="Remove Demo Data"
          badge="Irreversible"
          badgeClassName="scholr-sunk scholr-muted border-0"
          description="Permanently removes all records tagged as demo data from this school. Only demo-tagged records are deleted and your real data stays untouched."
          items={removalItems}
          action={() => setConfirmClear(true)}
          actionVariant="outline"
          actionClassName="w-full h-12 border-red-200 text-red-700"
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
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription className={result.type === 'success' ? 'text-emerald-800' : 'text-red-800'}>
            {result.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}