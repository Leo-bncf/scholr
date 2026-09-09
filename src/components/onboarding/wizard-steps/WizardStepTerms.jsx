import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import * as academics from '@/data/academics';

const TERM_PRESETS = [
  { label: '3 Terms', terms: ['Term 1', 'Term 2', 'Term 3'] },
  { label: '2 Semesters', terms: ['Semester 1', 'Semester 2'] },
  { label: '4 Quarters', terms: ['Q1', 'Q2', 'Q3', 'Q4'] },
];

export default function WizardStepTerms({ schoolId, academicYearId, onDone }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [newTerms, setNewTerms] = useState([{ name: 'Term 1', start_date: '', end_date: '' }]);

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years-wizard', schoolId],
    queryFn: () => academics.whereAcademicYears({ school_id: schoolId }),
  });

  const [selectedYearId, setSelectedYearId] = useState(academicYearId || '');

  const { data: existingTerms = [], refetch } = useQuery({
    queryKey: ['terms-wizard', schoolId],
    queryFn: () => academics.whereTerms({ school_id: schoolId }),
  });

  const activeYearId = selectedYearId || academicYears[0]?.id;

  const applyPreset = (preset) => {
    setNewTerms(preset.terms.map(name => ({ name, start_date: '', end_date: '' })));
  };

  const addTerm = () => setNewTerms(t => [...t, { name: `Term ${t.length + 1}`, start_date: '', end_date: '' }]);
  const removeTerm = (i) => setNewTerms(t => t.filter((_, idx) => idx !== i));
  const updateTerm = (i, field, value) => setNewTerms(t => t.map((term, idx) => idx === i ? { ...term, [field]: value } : term));

  const handleSave = async () => {
    if (!activeYearId) return;
    setSaving(true);
    await Promise.all(
      newTerms.filter(t => t.name).map(t =>
        academics.createTerm({ ...t, school_id: schoolId, academic_year_id: activeYearId })
      )
    );
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['onboarding-status', schoolId] });
    setSaving(false);
    onDone?.();
  };

  const termsForYear = existingTerms.filter(t => t.academic_year_id === activeYearId);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Terms & Reporting Periods</h3>
        <p className="text-sm text-slate-500">Define the terms within your academic year. These are used for grade locks, reporting windows, and attendance tracking.</p>
      </div>

      {academicYears.length > 1 && (
        <div>
          <Label className="text-xs text-slate-600 mb-1 block">Select Academic Year</Label>
          <Select value={activeYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choose year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map(y => (
                <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {termsForYear.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Existing Terms</p>
          {termsForYear.map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                <p className="text-xs text-slate-500">{t.start_date} → {t.end_date}</p>
              </div>
            </div>
          ))}
          <Button onClick={onDone} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-1.5 mt-2">
            <CheckCircle2 className="w-4 h-4" /> Continue with existing terms
          </Button>
        </div>
      )}

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Add Terms</p>
          <div className="flex gap-1.5">
            {TERM_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-2 py-0.5 rounded-full"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {newTerms.map((term, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Term Name</Label>
                <Input value={term.name} onChange={e => updateTerm(i, 'name', e.target.value)} placeholder="Term 1" />
              </div>
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Start Date</Label>
                <Input type="date" value={term.start_date} onChange={e => updateTerm(i, 'start_date', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">End Date</Label>
                <Input type="date" value={term.end_date} onChange={e => updateTerm(i, 'end_date', e.target.value)} />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeTerm(i)} className="text-slate-400 h-9 w-9">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addTerm} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Term
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || newTerms.every(t => !t.name) || !activeYearId}
            className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
            size="sm"
          >
            {saving ? 'Saving…' : <><CheckCircle2 className="w-3.5 h-3.5" /> Save Terms &amp; Continue</>}
          </Button>
        </div>
      </div>
    </div>
  );
}