import React, { useState, useEffect } from 'react';
import {
  LayoutGrid, MessageSquare, ClipboardList, CalendarDays, FolderOpen,
  BarChart3, BookMarked, CheckSquare, Users, TrendingUp, Settings, ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ClassHeader from './ClassHeader';
import ClassTabBar from './ClassTabBar';
import AdminOverviewTab from './AdminOverviewTab';
import ClassStream from '@/components/class/ClassStream';
import ClassAssignments from '@/components/class/ClassAssignments';
import ClassLessons from '@/components/class/ClassLessons';
import ClassMaterials from '@/components/class/ClassMaterials';
import ClassGrades from '@/components/class/ClassGrades';
import ClassRubrics from '@/components/class/ClassRubrics';
import ClassPeople from '@/components/class/ClassPeople';
import ClassAttendance from '@/components/class/ClassAttendance';
import ClassAnalytics from '@/components/class/ClassAnalytics';
import ClassSettings from '@/components/class/ClassSettings';

export default function AdminClassWorkspace({ classData, user, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'overview');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [activeTab]);

  const groups = [
    { label: 'Admin', tabs: [
      { id: 'overview', label: 'Overview', icon: LayoutGrid },
    ]},
    { label: 'Home', tabs: [
      { id: 'stream', label: 'Stream', icon: MessageSquare },
    ]},
    { label: 'Teach', tabs: [
      { id: 'assignments', label: 'Assignments', icon: ClipboardList },
      { id: 'lessons', label: 'Lessons', icon: CalendarDays },
      { id: 'materials', label: 'Materials', icon: FolderOpen },
    ]},
    { label: 'Assess', tabs: [
      { id: 'grades', label: 'Grades', icon: BarChart3 },
      { id: 'rubrics', label: 'Rubrics', icon: BookMarked },
      { id: 'attendance', label: 'Attendance', icon: CheckSquare },
    ]},
    { label: 'Manage', tabs: [
      { id: 'people', label: 'Roster', icon: Users },
      { id: 'analytics', label: 'Analytics', icon: TrendingUp },
      { id: 'settings', label: 'Settings', icon: Settings },
    ]},
  ];

  const adminChip = (
    <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 gap-1 text-[11px]">
      <ShieldCheck className="w-3 h-3" /> Admin view
    </Badge>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <ClassHeader classData={classData} contextChip={adminChip} />
      <ClassTabBar groups={groups} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="min-h-[calc(100vh-180px)]">
        {activeTab === 'overview' && <AdminOverviewTab classData={classData} onNavigate={setActiveTab} />}
        {activeTab === 'stream' && <ClassStream classData={classData} isTeacher userId={user.id} />}
        {activeTab === 'assignments' && <ClassAssignments classData={classData} isTeacher userId={user.id} />}
        {activeTab === 'lessons' && <ClassLessons classData={classData} isTeacher userId={user.id} />}
        {activeTab === 'materials' && <ClassMaterials classData={classData} isTeacher />}
        {activeTab === 'grades' && <ClassGrades classData={classData} isTeacher isStudent={false} userId={user.id} />}
        {activeTab === 'rubrics' && <ClassRubrics classData={classData} />}
        {activeTab === 'attendance' && <ClassAttendance classData={classData} isTeacher userId={user.id} />}
        {activeTab === 'people' && <ClassPeople classData={classData} />}
        {activeTab === 'analytics' && <ClassAnalytics classData={classData} isTeacher />}
        {activeTab === 'settings' && <ClassSettings classData={classData} isTeacher />}
      </div>
    </div>
  );
}