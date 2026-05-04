import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { useUser } from '@/components/auth/UserContext';
import { getAppSidebarLinks } from '@/components/app/sidebarLinks';
import WorkspaceAlertsBar from '@/components/teacher-workspace/WorkspaceAlertsBar';
import WorkspaceClassList from '@/components/teacher-workspace/WorkspaceClassList';
import WorkspacePipeline from '@/components/teacher-workspace/WorkspacePipeline';
import WorkspaceQuickActions from '@/components/teacher-workspace/WorkspaceQuickActions';
import WorkspaceGradingPanel from '@/components/teacher-workspace/WorkspaceGradingPanel';
import { Loader2 } from 'lucide-react';

export default function TeacherWorkspace() {
  const { user, school, schoolId, effectiveUserId } = useUser();
  const userId = effectiveUserId || user?.id;
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['teacher-workspace', schoolId, userId],
    queryFn: async () => {
      const [allClasses, assignments, submissions, memberships, gradeItems] = await Promise.all([
        base44.entities.Class.filter({ school_id: schoolId, status: 'active' }),
        base44.entities.Assignment.filter({ school_id: schoolId, teacher_id: userId }),
        base44.entities.Submission.filter({ school_id: schoolId }),
        base44.entities.SchoolMembership.filter({ school_id: schoolId, status: 'active' }),
        base44.entities.GradeItem.filter({ school_id: schoolId }),
      ]);

      const teacherClasses = allClasses.filter((item) => item.teacher_ids?.includes(userId));
      const teacherClassIds = teacherClasses.map((item) => item.id);
      const relevantAssignments = assignments.filter((item) => teacherClassIds.includes(item.class_id));
      const relevantSubmissions = submissions.filter((item) => teacherClassIds.includes(item.class_id));
      const studentMemberships = memberships.filter((item) => item.role === 'student');

      return {
        classes: teacherClasses,
        assignments: relevantAssignments,
        submissions: relevantSubmissions,
        students: studentMemberships,
        gradeItems,
      };
    },
    enabled: !!schoolId && !!userId,
  });

  const reviewedMutation = useMutation({
    mutationFn: (row) => base44.entities.Submission.update(row.submissionId, {
      status: 'graded',
      feedback: row.submission?.feedback || '',
      graded_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-workspace'] });
    },
  });

  const saveGradeMutation = useMutation({
    mutationFn: async ({ row, payload, publish }) => {
      const existing = row.gradeItem;
      const gradeData = {
        school_id: row.assignment.school_id,
        class_id: row.assignment.class_id,
        student_id: row.studentId,
        student_name: row.studentName,
        assignment_id: row.assignment.id,
        title: row.assignmentName,
        grading_type: payload.criteria.length > 1 ? 'rubric' : 'simple',
        rubric_criteria: payload.criteria.map((criterion) => ({
          id: criterion.criterion_id,
          name: criterion.name,
          description: criterion.description,
          max_score: criterion.max_score,
        })),
        criterion_scores: payload.criteria.map((criterion) => ({
          criterion_id: criterion.criterion_id,
          score: Number(criterion.score) || 0,
          feedback: criterion.feedback,
        })),
        score: payload.totalScore,
        max_score: payload.criteria.reduce((sum, criterion) => sum + (Number(criterion.max_score) || 0), 0),
        comment: payload.overallFeedback,
        status: publish ? 'published' : 'draft',
        visible_to_student: publish,
        visible_to_parent: publish,
      };

      if (existing?.id) {
        await base44.entities.GradeItem.update(existing.id, gradeData);
      } else {
        await base44.entities.GradeItem.create(gradeData);
      }

      await base44.entities.Submission.update(row.submissionId, {
        feedback: payload.overallFeedback,
        score: payload.totalScore,
        status: publish ? 'graded' : 'returned',
        graded_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-workspace'] });
      setSelectedRow(null);
    },
  });

  const computed = useMemo(() => {
    if (!data) {
      return {
        classCards: [],
        selectedClass: null,
        groupedRows: { not_submitted: [], submitted: [], needs_review: [], reviewed: [] },
        alerts: { missing: 0, needsReview: 0, performanceDrops: 0 },
      };
    }

    const assignmentMap = new Map(data.assignments.map((item) => [item.id, item]));
    const gradeMap = new Map();
    data.gradeItems.forEach((item) => {
      if (item.assignment_id && item.student_id) {
        gradeMap.set(`${item.assignment_id}_${item.student_id}`, item);
      }
    });

    const classCards = data.classes.map((classItem) => {
      const classAssignments = data.assignments.filter((assignment) => assignment.class_id === classItem.id);
      const classSubmissions = data.submissions.filter((submission) => submission.class_id === classItem.id);
      const missingSubmissions = classAssignments.reduce((sum, assignment) => {
        const expected = classItem.student_ids?.length || 0;
        const actual = classSubmissions.filter((submission) => submission.assignment_id === assignment.id && ['submitted', 'late', 'graded', 'returned', 'resubmitted'].includes(submission.status)).length;
        return sum + Math.max(0, expected - actual);
      }, 0);

      const upcomingAssignments = classAssignments.filter((assignment) => assignment.due_date && new Date(assignment.due_date) > new Date()).length;

      return {
        ...classItem,
        studentCount: classItem.student_ids?.length || 0,
        upcomingAssignments,
        missingSubmissions,
      };
    });

    const activeClassId = selectedClassId || classCards[0]?.id || null;
    const selectedClass = classCards.find((item) => item.id === activeClassId) || null;

    const groupedRows = { not_submitted: [], submitted: [], needs_review: [], reviewed: [] };

    if (selectedClass) {
      const classAssignments = data.assignments.filter((assignment) => assignment.class_id === selectedClass.id);
      const students = data.students.filter((student) => selectedClass.student_ids?.includes(student.user_id));

      classAssignments.forEach((assignment) => {
        students.forEach((student) => {
          const submission = data.submissions.find((item) => item.assignment_id === assignment.id && item.student_id === student.user_id);
          const gradeItem = gradeMap.get(`${assignment.id}_${student.user_id}`) || null;
          let column = 'not_submitted';
          let statusLabel = 'Not submitted';
          let canMarkReviewed = false;

          if (submission) {
            if (submission.status === 'graded') {
              column = 'reviewed';
              statusLabel = 'Reviewed';
            } else if (submission.status === 'returned') {
              column = 'needs_review';
              statusLabel = 'Needs review';
              canMarkReviewed = true;
            } else if (submission.status === 'submitted' || submission.status === 'late' || submission.status === 'resubmitted') {
              column = 'submitted';
              statusLabel = submission.status === 'late' ? 'Late submission' : 'Submitted';
              canMarkReviewed = true;
            }
          }

          groupedRows[column].push({
            key: `${assignment.id}_${student.user_id}`,
            submissionId: submission?.id,
            studentId: student.user_id,
            studentName: student.user_name || student.user_email,
            assignmentName: assignment.title,
            submittedAt: submission?.submitted_at,
            statusLabel,
            submission,
            assignment,
            gradeItem,
            canMarkReviewed,
          });
        });
      });
    }

    const alerts = {
      missing: classCards.reduce((sum, item) => sum + item.missingSubmissions, 0),
      needsReview: groupedRows.submitted.length + groupedRows.needs_review.length,
      performanceDrops: data.gradeItems.filter((item) => Number(item.percentage) < 60).length,
    };

    return { classCards, selectedClass, groupedRows, alerts };
  }, [data, selectedClassId]);

  const handleOpenSubmission = (row) => setSelectedRow(row);
  const handleMarkReviewed = (row) => reviewedMutation.mutate(row);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-700" /></div>;
  }

  return (
    <RoleGuard allowedRoles={['teacher', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={getAppSidebarLinks('teacher')} role="teacher" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-6">
          <div className="max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Teacher Workspace</h1>
                <p className="text-sm text-slate-500 mt-1">Daily teaching, review, and grading in one place.</p>
              </div>
              <WorkspaceQuickActions classData={computed.selectedClass} userId={userId} />
            </div>

            <WorkspaceAlertsBar alerts={computed.alerts} />

            <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
              <WorkspaceClassList
                classes={computed.classCards}
                selectedClassId={computed.selectedClass?.id}
                onSelectClass={setSelectedClassId}
              />
              <WorkspacePipeline
                groupedRows={computed.groupedRows}
                onOpenSubmission={handleOpenSubmission}
                onMarkReviewed={handleMarkReviewed}
              />
            </div>
          </div>
        </main>

        <WorkspaceGradingPanel
          row={selectedRow}
          open={!!selectedRow}
          onClose={() => setSelectedRow(null)}
          onSaveDraft={(payload) => saveGradeMutation.mutate({ row: selectedRow, payload, publish: false })}
          onPublishGrade={(payload) => saveGradeMutation.mutate({ row: selectedRow, payload, publish: true })}
        />
      </div>
    </RoleGuard>
  );
}