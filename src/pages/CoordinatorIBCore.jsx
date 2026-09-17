import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileText, Loader2, Star, 
  Palette, Heart, Users as UsersIcon, GraduationCap
} from 'lucide-react';
import { getCoordinatorSidebarLinks } from '@/components/app/coordinatorSidebarLinks';
import { useCurriculum } from '@/hooks/useCurriculum';
import * as casExperiencesData from '@/data/casExperiences';
import * as eeMilestonesData from '@/data/eeMilestones';
import * as tokTasksData from '@/data/tokTasks';
import * as membershipsData from '@/data/memberships';

export default function CoordinatorIBCore() {
  const { user, school, schoolId } = useUser();
  const { curriculum, config } = useCurriculum();
  const sidebarLinks = getCoordinatorSidebarLinks(curriculum, config);

  const { data: casStatsRow } = useQuery({
    queryKey: ['all-cas-summary', schoolId],
    /* The six CAS numbers are an aggregate, computed in Postgres — no need to
       ship every experience for six counters. The awaiting-approval tray is
       its own limited fetch below. See supabase/migrations/0015_bounded_reads.sql. */
    queryFn: () => casExperiencesData.summaryForSchool(schoolId),
    enabled: !!schoolId,
  });

  const { data: recentCasCompleted = [], isLoading: casLoading } = useQuery({
    queryKey: ['all-cas-recent', schoolId],
    queryFn: () => casExperiencesData.listRecentlyCompleted(schoolId, { limit: 10 }),
    enabled: !!schoolId,
  });

  const { data: eeMilestones = [], isLoading: eeLoading } = useQuery({
    queryKey: ['all-ee', schoolId],
    queryFn: () => eeMilestonesData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: tokTasks = [], isLoading: tokLoading } = useQuery({
    queryKey: ['all-tok', schoolId],
    queryFn: () => tokTasksData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: students = [] } = useQuery({
    queryKey: ['dp-students', schoolId],
    queryFn: async () => {
      const memberships = await membershipsData.where({ school_id: schoolId, role: 'student' });
      return memberships.filter(m => m.grade_level?.includes('DP'));
    },
    enabled: !!schoolId,
  });

  const casStats = {
    total: casStatsRow?.total ?? 0,
    approved: casStatsRow?.approved ?? 0,
    pending: casStatsRow?.pending ?? 0,
    creativity: casStatsRow?.creativity ?? 0,
    activity: casStatsRow?.activity ?? 0,
    service: casStatsRow?.service ?? 0,
  };

  const eeStats = {
    total: eeMilestones.length,
    submitted: eeMilestones.filter(m => m.status === 'submitted').length,
    needsReview: eeMilestones.filter(m => m.status === 'submitted').length,
    approved: eeMilestones.filter(m => m.status === 'approved').length,
  };

  const tokStats = {
    total: tokTasks.length,
    pending: tokTasks.filter(t => t.status === 'pending').length,
    submitted: tokTasks.filter(t => t.status === 'submitted').length,
    graded: tokTasks.filter(t => t.status === 'graded').length,
  };

  return (
    <RoleGuard allowedRoles={['ib_coordinator', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen scholr-sunk">
        <AppSidebar links={sidebarLinks} role="ib_coordinator" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        
        <main className="app-offset p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold scholr-ink mb-2">IB Core Overview</h1>
              <p className="scholr-muted">Monitor CAS, EE, and TOK progress across all DP students</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl border scholr-rule p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 scholr-accent-sf rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 scholr-accent" />
                  </div>
                  <div>
                    <p className="text-sm scholr-muted">DP Students</p>
                    <p className="text-2xl font-bold scholr-ink">{students.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border scholr-rule p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 scholr-accent-sf rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 scholr-accent" />
                  </div>
                  <div>
                    <p className="text-sm scholr-muted">CAS Experiences</p>
                    <p className="text-2xl font-bold scholr-ink">{casStats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border scholr-rule p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm scholr-muted">EE Submissions</p>
                    <p className="text-2xl font-bold scholr-ink">{eeStats.submitted}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border scholr-rule p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm scholr-muted">TOK Tasks</p>
                    <p className="text-2xl font-bold scholr-ink">{tokStats.total}</p>
                  </div>
                </div>
              </div>
            </div>

            <Tabs defaultValue="cas" className="space-y-6">
              <TabsList className="bg-white border scholr-rule">
                <TabsTrigger value="cas">
                  <Star className="w-4 h-4 mr-2" />
                  CAS
                </TabsTrigger>
                <TabsTrigger value="ee">
                  <FileText className="w-4 h-4 mr-2" />
                  Extended Essay
                </TabsTrigger>
                <TabsTrigger value="tok">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  TOK
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cas">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="scholr-accent-sf border scholr-accent-rule rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Palette className="w-5 h-5 scholr-accent" />
                        <h3 className="font-semibold scholr-accent">Creativity</h3>
                      </div>
                      <p className="text-3xl font-bold scholr-accent">{casStats.creativity}</p>
                      <p className="text-sm scholr-accent mt-1">experiences</p>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-semibold text-emerald-900">Activity</h3>
                      </div>
                      <p className="text-3xl font-bold text-emerald-700">{casStats.activity}</p>
                      <p className="text-sm text-emerald-600 mt-1">experiences</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <UsersIcon className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-blue-900">Service</h3>
                      </div>
                      <p className="text-3xl font-bold text-blue-700">{casStats.service}</p>
                      <p className="text-sm text-blue-600 mt-1">experiences</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border scholr-rule p-6">
                    <h2 className="text-xl font-bold scholr-ink mb-4">Recent CAS Submissions</h2>
                    {casLoading ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin scholr-accent" />
                      </div>
                    ) : recentCasCompleted.length === 0 ? (
                      <p className="text-center py-12 scholr-faint text-sm">No experiences awaiting approval</p>
                    ) : (
                      <div className="space-y-2">
                        {recentCasCompleted.map(exp => (
                          <div key={exp.id} className="border scholr-rule rounded-lg p-4 flex items-center justify-between">
                            <div>
                              <p className="font-medium scholr-ink">{exp.title}</p>
                              <p className="text-sm scholr-muted">{exp.student_name}</p>
                            </div>
                            <Badge className="bg-amber-100 text-amber-700">Needs Approval</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ee">
                <div className="bg-white rounded-xl border scholr-rule p-6">
                  <h2 className="text-xl font-bold scholr-ink mb-4">Extended Essay Progress</h2>
                  {eeLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin scholr-accent" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border scholr-rule rounded-lg p-5">
                        <p className="text-sm scholr-muted mb-2">Needs Review</p>
                        <p className="text-3xl font-bold text-amber-600">{eeStats.needsReview}</p>
                      </div>
                      <div className="border scholr-rule rounded-lg p-5">
                        <p className="text-sm scholr-muted mb-2">In Progress</p>
                        <p className="text-3xl font-bold text-blue-600">{eeStats.submitted}</p>
                      </div>
                      <div className="border scholr-rule rounded-lg p-5">
                        <p className="text-sm scholr-muted mb-2">Approved</p>
                        <p className="text-3xl font-bold text-green-600">{eeStats.approved}</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="tok">
                <div className="bg-white rounded-xl border scholr-rule p-6">
                  <h2 className="text-xl font-bold scholr-ink mb-4">TOK Progress</h2>
                  {tokLoading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin scholr-accent" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border scholr-rule rounded-lg p-5">
                        <p className="text-sm scholr-muted mb-2">Pending</p>
                        <p className="text-3xl font-bold text-amber-600">{tokStats.pending}</p>
                      </div>
                      <div className="border scholr-rule rounded-lg p-5">
                        <p className="text-sm scholr-muted mb-2">Submitted</p>
                        <p className="text-3xl font-bold text-blue-600">{tokStats.submitted}</p>
                      </div>
                      <div className="border scholr-rule rounded-lg p-5">
                        <p className="text-sm scholr-muted mb-2">Graded</p>
                        <p className="text-3xl font-bold text-green-600">{tokStats.graded}</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}