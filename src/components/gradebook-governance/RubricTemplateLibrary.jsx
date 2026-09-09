import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Lock, BookOpen, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import * as rubricTemplatesData from '@/data/rubricTemplates';

const SUBJECT_GROUPS = [
  { value: 'general', label: 'General' },
  { value: 'group1_language_literature', label: 'Group 1 — Language & Literature' },
  { value: 'group2_language_acquisition', label: 'Group 2 — Language Acquisition' },
  { value: 'group3_individuals_societies', label: 'Group 3 — Individuals & Societies' },
  { value: 'group4_sciences', label: 'Group 4 — Sciences' },
  { value: 'group5_mathematics', label: 'Group 5 — Mathematics' },
  { value: 'group6_arts', label: 'Group 6 — Arts' },
  { value: 'core_tok', label: 'Core — Theory of Knowledge' },
  { value: 'core_ee', label: 'Core — Extended Essay' },
  { value: 'core_cas', label: 'Core — CAS' },
];

const LEVELS = ['general','HL','SL','MYP','core'];

function CriterionRow({ criterion, onChange, onRemove }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-white rounded-lg border border-slate-200">
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Input value={criterion.name} onChange={e => onChange({ name: e.target.value })} placeholder="Criterion name" className="h-7 text-sm flex-1" />
          <div className="flex items-center gap-1 flex-shrink-0">
            <Input type="number" min="1" max="32" value={criterion.max_score} onChange={e => onChange({ max_score: Number(e.target.value) })} className="h-7 w-16 text-xs text-center" />
            <span className="text-xs text-slate-400">max</span>
          </div>
        </div>
        <Textarea value={criterion.description || ''} onChange={e => onChange({ description: e.target.value })} placeholder="Criterion description (optional)" rows={1} className="text-xs resize-none" />
      </div>
      <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 mt-1">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function TemplateDialog({ schoolId, template, onClose }) {
  const queryClient = useQueryClient();
  const isEdit = !!template?.id;
  const [form, setForm] = useState(template || {
    name: '', description: '', subject_group: 'general', level: 'general',
    criteria: [], is_protected: false, protected_reason: '', status: 'active',
  });

  const totalMax = (form.criteria || []).reduce((s, c) => s + (Number(c.max_score) || 0), 0);

  const addCriterion = () => {
    const crit = { id: `crit_${Date.now()}`, name: '', description: '', max_score: 8, strand_descriptors: [] };
    setForm(f => ({ ...f, criteria: [...(f.criteria || []), crit] }));
  };

  const updateCriterion = (id, patch) => setForm(f => ({ ...f, criteria: f.criteria.map(c => c.id === id ? { ...c, ...patch } : c) }));
  const removeCriterion = (id) => setForm(f => ({ ...f, criteria: f.criteria.filter(c => c.id !== id) }));

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, school_id: schoolId, total_max_score: totalMax };
      return isEdit ? rubricTemplatesData.update(template.id, payload) : rubricTemplatesData.create(payload);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rubric-templates', schoolId] }); onClose(); },
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit' : 'New'} Rubric Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold">Template Name *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sciences Lab Report Rubric" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Subject Group</Label>
              <Select value={form.subject_group} onValueChange={v => setForm({ ...form, subject_group: v })}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{SUBJECT_GROUPS.map(g => <SelectItem key={g.value} value={g.value} className="text-xs">{g.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-semibold">Level</Label>
              <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                <SelectTrigger className="mt-1 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold">Description</Label>
            <Textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="mt-1 text-sm" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs font-semibold">Criteria ({form.criteria?.length || 0}) — Total: {totalMax} pts</Label>
              <Button size="sm" variant="outline" onClick={addCriterion} className="text-xs gap-1 h-7">
                <Plus className="w-3 h-3" /> Add Criterion
              </Button>
            </div>
            <div className="space-y-2">
              {(form.criteria || []).map(c => (
                <CriterionRow key={c.id} criterion={c} onChange={(patch) => updateCriterion(c.id, patch)} onRemove={() => removeCriterion(c.id)} />
              ))}
              {form.criteria?.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">No criteria yet — click Add Criterion</div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-red-500" /> Protected template</p>
                <p className="text-xs text-slate-500">Teachers cannot edit this template — only admins/coordinators</p>
              </div>
              <Switch checked={form.is_protected} onCheckedChange={v => setForm({ ...form, is_protected: v })} />
            </div>
            {form.is_protected && (
              <div>
                <Label className="text-xs font-semibold">Protection reason (shown to teachers)</Label>
                <Input value={form.protected_reason || ''} onChange={e => setForm({ ...form, protected_reason: e.target.value })} placeholder="e.g. Official IB May 2026 rubric — do not modify" className="mt-1 text-sm" />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name.trim() || saveMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {saveMutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Template'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RubricTemplateLibrary({ schoolId }) {
  const queryClient = useQueryClient();
  const [dialogTemplate, setDialogTemplate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [filter, setFilter] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['rubric-templates', schoolId],
    queryFn: () => rubricTemplatesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const archiveMutation = useMutation({
    mutationFn: (t) => rubricTemplatesData.update(t.id, { status: t.status === 'archived' ? 'active' : 'archived' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rubric-templates', schoolId] }),
  });

  const filtered = templates.filter(t => !filter || t.name.toLowerCase().includes(filter.toLowerCase()));
  const subjectLabel = (v) => SUBJECT_GROUPS.find(g => g.value === v)?.label || v;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Rubric & Criteria Template Library</h3>
        <p className="text-xs text-slate-500 mb-4">Create shared IB rubric templates by subject group and level. Teachers can apply these to grade items. Protected templates cannot be altered.</p>
      </div>

      <div className="flex gap-3">
        <Input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search templates…" className="flex-1 h-8 text-sm" />
        <Button size="sm" onClick={() => { setDialogTemplate(null); setDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 gap-1 text-xs flex-shrink-0">
          <Plus className="w-3.5 h-3.5" /> New Template
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-400 text-sm">Loading templates…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No templates yet</p>
          <p className="text-xs text-slate-400 mt-1">Create shared rubric templates that teachers can apply to grade items</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(t => {
            const isOpen = expanded[t.id];
            return (
              <div key={t.id} className={`border rounded-xl overflow-hidden ${t.status === 'archived' ? 'opacity-60 border-slate-200' : 'border-slate-200'}`}>
                <div className="flex items-center gap-3 p-3 bg-white">
                  <button type="button" onClick={() => setExpanded(e => ({ ...e, [t.id]: !e[t.id] }))} className="text-slate-400">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{t.name}</span>
                      {t.is_protected && <Badge className="bg-red-100 text-red-700 border-0 text-xs gap-0.5"><Lock className="w-2.5 h-2.5" /> Protected</Badge>}
                      {t.status === 'archived' && <Badge className="bg-slate-100 text-slate-500 border-0 text-xs">Archived</Badge>}
                      <Badge className="bg-indigo-50 text-indigo-700 border-0 text-xs">{t.level}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{subjectLabel(t.subject_group)} · {t.criteria?.length || 0} criteria · {t.total_max_score || 0} pts total</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!t.is_protected && (
                      <Button size="sm" variant="ghost" onClick={() => { setDialogTemplate(t); setDialogOpen(true); }} className="h-7 w-7 p-0 text-slate-400 hover:text-indigo-600">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => archiveMutation.mutate(t)} className="text-xs h-7 text-slate-400 hover:text-slate-700">
                      {t.status === 'archived' ? 'Restore' : 'Archive'}
                    </Button>
                  </div>
                </div>
                {isOpen && t.criteria?.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50 p-3 space-y-1.5">
                    {t.criteria.map(c => (
                      <div key={c.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-slate-100">
                        <span className="font-medium text-slate-800">{c.name}</span>
                        <div className="flex items-center gap-2">
                          {c.description && <span className="text-slate-400 max-w-xs truncate">{c.description}</span>}
                          <Badge className="bg-violet-50 text-violet-700 border-0">{c.max_score} pts</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <TemplateDialog
          schoolId={schoolId}
          template={dialogTemplate}
          onClose={() => { setDialogOpen(false); setDialogTemplate(null); }}
        />
      )}
    </div>
  );
}