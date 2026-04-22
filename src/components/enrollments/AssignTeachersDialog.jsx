import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserCheck, Loader2, AlertCircle } from 'lucide-react';

/**
 * Unified teacher assignment dialog. Supports two modes:
 * - 'subject'   → assigns a subject + chosen teachers to a class (creates an
 *                 entry in `subject_teacher_assignments`)
 * - 'general'   → assigns teachers to the class as a whole (updates
 *                 `teacher_ids` and `primary_teacher_id`)
 */
export default function AssignTeachersDialog({
  open,
  onOpenChange,
  mode = 'subject',
  classItem,
  teachers = [],
  subjects = [],
  onSave,
  isSaving,
}) {
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setSubjectId('');
    if (mode === 'general') {
      setSelectedTeacherIds(classItem?.teacher_ids || []);
    } else {
      setSelectedTeacherIds([]);
    }
  }, [open, mode, classItem]);

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(
      (t) =>
        t.user_name?.toLowerCase().includes(q) ||
        t.user_email?.toLowerCase().includes(q)
    );
  }, [teachers, search]);

  const toggle = (userId) => {
    setSelectedTeacherIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const canSubmit =
    !isSaving &&
    (mode === 'general'
      ? true
      : !!subjectId && selectedTeacherIds.length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (mode === 'subject') {
      onSave({ subjectId, teacherIds: selectedTeacherIds });
    } else {
      onSave({ teacherIds: selectedTeacherIds });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === 'subject' ? 'Assign Subject & Teachers' : 'Assign Class Teachers'}
          </DialogTitle>
        </DialogHeader>

        {teachers.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-slate-700 font-medium">No teachers in this school yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Invite staff and assign them the teacher role to enable assignment.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 space-y-3 pt-1">
            {mode === 'subject' && (
              <div>
                <Label className="text-xs font-semibold">Subject *</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose subject…" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-slate-500">
                        No subjects configured
                      </div>
                    ) : (
                      subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold">Teachers</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Search teachers…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {filteredTeachers.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center">No teachers match your search</p>
              ) : (
                filteredTeachers.map((t) => {
                  const checked = selectedTeacherIds.includes(t.user_id);
                  return (
                    <label
                      key={t.user_id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                        checked ? 'bg-indigo-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(t.user_id)}
                        className="rounded border-slate-300"
                      />
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                        {t.user_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{t.user_name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {t.role.replace('_', ' ')}
                          {t.user_email ? ` • ${t.user_email}` : ''}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <p className="text-xs text-slate-500">
              {selectedTeacherIds.length} selected
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || teachers.length === 0}
            onClick={handleSubmit}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <UserCheck className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}