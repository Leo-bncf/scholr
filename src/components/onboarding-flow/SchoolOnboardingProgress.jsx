import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';

export default function SchoolOnboardingProgress({ steps, currentStep }) {
  const progress = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Setup progress</h2>
          <p className="text-xs text-slate-500">Step {currentStep + 1} of {steps.length}</p>
        </div>
        <span className="text-sm font-bold text-emerald-700">{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="space-y-2">
        {steps.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          return (
            <div key={step.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${active ? 'bg-emerald-50 border border-emerald-200' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? 'bg-emerald-600 text-white' : active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{index + 1}</span>}
              </div>
              <span className={`text-sm ${active ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}