import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, AlertCircle, Users } from 'lucide-react';

export default function EnrollStudentsDialog({
  open,
  onOpenChange,
  classItem,
  students = [],
  onSave,
  isSaving,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setSearch('');
    }
  }, [open]);

  // Hide already-enrolled students so admins see only new candidates.
  const available = useMemo(() => {
    const enrolled = new Set(classItem?.student_ids || []);
    return students.filter((s) => !enrolled.has(s.user_id));
  }, [students, classItem]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (s) =>
        s.user_name?.toLowerCase().includes(q) ||
        s.user_email?.toLowerCase().includes(q) ||
        s.grade_level?.toLowerCase().includes(q)
    );
  }, [available, search]);

  const toggle = (userId) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selectedIds.includes(s.user_id));

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((s) => s.user_id === id)));
    } else {
      const toAdd = filtered.map((s) => s.user_id);
      setSelectedIds((prev) => Array.from(new Set([...prev, ...toAdd])));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Enrol Students</DialogTitle>
        </DialogHeader>

        {students.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-slate-700 font-medium">No students in this school yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Invite students or import them via the Users page first.
            </p>
          </div>
        ) : available.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-700 font-medium">All students are already enrolled</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 space-y-3 pt-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search students…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={toggleAll}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {allFilteredSelected ? 'Clear selection' : `Select all (${filtered.length})`}
              </button>
              <span>{selectedIds.length} selected</span>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center">No students match</p>
              ) : (
                filtered.map((s) => {
                  const checked = selectedIds.includes(s.user_id);
                  return (
                    <label
                      key={s.user_id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                        checked ? 'bg-indigo-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(s.user_id)}
                        className="rounded border-slate-300"
                      />
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {s.user_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{s.user_name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {s.grade_level || 'Grade —'}
                          {s.user_email ? ` • ${s.user_email}` : ''}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={selectedIds.length === 0 || isSaving}
            onClick={() => onSave(selectedIds)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Enrol {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}