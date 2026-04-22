import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Copy, Check, User, Building2 } from 'lucide-react';

const ROLES = [
  { value: 'user', label: 'User (no school)' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'school_admin', label: 'School Admin' },
  { value: 'ib_coordinator', label: 'IB Coordinator' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent' },
];

export default function ManageUserDialog({ open, onOpenChange, user, onUserUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const [newRole, setNewRole] = useState(user?.role || 'user');
  const [newSchoolId, setNewSchoolId] = useState(user?.active_school_id || '');
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(false);

  useEffect(() => {
    if (user) {
      setNewRole(user.role || 'user');
      setNewSchoolId(user.active_school_id || '');
    }
    setError('');
    setSuccess('');
  }, [user, open]);

  useEffect(() => {
    if (open) {
      setLoadingSchools(true);
      base44.entities.School.list('-name', 1000).then(list => {
        setSchools(list);
        setLoadingSchools(false);
      }).catch(() => setLoadingSchools(false));
    }
  }, [open]);

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      const payload = { userId: user.id };
      if (newRole !== user.role) payload.role = newRole;
      if (newSchoolId !== (user.active_school_id || '')) payload.schoolId = newSchoolId || null;

      if (Object.keys(payload).length === 1) {
        setError('No changes to save');
        setLoading(false);
        return;
      }

      const response = await base44.functions.invoke('adminUpdateUser', payload);
      console.log('adminUpdateUser response:', response);

      // Surface backend-reported errors that the SDK didn't throw on
      const errMsg = response?.data?.error || response?.error;
      if (errMsg) {
        throw new Error(errMsg);
      }

      const schoolName = newSchoolId ? (schools.find(s => s.id === newSchoolId)?.name || 'selected school') : null;
      setSuccess(
        payload.schoolId !== undefined
          ? (newSchoolId ? `Assigned to ${schoolName}.` : 'Removed from school.')
          : 'User updated successfully.'
      );
      setTimeout(() => {
        onOpenChange(false);
        if (onUserUpdated) onUserUpdated();
      }, 1200);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(user.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasChanges = newRole !== (user?.role || 'user') || newSchoolId !== (user?.active_school_id || '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-4 h-4" /> Manage User
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800 ml-3 text-sm">{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 border-green-200">
              <Check className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800 ml-3 text-sm">{success}</AlertDescription>
            </Alert>
          )}

          {/* User Info */}
          <div className="p-3 bg-slate-50 rounded-lg space-y-2 border">
            <div>
              <p className="text-xs text-slate-500">Name</p>
              <p className="font-semibold text-slate-900 text-sm">{user.full_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 text-sm break-all">{user.email}</p>
                <Button onClick={handleCopyEmail} size="icon" variant="ghost" className="h-6 w-6 flex-shrink-0">
                  {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500">User ID</p>
              <p className="font-mono text-slate-600 text-xs break-all">{user.id}</p>
            </div>
          </div>

          {/* Change Role */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Role</Label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Current: <strong>{user.role || 'user'}</strong></p>
          </div>

          {/* Assign to School */}
          <div>
            <Label className="text-sm font-semibold mb-2 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Assign to School
            </Label>
            <select
              value={newSchoolId}
              onChange={(e) => setNewSchoolId(e.target.value)}
              disabled={loading || loadingSchools}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">— No School —</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {user.active_school_id && (
              <p className="text-xs text-slate-500 mt-1">
                Current: <strong>{schools.find(s => s.id === user.active_school_id)?.name || user.active_school_id}</strong>
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !hasChanges}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}