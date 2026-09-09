import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Eye, EyeOff, Clock, Calendar, Users } from 'lucide-react';

const RELEASE_MODES = [
  { value: 'immediate', label: 'Immediate', desc: 'Grades visible as soon as published by teacher', icon: Eye },
  { value: 'teacher_controlled', label: 'Teacher Controlled', desc: 'Each teacher decides visibility per grade item', icon: Users },
  { value: 'scheduled', label: 'Scheduled Release', desc: 'All grades become visible on a set date/time', icon: Calendar },
  { value: 'coordinator_release', label: 'Coordinator Release', desc: 'IB Coordinator manually releases grades to students/parents', icon: Clock },
];

export default function VisibilityRulesPanel({ form, onChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Grade Release Mode</h3>
        <p className="text-xs text-slate-500 mb-4">Controls when published grades become visible to students and parents.</p>
        <div className="grid grid-cols-1 gap-2">
          {RELEASE_MODES.map(opt => {
            const Icon = opt.icon;
            const active = form.grade_release_mode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ grade_release_mode: opt.value })}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <p className={`text-sm font-semibold ${active ? 'text-indigo-900' : 'text-slate-800'}`}>{opt.label}</p>
                  <p className="text-xs text-slate-500">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {form.grade_release_mode === 'scheduled' && (
          <div className="mt-3">
            <Label className="text-xs font-semibold">Scheduled Release Date & Time</Label>
            <Input
              type="datetime-local"
              value={form.scheduled_release_date?.slice(0, 16) || ''}
              onChange={e => onChange({ scheduled_release_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
              className="mt-1"
            />
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Default Visibility for New Grade Items</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Visible to students by default</p>
            <p className="text-xs text-slate-500">Pre-checked when teachers create a new grade item</p>
          </div>
          <Switch checked={form.default_visible_to_student} onCheckedChange={v => onChange({ default_visible_to_student: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Visible to parents by default</p>
            <p className="text-xs text-slate-500">Pre-checked when teachers create a new grade item</p>
          </div>
          <Switch checked={form.default_visible_to_parent} onCheckedChange={v => onChange({ default_visible_to_parent: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Allow teachers to override visibility</p>
            <p className="text-xs text-slate-500">If off, teachers cannot change visibility — school defaults apply</p>
          </div>
          <Switch checked={form.allow_teacher_visibility_override} onCheckedChange={v => onChange({ allow_teacher_visibility_override: v })} />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <EyeOff className="w-4 h-4 text-amber-500" /> Feedback-Only Mode
            </p>
            <p className="text-xs text-slate-500">Students and parents see written feedback but scores are hidden</p>
          </div>
          <Switch checked={form.feedback_only_mode} onCheckedChange={v => onChange({ feedback_only_mode: v })} />
        </div>
        {form.feedback_only_mode && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">⚠ In feedback-only mode, numeric scores and IB grades will be hidden from students and parents even if individual grade items are marked visible.</p>
          </div>
        )}
      </div>
    </div>
  );
}