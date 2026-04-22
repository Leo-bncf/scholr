import React, { useState, useEffect } from 'react';
import {
  MessageSquare, ClipboardList, FolderOpen, BarChart3, Users
} from 'lucide-react';
import ClassHeader from './ClassHeader';
import ClassTabBar from './ClassTabBar';
import ClassStream from '@/components/class/ClassStream';
import ClassAssignments from '@/components/class/ClassAssignments';
import ClassMaterials from '@/components/class/ClassMaterials';
import ClassGrades from '@/components/class/ClassGrades';
import ClassPeople from '@/components/class/ClassPeople';

/**
 * Read-first student view. Keeps the same limited tab set as the legacy page
 * — student experience is not the focus of this redesign.
 */
export default function StudentClassWorkspace({ classData, user, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'stream');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [activeTab]);

  const groups = [{
    label: 'Class',
    tabs: [
      { id: 'stream', label: 'Stream', icon: MessageSquare },
      { id: 'assignments', label: 'Assignments', icon: ClipboardList },
      { id: 'materials', label: 'Materials', icon: FolderOpen },
      { id: 'grades', label: 'Grades', icon: BarChart3 },
      { id: 'people', label: 'Roster', icon: Users },
    ],
  }];

  return (
    <div className="min-h-screen bg-slate-50">
      <ClassHeader classData={classData} />
      <ClassTabBar groups={groups} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="min-h-[calc(100vh-180px)]">
        {activeTab === 'stream' && <ClassStream classData={classData} isTeacher={false} userId={user.id} />}
        {activeTab === 'assignments' && <ClassAssignments classData={classData} isTeacher={false} userId={user.id} />}
        {activeTab === 'materials' && <ClassMaterials classData={classData} isTeacher={false} />}
        {activeTab === 'grades' && <ClassGrades classData={classData} isTeacher={false} isStudent userId={user.id} />}
        {activeTab === 'people' && <ClassPeople classData={classData} />}
      </div>
    </div>
  );
}