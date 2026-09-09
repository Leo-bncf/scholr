import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3,
  TrendingUp, ClipboardList, Loader2, Clock, ChevronDown, ChevronUp, Send, Download
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

const confidenceBadge = {
  high: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  medium: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-amber-100 text-amber-700 border-amber-200',
};

// ── Grade Card ────────────────────────────────────────────────────────────────

function GradeCard({ grade }) {
  const [expanded, setExpanded] = useState(false);
  const p = pct(grade.score, grade.max_score);
  const hasExtra = grade.comment || grade.criteria_scores?.length > 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{grade.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {grade.class_name && <span className="text-xs text-slate-500">{grade.class_name}</span>}
            {grade.type && <Badge variant="outline" className="text-xs capitalize">{grade.type?.replace('_', ' ')}</Badge>}
            {grade.ib_grade && <Badge className="bg-violet-50 text-violet-700 border-0 text-xs">IB {grade.ib_grade}/7</Badge>}
          </div>
          {grade.created_at && (
            <p className="text-xs text-slate-400 mt-1">{format(new Date(grade.created_at), 'MMM d, yyyy')}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {grade.score != null ? (
            <>
              <p className={`text-2xl font-bold ${scoreColor(p)}`}>{grade.score}<span className="text-sm font-normal text-slate-400">/{grade.max_score}</span></p>
              {p && <p className={`text-sm font-semibold ${scoreColor(p)}`}>{p}%</p>}
            </>
          ) : (
            <span className="text-slate-400 text-sm">—</span>
          )}
        </div>
      </div>

      {hasExtra && (
        <>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-full px-4 py-2 flex items-center gap-1.5 text-xs text-indigo-600 font-medium hover:bg-indigo-50 border-t border-slate-100 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {expanded ? 'Hide' : 'Show'} feedback & details
          </button>
          {expanded && (
            <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
              {grade.comment && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Teacher Feedback</p>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{grade.comment}</p>
                </div>
              )}
              {grade.criteria_scores?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Rubric Criteria</p>
                  <div className="space-y-2">
                    {grade.criteria_scores.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-slate-700">{c.criterion_name}</span>
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
    queryFn: () => gradebookData.whereGradeItems({
      school_id: schoolId,
      student_id: userId,
      visible_to_student: true,
      status: 'published'
    }, { order: 'created_at', ascending: false }),
    enabled: !!schoolId && !!userId,
  });

  const classMap = useMemo(() => Object.fromEntries(classes.map(c => [c.id, c.name])), [classes]);
  const gradesWithClass = useMemo(() => grades.map(g => ({ ...g, class_name: classMap[g.class_id] || '' })), [grades, classMap]);
  const filtered = useMemo(() => classFilter === 'all' ? gradesWithClass : gradesWithClass.filter(g => g.class_id === classFilter), [gradesWithClass, classFilter]);

  const validScores = filtered.filter(g => g.score != null && g.max_score);
  const avg = validScores.length > 0 ? (validScores.reduce((s, g) => s + (g.score / g.max_score) * 100, 0) / validScores.length).toFixed(1) : null;

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {avg && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-3 flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-xs text-indigo-600 font-medium">Overall Average</p>
                <p className={`text-2xl font-bold ${scoreColor(avg)}`}>{avg}%</p>
              </div>
            </div>
          )}
          <p className="text-sm text-slate-500">{filtered.length} grade{filtered.length !== 1 ? 's' : ''}</p>
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
        <div className="text-center py-16 text-slate-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
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
    queryFn: () => gradebookData.wherePredictedGrades({
      school_id: schoolId,
      student_id: userId,
      visible_to_student: true
    }, { order: 'entry_date', ascending: false }),
    enabled: !!schoolId && !!userId,
  });

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  if (predictions.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <TrendingUp className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No predicted grades have been shared with you yet</p>
      </div>
    );
  }

  const avg = (predictions.reduce((s, p) => s + (p.predicted_ib_grade || 0), 0) / predictions.length).toFixed(1);

  return (
    <div className="space-y-5">
      <div className="bg-violet-50 border border-violet-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-700">Predicted IB Average</p>
          <p className="text-4xl font-bold text-violet-900 mt-0.5">{avg}<span className="text-lg text-violet-500">/7</span></p>
          <p className="text-xs text-violet-600 mt-1">Based on {predictions.length} subject{predictions.length !== 1 ? 's' : ''}</p>
        </div>
        <TrendingUp className="w-10 h-10 text-violet-400" />
      </div>

      <div className="space-y-3">
        {predictions.map(pred => (
          <div key={pred.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-slate-900">{pred.class_name || 'Subject'}</h4>
                {pred.entry_date && (
                  <p className="text-xs text-slate-400 mt-0.5">Updated {format(new Date(pred.entry_date), 'MMM d, yyyy')}</p>
                )}
                {pred.confidence_level && (
                  <Badge className={`mt-2 border text-xs ${confidenceBadge[pred.confidence_level] || ''}`} variant="outline">
                    {pred.confidence_level} confidence
                  </Badge>
                )}
              </div>
              <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-3 text-center flex-shrink-0">
                <p className="text-xs text-violet-600 font-semibold">Predicted</p>
                <p className="text-3xl font-bold text-violet-700">{pred.predicted_ib_grade}</p>
                <p className="text-xs text-violet-500">/7</p>
              </div>
            </div>
            {pred.rationale && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 mb-1">Teacher Notes</p>
                <p className="text-sm text-slate-600">{pred.rationale}</p>
              </div>
            )}
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
    queryFn: async () => {
      const all = await assignmentsData.where({ school_id: schoolId, status: 'published' });
      const classIds = new Set(classes.map(c => c.id));
      return all.filter(a => classIds.has(a.class_id));
    },
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
    pending: 'bg-slate-100 text-slate-600',
    draft: 'bg-slate-100 text-slate-600',
  };

  const statusLabel = {
    submitted: 'Submitted', late: 'Late', returned: 'Returned',
    missing: 'Missing', pending: 'To Do', draft: 'Draft',
  };

  if (loadingA || loadingS) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

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
            className={`rounded-xl border p-3 text-center transition-all ${color} ${statusFilter === filter ? 'ring-2 ring-offset-1 ring-current' : 'hover:opacity-80'}`}
          >
            <p className="text-2xl font-bold">{count}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-48 h-9 text-sm"><SelectValue placeholder="All classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9 text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="missing">Missing</SelectItem>
            <SelectItem value="pending">To Do</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="late">Late</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No assignments match these filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className={`bg-white rounded-xl border overflow-hidden ${a.displayStatus === 'missing' ? 'border-red-200' : 'border-slate-200'}`}>
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{a.title}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{a.class_name}</span>
                    {a.type && <Badge variant="outline" className="text-xs capitalize">{a.type?.replace('_', ' ')}</Badge>}
                  </div>
                  {a.due_date && (
                    <p className={`text-xs mt-1.5 flex items-center gap-1 ${a.displayStatus === 'missing' ? 'text-red-600' : 'text-slate-500'}`}>
                      <Clock className="w-3 h-3" />
                      Due {format(new Date(a.due_date), 'MMM d, yyyy')}
                    </p>
                  )}
                  {a.submission?.feedback && (
                    <p className="text-xs text-slate-500 mt-1 truncate">Feedback: {a.submission.feedback}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Badge className={`${statusBadge[a.displayStatus]} border-0 text-xs`}>
                    {statusLabel[a.displayStatus] || a.displayStatus}
                  </Badge>
                  <Button
                    size="sm"
                    variant={['submitted', 'late'].includes(a.displayStatus) ? 'outline' : 'default'}
                    className={['submitted', 'late'].includes(a.displayStatus) ? '' : 'bg-indigo-600 hover:bg-indigo-700'}
                    onClick={() => setSubmittingAssignment(a)}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {a.displayStatus === 'pending' ? 'Submit' : a.displayStatus === 'returned' ? 'Resubmit' : 'View'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submission Dialog */}
      <Dialog open={!!submittingAssignment} onOpenChange={() => setSubmittingAssignment(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{submittingAssignment?.title}</DialogTitle>
            {submittingAssignment?.description && (
              <p className="text-sm text-slate-600 mt-1">{submittingAssignment.description}</p>
            )}
          </DialogHeader>
          {submittingAssignment && (
            <StudentSubmission
              assignment={submittingAssignment}
              studentId={userId}
              studentName={userName}
              existingSubmission={selectedSub}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function StudentAcademicDashboard() {
  const { user, school, schoolId, curriculum } = useUser();
  const studentLinks = getStudentSidebarLinks(curriculum);

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['student-classes', schoolId, user?.id],
    queryFn: async () => {
      const all = await classesData.where({ school_id: schoolId, status: 'active' });
      return all.filter(c => c.student_ids?.includes(user.id));
    },
    enabled: !!schoolId && !!user?.id,
  });

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={studentLinks} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">Academic Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Your grades, predicted scores, and assignments</p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : (
              <Tabs defaultValue="grades">
                <TabsList className="mb-6 flex-wrap">
                  <TabsTrigger value="grades" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Grades & Feedback
                  </TabsTrigger>
                  <TabsTrigger value="predicted" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Predicted Grades
                  </TabsTrigger>
                  <TabsTrigger value="assignments" className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" /> Assignments
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Analytics
                  </TabsTrigger>
                  <TabsTrigger value="export" className="flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="grades">
                  <GradesTab schoolId={schoolId} userId={user?.id} classes={classes} />
                </TabsContent>
                <TabsContent value="predicted">
                  <PredictedTab schoolId={schoolId} userId={user?.id} />
                </TabsContent>
                <TabsContent value="assignments">
                  <AssignmentsTab schoolId={schoolId} userId={user?.id} userName={user?.full_name} classes={classes} />
                </TabsContent>
                <TabsContent value="analytics">
                  <PerformanceTrends schoolId={schoolId} userId={user?.id} classes={classes} />
                </TabsContent>
                <TabsContent value="export">
                  <TermReportExport
                    schoolId={schoolId}
                    userId={user?.id}
                    userName={user?.full_name}
                    schoolName={school?.name}
                    classes={classes}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}