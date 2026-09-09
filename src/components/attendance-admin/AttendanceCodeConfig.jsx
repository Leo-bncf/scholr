import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Save, Tag, BookOpen } from 'lucide-react';
import * as attendancePoliciesData from '@/data/attendancePolicies';

const COLOR_OPTIONS = [
  { value: 'emerald', label: 'Green', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  { value: 'red',     label: 'Red',   bg: 'bg-red-100',     text: 'text-red-800',     border: 'border-red-300' },
  { value: 'amber',   label: 'Amber', bg: 'bg-amber-100',   text: 'text-amber-800',   border: 'border-amber-300' },
  { value: 'blue',    label: 'Blue',  bg: 'bg-blue-100',    text: 'text-blue-800',    border: 'border-blue-300' },
  { value: 'violet',  label: 'Violet',bg: 'bg-violet-100',  text: 'text-violet-800',  border: 'border-violet-300' },
  { value: 'slate',   label: 'Grey',  bg: 'bg-slate-100',   text: 'text-slate-800',   border: 'border-slate-300' },
];

const DEFAULT_CODES = [
  { id: 'c1', key: 'present', label: 'Present', color: 'emerald', counts_as_absent: false, requires_note: false, is_default: true, active: true },
  { id: 'c2', key: 'absent',  label: 'Absent',  color: 'red',     counts_as_absent: true,  requires_note: false, is_default: false, active: true },
  { id: 'c3', key: 'late',    label: 'Late',    color: 'amber',   counts_as_absent: false, requires_note: false, is_default: false, active: true },
  { id: 'c4', key: 'excused', label: 'Excused', color: 'blue',    counts_as_absent: false, requires_note: true,  is_default: false, active: true },
];

const DEFAULT_REASONS = [
  { id: 'r1', label: 'Medical / Illness',        applies_to: ['absent','excused'], active: true },
  { id: 'r2', label: 'Family Emergency',          applies_to: ['absent','excused'], active: true },
  { id: 'r3', label: 'Approved School Activity',  applies_to: ['excused'],          active: true },
  { id: 'r4', label: 'Travel',                    applies_to: ['absent','excused'], active: true },
  { id: 'r5', label: 'Transportation Issue',       applies_to: ['late'],             active: true },
  { id: 'r6', label: 'Other',                     applies_to: ['absent','late','excused'], active: true },
];

function genId() { return Math.random().toString(36).slice(2, 9); }

export default function AttendanceCodeConfig({ schoolId }) {
  const queryClient = useQueryClient();

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['attendance-policy', schoolId],
    queryFn: () => attendancePoliciesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const policy = policies[0] || null;

  const [codes, setCodes] = useState(null);
  const [reasons, setReasons] = useState(null);
  const [requireReason, setRequireReason] = useState(false);
  const [requireCorrection, setRequireCorrection] = useState(true);
  const [chronicThreshold, setChronicThreshold] = useState(20);
  const [latenessThreshold, setLatenessThreshold] = useState(3);

  useEffect(() => {
    if (policy) {
      setCodes(policy.codes?.length ? policy.codes : DEFAULT_CODES);
      setReasons(policy.reason_categories?.length ? policy.reason_categories : DEFAULT_REASONS);
      setRequireReason(policy.require_reason_for_absence ?? false);
      setRequireCorrection(policy.require_correction_reason ?? true);
      setChronicThreshold(policy.chronic_absence_threshold_percent ?? 20);
      setLatenessThreshold(policy.frequent_lateness_threshold ?? 3);
    } else if (!isLoading) {
      setCodes(DEFAULT_CODES);
      setReasons(DEFAULT_REASONS);
    }
  }, [policy, isLoading]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (policy) {
        return attendancePoliciesData.update(policy.id, data);
      }
      return attendancePoliciesData.create({ school_id: schoolId, ...data });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['attendance-policy', schoolId] }),
  });

  const handleSave = () => {
    saveMutation.mutate({
      codes,
      reason_categories: reasons,
      require_reason_for_absence: requireReason,
      require_correction_reason: requireCorrection,
      chronic_absence_threshold_percent: chronicThreshold,
      frequent_lateness_threshold: latenessThreshold,
    });
  };

  const addCode = () => {
    setCodes([...codes, { id: genId(), key: '', label: '', color: 'slate', counts_as_absent: false, requires_note: false, is_default: false, active: true }]);
  };

  const updateCode = (id, field, value) => {
    setCodes(codes.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCode = (id) => {
    setCodes(codes.filter(c => c.id !== id));
  };

  const addReason = () => {
    setReasons([...reasons, { id: genId(), label: '', applies_to: ['absent'], active: true }]);
  };

  const updateReason = (id, field, value) => {
    setReasons(reasons.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeReason = (id) => {
    setReasons(reasons.filter(r => r.id !== id));
  };

  const toggleReasonCode = (reasonId, codeKey) => {
    setReasons(reasons.map(r => {
      if (r.id !== reasonId) return r;
      const applies = r.applies_to || [];
      return {
        ...r,
        applies_to: applies.includes(codeKey) ? applies.filter(k => k !== codeKey) : [...applies, codeKey]
      };
    }));
  };

  if (isLoading || codes === null) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Attendance Codes */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900">Attendance Codes</h3>
              <p className="text-xs text-slate-500 mt-0.5">Define the statuses teachers can assign. All staff will see only these codes.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={addCode}>
            <Plus className="w-4 h-4 mr-1" /> Add Code
          </Button>
        </div>

        <div className="space-y-3">
          {codes.map(code => {
            const colorMeta = COLOR_OPTIONS.find(c => c.value === code.color) || COLOR_OPTIONS[5];
            return (
              <div key={code.id} className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="col-span-2">
                  <Label className="text-xs text-slate-500 mb-1 block">Key</Label>
                  <Input value={code.key} onChange={e => updateCode(code.id, 'key', e.target.value)} placeholder="e.g. present" className="text-sm h-8" />
                </div>
                <div className="col-span-3">
                  <Label className="text-xs text-slate-500 mb-1 block">Display Label</Label>
                  <Input value={code.label} onChange={e => updateCode(code.id, 'label', e.target.value)} placeholder="e.g. Present" className="text-sm h-8" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-slate-500 mb-1 block">Colour</Label>
                  <div className="flex gap-1 flex-wrap">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => updateCode(code.id, 'color', c.value)}
                        className={`w-5 h-5 rounded-full border-2 ${c.bg} ${code.color === c.value ? 'border-slate-700 scale-110' : 'border-transparent'} transition-all`}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Switch checked={code.counts_as_absent} onCheckedChange={v => updateCode(code.id, 'counts_as_absent', v)} className="scale-75" />
                    <span className="text-xs text-slate-600">Counts absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Switch checked={code.requires_note} onCheckedChange={v => updateCode(code.id, 'requires_note', v)} className="scale-75" />
                    <span className="text-xs text-slate-600">Requires note</span>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <Badge className={`${colorMeta.bg} ${colorMeta.text} border ${colorMeta.border} text-xs`}>{code.label || 'Preview'}</Badge>
                  <Switch checked={code.active} onCheckedChange={v => updateCode(code.id, 'active', v)} className="scale-75" />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button onClick={() => removeCode(code.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reason Categories */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-violet-600" />
            <div>
              <h3 className="font-bold text-slate-900">Reason Categories</h3>
              <p className="text-xs text-slate-500 mt-0.5">Standardised reasons staff must select when recording non-present attendance.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={addReason}>
            <Plus className="w-4 h-4 mr-1" /> Add Reason
          </Button>
        </div>

        <div className="space-y-2">
          {reasons.map(reason => (
            <div key={reason.id} className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
              <div className="col-span-4">
                <Input value={reason.label} onChange={e => updateReason(reason.id, 'label', e.target.value)} placeholder="Reason label" className="text-sm h-8" />
              </div>
              <div className="col-span-6 flex flex-wrap gap-1.5 items-center">
                <span className="text-xs text-slate-500 mr-1">Applies to:</span>
                {codes.filter(c => c.active && c.key !== 'present').map(code => {
                  const active = (reason.applies_to || []).includes(code.key);
                  const colorMeta = COLOR_OPTIONS.find(c => c.value === code.color) || COLOR_OPTIONS[5];
                  return (
                    <button
                      key={code.key}
                      onClick={() => toggleReasonCode(reason.id, code.key)}
                      className={`text-xs px-2 py-0.5 rounded-full border transition-all ${active ? `${colorMeta.bg} ${colorMeta.text} ${colorMeta.border}` : 'bg-white text-slate-400 border-slate-200'}`}
                    >
                      {code.label}
                    </button>
                  );
                })}
              </div>
              <div className="col-span-1 flex items-center justify-center">
                <Switch checked={reason.active} onCheckedChange={v => updateReason(reason.id, 'active', v)} className="scale-75" />
              </div>
              <div className="col-span-1 flex justify-end">
                <button onClick={() => removeReason(reason.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policy Settings */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Policy Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <Switch checked={requireReason} onCheckedChange={setRequireReason} />
            <div>
              <p className="text-sm font-medium text-slate-900">Require reason for non-present</p>
              <p className="text-xs text-slate-500 mt-0.5">Teachers must select a reason category when marking absent, late, or excused.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Switch checked={requireCorrection} onCheckedChange={setRequireCorrection} />
            <div>
              <p className="text-sm font-medium text-slate-900">Require reason for corrections</p>
              <p className="text-xs text-slate-500 mt-0.5">Admins must provide a justification when correcting an existing attendance record.</p>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Chronic Absence Threshold (%)</Label>
            <p className="text-xs text-slate-500 mb-2">Flag a student when their absences exceed this percentage of total days.</p>
            <Input type="number" min={1} max={100} value={chronicThreshold} onChange={e => setChronicThreshold(Number(e.target.value))} className="w-28" />
          </div>
          <div>
            <Label className="text-sm font-medium">Frequent Lateness Threshold (days)</Label>
            <p className="text-xs text-slate-500 mb-2">Flag a student when late records in the period exceed this count.</p>
            <Input type="number" min={1} value={latenessThreshold} onChange={e => setLatenessThreshold(Number(e.target.value))} className="w-28" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Configuration
        </Button>
      </div>

      {saveMutation.isSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center text-sm text-emerald-800 font-medium">
          Attendance configuration saved successfully.
        </div>
      )}
    </div>
  );
}