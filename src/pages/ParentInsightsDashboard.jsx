import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { useUser } from '@/components/auth/UserContext';
import ChildSelector from '@/components/parent/ChildSelector';
import InsightsStatusCard from '@/components/parent-insights/InsightsStatusCard';
import InsightsWeeklySummary from '@/components/parent-insights/InsightsWeeklySummary';
import InsightsSubjectPerformance from '@/components/parent-insights/InsightsSubjectPerformance';
import InsightsAlertsSection from '@/components/parent-insights/InsightsAlertsSection';
import InsightsActionPanel from '@/components/parent-insights/InsightsActionPanel';
import { getAppSidebarLinks } from '@/components/app/sidebarLinks';
import { Loader2, Users } from 'lucide-react';

export default function ParentInsightsDashboard() {
  const { user, school, schoolId } = useUser();
  const [selectedChildId, setSelectedChildId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['parent-insights-dashboard', schoolId, selectedChildId],
    queryFn: async () => {
      const [classes, assignments, submissions, grades, attendance] = await Promise.all([
        base44.entities.Class.filter({ school_id: schoolId, status: 'active' }),
        base44.entities.Assignment.filter({ school_id: schoolId, status: 'published' }),
        base44.entities.Submission.filter({ school_id: schoolId, student_id: selectedChildId }),
        base44.entities.GradeItem.filter({ school_id: schoolId, student_id: selectedChildId, visible_to_parent: true }),
        base44.entities.AttendanceRecord.filter({ school_id: schoolId, student_id: selectedChildId }),
      ]);

      const studentClasses = classes.filter((item) => item.student_ids?.includes(selectedChildId));
      const classIds = studentClasses.map((item) => item.id);
      const relevantAssignments = assignments.filter((item) => classIds.includes(item.class_id));

      return {
        classes: studentClasses,
        assignments: relevantAssignments,
        submissions,
        grades,
        attendance,
      };
    },
    enabled: !!schoolId && !!selectedChildId,
  });

  const insights = useMemo(() => {
    if (!data) {
      return {
        statusKey: 'on_track',
        summary: { averageGrade: 0, attendanceRate: 0, missingAssignments: 0 },
        bullets: [],
        subjects: [],
        alerts: [],
      };
    }

    const averageGrade = data.grades.length
      ? Math.round(data.grades.reduce((sum, item) => sum + Number(item.percentage || ((item.score || 0) / Math.max(item.max_score || 1, 1) * 100)), 0) / data.grades.length)
      : 0;

    const attendancePresent = data.attendance.filter((item) => item.status === 'present').length;
    const attendanceRate = data.attendance.length ? Math.round((attendancePresent / data.attendance.length) * 100) : 100;

    const missingAssignments = data.assignments.filter((assignment) => {
      const hasSubmission = data.submissions.some((submission) => submission.assignment_id === assignment.id);
      return !hasSubmission && assignment.due_date && new Date(assignment.due_date) < new Date();
    }).length;

    let statusKey = 'on_track';
    if (averageGrade >= 85 && attendanceRate >= 95 && missingAssignments === 0) statusKey = 'above';
    if (averageGrade < 70 || attendanceRate < 90 || missingAssignments >= 2) statusKey = 'at_risk';

    const recentGrades = [...data.grades]
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 6);
    const olderAverage = recentGrades.slice(3).length ? recentGrades.slice(3).reduce((sum, item) => sum + Number(item.percentage || 0), 0) / recentGrades.slice(3).length : null;
    const newerAverage = recentGrades.slice(0, 3).length ? recentGrades.slice(0, 3).reduce((sum, item) => sum + Number(item.percentage || 0), 0) / recentGrades.slice(0, 3).length : null;
    const trendDelta = olderAverage !== null && newerAverage !== null ? Math.round(newerAverage - olderAverage) : 0;

    const attendanceIssues = data.attendance.filter((item) => item.status !== 'present').length;

    const bullets = [];
    bullets.push(missingAssignments === 0 ? 'No missing assignments right now.' : `${missingAssignments} assignment${missingAssignments === 1 ? '' : 's'} are missing and may need attention.`);
    if (trendDelta >= 5) bullets.push(`Grades have improved by about ${trendDelta} points recently.`);
    else if (trendDelta <= -5) bullets.push(`Grades have dropped by about ${Math.abs(trendDelta)} points recently.`);
    else bullets.push('Grades have been mostly steady over the last few results.');
    bullets.push(attendanceIssues === 0 ? 'Attendance has been strong with no recent issues.' : `${attendanceIssues} attendance issue${attendanceIssues === 1 ? '' : 's'} have been recorded recently.`);
    if (averageGrade > 0) bullets.push(`Current overall average is ${averageGrade}%.`);

    const subjectsMap = new Map();
    data.classes.forEach((item) => {
      subjectsMap.set(item.id, { name: item.name, scores: [] });
    });
    data.grades.forEach((grade) => {
      if (subjectsMap.has(grade.class_id)) {
        subjectsMap.get(grade.class_id).scores.push(Number(grade.percentage || ((grade.score || 0) / Math.max(grade.max_score || 1, 1) * 100)));
      }
    });

    const subjects = Array.from(subjectsMap.values()).map((subject) => {
      const recentScores = subject.scores.slice(-5);
      const currentGrade = recentScores.length ? Math.round(recentScores[recentScores.length - 1]) : 0;
      const first = recentScores[0] || currentGrade;
      const last = recentScores[recentScores.length - 1] || currentGrade;
      const trend = last > first + 3 ? 'up' : last < first - 3 ? 'down' : 'stable';
      return {
        name: subject.name,
        currentGrade,
        trend,
        recentScores: recentScores.length ? recentScores : [currentGrade || 0, currentGrade || 0, currentGrade || 0],
      };
    });

    const alerts = [];
    if (missingAssignments > 0) alerts.push({ title: 'Missing assignments', body: `${missingAssignments} piece${missingAssignments === 1 ? '' : 's'} of work are overdue.` });
    if (averageGrade > 0 && averageGrade < 70) alerts.push({ title: 'Low grades', body: 'Overall grades are below the expected range right now.' });
    if (attendanceRate < 90) alerts.push({ title: 'Attendance warning', body: `Attendance is currently ${attendanceRate}%.` });

    return {
      statusKey,
      summary: { averageGrade, attendanceRate, missingAssignments },
      bullets: bullets.slice(0, 5),
      subjects,
      alerts,
    };
  }, [data]);

  return (
    <RoleGuard allowedRoles={['parent', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={getAppSidebarLinks('parent')} role="parent" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Parent Insights</h1>
              <p className="text-sm text-slate-600 mt-1">A quick, simple view of how your child is doing.</p>
            </div>

            <ChildSelector
              parentId={user?.id}
              schoolId={schoolId}
              selectedChildId={selectedChildId}
              onSelectChild={setSelectedChildId}
            />

            {!selectedChildId ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-slate-900">Select a child</h2>
                <p className="text-sm text-slate-500 mt-2">Choose a child above to see a fast summary.</p>
              </div>
            ) : isLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
              </div>
            ) : (
              <div className="space-y-6">
                <InsightsStatusCard statusKey={insights.statusKey} summary={insights.summary} />
                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                  <InsightsWeeklySummary bullets={insights.bullets} />
                  <InsightsActionPanel selectedChildId={selectedChildId} />
                </div>
                <InsightsSubjectPerformance subjects={insights.subjects} />
                <InsightsAlertsSection alerts={insights.alerts} />
              </div>
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}