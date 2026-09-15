import React, { useState, useEffect } from 'react';
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



export default function GradingRules() {
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

  /* Five sub-tabs became five stacked groups. Nesting tabs inside tabs made
     you click twice to reach a setting and gave no sense of how much policy
     there is; a settings page is read top to bottom. */
  return (
    <div className="space-y-4">
      <div className="app-group p-6 max-w-2xl">
        <GradingModelPanel form={form} onChange={onChange} />
      </div>
      <div className="app-group p-6 max-w-2xl">
        <VisibilityRulesPanel form={form} onChange={onChange} />
      </div>
      <div className="app-group p-6 max-w-2xl">
        <GradeLocksPanel form={form} onChange={onChange} terms={terms} />
      </div>
      <div className="app-group p-6 max-w-2xl">
        <PredictedGradesPolicy form={form} onChange={onChange} />
      </div>
      <div className="app-group p-6">
        <RubricTemplateLibrary schoolId={schoolId} />
      </div>
      <SaveButton tab="grading" />
    </div>
  );
}
