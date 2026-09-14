import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Plus } from 'lucide-react';
import * as academics from '@/data/academics';

export default function WizardStepAcademicYear({ schoolId, onDone, onAcademicYearCreated }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    start_date: `${new Date().getFullYear()}-09-01`,
    end_date: `${new Date().getFullYear() + 1}-06-30`,
  });

  const { data: existingYears = [], refetch } = useQuery({
    queryKey: ['academic-years-wizard', schoolId],
    queryFn: () => academics.whereAcademicYears({ school_id: schoolId }),
  });

  const handleSave = async () => {
    setSaving(true);
    const year = await academics.createAcademicYear({
      ...form,
      school_id: schoolId,
      is_current: true,
      status: 'active',
    });
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['onboarding-status', schoolId] });
    onAcademicYearCreated?.(year.id);
    setSaving(false);
  };

  const hasYears = existingYears.length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold scholr-ink mb-1">Academic Year</h3>
        <p className="text-sm scholr-muted">Define the school year that classes and terms will belong to. You can add more years later.</p>
      </div>

      {existingYears.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold scholr-muted uppercase tracking-wide">Configured Years</p>
          {existingYears.map(y => (
            <div key={y.id} className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold scholr-ink">{y.name}</p>
                <p className="text-xs scholr-muted">{y.start_date} → {y.end_date}</p>
              </div>
            </div>
          ))}
          <Button onClick={onDone} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-1.5 mt-2">
            <CheckCircle2 className="w-4 h-4" /> Continue with existing year
          </Button>
        </div>
      )}

      {!hasYears && (
        <div className="scholr-sunk rounded-xl border scholr-rule p-5 space-y-4">
          <p className="text-xs font-semibold scholr-muted uppercase tracking-wide">Create First Academic Year</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs scholr-muted mb-1 block">Year Name</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. 2025-2026"
              />
            </div>
            <div>
              <Label className="text-xs scholr-muted mb-1 block">Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs scholr-muted mb-1 block">End Date</Label>
              <Input
                type="date"
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !form.name || !form.start_date || !form.end_date}
            className="w-full scholr-accent-sf hover:scholr-accent-sf gap-1.5"
          >
            {saving
              ? <span className="animate-pulse">Saving…</span>
              : <><Plus className="w-4 h-4" /> Create Academic Year &amp; Continue</>
            }
          </Button>
        </div>
      )}

      {hasYears && (
        <div className="scholr-sunk rounded-xl border scholr-rule p-5 space-y-3">
          <p className="text-xs font-semibold scholr-muted uppercase tracking-wide">Add Another Year (optional)</p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs scholr-muted mb-1 block">Year Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs scholr-muted mb-1 block">Start Date</Label>
              <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs scholr-muted mb-1 block">End Date</Label>
              <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <Button variant="outline" onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Another Year
          </Button>
        </div>
      )}
    </div>
  );
}