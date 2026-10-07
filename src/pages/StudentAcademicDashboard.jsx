import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import AppShell, { Segmented } from '@/components/app/AppShell';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, TrendingUp, ClipboardList, Loader2, Clock, ChevronDown, ChevronUp, Send
} from 'lucide-react';
import PerformanceTrends from '@/components/student/PerformanceTrends';
import TermReportExport from '@/components/student/TermReportExport';
import { format, isPast } from 'date-fns';
import StudentSubmission from '@/components/assignment/StudentSubmission';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getStudentSidebarLinks } from '@/components/app/studentSidebarLinks';
import * as gradebookData from '@/data/gradebook';
import * as assignmentsData from '@/data/assignments';
import * as submissionsData from '@/data/submissions';
import * as classesData from '@/data/classes';

// ── Helpers ──────────────────────────────────────────────────────────────────

function pct(score, max) {
  if (score == null || !max) return null;
  return ((score / max) * 100).toFixed(1);
}

function scoreColor(p) {
  if (p >= 70) return 'text-emerald-700';
  if (p >= 50) return 'text-amber-700';
  return 'text-red-700';
}

// ── Grade Card ────────────────────────────────────────────────────────────────

function GradeCard({ grade }) {
  const [expanded, setExpanded] = useState(false);
  const p = pct(grade.score, grade.max_score);
  const hasExtra = grade.comment || grade.criteria_scores?.length > 0;

  return (
    <div className="bg-white rounded-xl border scholr-rule overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold scholr-ink truncate">{grade.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {grade.class_name && <span className="text-xs scholr-muted">{grade.class_name}</span>}
            {grade.type && <Badge variant="outline" className="text-xs capitalize">{grade.type?.replace('_', ' ')}</Badge>}
            {grade.ib_grade && <Badge className="scholr-accent-sf scholr-accent border-0 text-xs">IB {grade.ib_grade}/7</Badge>}
          </div>
          {grade.created_at && (
            <p className="text-xs scholr-faint mt-1">{format(new Date(grade.created_at), 'MMM d, yyyy')}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {grade.score != null ? (
            <>
              <p className={`text-2xl font-bold ${scoreColor(p)}`}>{grade.score}<span className="text-sm font-normal scholr-faint">/{grade.max_score}</span></p>
              {p && <p className={`text-sm font-semibold ${scoreColor(p)}`}>{p}%</p>}
            </>
          ) : (
            <span className="scholr-faint text-sm">—</span>
          )}
        </div>
      </div>

      {hasExtra && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full px-4 py-2 flex items-center gap-1.5 text-xs scholr-accent font-medium hover:scholr-accent-sf border-t scholr-rule-soft transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide' : 'Show'} feedback & details
          </button>
          {expanded && (
            <div className="px-4 pb-4 space-y-3 border-t scholr-rule-soft">
              {grade.comment && (
                <div className="mt-3">
                  <p className="text-xs font-semibold scholr-body mb-1">Teacher Feedback</p>
                  <p className="text-sm scholr-muted scholr-sunk rounded-lg p-3">{grade.comment}</p>
                </div>
              )}
              {grade.criteria_scores?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold scholr-body mb-2">Rubric Criteria</p>
                  <div className="space-y-2">
                    {grade.criteria_scores.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="scholr-body">{c.criterion_name}</span>
                        <span className={`font-semibold ${scoreColor(pct(c.score, c.max_score))}`}>{c.score}/{c.max_score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Grades Tab ────────────────────────────────────────────────────────────────

function GradesTab({ schoolId, userId, classes }) {
  const [classFilter, setClassFilter] = useState('all');

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['student-grades-academic', schoolId, userId],
    queryFn: () => gradebookData.listForStudent(schoolId, userId),
    enabled: !!schoolId && !!userId,
  });

  const classMap = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes]);
  const gradesWithClass = useMemo(() => grades.map(g => ({ ...g, class_name: classMap[g.class_id] || '' })), [grades, classMap]);
  const filtered = useMemo(() => classFilter === 'all' ? gradesWithClass : gradesWithClass.filter(g => g.class_id === classFilter), [gradesWithClass, classFilter]);

  const validScores = filtered.filter(g => g.score != null && g.max_score);
  const avg = validScores.length > 0 ? (validScores.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / validScores.length).toFixed(1) : null;

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin scholr-accent" /></div>;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {avg && (
            <div className="scholr-accent-sf border scholr-accent-rule rounded-xl px-5 py-3 flex items-center gap-3">
              <div>
                <p className="text-xs font-semibold scholr-accent">Average Percentage</p>
                <p className="text-2xl font-bold scholr-accent">{avg}%</p>
              </div>
            </div>
          )}
          <p className="text-sm scholr-muted">{filtered.length} grade{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-48 h-9 text-sm"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 scholr-faint">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 scholr-faint" />
          <p>No grades available yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(g => <GradeCard key={g.id} grade={g} />)}
        </div>
      )}
    </div>
  );
}

// ── Predicted Grades Tab ──────────────────────────────────────────────────────

function PredictedTab({ schoolId, userId }) {
  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['student-predicted', schoolId, userId],
    queryFn: () => gradebookData.listPredicted(schoolId, { studentId: userId }),
    enabled: !!schoolId && !!userId,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin scholr-accent" /></div>;

  if (predictions.length === 0) {
    return (
      <div className="text-center py-16 scholr-faint">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 scholr-faint" />
        <p>No predicted grades have been shared with you yet</p>
      </div>
    );
  }

  const avg = (predictions.reduce((s, p) => s + (p.predicted_ib_grade || 0), 0) / predictions.length).toFixed(1);

  return (
    <div className="space-y-5">
      <div className="scholr-accent-sf border scholr-accent-rule rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold scholr-accent">Predicted IB Average</p>
          <p className="text-4xl font-bold scholr-accent mt-0.5">{avg}<span className="text-lg scholr-accent">/7</span></p>
          <p className="text-xs scholr-accent mt-1">Based on {predictions.length} subject{predictions.length !== 1 ? 's' : ''}</p>
        </div>
        <TrendingUp className="w-10 h-10 scholr-accent" />
      </div>

      <div className="space-y-3">
        {predictions.map(pred => (
          <div key={pred.id} className="bg-white rounded-xl border scholr-rule p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-semibold scholr-ink">{pred.class_name || 'Subject'}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs scholr-muted">By {pred.teacher_name || 'Teacher'}</span>
                  {pred.entry_date && <span className="text-xs scholr-faint">· {format(new Date(pred.entry_date), 'd MMM yyyy')}</span>}
                </div>
                {pred.rationale && (
                  <p className="text-sm scholr-muted mt-2 italic">"{pred.rationale}"</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs scholr-muted block mb-1">Predicted</span>
                <span className="text-3xl font-bold text-violet-700">
                  {pred.predicted_ib_grade}
                </span>
                <span className="text-sm scholr-muted font-normal">/7</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Assignments Tab ───────────────────────────────────────────────────────────

function AssignmentsTab({ schoolId, userId, userName, classes }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [submittingAssignment, setSubmittingAssignment] = useState(null);

  const { data: assignments = [], isLoading: loadingA } = useQuery({
    queryKey: ['student-all-assignments', schoolId, userId],
    queryFn: () => assignmentsData.listPublishedForClasses(classes.map(c => c.id)),
    enabled: !!schoolId && classes.length > 0,
  });

  const { data: submissions = [], isLoading: loadingS } = useQuery({
    queryKey: ['student-all-submissions', schoolId, userId],
    queryFn: () => submissionsData.where({ school_id: schoolId, student_id: userId }),
    enabled: !!schoolId && !!userId,
  });

  const classMap = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes]);
  const submissionMap = useMemo(() => Object.fromEntries(submissions.map(s => [s.assignment_id, s])), [submissions]);

  const enriched = useMemo(() => assignments.map(a => {
    const sub = submissionMap[a.id];
    const overdue = a.due_date && isPast(new Date(a.due_date));
    const status = sub ? sub.status : (overdue ? 'missing' : 'pending');
    return { ...a, class_name: classMap[a.class_id] || '', submission: sub, displayStatus: status };
  }).sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  }), [assignments, classMap, submissionMap]);

  const filtered = useMemo(() => enriched.filter(a => {
    const statusOk = statusFilter === 'all' || a.displayStatus === statusFilter;
    const classOk = classFilter === 'all' || a.class_id === classFilter;
    return statusOk && classOk;
  }), [enriched, statusFilter, classFilter]);

  const counts = useMemo(() => ({
    missing: enriched.filter(a => a.displayStatus === 'missing').length,
    pending: enriched.filter(a => a.displayStatus === 'pending').length,
    submitted: enriched.filter(a => ['submitted', 'late', 'returned'].includes(a.displayStatus)).length,
  }), [enriched]);

  const statusBadge = {
    submitted: 'bg-emerald-100 text-emerald-700',
    late: 'bg-amber-100 text-amber-700',
    returned: 'bg-blue-100 text-blue-700',
    missing: 'bg-red-100 text-red-700',
    pending: 'scholr-sunk scholr-muted',
    draft: 'scholr-sunk scholr-muted',
  };

  const statusLabel = {
    submitted: 'Submitted', late: 'Late', returned: 'Returned',
    missing: 'Missing', pending: 'To Do', draft: 'Draft',
  };

  if (loadingA || loadingS) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin scholr-accent" /></div>;

  const selectedSub = submittingAssignment ? submissionMap[submittingAssignment.id] : null;

  return (
    <div className="space-y-5">
      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Missing', count: counts.missing, color: 'border-red-200 bg-red-50 text-red-700', filter: 'missing' },
          { label: 'To Do', count: counts.pending, color: 'border-amber-200 bg-amber-50 text-amber-700', filter: 'pending' },
          { label: 'Submitted', count: counts.submitted, color: 'border-emerald-200 bg-emerald-50 text-emerald-700', filter: 'submitted' },
        ].map(({ label, count, color, filter }) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(statusFilter === filter ? 'all' : filter)}
            className={`border rounded-xl p-4 text-left transition-colors ${color} ${statusFilter === filter ? 'ring-2 ring-offset-1 ring-current' : ''}`}
          >
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-semibold mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm scholr-muted">{filtered.length} assignment{filtered.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="w-44 h-9 text-sm"><SelectValue placeholder="All classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 scholr-faint">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 scholr-faint" />
          <p>No assignments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className="bg-white rounded-xl border scholr-rule p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[a.displayStatus]}`}>
                    {statusLabel[a.displayStatus]}
                  </span>
                  {a.class_name && <span className="text-xs scholr-muted">{a.class_name}</span>}
                </div>
                <p className="font-semibold scholr-ink truncate text-sm">{a.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs scholr-muted">
                  {a.due_date && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due {format(new Date(a.due_date), 'd MMM yyyy, h:mm a')}
                    </span>
                  )}
                  {a.max_points && <span>Max: {a.max_points} pts</span>}
                </div>
              </div>

              <div className="flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => setSubmittingAssignment(a)}>
                  <Send className="w-3.5 h-3.5 mr-1" />
                  {a.submission ? 'View Submission' : 'Submit'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submission Dialog */}
      {submittingAssignment && (
        <Dialog open={!!submittingAssignment} onOpenChange={open => !open && setSubmittingAssignment(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{submittingAssignment.title}</DialogTitle>
            </DialogHeader>
            <StudentSubmission
              assignment={submittingAssignment}
              submission={selectedSub}
              userId={userId}
              userName={userName}
              schoolId={schoolId}
              onSubmitted={() => setSubmittingAssignment(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StudentAcademicDashboard() {
  const { user, school, schoolId, curriculum } = useUser();
  const studentLinks = getStudentSidebarLinks(curriculum);
  const [activeTab, setActiveTab] = useState('grades');

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['student-classes-academic', schoolId, user?.id],
    queryFn: () => classesData.listForStudent(schoolId, user?.id),
    enabled: !!schoolId && !!user?.id,
  });

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <AppSidebar links={studentLinks} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
      <div className="app-offset">
        <AppShell
          eyebrow="Academic Records & Feedback"
          title="Academic Dashboard"
          actions={
            <Segmented
              label="Academic Tabs"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { label: 'Grades & Feedback', value: 'grades' },
                { label: 'Predicted Grades', value: 'predicted' },
                { label: 'Assignments', value: 'assignments' },
                { label: 'Analytics', value: 'analytics' },
                { label: 'Export Report', value: 'export' },
              ]}
            />
          }
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin scholr-accent" />
            </div>
          ) : (
            <>
              {activeTab === 'grades' && (
                <GradesTab schoolId={schoolId} userId={user?.id} classes={classes} />
              )}
              {activeTab === 'predicted' && (
                <PredictedTab schoolId={schoolId} userId={user?.id} />
              )}
              {activeTab === 'assignments' && (
                <AssignmentsTab schoolId={schoolId} userId={user?.id} userName={user?.full_name} classes={classes} />
              )}
              {activeTab === 'analytics' && (
                <PerformanceTrends schoolId={schoolId} userId={user?.id} classes={classes} />
              )}
              {activeTab === 'export' && (
                <TermReportExport
                  schoolId={schoolId}
                  userId={user?.id}
                  userName={user?.full_name}
                  schoolName={school?.name}
                  classes={classes}
                />
              )}
            </>
          )}
        </AppShell>
      </div>
    </RoleGuard>
  );
}