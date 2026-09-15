import Notice from '@/components/app/Notice';
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
        <h3 className="text-sm font-bold scholr-ink mb-1">Grade Release Mode</h3>
        <p className="text-xs scholr-muted mb-4">Controls when published grades become visible to students and parents.</p>
        <div className="grid grid-cols-1 gap-2">
          {RELEASE_MODES.map(opt => {
            const Icon = opt.icon;
            const active = form.grade_release_mode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ grade_release_mode: opt.value })}
                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-colors ${active ? 'scholr-accent-rule scholr-accent-sf' : 'scholr-rule hover:scholr-rule bg-white'}`}
              >
                <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${active ? 'scholr-accent' : 'scholr-faint'}`} />
                <div>
                  <p className={`text-sm font-semibold ${active ? 'scholr-accent' : 'scholr-ink'}`}>{opt.label}</p>
                  <p className="text-xs scholr-muted">{opt.desc}</p>
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

      <div className="border-t scholr-rule-soft pt-5 space-y-4">
        <h3 className="text-sm font-bold scholr-ink">Default Visibility for New Grade Items</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold scholr-ink">Visible to students by default</p>
            <p className="text-xs scholr-muted">Pre-checked when teachers create a new grade item</p>
          </div>
          <Switch checked={form.default_visible_to_student} onCheckedChange={v => onChange({ default_visible_to_student: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold scholr-ink">Visible to parents by default</p>
            <p className="text-xs scholr-muted">Pre-checked when teachers create a new grade item</p>
          </div>
          <Switch checked={form.default_visible_to_parent} onCheckedChange={v => onChange({ default_visible_to_parent: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold scholr-ink">Allow teachers to override visibility</p>
            <p className="text-xs scholr-muted">If off, teachers cannot change visibility — school defaults apply</p>
          </div>
          <Switch checked={form.allow_teacher_visibility_override} onCheckedChange={v => onChange({ allow_teacher_visibility_override: v })} />
        </div>
      </div>

      <div className="border-t scholr-rule-soft pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold scholr-ink flex items-center gap-1.5">
              <EyeOff className="w-4 h-4" /> Feedback-Only Mode
            </p>
            <p className="text-xs scholr-muted">Students and parents see written feedback but scores are hidden</p>
          </div>
          <Switch checked={form.feedback_only_mode} onCheckedChange={v => onChange({ feedback_only_mode: v })} />
        </div>
        {form.feedback_only_mode && (
          <Notice tone="warn">
            In feedback-only mode, numeric scores and IB grades will be hidden from students and parents even if individual grade items are marked visible.
          </Notice>
        )}
      </div>
    </div>
  );
}