import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import BehaviorRecordsList from '@/components/behavior/BehaviorRecordsList';
import { LayoutDashboard, BarChart3, MessageSquare, Star, Loader2 } from 'lucide-react';
import * as behaviorRecordsData from '@/data/behaviorRecords';

const sidebarLinks = [
  { label: 'Dashboard', page: 'StudentDashboard', icon: LayoutDashboard },
  { label: 'My Grades', page: 'StudentDashboard', icon: BarChart3 },
  { label: 'IB Core', page: 'StudentCAS', icon: Star },
  { label: 'Messages', page: 'Messages', icon: MessageSquare },
];

export default function StudentBehavior() {
  const { user, school, schoolId } = useUser();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['student-behavior', schoolId, user?.id],
    queryFn: () => behaviorRecordsData.where({
      school_id: schoolId,
      student_id: user.id,
      visible_to_student: true
    }, { order: 'date', ascending: false }),
    enabled: !!schoolId && !!user?.id,
  });

  return (
    <RoleGuard allowedRoles={['student', 'super_admin', 'admin']}>
      <div className="min-h-screen scholr-sunk">
        <AppSidebar links={sidebarLinks} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        
        <main className="app-offset p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold scholr-ink mb-2">My Behavior Records</h1>
            <p className="scholr-muted mb-8">View notes and feedback from your teachers</p>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin scholr-accent" />
              </div>
            ) : (
              <BehaviorRecordsList records={records} showVisibilityIndicators={false} />
            )}
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}