import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { getAppSidebarLinks } from '@/components/app/sidebarLinks';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import { Loader2 } from 'lucide-react';
import CoverageSummaryCards from '@/components/curriculum/CoverageSummaryCards';
import SubjectCoverageList from '@/components/curriculum/SubjectCoverageList';
import TopicCoverageTable from '@/components/curriculum/TopicCoverageTable';

const indicatorMeta = (avg) => {
  if (avg === null) return { label: 'No Data', className: 'bg-slate-100 text-slate-700 border-0' };
  if (avg >= 75) return { label: 'Strength', className: 'bg-emerald-100 text-emerald-700 border-0' };
  if (avg < 60) return { label: 'Weakness', className: 'bg-red-100 text-red-700 border-0' };
  return { label: 'Monitor', className: 'bg-amber-100 text-amber-700 border-0' };
};

export default function CurriculumMapping() {
  const { user, school, schoolId, role } = useUser();
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const isAdminView = ['school_admin', 'ib_coordinator', 'admin', 'super_admin'].includes(role);
  const sidebarLinks = role === 'teacher' ? getAppSidebarLinks('teacher') : SCHOOL_ADMIN_SIDEBAR_LINKS;
  const sidebarRole = role === 'teacher' ? 'teacher' : 'school_admin';

  const { data, isLoading } = useQuery({
    queryKey: ['curriculum-mapping', schoolId, role, user?.id],
    queryFn: async () => {
      const [subjects, topics, assignments, gradeItems, classes] = await Promise.all([
        base44.entities.Subject.filter({ school_id: schoolId, status: 'active' }),
        base44.entities.CurriculumTopic.filter({ school_id: schoolId, status: 'active' }),
        base44.entities.Assignment.filter({ school_id: schoolId }),
        base44.entities.GradeItem.filter({ school_id: schoolId }),
        base44.entities.Class.filter({ school_id: schoolId, status: 'active' }),
      ]);

      const visibleClassIds = role === 'teacher'
        ? classes.filter((item) => item.teacher_ids?.includes(user.id)).map((item) => item.id)
        : classes.map((item) => item.id);

      return {
        subjects,
        topics,
        assignments: assignments.filter((item) => visibleClassIds.includes(item.class_id)),
        gradeItems: gradeItems.filter((item) => visibleClassIds.includes(item.class_id)),
      };
    },
    enabled: !!schoolId && !!user?.id,
  });

  const computed = useMemo(() => {
    if (!data) return { subjects: [], selectedRows: [], stats: [] };

    const topLevelTopics = data.topics.filter((item) => item.level === 'topic');
    const subtopics = data.topics.filter((item) => item.level === 'subtopic');
    const assignmentsByTopicId = {};

    data.assignments.forEach((assignment) => {
      (assignment.curriculum_topic_ids || []).forEach((topicId) => {
        assignmentsByTopicId[topicId] = assignmentsByTopicId[topicId] || [];
        assignmentsByTopicId[topicId].push(assignment);
      });
    });

    const subjectRows = data.subjects.map((subject) => {
      const topicRows = topLevelTopics.filter((topic) => topic.subject_id === subject.id).map((topic) => {
        const childSubtopics = subtopics.filter((item) => item.parent_topic_id === topic.id);
        const linkedAssignments = [
          ...(assignmentsByTopicId[topic.id] || []),
          ...childSubtopics.flatMap((item) => assignmentsByTopicId[item.id] || []),
        ];
        const uniqueAssignments = Array.from(new Map(linkedAssignments.map((item) => [item.id, item])).values());
        const linkedGrades = data.gradeItems.filter((grade) => uniqueAssignments.some((assignment) => assignment.id === grade.assignment_id) && grade.score != null && grade.max_score);
        const averageScore = linkedGrades.length
          ? Math.round(linkedGrades.reduce((sum, grade) => sum + ((grade.score / grade.max_score) * 100), 0) / linkedGrades.length)
          : null;
        const indicator = indicatorMeta(averageScore);
        return {
          id: topic.id,
          title: topic.title,
          subtopics: childSubtopics.map((item) => item.title),
          assignmentCount: uniqueAssignments.length,
          averageScore,
          covered: uniqueAssignments.length > 0,
          indicatorLabel: indicator.label,
          indicatorClass: indicator.className,
        };
      });

      const coveredCount = topicRows.filter((item) => item.covered).length;
      const totalCount = topicRows.length;
      return {
        id: subject.id,
        name: subject.name,
        rows: topicRows,
        coveredCount,
        totalCount,
        coveragePercent: totalCount ? Math.round((coveredCount / totalCount) * 100) : 0,
        weakCount: topicRows.filter((item) => item.indicatorLabel === 'Weakness').length,
      };
    });

    const activeSubject = subjectRows.find((item) => item.id === (selectedSubjectId || subjectRows[0]?.id)) || null;
    const allRows = subjectRows.flatMap((item) => item.rows);
    const stats = [
      { label: 'Subjects', value: subjectRows.length, helper: 'Tracked in curriculum map' },
      { label: 'Coverage', value: `${subjectRows.length ? Math.round(subjectRows.reduce((sum, item) => sum + item.coveragePercent, 0) / subjectRows.length) : 0}%`, helper: 'Average subject coverage' },
      { label: 'Weak Topics', value: allRows.filter((item) => item.indicatorLabel === 'Weakness').length, helper: 'Topics needing attention' },
    ];

    return { subjects: subjectRows, selectedRows: activeSubject?.rows || [], stats };
  }, [data, selectedSubjectId]);

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-700" /></div>;
  }

  return (
    <RoleGuard allowedRoles={['teacher', 'school_admin', 'ib_coordinator', 'admin', 'super_admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={sidebarLinks} role={sidebarRole} schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-6">
          <div className="max-w-[1500px] mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Curriculum Mapping</h1>
              <p className="text-sm text-slate-500 mt-1">
                {isAdminView ? 'School-wide curriculum coverage and topic performance insights.' : 'Track topic coverage and class mastery across your subjects.'}
              </p>
            </div>
            <CoverageSummaryCards stats={computed.stats} />
            <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
              <SubjectCoverageList
                subjects={computed.subjects}
                selectedSubjectId={selectedSubjectId || computed.subjects[0]?.id}
                onSelectSubject={setSelectedSubjectId}
              />
              <TopicCoverageTable rows={computed.selectedRows} />
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}