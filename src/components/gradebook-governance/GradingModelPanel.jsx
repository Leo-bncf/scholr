import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, GripVertical, Calculator, BarChart3, BookOpen } from 'lucide-react';

const CATEGORY_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'];
const GRADE_TYPES = ['homework','quiz','test','exam','project','lab','presentation','participation','other'];

const MODEL_OPTIONS = [
  { value: 'points_based', label: 'Points-Based Totals', desc: 'Sum of all earned points divided by total possible. Simplest approach.', icon: Calculator },
  { value: 'category_weights', label: 'Category Weights', desc: 'Categories (e.g. Summative 60%, Formative 40%) each carry a defined percentage weight.', icon: BarChart3 },
  { value: 'ib_criteria_only', label: 'IB Criteria Only', desc: 'Grades derive entirely from IB criterion scores (1-7 scale). No raw points.', icon: BookOpen },
];

export default function GradingModelPanel({ form, onChange }) {
  const [newCat, setNewCat] = useState({ name: '', weight_percent: 0, color: CATEGORY_COLORS[0], drop_lowest: 0, applies_to_types: [] });
  const [showNewCat, setShowNewCat] = useState(false);

  const totalWeight = (form.categories || []).reduce((s, c) => s + (Number(c.weight_percent) || 0), 0);

  const addCategory = () => {
    if (!newCat.name.trim()) return;
    const cat = { ...newCat, id: `cat_${Date.now()}` };
    onChange({ categories: [...(form.categories || []), cat] });
    setNewCat({ name: '', weight_percent: 0, color: CATEGORY_COLORS[form.categories?.length % CATEGORY_COLORS.length || 0], drop_lowest: 0, applies_to_types: [] });
    setShowNewCat(false);
  };

  const removeCategory = (id) => onChange({ categories: form.categories.filter(c => c.id !== id) });

  const updateCategory = (id, patch) => onChange({ categories: form.categories.map(c => c.id === id ? { ...c, ...patch } : c) });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Grading Model</h3>
        <p className="text-xs text-slate-500 mb-4">Defines how final grades are calculated across all classes in this school.</p>
        <div className="grid grid-cols-1 gap-3">
          {MODEL_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const active = form.grading_model === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ grading_model: opt.value })}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
              >
                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${active ? 'text-indigo-900' : 'text-slate-800'}`}>{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category management — only shown for category_weights model */}
      {form.grading_model === 'category_weights' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Grade Categories</h4>
              {totalWeight !== 100 && form.categories?.length > 0 && (
                <p className="text-xs text-amber-600 mt-0.5">⚠ Weights total {totalWeight}% — should equal 100%</p>
              )}
              {totalWeight === 100 && form.categories?.length > 0 && (
                <p className="text-xs text-emerald-600 mt-0.5">✓ Weights total 100%</p>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setShowNewCat(true)} className="text-xs gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Category
            </Button>
          </div>

          <div className="space-y-2">
            {(form.categories || []).map(cat => (
              <div key={cat.id} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
                <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <div className="flex-1 min-w-0">
                  <Input
                    value={cat.name}
                    onChange={e => updateCategory(cat.id, { name: e.target.value })}
                    className="h-7 text-sm font-medium border-0 bg-transparent p-0 focus-visible:ring-0 w-full"
                  />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Input
                    type="number" min="0" max="100"
                    value={cat.weight_percent}
                    onChange={e => updateCategory(cat.id, { weight_percent: Number(e.target.value) })}
                    className="h-7 w-16 text-xs text-center"
                  />
                  <span className="text-xs text-slate-400">%</span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 text-xs text-slate-500">
                  <span>Drop</span>
                  <Input
                    type="number" min="0"
                    value={cat.drop_lowest}
                    onChange={e => updateCategory(cat.id, { drop_lowest: Number(e.target.value) })}
                    className="h-7 w-12 text-xs text-center"
                  />
                  <span>lowest</span>
                </div>
                <button type="button" onClick={() => removeCategory(cat.id)} className="text-slate-400 hover:text-red-500 flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {showNewCat && (
            <div className="mt-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
              <h5 className="text-xs font-bold text-indigo-900">New Category</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold">Name</Label>
                  <Input value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} placeholder="e.g. Summative" className="mt-1 h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Weight %</Label>
                  <Input type="number" min="0" max="100" value={newCat.weight_percent} onChange={e => setNewCat({ ...newCat, weight_percent: Number(e.target.value) })} className="mt-1 h-8 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold">Color</Label>
                <div className="flex gap-2 mt-1">
                  {CATEGORY_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setNewCat({ ...newCat, color: c })} className={`w-6 h-6 rounded-full transition-all ${newCat.color === c ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110' : ''}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addCategory} disabled={!newCat.name.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-xs">Add</Button>
                <Button size="sm" variant="outline" onClick={() => setShowNewCat(false)} className="text-xs">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Allow teachers to override categories</p>
            <p className="text-xs text-slate-500">Teachers can assign grade items to different categories per class</p>
          </div>
          <Switch checked={form.allow_teacher_category_override} onCheckedChange={v => onChange({ allow_teacher_category_override: v })} />
        </div>
      </div>
    </div>
  );
}