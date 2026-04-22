import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function CreateClassDialog({
  open,
  onOpenChange,
  subjects = [],
  academicYears = [],
  onCreate,
  isCreating,
}) {
  const [form, setForm] = useState({
    name: '',
    section: '',
    subject_id: '',
    academic_year_id: '',
    room: '',
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: '',
        section: '',
        subject_id: '',
        academic_year_id: academicYears.find((y) => y.is_current)?.id || '',
        room: '',
      });
    }
  }, [open, academicYears]);

  const canSubmit = form.name.trim().length > 0 && !isCreating;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onCreate({
      name: form.name.trim(),
      section: form.section.trim() || undefined,
      subject_id: form.subject_id || undefined,
      academic_year_id: form.academic_year_id || undefined,
      room: form.room.trim() || undefined,
      status: 'active',
      student_ids: [],
      teacher_ids: [],
      subject_teacher_assignments: [],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label className="text-xs font-semibold">Class Name *</Label>
            <Input
              autoFocus
              placeholder="e.g. Biology HL — DP2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Section</Label>
              <Input
                placeholder="A"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Room</Label>
              <Input
                placeholder="B-204"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {subjects.length > 0 && (
            <div>
              <Label className="text-xs font-semibold">Primary Subject</Label>
              <Select
                value={form.subject_id}
                onValueChange={(v) => setForm({ ...form, subject_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose subject…" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {academicYears.length > 0 && (
            <div>
              <Label className="text-xs font-semibold">Academic Year</Label>
              <Select
                value={form.academic_year_id}
                onValueChange={(v) => setForm({ ...form, academic_year_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose year…" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((y) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name} {y.is_current ? '(current)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {isCreating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Class
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}