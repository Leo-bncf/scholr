import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as fns from '@/data/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Plus, Trash2, Mail, Users } from 'lucide-react';
import * as membershipsData from '@/data/memberships';

const ROLES = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'ib_coordinator', label: 'IB Coordinator' },
  { value: 'school_admin', label: 'School Admin' },
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent' },
];

export default function WizardStepInviteUsers({ schoolId, onDone }) {
  const queryClient = useQueryClient();
  const [inviting, setInviting] = useState(false);
  const [inviteRows, setInviteRows] = useState([
    { email: '', name: '', role: 'teacher' },
  ]);
  const [results, setResults] = useState([]);

  const { data: memberships = [], refetch } = useQuery({
    queryKey: ['memberships-wizard', schoolId],
    queryFn: () => membershipsData.where({ school_id: schoolId, status: 'active' }),
  });

  const teachers = memberships.filter(m => ['teacher', 'ib_coordinator'].includes(m.role));
  const students = memberships.filter(m => m.role === 'student');

  const addRow = () => setInviteRows(r => [...r, { email: '', name: '', role: 'teacher' }]);
  const removeRow = (i) => setInviteRows(r => r.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) => setInviteRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const handleInvite = async () => {
    const valid = inviteRows.filter(r => r.email.trim() && r.name.trim());
    if (!valid.length) return;
    setInviting(true);
    const newResults = [];

    for (const row of valid) {
      try {
        // Create membership record (actual invite is handled by the users page)
        await membershipsData.create({
          school_id: schoolId,
          user_email: row.email.trim(),
          user_name: row.name.trim(),
          role: row.role,
          status: 'pending',
        });
        // Send invite
        await fns.invoke('sendInvitation', { email: row.email.trim(), role: row.role });
        newResults.push({ email: row.email, status: 'success' });
      } catch {
        newResults.push({ email: row.email, status: 'error' });
      }
    }

    setResults(newResults);
    await refetch();
    queryClient.invalidateQueries({ queryKey: ['onboarding-status', schoolId] });
    setInviting(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Invite Your Team</h3>
        <p className="text-sm text-slate-500">Send invitations to teachers, coordinators, and students. They'll receive an email to create their account.</p>
      </div>

      {(teachers.length > 0 || students.length > 0) && (
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-slate-700">{teachers.length} staff</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-slate-700">{students.length} students</span>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-1.5">
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${r.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {r.status === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Mail className="w-4 h-4 shrink-0" />}
              <span>{r.email} — {r.status === 'success' ? 'Invited!' : 'Failed'}</span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Invite Users</p>

        <div className="space-y-3">
          {inviteRows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Full Name</Label>
                <Input value={row.name} onChange={e => updateRow(i, 'name', e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <Label className="text-xs text-slate-600 mb-1 block">Email</Label>
                <Input type="email" value={row.email} onChange={e => updateRow(i, 'email', e.target.value)} placeholder="jane@school.edu" />
              </div>
              <div className="w-36">
                <Label className="text-xs text-slate-600 mb-1 block">Role</Label>
                <Select value={row.role} onValueChange={val => updateRow(i, 'role', val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeRow(i)} className="text-slate-400 h-9 w-9">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Person
          </Button>
          <Button
            onClick={handleInvite}
            disabled={inviting || inviteRows.every(r => !r.email.trim())}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 gap-1.5"
          >
            {inviting ? 'Sending…' : <><Mail className="w-3.5 h-3.5" /> Send Invitations</>}
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {teachers.length > 0 && (
          <Button onClick={onDone} className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Done — Complete Setup
          </Button>
        )}
        <Button variant="outline" onClick={onDone} className="flex-1">
          Skip for now
        </Button>
      </div>
    </div>
  );
}