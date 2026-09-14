import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Plus, Trash2, BookOpen } from 'lucide-react';
import { getSubjectTemplate } from '@/lib/curriculumTemplates';
import { getCurriculumConfig } from '@/lib/curriculumConfig';
import * as academics from '@/data/academics';

export default function WizardStepSubjects({ schoolId, curriculum = 'ib_dp', onDone }) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [subjects, setSubjects] = useState([{ name: '', code: '' }]);
  const [useTemplate, setUseTemplate] = useState(true);
  const [selectedFromTemplate, setSelectedFromTemplate] = useState(new Set());

  const template = getSubjectTemplate(curriculum);
  const config = getCurriculumConfig(curriculum);
  const hasTemplate = template.length > 0;

  const { data: existingSubjects = [], refetch } = useQuery({
    queryKey: ['subjects-wizard', schoolId],
    queryFn: () => academics.whereSubjects({ school_id: schoolId }),
  });

  const toggleTemplate = (code) => {
    setSelectedFromTemplate(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const selectAll = () => setSelectedFromTemplate(new Set(template.map(s => s.code)));
  const selectNone = () => setSelectedFromTemplate(new Set());

  const addRow = () => setSubjects(s => [...s, { name: '', code: '' }]);
  const removeRow = (i) => setSubjects(s => s.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) => setSubjects(s => s.map((sub, idx) => idx === i ? { ...sub, [field]: value } : sub));

  const handleSave = async () => {
    setSaving(true);
    const toCreate = (useTemplate && hasTemplate)
      ? template.filter(s => selectedFromTemplate.has(s.code))
      : subjects.filter(s => s.name.trim());

    await Promise.all(
      toCreate.map(s => academics.createSubject({ ...s, school_id: schoolId, status: 'active' }))
    );
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['onboarding-status', schoolId] });
    setSaving(false);
    onDone?.();
  };

  const canSave = useTemplate && hasTemplate
    ? selectedFromTemplate.size > 0
    : subjects.some(s => s.name.trim());

  // Group template subjects by ib_group for display
  const groupedTemplate = template.reduce((acc, s) => {
    const groupKey = s.ib_group || '_other';
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(s);
    return acc;
  }, {});

  const groupLabels = config.subjectGroupLabels || {};

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold scholr-ink mb-1">Subject Catalogue</h3>
        <p className="text-sm scholr-muted">
          {hasTemplate
            ? `Choose from the ${config.shortLabel} subject template or create custom subjects.`
            : 'Add the subjects your school teaches.'}
        </p>
      </div>

      {existingSubjects.length > 0 && (
        <div>
          <p className="text-xs font-semibold scholr-muted uppercase tracking-wide mb-2">Existing Subjects ({existingSubjects.length})</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {existingSubjects.map(s => (
              <Badge key={s.id} variant="outline" className="gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {s.name}
              </Badge>
            ))}
          </div>
          <Button onClick={onDone} className="bg-emerald-600 hover:bg-emerald-700 gap-1.5" size="sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Continue with existing subjects
          </Button>
        </div>
      )}

      {hasTemplate && (
        <div className="flex gap-2">
          <button
            onClick={() => setUseTemplate(true)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${useTemplate ? 'pub-btn pub-btn-gold scholr-accent-rule' : 'scholr-rule scholr-muted'}`}
          >
            {config.shortLabel} Template
          </button>
          <button
            onClick={() => setUseTemplate(false)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${!useTemplate ? 'pub-btn pub-btn-gold scholr-accent-rule' : 'scholr-rule scholr-muted'}`}
          >
            Custom Subjects
          </button>
        </div>
      )}

      {(useTemplate && hasTemplate) ? (
        <div className="scholr-sunk rounded-xl border scholr-rule p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs scholr-muted">Select the subjects your school offers:</p>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs scholr-accent hover:underline">Select all</button>
              <span className="scholr-faint">|</span>
              <button onClick={selectNone} className="text-xs scholr-muted hover:underline">None</button>
            </div>
          </div>
          {Object.entries(groupedTemplate).map(([groupKey, items]) => (
            <div key={groupKey}>
              {groupKey !== '_other' && (
                <p className="text-xs font-semibold scholr-muted uppercase tracking-wide mb-2">
                  {groupLabels[groupKey] || groupKey}
                </p>
              )}
              <div className="grid sm:grid-cols-2 gap-1.5">
                {items.map(s => (
                  <button
                    key={s.code}
                    onClick={() => toggleTemplate(s.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-colors ${
                      selectedFromTemplate.has(s.code)
                        ? 'scholr-accent-sf scholr-accent-rule scholr-accent'
                        : 'bg-white scholr-rule scholr-body hover:scholr-rule'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                      selectedFromTemplate.has(s.code) ? 'scholr-accent-sf scholr-accent-rule' : 'scholr-rule'
                    }`}>
                      {selectedFromTemplate.has(s.code) && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{s.name}</p>
                      <p className="text-[10px] scholr-faint">{s.code}{s.level && s.level !== 'na' ? ` · ${s.level}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="scholr-sunk rounded-xl border scholr-rule p-5 space-y-3">
          {subjects.map((sub, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-2 items-end">
              <div>
                <Label className="text-xs scholr-muted mb-1 block">Subject Name</Label>
                <Input value={sub.name} onChange={e => updateRow(i, 'name', e.target.value)} placeholder="e.g. Mathematics" />
              </div>
              <div className="w-24">
                <Label className="text-xs scholr-muted mb-1 block">Code</Label>
                <Input value={sub.code} onChange={e => updateRow(i, 'code', e.target.value)} placeholder="MA" />
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeRow(i)} className="scholr-faint h-9 w-9">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Subject
          </Button>
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={saving || !canSave}
        className="w-full scholr-accent-sf hover:scholr-accent-sf gap-1.5"
      >
        {saving ? 'Saving…' : <><BookOpen className="w-4 h-4" /> Save Subjects &amp; Continue</>}
      </Button>
    </div>
  );
}