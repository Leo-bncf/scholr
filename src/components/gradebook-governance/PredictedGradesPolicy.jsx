import React from 'react';
import { Switch } from '@/components/ui/switch';
import { TrendingUp, Lock, Unlock, Eye, AlertTriangle } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'teacher', label: 'Teachers', desc: 'Class teachers can enter predicted grades' },
  { value: 'ib_coordinator', label: 'IB Coordinators', desc: 'Coordinators can enter/override predicted grades' },
  { value: 'school_admin', label: 'School Admins', desc: 'Admins can always enter predicted grades' },
];

export default function PredictedGradesPolicy({ form, onChange }) {
  const toggleRole = (role) => {
    const current = form.predicted_grade_entry_roles || [];
    const next = current.includes(role) ? current.filter(r => r !== role) : [...current, role];
    onChange({ predicted_grade_entry_roles: next });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Predicted Grades Workflow</h3>
        <p className="text-xs text-slate-500 mb-4">Configure the IB predicted grade collection process as a governed, school-wide workflow.</p>
      </div>

      <div className="flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 bg-white">
        <div>
          <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-violet-600" /> Enable Predicted Grades</p>
          <p className="text-xs text-slate-500 mt-0.5">Activates the predicted grade collection feature school-wide</p>
        </div>
        <Switch checked={form.predicted_grades_enabled} onCheckedChange={v => onChange({ predicted_grades_enabled: v })} />
      </div>

      {form.predicted_grades_enabled && (
        <>
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Who Can Enter Predicted Grades</h4>
            <div className="space-y-2">
              {ROLE_OPTIONS.map(opt => {
                const enabled = (form.predicted_grade_entry_roles || []).includes(opt.value);
                return (
                  <div key={opt.value} className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${enabled ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-white'}`}>
                    <div>
                      <p className={`text-sm font-semibold ${enabled ? 'text-violet-900' : 'text-slate-700'}`}>{opt.label}</p>
                      <p className="text-xs text-slate-500">{opt.desc}</p>
                    </div>
                    <Switch checked={enabled} onCheckedChange={() => toggleRole(opt.value)} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Entry Requirements</h4>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Require written rationale</p>
                <p className="text-xs text-slate-500">Teachers must explain the basis for their predicted grade</p>
              </div>
              <Switch checked={form.predicted_grades_require_rationale} onCheckedChange={v => onChange({ predicted_grades_require_rationale: v })} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Coordinator can lock predicted grades</p>
                <p className="text-xs text-slate-500">Once locked, no further teacher entries or edits are allowed</p>
              </div>
              <Switch checked={form.coordinator_can_lock_predicted} onCheckedChange={v => onChange({ coordinator_can_lock_predicted: v })} />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Current Collection Status</h4>

            <div className={`flex items-center justify-between p-4 rounded-xl border-2 ${form.predicted_grades_locked ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'}`}>
              <div className="flex items-center gap-3">
                {form.predicted_grades_locked ? (
                  <Lock className="w-5 h-5 text-red-600" />
                ) : (
                  <Unlock className="w-5 h-5 text-emerald-600" />
                )}
                <div>
                  <p className={`text-sm font-bold ${form.predicted_grades_locked ? 'text-red-900' : 'text-emerald-900'}`}>
                    {form.predicted_grades_locked ? 'Collection Locked' : 'Collection Open'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {form.predicted_grades_locked ? 'Teachers cannot enter or edit predicted grades' : 'Eligible roles can enter predicted grades'}
                  </p>
                </div>
              </div>
              {form.coordinator_can_lock_predicted && (
                <Switch checked={form.predicted_grades_locked} onCheckedChange={v => onChange({ predicted_grades_locked: v })} />
              )}
            </div>

            {form.predicted_grades_locked && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">Collection is currently locked. Only school admins can make changes until it is unlocked.</p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Release to Students & Parents</h4>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Release predicted grades to students</p>
                <p className="text-xs text-slate-500">Students can see their predicted IB grade in their portal</p>
              </div>
              <Switch checked={form.predicted_grades_released_to_student} onCheckedChange={v => onChange({ predicted_grades_released_to_student: v })} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Release predicted grades to parents</p>
                <p className="text-xs text-slate-500">Parents can see predicted grades in the parent portal</p>
              </div>
              <Switch checked={form.predicted_grades_released_to_parent} onCheckedChange={v => onChange({ predicted_grades_released_to_parent: v })} />
            </div>
          </div>
        </>
      )}

      {!form.predicted_grades_enabled && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
          <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Predicted grades are disabled</p>
          <p className="text-xs text-slate-400 mt-1">Enable predicted grades above to configure the workflow</p>
        </div>
      )}
    </div>
  );
}