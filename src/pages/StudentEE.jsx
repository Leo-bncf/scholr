import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { STUDENT_SIDEBAR_LINKS } from '@/components/app/studentSidebarLinks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, BarChart3, 
  MessageSquare, Star, FileText, Loader2, CheckCircle2, 
  Clock, Upload
} from 'lucide-react';
import { format } from 'date-fns';
import * as eeMilestonesData from '@/data/eeMilestones';

const sidebarLinks = [
  { label: 'Dashboard', page: 'StudentDashboard', icon: LayoutDashboard },
  { label: 'Academic', page: 'StudentAcademicDashboard', icon: BarChart3 },
  { label: 'IB Core', page: 'StudentIBCore', icon: Star },
  { label: 'Messages', page: 'StudentCommunication', icon: MessageSquare },
];

const milestoneLabels = {
  initial_proposal: 'Initial Proposal',
  first_meeting: 'First Supervision Meeting',
  research_planning: 'Research Planning',
  first_draft: 'First Draft',
  interim_reflection: 'Interim Reflection (RPPF)',
  second_draft: 'Second Draft',
  final_draft: 'Final Draft',
  viva_voce: 'Viva Voce'
};

const statusColors = {
  pending: 'scholr-sunk scholr-body',
  submitted: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  needs_revision: 'bg-red-100 text-red-700'
};

export default function StudentEE() {
  const { user, school, schoolId } = useUser();

  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['student-ee', schoolId, user?.id],
    queryFn: () => eeMilestonesData.where({ school_id: schoolId, student_id: user.id }),
    enabled: !!schoolId && !!user?.id,
  });

  const sortedMilestones = [...milestones].sort((a, b) => {
    const order = ['initial_proposal', 'first_meeting', 'research_planning', 'first_draft', 'interim_reflection', 'second_draft', 'final_draft', 'viva_voce'];
    return order.indexOf(a.milestone_type) - order.indexOf(b.milestone_type);
  });

  const latestMilestone = milestones[0];

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen scholr-sunk">
        <AppSidebar links={STUDENT_SIDEBAR_LINKS} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        
        <main className="app-offset p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold scholr-ink mb-2">IB Core: Extended Essay</h1>
              <p className="scholr-muted">Track your EE research journey and milestones</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl border scholr-rule p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 scholr-accent-sf rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 scholr-accent" />
                  </div>
                  <div>
                    <p className="text-sm scholr-muted">Subject Area</p>
                    <p className="font-semibold scholr-ink">{latestMilestone?.subject_area || 'Not yet selected'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border scholr-rule p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm scholr-muted">Progress</p>
                    <p className="font-semibold scholr-ink">{milestones.filter(m => m.status === 'approved').length} / {sortedMilestones.length} milestones</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border scholr-rule p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm scholr-muted">Supervisor</p>
                    <p className="font-semibold scholr-ink">{latestMilestone?.supervisor_name || 'Not yet assigned'}</p>
                  </div>
                </div>
              </div>
            </div>

            {latestMilestone?.research_question && (
              <div className="scholr-accent-sf border scholr-accent-rule rounded-xl p-6 mb-8">
                <h2 className="text-sm font-semibold scholr-accent mb-2">Research Question</h2>
                <p className="scholr-accent italic">"{latestMilestone.research_question}"</p>
              </div>
            )}

            <div className="bg-white rounded-xl border scholr-rule p-6">
              <h2 className="text-xl font-bold scholr-ink mb-6">EE Milestones</h2>

              {isLoading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin scholr-accent" />
                </div>
              ) : sortedMilestones.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 scholr-faint mx-auto mb-4" />
                  <h3 className="text-lg font-semibold scholr-ink mb-2">No milestones yet</h3>
                  <p className="scholr-muted">Your EE coordinator will set up your milestones</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedMilestones.map((milestone, idx) => (
                    <div key={milestone.id} className="border scholr-rule rounded-lg p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            milestone.status === 'approved' ? 'bg-green-100' : 
                            milestone.status === 'submitted' ? 'bg-blue-100' :
                            'scholr-sunk'
                          }`}>
                            {milestone.status === 'approved' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : milestone.status === 'submitted' ? (
                              <Clock className="w-4 h-4 text-blue-600" />
                            ) : (
                              <span className="text-xs font-semibold scholr-muted">{idx + 1}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold scholr-ink">{milestoneLabels[milestone.milestone_type]}</h3>
                            {milestone.due_date && (
                              <p className="text-sm scholr-muted mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Due: {format(new Date(milestone.due_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={statusColors[milestone.status]}>{milestone.status}</Badge>
                      </div>

                      {milestone.supervisor_feedback && (
                        <div className="scholr-sunk rounded-lg p-4 mt-3">
                          <p className="text-xs font-semibold scholr-body mb-1">Supervisor Feedback</p>
                          <p className="text-sm scholr-muted">{milestone.supervisor_feedback}</p>
                        </div>
                      )}

                      {milestone.status === 'pending' && (
                        <Button variant="outline" size="sm" className="mt-3">
                          <Upload className="w-3 h-3 mr-2" />
                          Submit Work
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}