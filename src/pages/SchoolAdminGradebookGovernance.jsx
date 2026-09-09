import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import RoleGuard from '@/components/auth/RoleGuard';
import AppSidebar from '@/components/app/AppSidebar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2, CheckCircle2, AlertCircle, BarChart3, Eye, Lock, Library, TrendingUp
} from 'lucide-react';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import { DEFAULT_GRADEBOOK_POLICY } from '@/hooks/useGradebookPolicy';
import GradingModelPanel from '@/components/gradebook-governance/GradingModelPanel';
import VisibilityRulesPanel from '@/components/gradebook-governance/VisibilityRulesPanel';
import GradeLocksPanel from '@/components/gradebook-governance/GradeLocksPanel';
import RubricTemplateLibrary from '@/components/gradebook-governance/RubricTemplateLibrary';
import PredictedGradesPolicy from '@/components/gradebook-governance/PredictedGradesPolicy';
import * as gradebookPoliciesData from '@/data/gradebookPolicies';
import * as academics from '@/data/academics';



export default function SchoolAdminGradebookGovernance() {
  const { user, school: contextSchool, schoolId, membership } = useUser();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({ ...DEFAULT_GRADEBOOK_POLICY });

  const { data: policyRecord, isLoading } = useQuery({
    queryKey: ['gradebook-policy', schoolId],
    queryFn: async () => {
      if (!schoolId) return null;
      const results = await gradebookPoliciesData.where({ school_id: schoolId });
      return results[0] || null;
    },
    enabled: !!schoolId,
  });

  const { data: terms = [] } = useQuery({
    queryKey: ['terms', schoolId],
    queryFn: () => academics.whereTerms({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  useEffect(() => {
    if (policyRecord) {
      setForm({ ...DEFAULT_GRADEBOOK_POLICY, ...policyRecord });
    }
  }, [policyRecord?.id]);

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, school_id: schoolId };
      return policyRecord
        ? gradebookPoliciesData.update(policyRecord.id, payload)
        : gradebookPoliciesData.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradebook-policy', schoolId] });
      showMessage('success', 'Gradebook policy saved successfully.');
    },
    onError: () => showMessage('error', 'Failed to save policy. Please try again.'),
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const onChange = (partial) => setForm(prev => ({ ...prev, ...partial }));

  const tabTriggerClass = "text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700";

  // Tabs that share the policy save button vs tabs that manage their own data
  const POLICY_TABS = ['grading', 'visibility', 'locks', 'predicted'];

  const SaveButton = ({ tab }) => (
    POLICY_TABS.includes(tab) ? (
      <div className="flex justify-end mt-6">
        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Save Policy
        </Button>
      </div>
    ) : null
  );

  return (
    <RoleGuard allowedRoles={['school_admin', 'super_admin', 'admin', 'ib_coordinator']}>
      <div className="min-h-screen bg-slate-50">
        <AppSidebar
          links={SCHOOL_ADMIN_SIDEBAR_LINKS}
          role={membership?.role || 'school_admin'}
          schoolName={contextSchool?.name}
          userName={user?.full_name}
          userId={user?.id}
          schoolId={schoolId}
        />

        <main className="md:ml-64 min-h-screen">
          <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 tracking-tight">Gradebook Governance & IB Controls</h1>
                <p className="text-xs text-slate-400 mt-0.5">Standardize grading models, visibility rules, grade locking, rubric templates, and IB predicted grade workflows</p>
              </div>
            </div>
          </div>

          {message && (
            <div className="mx-6 mt-4">
              <Alert className={message.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <AlertDescription className={message.type === 'success' ? 'text-emerald-800' : 'text-red-800'}>{message.text}</AlertDescription>
              </Alert>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-indigo-400" /></div>
          ) : (
            <div className="p-6 max-w-4xl">
              <Tabs defaultValue="grading">
                <TabsList className="bg-white border border-slate-200 h-10 mb-6 flex flex-wrap gap-0.5">
                  <TabsTrigger value="grading" className={tabTriggerClass}>
                    <BarChart3 className="w-3.5 h-3.5" /> Grading Model
                  </TabsTrigger>
                  <TabsTrigger value="visibility" className={tabTriggerClass}>
                    <Eye className="w-3.5 h-3.5" /> Visibility & Release
                  </TabsTrigger>
                  <TabsTrigger value="locks" className={tabTriggerClass}>
                    <Lock className="w-3.5 h-3.5" /> Locks & Deadlines
                  </TabsTrigger>
                  <TabsTrigger value="rubrics" className={tabTriggerClass}>
                    <Library className="w-3.5 h-3.5" /> Rubric Library
                  </TabsTrigger>
                  <TabsTrigger value="predicted" className={tabTriggerClass}>
                    <TrendingUp className="w-3.5 h-3.5" /> Predicted Grades
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="grading">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-2xl">
                    <GradingModelPanel form={form} onChange={onChange} />
                  </div>
                  <SaveButton tab="grading" />
                </TabsContent>

                <TabsContent value="visibility">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-2xl">
                    <VisibilityRulesPanel form={form} onChange={onChange} />
                  </div>
                  <SaveButton tab="visibility" />
                </TabsContent>

                <TabsContent value="locks">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-2xl">
                    <GradeLocksPanel form={form} onChange={onChange} terms={terms} />
                  </div>
                  <SaveButton tab="locks" />
                </TabsContent>

                <TabsContent value="rubrics">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                    <RubricTemplateLibrary schoolId={schoolId} />
                  </div>
                </TabsContent>

                <TabsContent value="predicted">
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-2xl">
                    <PredictedGradesPolicy form={form} onChange={onChange} />
                  </div>
                  <SaveButton tab="predicted" />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </main>
      </div>
    </RoleGuard>
  );
}