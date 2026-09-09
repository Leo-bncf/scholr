import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import CASProgressOverview from '@/components/ibcore/CASProgressOverview';
import CASExperienceCard from '@/components/ibcore/CASExperienceCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Plus, Loader2, Filter
} from 'lucide-react';
import { STUDENT_SIDEBAR_LINKS } from '@/components/app/studentSidebarLinks';
import * as casExperiencesData from '@/data/casExperiences';

export default function StudentCAS() {
  const { user, school, schoolId } = useUser();
  const [filterStrand, setFilterStrand] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['student-cas', schoolId, user?.id],
    queryFn: () => casExperiencesData.where({ school_id: schoolId, student_id: user.id }),
    enabled: !!schoolId && !!user?.id,
  });

  const filteredExperiences = experiences.filter(exp => {
    const strandMatch = filterStrand === 'all' || exp.cas_strands?.includes(filterStrand);
    const statusMatch = filterStatus === 'all' || exp.status === filterStatus;
    return strandMatch && statusMatch;
  });

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={STUDENT_SIDEBAR_LINKS} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        
        <main className="ml-64 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">IB Core: CAS</h1>
              <p className="text-slate-600">Creativity, Activity, Service - Track your IB CAS journey</p>
            </div>

            <Tabs defaultValue="experiences" className="space-y-6">
              <TabsList className="bg-white border border-slate-200">
                <TabsTrigger value="experiences">My Experiences</TabsTrigger>
                <TabsTrigger value="progress">Progress Overview</TabsTrigger>
              </TabsList>

              <TabsContent value="progress">
                <div className="space-y-6">
                  <CASProgressOverview experiences={experiences} />

                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h2 className="text-xl font-bold text-slate-900 mb-4">CAS Requirements</h2>
                    <div className="space-y-3 text-sm text-slate-700">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                        <p>Complete experiences across all three strands (Creativity, Activity, Service)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                        <p>Demonstrate achievement of the seven CAS learning outcomes</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                        <p>Undertake at least one CAS project (collaborative, sustained, with a real outcome)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                        <p>Provide evidence and reflections for all experiences</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="experiences">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Filter className="w-4 h-4 text-slate-400" />
                      <select 
                        value={filterStrand}
                        onChange={(e) => setFilterStrand(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="all">All Strands</option>
                        <option value="creativity">Creativity</option>
                        <option value="activity">Activity</option>
                        <option value="service">Service</option>
                      </select>
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <option value="all">All Status</option>
                        <option value="planned">Planned</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="approved">Approved</option>
                      </select>
                    </div>
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                  ) : filteredExperiences.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                      <Star className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">No CAS experiences yet</h3>
                      <p className="text-slate-500 mb-4">Start documenting your CAS journey by adding your first experience</p>
                      <Button className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Experience
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredExperiences.map(exp => (
                        <CASExperienceCard 
                          key={exp.id} 
                          experience={exp}
                          onViewDetails={() => {}}
                          onEdit={() => {}}
                        />
                      ))}
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