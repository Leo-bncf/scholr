import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as membershipsData from '@/data/memberships';
import * as submissionsData from '@/data/submissions';
import * as messagesData from '@/data/messages';
import * as attendanceData from '@/data/attendance';
import * as behaviorRecordsData from '@/data/behaviorRecords';
import {
  ShieldAlert, Search, Loader2, Trash2, EyeOff, CheckCircle2,
  AlertCircle, UserX, FileX, User
} from 'lucide-react';

function UserDataSummary({ result }) {
  if (!result) return null;
  const { memberships, submissions, messages, attendance, behavior } = result;
  const rows = [
    { label: 'School Memberships', count: memberships, icon: User },
    { label: 'Assignment Submissions', count: submissions, icon: FileX },
    { label: 'Messages Sent', count: messages, icon: FileX },
    { label: 'Attendance Records', count: attendance, icon: FileX },
    { label: 'Behavior Records', count: behavior, icon: FileX },
  ];
  return (
    <div className="mt-3 border border-slate-200 rounded-md overflow-hidden">
      {rows.map(r => (
        <div key={r.label} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 last:border-0 bg-white">
          <span className="text-sm text-slate-600">{r.label}</span>
          <span className="text-sm font-semibold text-slate-900">{r.count}</span>
        </div>
      ))}
    </div>
  );
}

export default function GdprPrivacyTools() {
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(null);
  const [summary, setSummary] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const [anonymizing, setAnonymizing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const reset = () => {
    setFound(null);
    setSummary(null);
    setSearchError(null);
    setActionResult(null);
    setConfirmDelete(false);
  };

  const handleSearch = async () => {
    if (!email.trim()) return;
    setSearching(true);
    reset();
    const memberships = await membershipsData.where({ user_email: email.trim() });
    if (memberships.length === 0) {
      setSearchError('No user found with that email address.');
      setSearching(false);
      return;
    }
    const userId = memberships[0].user_id;
    const [submissions, messages, attendance, behavior] = await Promise.all([
      submissionsData.where({ student_id: userId }),
      messagesData.where({ sender_id: userId }),
      attendanceData.whereRecords({ student_id: userId }),
      behaviorRecordsData.where({ student_id: userId }),
    ]);
    setFound({ userId, email: email.trim(), memberships });
    setSummary({
      memberships: memberships.length,
      submissions: submissions.length,
      messages: messages.length,
      attendance: attendance.length,
      behavior: behavior.length,
      submissionIds: submissions.map(s => s.id),
      attendanceIds: attendance.map(a => a.id),
      behaviorIds: behavior.map(b => b.id),
      membershipIds: memberships.map(m => m.id),
    });
    setSearching(false);
  };

  const handleAnonymize = async () => {
    if (!found) return;
    setAnonymizing(true);
    setActionResult(null);
    const anonName = `Anonymized User`;
    const anonEmail = `anon_${found.userId.slice(-6)}@redacted.invalid`;
    // Anonymize memberships
    for (const id of summary.membershipIds) {
      await membershipsData.update(id, { user_name: anonName, user_email: anonEmail });
    }
    // Anonymize submissions
    for (const id of summary.submissionIds) {
      await submissionsData.update(id, { student_name: anonName });
    }
    // Anonymize attendance
    for (const id of summary.attendanceIds) {
      await attendanceData.update(id, { student_name: anonName });
    }
    // Anonymize behavior
    for (const id of summary.behaviorIds) {
      await behaviorRecordsData.update(id, { student_name: anonName });
    }
    setActionResult({ type: 'success', message: `User data anonymized. ${summary.membershipIds.length + summary.submissionIds.length + summary.attendanceIds.length + summary.behaviorIds.length} records updated.` });
    setAnonymizing(false);
    setFound(null);
    setSummary(null);
    setEmail('');
  };

  const handleDelete = async () => {
    if (!found || !confirmDelete) return;
    setDeleting(true);
    setActionResult(null);
    for (const id of summary.membershipIds) await membershipsData.remove(id);
    for (const id of summary.submissionIds) await submissionsData.remove(id);
    for (const id of summary.attendanceIds) await attendanceData.remove(id);
    for (const id of summary.behaviorIds) await behaviorRecordsData.remove(id);
    const total = summary.membershipIds.length + summary.submissionIds.length + summary.attendanceIds.length + summary.behaviorIds.length;
    setActionResult({ type: 'success', message: `${total} records permanently deleted for this user.` });
    setDeleting(false);
    setFound(null);
    setSummary(null);
    setEmail('');
    setConfirmDelete(false);
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
        <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          Use these tools to fulfil GDPR/CCPA data subject requests. Anonymization replaces personal identifiers with placeholder values. Deletion permanently removes all linked records. Both actions are irreversible.
        </p>
      </div>

      {/* Search */}
      <div>
        <Label className="text-sm font-semibold text-slate-800 mb-2 block">Look Up User by Email</Label>
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={e => { setEmail(e.target.value); reset(); }}
            placeholder="user@school.edu"
            className="flex-1"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={searching || !email.trim()}
            className="bg-slate-800 hover:bg-slate-900 text-white gap-2"
            size="sm"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Search
          </Button>
        </div>
        {searchError && (
          <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {searchError}
          </div>
        )}
      </div>

      {/* Action result */}
      {actionResult && (
        <div className={`flex items-start gap-2 p-3 rounded-md border text-sm ${actionResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {actionResult.message}
        </div>
      )}

      {/* Found user */}
      {found && summary && (
        <div className="border border-slate-200 rounded-md overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-500" />
            <p className="text-sm font-semibold text-slate-800">{found.email}</p>
            <span className="text-xs text-slate-400 ml-auto">{found.memberships.length} school(s)</span>
          </div>

          <div className="p-4 bg-white">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Data Inventory</p>
            <UserDataSummary result={summary} />

            <div className="mt-5 space-y-3">
              {/* Anonymize */}
              <div className="p-3 border border-slate-200 rounded-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                      <EyeOff className="w-4 h-4 text-amber-500" /> Anonymize Personal Data
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Replaces name and email fields with placeholder values. Records are retained for audit purposes.</p>
                  </div>
                  <Button
                    onClick={handleAnonymize}
                    disabled={anonymizing || deleting}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50 gap-1.5 text-xs"
                  >
                    {anonymizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <EyeOff className="w-3 h-3" />}
                    Anonymize
                  </Button>
                </div>
              </div>

              {/* Delete */}
              <div className="p-3 border border-red-200 rounded-md bg-red-50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-red-800 flex items-center gap-1.5">
                      <UserX className="w-4 h-4 text-red-500" /> Delete All User Data
                    </p>
                    <p className="text-xs text-red-600 mt-0.5">Permanently deletes all records linked to this user. This cannot be undone.</p>
                    {!confirmDelete && (
                      <button onClick={() => setConfirmDelete(true)} className="text-xs text-red-600 underline mt-1.5 hover:text-red-800">
                        I understand — show delete button
                      </button>
                    )}
                  </div>
                  {confirmDelete && (
                    <Button
                      onClick={handleDelete}
                      disabled={deleting || anonymizing}
                      size="sm"
                      className="flex-shrink-0 bg-red-600 hover:bg-red-700 text-white gap-1.5 text-xs"
                    >
                      {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      Confirm Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}