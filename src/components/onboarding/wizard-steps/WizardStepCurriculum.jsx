import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, GraduationCap, BookOpen } from 'lucide-react';
import { CURRICULUM_OPTIONS, getCurriculumConfig } from '@/lib/curriculumConfig';
import { getSubjectTemplate } from '@/lib/curriculumTemplates';
import * as schoolsData from '@/data/schools';

export default function WizardStepCurriculum({ schoolId, currentCurriculum, onDone }) {
  const [selected, setSelected] = useState(currentCurriculum || 'ib_dp');
  const [saving, setSaving] = useState(false);

  const config = getCurriculumConfig(selected);
  const template = getSubjectTemplate(selected);

  const handleSave = async () => {
    setSaving(true);
    await schoolsData.update(schoolId, { curriculum: selected });
    onDone?.({ curriculum: selected });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Choose Your Curriculum</h3>
        <p className="text-sm text-slate-500">
          This sets up your grading scale, subject groups, grade levels, and role labels throughout Scholr.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        {CURRICULUM_OPTIONS.map(opt => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={`text-left p-3.5 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-800' : 'text-slate-800'}`}>{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Template preview */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{config.shortLabel} — What gets pre-configured</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <p className="text-slate-400 mb-1">Grading Scale</p>
            <Badge variant="outline" className="text-xs">{config.gradeScale.displayLabel}</Badge>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Grade Levels</p>
            <div className="flex flex-wrap gap-1">
              {config.gradeLevels.length > 0
                ? config.gradeLevels.slice(0, 4).map(g => <Badge key={g} variant="outline" className="text-xs">{g}</Badge>)
                : <span className="text-slate-400 italic">Custom</span>
              }
              {config.gradeLevels.length > 4 && <span className="text-slate-400 text-xs">+{config.gradeLevels.length - 4} more</span>}
            </div>
          </div>
          <div>
            <p className="text-slate-400 mb-1">Coordinator Role</p>
            <Badge variant="outline" className="text-xs">{config.coordinatorLabel}</Badge>
          </div>
        </div>
        {template.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <p className="text-xs font-medium text-slate-600">{template.length} subjects in template — preview:</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {template.slice(0, 10).map(s => (
                <span key={s.code} className="text-xs bg-white border border-slate-200 rounded-md px-2 py-0.5 text-slate-600">{s.name}</span>
              ))}
              {template.length > 10 && (
                <span className="text-xs text-slate-400 px-2 py-0.5">+{template.length - 10} more</span>
              )}
            </div>
          </div>
        )}
        {template.length === 0 && (
          <p className="text-xs text-slate-400 italic">No subject template — you'll create subjects manually.</p>
        )}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-indigo-600 hover:bg-indigo-700 gap-1.5"
      >
        {saving ? 'Saving…' : <><CheckCircle2 className="w-4 h-4" /> Use {config.shortLabel} &amp; Continue</>}
      </Button>
    </div>
  );
}