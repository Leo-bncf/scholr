import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Lock, Unlock, AlertTriangle } from 'lucide-react';

export default function GradeLocksPanel({ form, onChange, terms = [] }) {
  const [showNew, setShowNew] = useState(false);
  const [newWin, setNewWin] = useState({ name: '', opens_at: '', locks_at: '', term_id: '' });

  const addWindow = () => {
    if (!newWin.name.trim() || !newWin.locks_at) return;
    const win = { ...newWin, id: `win_${Date.now()}`, locked: false };
    onChange({ reporting_windows: [...(form.reporting_windows || []), win] });
    setNewWin({ name: '', opens_at: '', locks_at: '', term_id: '' });
    setShowNew(false);
  };

  const removeWindow = (id) => onChange({ reporting_windows: form.reporting_windows.filter(w => w.id !== id) });

  const toggleWindowLock = (id) => onChange({
    reporting_windows: form.reporting_windows.map(w => w.id === id ? { ...w, locked: !w.locked } : w)
  });

  const updateWindow = (id, patch) => onChange({
    reporting_windows: form.reporting_windows.map(w => w.id === id ? { ...w, ...patch } : w)
  });

  const isExpired = (win) => win.locks_at && new Date() > new Date(win.locks_at);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-1">Reporting Windows</h3>
        <p className="text-xs text-slate-500 mb-4">Define named reporting periods. Grades can be automatically locked after the deadline.</p>

        <div className="space-y-2 mb-3">
          {(form.reporting_windows || []).map(win => {
            const expired = isExpired(win);
            const effectiveLocked = win.locked || expired;
            return (
              <div key={win.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Input
                        value={win.name}
                        onChange={e => updateWindow(win.id, { name: e.target.value })}
                        className="h-7 text-sm font-semibold border-0 bg-transparent p-0 focus-visible:ring-0"
                      />
                      {effectiveLocked ? (
                        <Badge className="bg-red-100 text-red-700 border-0 text-xs gap-1 flex-shrink-0">
                          <Lock className="w-3 h-3" /> Locked
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs gap-1 flex-shrink-0">
                          <Unlock className="w-3 h-3" /> Open
                        </Badge>
                      )}
                      {expired && !win.locked && (
                        <Badge className="bg-amber-100 text-amber-700 border-0 text-xs flex-shrink-0">Auto-locked</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-500">Opens</Label>
                        <Input type="datetime-local" value={win.opens_at?.slice(0, 16) || ''} onChange={e => updateWindow(win.id, { opens_at: e.target.value ? new Date(e.target.value).toISOString() : '' })} className="mt-0.5 h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500">Deadline (locks at)</Label>
                        <Input type="datetime-local" value={win.locks_at?.slice(0, 16) || ''} onChange={e => updateWindow(win.id, { locks_at: e.target.value ? new Date(e.target.value).toISOString() : '' })} className="mt-0.5 h-7 text-xs" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button size="sm" variant="outline" onClick={() => toggleWindowLock(win.id)} className="text-xs gap-1 h-7">
                      {win.locked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {win.locked ? 'Unlock' : 'Lock Now'}
                    </Button>
                    <button type="button" onClick={() => removeWindow(win.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showNew ? (
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
            <h5 className="text-xs font-bold text-indigo-900">New Reporting Window</h5>
            <div>
              <Label className="text-xs font-semibold">Window Name</Label>
              <Input value={newWin.name} onChange={e => setNewWin({ ...newWin, name: e.target.value })} placeholder="e.g. Semester 1 Reports" className="mt-1 h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Opens</Label>
                <Input type="datetime-local" value={newWin.opens_at} onChange={e => setNewWin({ ...newWin, opens_at: e.target.value })} className="mt-1 h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs font-semibold">Locks At *</Label>
                <Input type="datetime-local" value={newWin.locks_at} onChange={e => setNewWin({ ...newWin, locks_at: e.target.value })} className="mt-1 h-8 text-xs" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={addWindow} disabled={!newWin.name.trim() || !newWin.locks_at} className="bg-indigo-600 hover:bg-indigo-700 text-xs">Add Window</Button>
              <Button size="sm" variant="outline" onClick={() => setShowNew(false)} className="text-xs">Cancel</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setShowNew(true)} className="text-xs gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Reporting Window
          </Button>
        )}
      </div>

      <div className="border-t border-slate-100 pt-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Lock Behavior</h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5"><Lock className="w-4 h-4 text-red-500" /> Auto-lock after deadline</p>
            <p className="text-xs text-slate-500">Grade edits are blocked once a reporting window's deadline passes</p>
          </div>
          <Switch checked={form.lock_grades_after_deadline} onCheckedChange={v => onChange({ lock_grades_after_deadline: v })} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-500" /> Require justification for post-lock edits</p>
            <p className="text-xs text-slate-500">Admin overrides must include a written justification</p>
          </div>
          <Switch checked={form.require_justification_for_locked_edit} onCheckedChange={v => onChange({ require_justification_for_locked_edit: v })} />
        </div>

        {form.require_justification_for_locked_edit && (
          <div>
            <Label className="text-xs font-semibold">Minimum justification length (characters)</Label>
            <Input type="number" min="10" max="500" value={form.justification_min_chars} onChange={e => onChange({ justification_min_chars: Number(e.target.value) })} className="mt-1 w-28 h-8 text-sm" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Admins can override locked grades</p>
            <p className="text-xs text-slate-500">School admins retain override capability even when grades are locked</p>
          </div>
          <Switch checked={form.admin_can_override_lock} onCheckedChange={v => onChange({ admin_can_override_lock: v })} />
        </div>
      </div>
    </div>
  );
}