import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import * as behaviorPoliciesData from '@/data/behaviorPolicies';
import * as behaviorRecordsData from '@/data/behaviorRecords';

export default function CreateBehaviorRecord({ schoolId, studentId, studentName, recorderId, recorderName, onClose, trigger }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'note',
    category: 'other',
    incident_type_id: '',
    title: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    severity: 'low',
    visible_to_student: false,
    visible_to_parent: false,
    staff_only: false,
    action_taken: '',
    follow_up_required: false,
  });

  const { data: policies = [] } = useQuery({
    queryKey: ['behavior-policy', schoolId],
    queryFn: () => behaviorPoliciesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });
  const policy = policies[0] || null;
  const activeTypes = policy?.incident_types?.filter(t => t.active) || [];
  const activeSeverities = policy?.severity_levels?.filter(s => s.active) || [];

  const handleIncidentTypeChange = (typeId) => {
    const incType = activeTypes.find(t => t.id === typeId);
    if (incType) {
      setForm(f => ({
        ...f,
        incident_type_id: typeId,
        visible_to_student: incType.staff_only ? false : incType.default_visible_to_student,
        visible_to_parent: incType.staff_only ? false : incType.default_visible_to_parent,
        staff_only: incType.staff_only,
      }));
    } else {
      setForm(f => ({ ...f, incident_type_id: typeId }));
    }
  };

  const selectedIncidentType = activeTypes.find(t => t.id === form.incident_type_id);
  const visibilityLocked = selectedIncidentType?.staff_only || (!policy?.allow_teacher_visibility_override && !!selectedIncidentType);

  const createMutation = useMutation({
    mutationFn: (data) => behaviorRecordsData.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-behavior'] });
      queryClient.invalidateQueries({ queryKey: ['parent-child-behavior'] });
      setOpen(false);
      if (onClose) onClose();
      setForm({
        type: 'note',
        category: 'other',
        title: '',
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        severity: 'low',
        visible_to_student: false,
        visible_to_parent: false,
        action_taken: '',
        follow_up_required: false,
      });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      ...form,
      school_id: schoolId,
      student_id: studentId,
      student_name: studentName,
      recorded_by: recorderId,
      recorded_by_name: recorderName,
    });
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> New Record
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Behavior Record</DialogTitle>
            <p className="text-sm text-slate-500">For: {studentName}</p>
          </DialogHeader>

          <div className="space-y-4">
            {activeTypes.length > 0 && (
              <div>
                <Label className="text-sm font-semibold">Incident Type</Label>
                <Select value={form.incident_type_id} onValueChange={handleIncidentTypeChange}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select incident type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedIncidentType?.staff_only && (
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-3 py-1.5">
                    <EyeOff className="w-3 h-3" /> This type is staff-only. Visibility is locked.
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive Recognition</SelectItem>
                    <SelectItem value="concern">Concern</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="note">General Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="conduct">Conduct</SelectItem>
                    <SelectItem value="participation">Participation</SelectItem>
                    <SelectItem value="achievement">Achievement</SelectItem>
                    <SelectItem value="attendance_related">Attendance Related</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Date</Label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Title *</Label>
              <Input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Brief title..."
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Description</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Detailed description..."
                rows={4}
                className="mt-1.5"
              />
            </div>

            {(form.type === 'concern' || form.type === 'incident') && (
              <div>
                <Label className="text-sm font-semibold">Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label className="text-sm font-semibold">Action Taken</Label>
              <Textarea
                value={form.action_taken}
                onChange={e => setForm({ ...form, action_taken: e.target.value })}
                placeholder="Actions or follow-up steps..."
                rows={2}
                className="mt-1.5"
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-semibold">Visibility</Label>
              {visibilityLocked ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-600">
                  <EyeOff className="w-4 h-4 text-rose-500" />
                  {selectedIncidentType?.staff_only ? 'Staff-only: visibility locked by school policy.' : 'Visibility override disabled by school policy.'}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="visible_student" checked={form.visible_to_student}
                      onChange={e => setForm({ ...form, visible_to_student: e.target.checked })} className="w-4 h-4" />
                    <Label htmlFor="visible_student" className="text-sm cursor-pointer">Visible to student</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="visible_parent" checked={form.visible_to_parent}
                      onChange={e => setForm({ ...form, visible_to_parent: e.target.checked })} className="w-4 h-4" />
                    <Label htmlFor="visible_parent" className="text-sm cursor-pointer">Visible to parents</Label>
                  </div>
                </>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="follow_up"
                  checked={form.follow_up_required}
                  onChange={e => setForm({ ...form, follow_up_required: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="follow_up" className="text-sm cursor-pointer">
                  Follow-up required
                </Label>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={!form.title || createMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}