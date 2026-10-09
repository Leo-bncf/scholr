import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Segmented } from '@/components/app/AppShell';
import Notice from '@/components/app/Notice';
import TeacherPage from '@/components/teacher/TeacherPage';
import { PageLoading } from '@/components/teacher/bits';
import { useTeacherLoad } from '@/components/teacher/useTeacherLoad';
import ClassOverview from '@/components/teacher/class/ClassOverview';
import ClassAssignmentList from '@/components/teacher/class/ClassAssignmentList';
import ClassMarksGrid from '@/components/teacher/class/ClassMarksGrid';
import ClassStudents from '@/components/teacher/class/ClassStudents';
import CreateAssignment from '@/components/assignment/CreateAssignment';
import ClassMaterials from '@/components/class/ClassMaterials';
import ClassLessons from '@/components/class/ClassLessons';
import ClassGrades from '@/components/class/ClassGrades';
import ClassRubrics from '@/components/class/ClassRubrics';
import ClassAttendance from '@/components/class/ClassAttendance';
import ClassAnalytics from '@/components/class/ClassAnalytics';
import ClassSettings from '@/components/class/ClassSettings';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'assignments', label: 'Assignments' },
  { value: 'gradebook', label: 'Gradebook' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'students', label: 'Students' },
  { value: 'resources', label: 'Resources' },
  { value: 'settings', label: 'Settings' },
];

/**
 * Eleven tabs became seven. The old ones still resolve, so links and
 * bookmarks into a class keep working: each lands on the tab that now holds
 * what it used to show.
 */
const LEGACY = {
  today: ['overview'], stream: ['overview'],
  lessons: ['resources', 'lessons'], materials: ['resources', 'materials'],
  grades: ['gradebook', 'marks'], rubrics: ['gradebook', 'rubrics'], analytics: ['gradebook', 'analytics'],
  people: ['students'],
};

/**
 * One class, for the teacher who teaches it.
 *
 * Used to be the only teacher page without the sidebar: opening a class took
 * the navigation away and left an eleven-tab strip in its own visual language.
 * It now sits in the same frame as Today, Classes and Marking.
 */
export default function TeacherClassWorkspace({ classData, user, initialTab }) {
  const [first, firstSub] = LEGACY[initialTab] || [TABS.some((t) => t.value === initialTab) ? initialTab : 'overview'];
  const [tab, setTab] = useState(first);
  const [gradebookView, setGradebookView] = useState(first === 'gradebook' && firstSub ? firstSub : 'marks');
  const [resourcesView, setResourcesView] = useState(first === 'resources' && firstSub ? firstSub : 'materials');
  const [creating, setCreating] = useState(false);
  const load = useTeacherLoad({ classId: classData.id });

  const students = classData.student_ids?.length || 0;
  const eyebrow = [
    classData.subject?.name,
    classData.section && `Section ${classData.section}`,
    classData.room && `Room ${classData.room}`,
    `${students} student${students === 1 ? '' : 's'}`,
  ].filter(Boolean).join(' · ');

  const canCreate = classData.status !== 'archived' && ['overview', 'assignments'].includes(tab);

  return (
    <TeacherPage
      title={classData.name}
      eyebrow={eyebrow}
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      actions={canCreate ? (
        <button type="button" className="pub-btn pub-btn-primary scholr-focus" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" /> New assignment
        </button>
      ) : null}
    >
      {classData.status === 'archived' && (
        <Notice title="This class is archived">You can look back at its work and marks, but nothing new can be set.</Notice>
      )}
      {load.error && <Notice tone="crit" title="Some of this class didn't load">{String(load.error.message || load.error)}</Notice>}

      {load.isLoading && ['overview', 'assignments', 'gradebook', 'students'].includes(tab) ? <PageLoading /> : (
        <>
          {tab === 'overview' && <ClassOverview classData={classData} load={load} onTab={setTab} userId={user.id} />}
          {tab === 'assignments' && <ClassAssignmentList classData={classData} load={load} />}
          {tab === 'gradebook' && (
            <>
              <div style={{ alignSelf: 'flex-start', maxWidth: '100%', overflowX: 'auto' }}><Segmented
                label="Gradebook views"
                value={gradebookView}
                onChange={setGradebookView}
                options={[
                  { value: 'marks', label: 'Marks' },
                  { value: 'other', label: 'Other marks & predicted' },
                  { value: 'rubrics', label: 'Rubrics' },
                  { value: 'analytics', label: 'Analytics' },
                ]}
              /></div>
              {gradebookView === 'marks' && <ClassMarksGrid classData={classData} load={load} />}
              {gradebookView === 'other' && <ClassGrades classData={classData} isTeacher isStudent={false} userId={user.id} />}
              {gradebookView === 'rubrics' && <ClassRubrics classData={classData} />}
              {gradebookView === 'analytics' && <ClassAnalytics classData={classData} isTeacher />}
            </>
          )}
          {tab === 'attendance' && <ClassAttendance classData={classData} isTeacher userId={user.id} />}
          {tab === 'students' && <ClassStudents classData={classData} load={load} />}
          {tab === 'resources' && (
            <>
              <div style={{ alignSelf: 'flex-start' }}><Segmented
                label="Resources views"
                value={resourcesView}
                onChange={setResourcesView}
                options={[{ value: 'materials', label: 'Materials' }, { value: 'lessons', label: 'Lesson plans' }]}
              /></div>
              {resourcesView === 'materials' && <ClassMaterials classData={classData} isTeacher />}
              {resourcesView === 'lessons' && <ClassLessons classData={classData} isTeacher userId={user.id} />}
            </>
          )}
          {tab === 'settings' && <ClassSettings classData={classData} isTeacher />}
        </>
      )}

      <CreateAssignment classData={classData} userId={user.id} open={creating} onOpenChange={setCreating} />
    </TeacherPage>
  );
}
