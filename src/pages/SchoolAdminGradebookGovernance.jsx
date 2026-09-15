import React, { useState, useEffect } from 'react';
import SchoolAdminPage from '@/components/app/SchoolAdminPage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import { Button } from '@/components/ui/button';
import {
  Loader2
} from 'lucide-react';
import { DEFAULT_GRADEBOOK_POLICY } from '@/hooks/useGradebookPolicy';
import GradingModelPanel from '@/components/gradebook-governance/GradingModelPanel';
import VisibilityRulesPanel from '@/components/gradebook-governance/VisibilityRulesPanel';
import GradeLocksPanel from '@/components/gradebook-governance/GradeLocksPanel';
import RubricTemplateLibrary from '@/components/gradebook-governance/RubricTemplateLibrary';
import PredictedGradesPolicy from '@/components/gradebook-governance/PredictedGradesPolicy';
import * as gradebookPoliciesData from '@/data/gradebookPolicies';
import * as academics from '@/data/academics';



const TABS = [
  { value: 'grading', label: 'Grading model' },
  { value: 'visibility', label: 'Visibility' },
  { value: 'locks', label: 'Locks' },
  { value: 'rubrics', label: 'Rubrics' },
  { value: 'predicted', label: 'Predicted' },
];

export default function SchoolAdminGradebookGovernance() {
  const [tab, setTab] = useState('grading');
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

  const tabTriggerClass = "text-xs gap-1.5 data-[state=active]:scholr-accent-sf data-[state=active]:scholr-accent";

  // Tabs that share the policy save button vs tabs that manage their own data
  const POLICY_TABS = ['grading', 'visibility', 'locks', 'predicted'];

  const SaveButton = ({ tab }) => (
    POLICY_TABS.includes(tab) ? (
      <div className="flex justify-end mt-6">
        <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="pub-btn pub-btn-primary">
          {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Save Policy
        </Button>
      </div>
    ) : null
  );

  return (
    <SchoolAdminPage
      title="Gradebook rules"
      eyebrow="How marks behave and who may see them"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      allowedRoles={['school_admin', 'super_admin', 'admin', 'ib_coordinator']}
      related={[["SchoolAdminClasses","Classes"],["SchoolAdminReports","Reports"],["SchoolAdminGovernance","Governance"]]}
    >
      {tab === 'grading' && (
        <>
          <div className="app-group p-6 max-w-2xl">
                        <GradingModelPanel form={form} onChange={onChange} />
                      </div>
                      <SaveButton tab="grading" />
        </>
      )}
      {tab === 'visibility' && (
        <>
          <div className="app-group p-6 max-w-2xl">
                        <VisibilityRulesPanel form={form} onChange={onChange} />
                      </div>
                      <SaveButton tab="visibility" />
        </>
      )}
      {tab === 'locks' && (
        <>
          <div className="app-group p-6 max-w-2xl">
                        <GradeLocksPanel form={form} onChange={onChange} terms={terms} />
                      </div>
                      <SaveButton tab="locks" />
        </>
      )}
      {tab === 'rubrics' && (
        <>
          <div className="app-group p-6">
                        <RubricTemplateLibrary schoolId={schoolId} />
                      </div>
        </>
      )}
      {tab === 'predicted' && (
        <>
          <div className="app-group p-6 max-w-2xl">
                        <PredictedGradesPolicy form={form} onChange={onChange} />
                      </div>
                      <SaveButton tab="predicted" />
        </>
      )}
    </SchoolAdminPage>
  );
}