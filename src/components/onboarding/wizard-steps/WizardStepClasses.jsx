import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Plus, Trash2, Layers } from 'lucide-react';
import * as academics from '@/data/academics';
import * as classesData from '@/data/classes';

export default function WizardStepClasses({ schoolId, onDone }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [newClasses, setNewClasses] = useState([{ name: '', section: '' }]);

  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years-wizard', schoolId],
    queryFn: () => academics.whereAcademicYears({ school_id: schoolId }),
  });
  const { data: existingClasses = [], refetch } = useQuery({
    queryKey: ['classes-wizard', schoolId],
    queryFn: () => classesData.where({ school_id: schoolId, status: 'active' }),
  });

  const [yearId, setYearId] = useState('');
  const activeYearId = yearId || academicYears[0]?.id;

  const addRow = () => setNewClasses(c => [...c, { name: '', section: '' }]);
  const removeRow = (i) => setNewClasses(c => c.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => setNewClasses(c => c.map((cls, idx) => idx === i ? { ...cls, [field]: val } : cls));

  const handleSave = async () => {
    setSaving(true);
    await Promise.all(
      newClasses.filter(c => c.name.trim()).map(c =>
        classesData.create({
          name: c.name,
          section: c.section || undefined,
          school_id: schoolId,
          academic_year_id: activeYearId || undefined,
          status: 'active',
          student_ids: [],
          teacher_ids: [],
        })
      )
    );
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['onboarding-status', schoolId] });
    setSaving(false);
    onDone?.();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Create Classes</h3>
        <p className="text-sm text-slate-500">Set up your initial class groups. You'll assign teachers and enrol students from the Classes page after setup.</p>
      </div>

      {existingClasses.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Existing Classes ({existingClasses.length})</p>
          <div className="space-y-2 mb-3">
            {existingClasses.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-semibold text-slate-800">{c.name}{c.section ? ` (${c.section})` : ''}</p>
              </div>
            ))}
            {existingClasses.length > 5 && <p className="text-xs text-slate-400">+{existingClasses.length - 5} more</p>}
          </div>
          <Button onClick={onDone} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5" size="sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Continue with existing classes
          </Button>
        </div>
      )}

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New Classes</p>

        {academicYears.length > 1 && (
          <div>
            <Label className="text-xs text-slate-600 mb-1 block">Academic Year</Label>
            <Select value={activeYearId} onValueChange={setYearId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-3">
          {newClasses.map((cls, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Class Name</Label>
                <Input
                  value={cls.name}
                  onChange={e => updateRow(i, 'name', e.target.value)}
                  placeholder="e.g. IB DP Year 1, Mathematics HL"
                />
              </div>
              <div className="w-24">
                <Label className="text-xs text-slate-600 mb-1 block">Section</Label>
                <Input
                  value={cls.section}
                  onChange={e => updateRow(i, 'section', e.target.value)}
                  placeholder="A"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeRow(i)} className="text-slate-400 h-9 w-9">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Class
        </Button>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || newClasses.every(c => !c.name.trim())}
        className="w-full bg-indigo-600 hover:bg-indigo-700 gap-1.5"
      >
        {saving ? 'Saving…' : <><Layers className="w-4 h-4" /> Create Classes &amp; Continue</>}
      </Button>
    </div>
  );
}