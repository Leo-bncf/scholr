import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import CASProgressOverview from '@/components/ibcore/CASProgressOverview';
import CASExperienceCard from '@/components/ibcore/CASExperienceCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Plus, Loader2, Filter, FileText, Clock,
  CheckCircle2, Upload, BookOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { getStudentSidebarLinks } from '@/components/app/studentSidebarLinks';
import * as casExperiencesData from '@/data/casExperiences';
import * as tokTasksData from '@/data/tokTasks';
import * as eeMilestonesData from '@/data/eeMilestones';

const milestoneOrder = ['initial_proposal', 'first_meeting', 'research_planning', 'first_draft', 'interim_reflection', 'second_draft', 'final_draft', 'viva_voce'];
const milestoneLabels = {
  initial_proposal: 'Initial Proposal', first_meeting: 'First Supervision Meeting',
  research_planning: 'Research Planning', first_draft: 'First Draft',
  interim_reflection: 'Interim Reflection (RPPF)', second_draft: 'Second Draft',
  final_draft: 'Final Draft', viva_voce: 'Viva Voce',
};
const tokTaskLabels = {
  exhibition_planning: 'Exhibition Planning', exhibition_draft: 'Exhibition Draft',
  exhibition_final: 'Exhibition Final', essay_planning: 'Essay Planning',
  essay_draft: 'Essay Draft', essay_final: 'Essay Final',
  presentation: 'Presentation', reflection: 'Reflection', reading: 'Reading', other: 'Other',
};
const statusColors = {
  pending: 'bg-amber-100 text-amber-700', submitted: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-purple-100 text-purple-700', graded: 'bg-green-100 text-green-700',
  approved: 'bg-green-100 text-green-700', needs_revision: 'bg-red-100 text-red-700',
};

// ─── CAS Tab ──────────────────────────────────────────────────────────────────
function CASTab({ schoolId, userId }) {
  const [filterStrand, setFilterStrand] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['student-cas', schoolId, userId],
    queryFn: () => casExperiencesData.where({ school_id: schoolId, student_id: userId }),
    enabled: !!schoolId && !!userId,
  });

  const filtered = experiences.filter(e => {
    const strandOk = filterStrand === 'all' || e.cas_strands?.includes(filterStrand);
    const statusOk = filterStatus === 'all' || e.status === filterStatus;
    return strandOk && statusOk;
  });

  return (
    <div className="space-y-6">
      <CASProgressOverview experiences={experiences} />

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-3 text-sm">IB CAS Requirements</h3>
        <ul className="space-y-1.5 text-sm text-slate-600">
          {[
            'Complete experiences across all three strands (Creativity, Activity, Service)',
            'Demonstrate achievement of the seven CAS learning outcomes',
            'Undertake at least one CAS project (collaborative, sustained, with a real outcome)',
            'Provide evidence and reflections for all experiences',
          ].map((r, i) => (
            <li key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 flex-shrink-0" />
              {r}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={filterStrand} onChange={e => setFilterStrand(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">All Strands</option>
            <option value="creativity">Creativity</option>
            <option value="activity">Activity</option>
            <option value="service">Service</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
            <option value="all">All Status</option>
            <option value="planned">Planned</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>
          </select>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4 mr-2" />Add Experience</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Star className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-medium">No CAS experiences yet</p>
          <p className="text-sm mt-1">Start documenting your CAS journey</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(exp => (
            <CASExperienceCard key={exp.id} experience={exp} onViewDetails={() => {}} onEdit={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── TOK Tab ──────────────────────────────────────────────────────────────────
function TOKTab({ schoolId, userId }) {
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['student-tok', schoolId, userId],
    queryFn: async () => {
      const [mine, classWide] = await Promise.all([
        tokTasksData.where({ school_id: schoolId, student_id: userId }),
        tokTasksData.where({ school_id: schoolId, is_class_wide: true }),
      ]);
      return [...mine, ...classWide];
    },
    enabled: !!schoolId && !!userId,
  });

  const upcoming = tasks.filter(t => t.status === 'pending' && t.due_date && new Date(t.due_date) > new Date())
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const completed = tasks.filter(t => ['graded', 'reviewed'].includes(t.status));

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Tasks', value: tasks.length, cls: 'text-slate-900' },
          { label: 'Pending', value: tasks.filter(t => t.status === 'pending').length, cls: 'text-amber-600' },
          { label: 'Completed', value: completed.length, cls: 'text-green-600' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className={`text-3xl font-bold ${cls}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Upcoming Tasks</h3>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-slate-400"><FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" /><p className="text-sm">No upcoming tasks</p></div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(task => (
                <div key={task.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-slate-900 text-sm">{task.title}</p>
                    <Badge variant="outline" className="text-xs capitalize">{tokTaskLabels[task.task_type] || task.task_type}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" />Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                    <Button size="sm" variant="outline"><Upload className="w-3 h-3 mr-1" />Submit</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">All Tasks</h3>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-400"><FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" /><p className="text-sm">No TOK tasks yet</p></div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {tasks.map(task => (
                <div key={task.id} className="border border-slate-200 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-slate-900 text-sm">{task.title}</p>
                    <Badge className={`${statusColors[task.status]} border-0 text-xs`}>{task.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                    <span>{tokTaskLabels[task.task_type] || task.task_type}</span>
                    {task.due_date && <span>{format(new Date(task.due_date), 'MMM d')}</span>}
                  </div>
                  {task.teacher_feedback && task.status === 'reviewed' && (
                    <p className="text-xs text-slate-600 bg-slate-50 rounded p-2 mt-2">{task.teacher_feedback}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── EE Tab ───────────────────────────────────────────────────────────────────
function EETab({ schoolId, userId }) {
  const { data: milestones = [], isLoading } = useQuery({
    queryKey: ['student-ee', schoolId, userId],
    queryFn: () => eeMilestonesData.where({ school_id: schoolId, student_id: userId }),
    enabled: !!schoolId && !!userId,
  });

  const sorted = [...milestones].sort((a, b) => milestoneOrder.indexOf(a.milestone_type) - milestoneOrder.indexOf(b.milestone_type));
  const latest = milestones[0];
  const approved = milestones.filter(m => m.status === 'approved').length;

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Subject Area', value: latest?.subject_area || 'Not yet selected', colorCls: 'bg-indigo-50 text-indigo-600', Ico: FileText },
          { label: 'Progress', value: `${approved} / ${Math.max(sorted.length, 8)} milestones`, colorCls: 'bg-emerald-50 text-emerald-600', Ico: CheckCircle2 },
          { label: 'Supervisor', value: latest?.supervisor_name || 'Not assigned', colorCls: 'bg-amber-50 text-amber-600', Ico: Clock },
        ].map(({ label, value, colorCls, Ico }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorCls}`}><Ico className="w-5 h-5" /></div>
            <div><p className="text-xs text-slate-500">{label}</p><p className="font-semibold text-slate-900 text-sm">{value}</p></div>
          </div>
        ))}
      </div>

      {latest?.research_question && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-indigo-700 mb-1">Research Question</p>
          <p className="text-indigo-800 italic text-sm">"{latest.research_question}"</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-5">EE Milestones</h3>
        {sorted.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="font-medium">No milestones yet</p>
            <p className="text-sm mt-1">Your EE coordinator will set these up</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((ms, idx) => (
              <div key={ms.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${ms.status === 'approved' ? 'bg-green-100' : ms.status === 'submitted' ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      {ms.status === 'approved' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : ms.status === 'submitted' ? <Clock className="w-4 h-4 text-blue-600" /> : <span className="text-xs font-semibold text-slate-600">{idx + 1}</span>}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">{milestoneLabels[ms.milestone_type]}</p>
                      {ms.due_date && <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />Due: {format(new Date(ms.due_date), 'MMM d, yyyy')}</p>}
                    </div>
                  </div>
                  <Badge className={`${statusColors[ms.status]} border-0 text-xs`}>{ms.status}</Badge>
                </div>
                {ms.supervisor_feedback && (
                  <div className="bg-slate-50 rounded p-3 mt-3">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Supervisor Feedback</p>
                    <p className="text-xs text-slate-600">{ms.supervisor_feedback}</p>
                  </div>
                )}
                {ms.status === 'pending' && (
                  <Button variant="outline" size="sm" className="mt-3"><Upload className="w-3 h-3 mr-2" />Submit Work</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function StudentIBCore() {
  const { user, school, schoolId, curriculum } = useUser();
  const studentLinks = getStudentSidebarLinks(curriculum);

  return (
    <RoleGuard allowedRoles={['student', 'school_admin', 'super_admin', 'admin']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar links={studentLinks} role="student" schoolName={school?.name} userName={user?.full_name} userId={user?.id} schoolId={schoolId} />
        <main className="ml-0 md:ml-64 p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">IB Core</h1>
              <p className="text-sm text-slate-500 mt-1">CAS, Theory of Knowledge, and Extended Essay</p>
            </div>

            <Tabs defaultValue="cas">
              <TabsList className="mb-6">
                <TabsTrigger value="cas" className="flex items-center gap-2"><Star className="w-4 h-4" />CAS</TabsTrigger>
                <TabsTrigger value="tok" className="flex items-center gap-2"><FileText className="w-4 h-4" />TOK</TabsTrigger>
                <TabsTrigger value="ee" className="flex items-center gap-2"><BookOpen className="w-4 h-4" />Extended Essay</TabsTrigger>
              </TabsList>
              <TabsContent value="cas"><CASTab schoolId={schoolId} userId={user?.id} /></TabsContent>
              <TabsContent value="tok"><TOKTab schoolId={schoolId} userId={user?.id} /></TabsContent>
              <TabsContent value="ee"><EETab schoolId={schoolId} userId={user?.id} /></TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}