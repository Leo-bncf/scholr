import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Save, Tag, Shield, AlertTriangle } from 'lucide-react';
import * as behaviorPoliciesData from '@/data/behaviorPolicies';

const COLOR_OPTIONS = [
  { value: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  { value: 'blue',    bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300',    dot: 'bg-blue-500' },
  { value: 'amber',   bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300',   dot: 'bg-amber-500' },
  { value: 'red',     bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-300',     dot: 'bg-red-500' },
  { value: 'violet',  bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-300',  dot: 'bg-violet-500' },
  { value: 'rose',    bg: 'bg-rose-100',    text: 'text-rose-800',    border: 'border-rose-300',    dot: 'bg-rose-500' },
  { value: 'slate',   bg: 'bg-slate-100',   text: 'text-slate-800',   border: 'border-slate-300',   dot: 'bg-slate-500' },
];

const DEFAULT_TYPES = [
  { id: 't1', key: 'commendation',    label: 'Commendation',      color: 'emerald', default_visible_to_student: true,  default_visible_to_parent: true,  staff_only: false, requires_action: false, active: true },
  { id: 't2', key: 'warning',         label: 'Verbal Warning',    color: 'amber',   default_visible_to_student: false, default_visible_to_parent: false, staff_only: false, requires_action: false, active: true },
  { id: 't3', key: 'detention',       label: 'Detention',         color: 'red',     default_visible_to_student: true,  default_visible_to_parent: true,  staff_only: false, requires_action: true,  active: true },
  { id: 't4', key: 'academic_concern',label: 'Academic Concern',  color: 'violet',  default_visible_to_student: false, default_visible_to_parent: false, staff_only: false, requires_action: true,  active: true },
  { id: 't5', key: 'pastoral_note',   label: 'Pastoral Note',     color: 'slate',   default_visible_to_student: false, default_visible_to_parent: false, staff_only: true,  requires_action: false, active: true },
  { id: 't6', key: 'safeguarding',    label: 'Safeguarding',      color: 'rose',    default_visible_to_student: false, default_visible_to_parent: false, staff_only: true,  requires_action: true,  active: true },
];

const DEFAULT_SEVERITIES = [
  { id: 's1', key: 'low',      label: 'Low',      color: 'blue',   requires_pastoral_review: false, notify_admin: false, active: true },
  { id: 's2', key: 'medium',   label: 'Medium',   color: 'amber',  requires_pastoral_review: false, notify_admin: false, active: true },
  { id: 's3', key: 'high',     label: 'High',     color: 'red',    requires_pastoral_review: true,  notify_admin: false, active: true },
  { id: 's4', key: 'critical', label: 'Critical', color: 'rose',   requires_pastoral_review: true,  notify_admin: true,  active: true },
];

function genId() { return Math.random().toString(36).slice(2, 9); }

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex gap-1 flex-wrap">
      {COLOR_OPTIONS.map(c => (
        <button key={c.value} onClick={() => onChange(c.value)}
          className={`w-5 h-5 rounded-full border-2 ${c.dot} ${value === c.value ? 'border-slate-700 scale-110' : 'border-transparent'} transition-all`}
          title={c.value} />
      ))}
    </div>
  );
}

export default function BehaviorPolicyConfig({ schoolId }) {
  const queryClient = useQueryClient();
  const [types, setTypes] = useState(null);
  const [severities, setSeverities] = useState(null);
  const [allowTeacherOverride, setAllowTeacherOverride] = useState(true);
  const [followUpTracking, setFollowUpTracking] = useState(true);

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['behavior-policy', schoolId],
    queryFn: () => behaviorPoliciesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });
  const policy = policies[0] || null;

  useEffect(() => {
    if (policy) {
      setTypes(policy.incident_types?.length ? policy.incident_types : DEFAULT_TYPES);
      setSeverities(policy.severity_levels?.length ? policy.severity_levels : DEFAULT_SEVERITIES);
      setAllowTeacherOverride(policy.allow_teacher_visibility_override ?? true);
      setFollowUpTracking(policy.follow_up_tracking_enabled ?? true);
    } else if (!isLoading) {
      setTypes(DEFAULT_TYPES);
      setSeverities(DEFAULT_SEVERITIES);
    }
  }, [policy, isLoading]);

  const saveMutation = useMutation({
    mutationFn: (data) => policy
      ? behaviorPoliciesData.update(policy.id, data)
      : behaviorPoliciesData.create({ school_id: schoolId, ...data }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['behavior-policy', schoolId] }),
  });

  const handleSave = () => saveMutation.mutate({
    incident_types: types,
    severity_levels: severities,
    allow_teacher_visibility_override: allowTeacherOverride,
    follow_up_tracking_enabled: followUpTracking,
  });

  const updateType = (id, field, val) => setTypes(types.map(t => t.id === id ? { ...t, [field]: val } : t));
  const removeType = (id) => setTypes(types.filter(t => t.id !== id));
  const addType = () => setTypes([...types, { id: genId(), key: '', label: '', color: 'slate', default_visible_to_student: false, default_visible_to_parent: false, staff_only: false, requires_action: false, active: true }]);

  const updateSev = (id, field, val) => setSeverities(severities.map(s => s.id === id ? { ...s, [field]: val } : s));
  const removeSev = (id) => setSeverities(severities.filter(s => s.id !== id));
  const addSev = () => setSeverities([...severities, { id: genId(), key: '', label: '', color: 'slate', requires_pastoral_review: false, notify_admin: false, active: true }]);

  if (isLoading || types === null) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-8">
      {/* Incident Types */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900">Incident Types</h3>
              <p className="text-xs text-slate-500 mt-0.5">Define the behavior categories staff can record. Each type carries default visibility rules.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={addType}><Plus className="w-4 h-4 mr-1" /> Add Type</Button>
        </div>

        <div className="space-y-3">
          {types.map(t => {
            const cm = COLOR_OPTIONS.find(c => c.value === t.color) || COLOR_OPTIONS[6];
            return (
              <div key={t.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Key</p>
                    <Input value={t.key} onChange={e => updateType(t.id, 'key', e.target.value)} placeholder="e.g. warning" className="h-8 text-sm" />
                  </div>
                  <div className="col-span-3">
                    <p className="text-xs text-slate-500 mb-1">Label</p>
                    <Input value={t.label} onChange={e => updateType(t.id, 'label', e.target.value)} placeholder="Display label" className="h-8 text-sm" />
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-1">Colour</p>
                    <ColorPicker value={t.color} onChange={v => updateType(t.id, 'color', v)} />
                  </div>
                  <div className="col-span-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Switch checked={t.default_visible_to_student} onCheckedChange={v => updateType(t.id, 'default_visible_to_student', v)} className="scale-75" />
                      <span className="text-xs text-slate-600">Visible to student (default)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={t.default_visible_to_parent} onCheckedChange={v => updateType(t.id, 'default_visible_to_parent', v)} className="scale-75" />
                      <span className="text-xs text-slate-600">Visible to parent (default)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={t.staff_only} onCheckedChange={v => updateType(t.id, 'staff_only', v)} className="scale-75" />
                      <span className="text-xs text-slate-600 font-medium text-rose-700">🔒 Staff only (locked)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={t.requires_action} onCheckedChange={v => updateType(t.id, 'requires_action', v)} className="scale-75" />
                      <span className="text-xs text-slate-600">Requires action taken</span>
                    </div>
                  </div>
                  <div className="col-span-1 flex flex-col items-end gap-2">
                    <Badge className={`${cm.bg} ${cm.text} border ${cm.border} text-xs`}>{t.label || 'Preview'}</Badge>
                    <Switch checked={t.active} onCheckedChange={v => updateType(t.id, 'active', v)} className="scale-75" />
                    <button onClick={() => removeType(t.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                {t.staff_only && (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded px-3 py-1.5 text-xs text-rose-700">
                    <Shield className="w-3 h-3" /> This type is staff-only. Student and parent visibility cannot be enabled for records of this type.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Severity Levels */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-slate-900">Severity Levels</h3>
              <p className="text-xs text-slate-500 mt-0.5">Define severity tiers and map them to pastoral review and admin notification requirements.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={addSev}><Plus className="w-4 h-4 mr-1" /> Add Level</Button>
        </div>
        <div className="space-y-3">
          {severities.map(s => {
            const cm = COLOR_OPTIONS.find(c => c.value === s.color) || COLOR_OPTIONS[6];
            return (
              <div key={s.id} className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Key</p>
                  <Input value={s.key} onChange={e => updateSev(s.id, 'key', e.target.value)} placeholder="e.g. high" className="h-8 text-sm" />
                </div>
                <div className="col-span-3">
                  <p className="text-xs text-slate-500 mb-1">Label</p>
                  <Input value={s.label} onChange={e => updateSev(s.id, 'label', e.target.value)} placeholder="Display label" className="h-8 text-sm" />
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-500 mb-1">Colour</p>
                  <ColorPicker value={s.color} onChange={v => updateSev(s.id, 'color', v)} />
                </div>
                <div className="col-span-4 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Switch checked={s.requires_pastoral_review} onCheckedChange={v => updateSev(s.id, 'requires_pastoral_review', v)} className="scale-75" />
                    <span className="text-xs text-slate-600">Requires pastoral review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={s.notify_admin} onCheckedChange={v => updateSev(s.id, 'notify_admin', v)} className="scale-75" />
                    <span className="text-xs text-slate-600">Notify admin</span>
                  </div>
                </div>
                <div className="col-span-1 flex flex-col items-end gap-2">
                  <Badge className={`${cm.bg} ${cm.text} border ${cm.border} text-xs`}>{s.label || 'Preview'}</Badge>
                  <Switch checked={s.active} onCheckedChange={v => updateSev(s.id, 'active', v)} className="scale-75" />
                  <button onClick={() => removeSev(s.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Policy Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Global Policy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Switch checked={allowTeacherOverride} onCheckedChange={setAllowTeacherOverride} />
            <div>
              <p className="text-sm font-medium text-slate-900">Allow teachers to override visibility defaults</p>
              <p className="text-xs text-slate-500 mt-0.5">If off, teachers cannot change the visibility settings defined per incident type. Admins and pastoral staff can always override.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Switch checked={followUpTracking} onCheckedChange={setFollowUpTracking} />
            <div>
              <p className="text-sm font-medium text-slate-900">Enable follow-up tracking</p>
              <p className="text-xs text-slate-500 mt-0.5">Track whether required follow-ups have been completed. Surfaced in the pastoral oversight view.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Policy
        </Button>
      </div>
      {saveMutation.isSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center text-sm text-emerald-800 font-medium">
          Behavior policy saved successfully.
        </div>
      )}
    </div>
  );
}