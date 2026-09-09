import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings, Archive } from 'lucide-react';
import * as classesData from '@/data/classes';
import * as fns from '@/data/functions';

export default function ClassSettings({ classData, isTeacher }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: classData.name,
    section: classData.section || '',
    room: classData.room || '',
    schedule_info: classData.schedule_info || '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => classesData.update(classData.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-details'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => fns.invoke('updateClassStatus', { classId: classData.id, status: 'archived' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-details'] });
      queryClient.invalidateQueries({ queryKey: ['school-classes'] });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  const handleArchive = () => {
    if (window.confirm('Are you sure you want to archive this class? This action can be reversed later.')) {
      archiveMutation.mutate();
    }
  };

  if (!isTeacher) {
    return (
      <div className="p-6 text-center text-slate-400">
        <Settings className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>Settings are only available to teachers</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900 mb-6">Class Settings</h2>
      
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div>
          <Label>Class Name</Label>
          <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="mt-1" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Section</Label>
            <Input value={form.section} onChange={e => setForm({...form, section: e.target.value})} className="mt-1" />
          </div>
          <div>
            <Label>Room</Label>
            <Input value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="mt-1" />
          </div>
        </div>

        <div>
          <Label>Schedule Information</Label>
          <Input value={form.schedule_info} onChange={e => setForm({...form, schedule_info: e.target.value})} placeholder="e.g. Mon/Wed/Fri 9:00-10:30" className="mt-1" />
        </div>

        <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
          {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </div>

      <div className="bg-amber-50 rounded-xl border border-amber-200 p-6 mt-6">
        <h3 className="font-semibold text-amber-900 mb-2">Archive Class</h3>
        <p className="text-sm text-amber-700 mb-4">Archive this class. This action can be reversed later.</p>
        <Button variant="outline" size="sm" onClick={handleArchive} disabled={archiveMutation.isPending} className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200">
          {archiveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
          Archive Class
        </Button>
      </div>
    </div>
  );
}