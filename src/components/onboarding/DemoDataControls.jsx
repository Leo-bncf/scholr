import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles, Trash2, AlertTriangle, CheckCircle2,
  Loader2, FlaskConical, Info
} from 'lucide-react';

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
      setResult({ type: 'success', message: `Demo data seeded: ${response.data.stats?.subjects ?? 0} subjects, ${response.data.stats?.classes ?? 0} classes, ${response.data.stats?.memberships ?? 0} memberships created.` });
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
    setConfirmClear(false);
    try {
      const response = await base44.functions.invoke('clearSchoolDemoData', { schoolId });
      setResult({ type: 'success', message: `Demo data cleared: ${response.data.deleted ?? 0} records removed.` });
      onRefresh?.();
    } catch (err) {
      setResult({ type: 'error', message: err?.response?.data?.error || 'Failed to clear demo data.' });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-5">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-amber-900">Demo data is isolated and safe</p>
          <p className="text-sm leading-6 text-amber-800">All seeded records are tagged with <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">is_demo: true</code> and can be removed cleanly without affecting any real school data you have configured.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">
        {/* Seed card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
              <FlaskConical className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-bold text-slate-900">Generate Demo Data</p>
                <Badge className="bg-indigo-50 text-indigo-600 border-0 text-xs">Safe to run</Badge>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Creates a realistic set of sample academic years, terms, subjects, classes, memberships, and assignments for training or demonstration purposes.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-5">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500 shrink-0" /> 1 academic year + 2 terms</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500 shrink-0" /> 6 IB subjects</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500 shrink-0" /> 3 classes with teachers</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500 shrink-0" /> Sample assignments & grades</li>
            </ul>
          </div>
          <Button
            onClick={handleSeed}
            disabled={seeding || clearing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2 h-11"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {seeding ? 'Seeding…' : 'Seed Demo Data'}
          </Button>
        </div>

        {/* Clear card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-bold text-slate-900">Remove Demo Data</p>
                <Badge className="bg-red-50 text-red-600 border-0 text-xs">Irreversible</Badge>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Permanently removes all records tagged as demo data from this school. Only demo-tagged records are deleted — your real data is untouched.
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 mb-5">
            <div className="flex items-start gap-2 text-sm text-slate-600 leading-6">
              <Info className="w-4 h-4 mt-1 shrink-0 text-slate-400" />
              <span>This removes: academic years, terms, subjects, classes, memberships, assignments, grades, and attendance records marked as demo.</span>
            </div>
          </div>

          {!confirmClear ? (
            <Button
              variant="outline"
              onClick={() => setConfirmClear(true)}
              disabled={seeding || clearing}
              className="w-full border-red-200 text-red-600 hover:bg-red-50 gap-2 h-11"
            >
              <Trash2 className="w-4 h-4" /> Remove Demo Data
            </Button>
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-sm text-red-700 font-semibold">Are you sure you want to remove all demo records?</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmClear(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 gap-2"
                  onClick={handleClear}
                  disabled={clearing}
                >
                  {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {clearing ? 'Clearing…' : 'Yes, Remove'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {result && (
        <Alert className={result.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
          {result.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            : <AlertTriangle className="w-4 h-4 text-red-600" />
          }
          <AlertDescription className={result.type === 'success' ? 'text-emerald-800' : 'text-red-800'}>
            {result.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}