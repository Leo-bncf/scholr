import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as membershipsData from '@/data/memberships';
import * as submissionsData from '@/data/submissions';
import * as messagesData from '@/data/messages';
import * as attendanceData from '@/data/attendance';
import * as behaviorRecordsData from '@/data/behaviorRecords';
import * as gradebookData from '@/data/gradebook';
import * as assessmentSubmissionsData from '@/data/assessmentSubmissions';
import * as reportsData from '@/data/reports';
import * as casExperiencesData from '@/data/casExperiences';
import * as parentStudentLinksData from '@/data/parentStudentLinks';
import * as academicsData from '@/data/academics';
import * as classesData from '@/data/classes';
import * as adminData from '@/data/admin';
import * as fns from '@/data/functions';
import {
  ShieldAlert, Search, Loader2, Trash2, EyeOff, CheckCircle2,
  AlertCircle, UserX, FileX, User, BookOpen, ClipboardList,
  FileText, Sparkles, Link2, Users, GraduationCap, ScrollText
} from 'lucide-react';

function UserDataSummary({ result }) {
  if (!result) return null;
  const {
    memberships, submissions, messages, attendance, behavior,
    gradeItems, assessmentSubmissions, reports, casExperiences, parentLinks,
    cohortMemberships, classRosters, auditEntries
  } = result;
  const rows = [
    { label: 'School Memberships', count: memberships, icon: User },
    { label: 'Assignment Submissions', count: submissions, icon: FileX },
    { label: 'Messages Sent', count: messages, icon: FileX },
    { label: 'Attendance Records', count: attendance, icon: FileX },
    { label: 'Behavior Records', count: behavior, icon: FileX },
    { label: 'Grade Items', count: gradeItems, icon: BookOpen },
    { label: 'Assessment Submissions', count: assessmentSubmissions, icon: ClipboardList },
    { label: 'Reports', count: reports, icon: FileText },
    { label: 'CAS Experiences', count: casExperiences, icon: Sparkles },
    { label: 'Parent Links', count: parentLinks, icon: Link2 },
    { label: 'Cohort Memberships', count: cohortMemberships, icon: Users },
    { label: 'Class Rosters', count: classRosters, icon: GraduationCap },
    { label: 'Audit Log Entries', count: auditEntries, icon: ScrollText },
  ];
  return (
    <div className="mt-3 border scholr-rule rounded-md overflow-hidden">
      {rows.map(r => (
        <div key={r.label} className="flex items-center justify-between px-4 py-2.5 border-b scholr-rule-soft last:border-0 bg-white">
          <span className="text-sm scholr-muted">{r.label}</span>
          <span className="text-sm font-semibold scholr-ink">{r.count}</span>
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
    const [
      submissions, messages, attendance, behavior,
      gradeItems, assessmentSubmissions, reports, casExperiences,
      parentLinks, childLinks,
    ] = await Promise.all([
      submissionsData.where({ student_id: userId }),
      messagesData.where({ sender_id: userId }),
      attendanceData.whereRecords({ student_id: userId }),
      behaviorRecordsData.where({ student_id: userId }),
      gradebookData.whereGradeItems({ student_id: userId }),
      assessmentSubmissionsData.where({ student_id: userId }),
      reportsData.where({ student_id: userId }),
      casExperiencesData.where({ student_id: userId }),
      parentStudentLinksData.where({ parent_id: userId }),
      parentStudentLinksData.where({ student_id: userId }),
    ]);
    // Array memberships (cohorts.student_ids, classes.student_ids) and the
    // audit trail are resolved per school / per user, not by a single column.
    const [cohortBySchool, rosterBySchool] = await Promise.all([
      Promise.all(memberships.map(m => academicsData.listCohortsForStudent(m.school_id, userId))),
      Promise.all(memberships.map(m => classesData.listForStudent(m.school_id, userId))),
    ]);
    const cohortIds = cohortBySchool.flat().map(c => c.id);
    const classRosterIds = rosterBySchool.flat().map(c => c.id);
    const auditEntries = await adminData.listAuditLogsForUser(userId, { email: email.trim() });
    setFound({ userId, email: email.trim(), memberships });
    setSummary({
      memberships: memberships.length,
      submissions: submissions.length,
      messages: messages.length,
      attendance: attendance.length,
      behavior: behavior.length,
      gradeItems: gradeItems.length,
      assessmentSubmissions: assessmentSubmissions.length,
      reports: reports.length,
      casExperiences: casExperiences.length,
      parentLinks: parentLinks.length + childLinks.length,
      cohortMemberships: cohortIds.length,
      classRosters: classRosterIds.length,
      auditEntries: auditEntries.length,
      submissionIds: submissions.map(s => s.id),
      attendanceIds: attendance.map(a => a.id),
      behaviorIds: behavior.map(b => b.id),
      membershipIds: memberships.map(m => m.id),
      gradeItemIds: gradeItems.map(g => g.id),
      assessmentSubmissionIds: assessmentSubmissions.map(a => a.id),
      reportIds: reports.map(r => r.id),
      casExperienceIds: casExperiences.map(c => c.id),
      parentLinkIds: parentLinks.map(l => l.id),
      childLinkIds: childLinks.map(l => l.id),
      cohortIds,
      classRosterIds,
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
      await submissionsData.anonymiseStudentName(id, anonName);
    }
    // Anonymize attendance
    for (const id of summary.attendanceIds) {
      await attendanceData.update(id, { student_name: anonName });
    }
    // Anonymize behavior
    for (const id of summary.behaviorIds) {
      await behaviorRecordsData.update(id, { student_name: anonName });
    }
    // Anonymize grade items
    for (const id of summary.gradeItemIds) {
      await gradebookData.update(id, { student_name: anonName });
    }
    // Anonymize assessment submissions
    for (const id of summary.assessmentSubmissionIds) {
      await assessmentSubmissionsData.update(id, { student_name: anonName });
    }
    // Anonymize reports
    for (const id of summary.reportIds) {
      await reportsData.update(id, { student_name: anonName });
    }
    // Anonymize CAS experiences
    for (const id of summary.casExperienceIds) {
      await casExperiencesData.update(id, { student_name: anonName });
    }
    // Anonymize parent links on whichever side the subject is linked
    for (const id of summary.parentLinkIds) {
      await parentStudentLinksData.update(id, { parent_name: anonName });
    }
    for (const id of summary.childLinkIds) {
      await parentStudentLinksData.update(id, { student_name: anonName });
    }
    // Anonymize the audit trail rather than deleting it: the entries must
    // survive legal scrutiny, but with the subject's identity stripped.
    const auditAnonymised = await adminData.anonymiseAuditLogsForUser(found.userId, { email: found.email, anonEmail });
    const updatedCount = summary.membershipIds.length + summary.submissionIds.length + summary.attendanceIds.length + summary.behaviorIds.length + summary.gradeItemIds.length + summary.assessmentSubmissionIds.length + summary.reportIds.length + summary.casExperienceIds.length + summary.parentLinkIds.length + summary.childLinkIds.length + auditAnonymised;
    setActionResult({ type: 'success', message: `User data anonymized. ${updatedCount} records updated.` });
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
    for (const id of summary.gradeItemIds) await gradebookData.remove(id);
    for (const id of summary.assessmentSubmissionIds) await assessmentSubmissionsData.remove(id);
    for (const id of summary.reportIds) await reportsData.remove(id);
    for (const id of summary.casExperienceIds) await casExperiencesData.remove(id);
    for (const id of summary.parentLinkIds) await parentStudentLinksData.remove(id);
    for (const id of summary.childLinkIds) await parentStudentLinksData.remove(id);
    // Cohorts and class rosters hold the student's id in arrays; erasure means
    // removing that reference from each row, not deleting the row itself.
    let referencesRemoved = 0;
    for (const id of summary.cohortIds) referencesRemoved += await academicsData.removeCohortMember(id, found.userId);
    for (const id of summary.classRosterIds) referencesRemoved += await classesData.removeStudentRoster(id, found.userId);
    // The audit trail survives, with the subject's identity stripped.
    const auditAnonymised = await adminData.anonymiseAuditLogsForUser(found.userId, { email: found.email, anonEmail: `anon_${found.userId.slice(-6)}@redacted.invalid` });
    const total = summary.membershipIds.length + summary.submissionIds.length + summary.attendanceIds.length + summary.behaviorIds.length + summary.gradeItemIds.length + summary.assessmentSubmissionIds.length + summary.reportIds.length + summary.casExperienceIds.length + summary.parentLinkIds.length + summary.childLinkIds.length;
    let authNote = '';
    let authOk = false;
    try {
      const res = await fns.invoke('superAdminDeleteUser', { userId: found.userId });
      const errMsg = res?.error;
      const failures = res?.failures || [];
      if (errMsg) throw new Error(errMsg);
      if (failures.length > 0) throw new Error(failures[0].error || 'Delete failed');
      if (!res || res.success !== true) throw new Error('no confirmation returned');
      // The function also erases the user's remaining own records (account
      // state, notifications, Google connection, predicted grades, EE
      // milestones) so the auth delete is unobstructed — reflect that in the
      // count instead of pretending it didn't happen.
      const extraDeleted = Object.values(res?.extraDeleted ?? {}).reduce((a, b) => a + b, 0);
      let deletedNote = `${total + extraDeleted} records permanently deleted for this user.`;
      const fileErrors = res?.fileErrors || [];
      if (res?.filesRemoved > 0) deletedNote += ` ${res.filesRemoved} stored file(s) removed.`;
      if (fileErrors.length > 0) deletedNote += ` ${fileErrors.length} stored-file batch(es) failed to remove.`;
      if (referencesRemoved > 0) deletedNote += ` ${referencesRemoved} cohort/class roster reference(s) removed.`;
      if (auditAnonymised > 0) deletedNote += ` ${auditAnonymised} audit entr${auditAnonymised === 1 ? 'y' : 'ies'} anonymised.`;
      authNote = `${deletedNote} Their auth record was also deleted.`;
      authOk = true;
    } catch (err) {
      authNote = `${total} records permanently deleted for this user. Their auth record could not be deleted (` + (err?.message || 'unexpected error') + ').';
    }
    setActionResult({ type: authOk ? 'success' : 'error', message: authNote });
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
        <Label className="text-sm font-semibold scholr-ink mb-2 block">Look Up User by Email</Label>
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
            className="scholr-sunk hover:scholr-sunk text-white gap-2"
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
        <div className="border scholr-rule rounded-md overflow-hidden">
          <div className="px-4 py-3 scholr-sunk border-b scholr-rule flex items-center gap-2">
            <User className="w-4 h-4 scholr-muted" />
            <p className="text-sm font-semibold scholr-ink">{found.email}</p>
            <span className="text-xs scholr-faint ml-auto">{found.memberships.length} school(s)</span>
          </div>

          <div className="p-4 bg-white">
            <p className="text-xs font-semibold scholr-muted uppercase tracking-wide mb-2">Data Inventory</p>
            <UserDataSummary result={summary} />

            <div className="mt-5 space-y-3">
              {/* Anonymize */}
              <div className="p-3 border scholr-rule rounded-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold scholr-ink flex items-center gap-1.5">
                      <EyeOff className="w-4 h-4 text-amber-500" /> Anonymize Personal Data
                    </p>
                    <p className="text-xs scholr-muted mt-0.5">Replaces name and email fields with placeholder values. Records are retained for audit purposes.</p>
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