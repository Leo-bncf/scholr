import Meter from '@/components/app/Meter';
import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/components/auth/UserContext';
import { useOnboardingStatus } from './useOnboardingStatus';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2, ChevronRight, ChevronLeft, Calendar, Clock,
  BookOpen, Layers, Mail, GraduationCap
} from 'lucide-react';
import WizardStepCurriculum from './wizard-steps/WizardStepCurriculum';
import WizardStepAcademicYear from './wizard-steps/WizardStepAcademicYear';
import WizardStepTerms from './wizard-steps/WizardStepTerms';
import WizardStepSubjects from './wizard-steps/WizardStepSubjects';
import WizardStepClasses from './wizard-steps/WizardStepClasses';
import WizardStepInviteUsers from './wizard-steps/WizardStepInviteUsers';

const STEPS = [
  { id: 'curriculum',    label: 'Curriculum',    icon: GraduationCap, description: 'Choose your curriculum system' },
  { id: 'academic_year', label: 'Academic Year', icon: Calendar,      description: 'Define your school year dates' },
  { id: 'terms',         label: 'Terms',         icon: Clock,         description: 'Add reporting periods and terms' },
  { id: 'subjects',      label: 'Subjects',      icon: BookOpen,      description: 'Build your subject catalogue' },
  { id: 'classes',       label: 'Classes',       icon: Layers,        description: 'Create your first class groups' },
  { id: 'invite',        label: 'Invite Users',  icon: Mail,          description: 'Invite teachers and students' },
];

function StepNav({ steps, currentIndex, completedStepIds }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const Icon = step.icon;
        const isDone = completedStepIds.has(step.id);
        const isCurrent = i === currentIndex;
        const isPast = i < currentIndex;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              {/* One accent, three states: done is filled, current is
                  outlined, still-to-come is a hairline. Emerald-500 for done
                  and the brand green for current were two greens side by
                  side, which read as one indistinct blur. */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{
                  border: `1px solid ${isDone || isPast || isCurrent ? 'var(--brand)' : 'var(--rule)'}`,
                  background: isDone || isPast ? 'var(--brand)' : 'transparent',
                  color: isDone || isPast ? 'var(--surface)' : isCurrent ? 'var(--brand)' : 'var(--faint)',
                }}
              >
                {isDone || isPast ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <p
                className="text-xs mt-1 font-medium hidden md:block"
                style={{ color: isCurrent || isDone || isPast ? 'var(--brand)' : 'var(--faint)' }}
              >
                {step.label}
              </p>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 mx-1 mb-4"
                style={{ height: '1px', background: isPast || isDone ? 'var(--brand)' : 'var(--rule)' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function SetupWizard({ onComplete }) {
  const { schoolId, school } = useUser();
  const queryClient = useQueryClient();
  const { data: status } = useOnboardingStatus(schoolId);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [academicYearId, setAcademicYearId] = useState(null);
  const [curriculum, setCurriculum] = useState(school?.curriculum || 'ib_dp');

  const completedStepIds = new Set((status?.steps || []).filter(s => s.completed).map(s => s.id));

  const currentStep = STEPS[currentIndex];
  const isLastStep = currentIndex === STEPS.length - 1;

  const handleStepDone = (extraData) => {
    if (currentStep.id === 'curriculum' && extraData?.curriculum) {
      setCurriculum(extraData.curriculum);
    }
    queryClient.invalidateQueries({ queryKey: ['onboarding-status', schoolId] });
    if (isLastStep) {
      onComplete?.();
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const handleSkip = () => {
    if (!isLastStep) setCurrentIndex(i => i + 1);
    else onComplete?.();
  };

  const renderStep = () => {
    switch (currentStep.id) {
      case 'curriculum':
        return (
          <WizardStepCurriculum
            schoolId={schoolId}
            currentCurriculum={curriculum}
            onDone={handleStepDone}
          />
        );
      case 'academic_year':
        return (
          <WizardStepAcademicYear
            schoolId={schoolId}
            onAcademicYearCreated={setAcademicYearId}
            onDone={handleStepDone}
          />
        );
      case 'terms':
        return (
          <WizardStepTerms
            schoolId={schoolId}
            academicYearId={academicYearId}
            onDone={handleStepDone}
          />
        );
      case 'subjects':
        return (
          <WizardStepSubjects
            schoolId={schoolId}
            curriculum={curriculum}
            onDone={handleStepDone}
          />
        );
      case 'classes':
        return (
          <WizardStepClasses
            schoolId={schoolId}
            academicYearId={academicYearId}
            onDone={handleStepDone}
          />
        );
      case 'invite':
        return (
          <WizardStepInviteUsers
            schoolId={schoolId}
            onDone={handleStepDone}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-group overflow-hidden">
      {/* An indigo-to-indigo gradient with white type, on a product whose one
          accent is green — the second such banner on this page. */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--rule-soft)' }}>
        <div className="flex items-baseline gap-3 mb-4">
          <h2 className="scholr-label" style={{ margin: 0 }}>Step {currentIndex + 1} of {STEPS.length}</h2>
          <p style={{ margin: 0, fontSize: '.88rem', color: 'var(--muted)' }}>{currentStep.description}</p>
        </div>
        <StepNav steps={STEPS} currentIndex={currentIndex} completedStepIds={completedStepIds} />
        <div style={{ marginTop: '1rem' }}>
          <Meter value={(currentIndex / STEPS.length) * 100} height={3} />
        </div>
      </div>

      {/* Step content */}
      <div className="p-6">
        {renderStep()}
      </div>

      {/* Footer nav */}
      <div className="px-6 py-4 scholr-sunk border-t scholr-rule-soft flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="gap-1.5 scholr-muted"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleSkip} className="scholr-faint text-xs">
            Skip this step
          </Button>
          {isLastStep ? (
            <Button size="sm" onClick={onComplete} className="pub-btn pub-btn-primary gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Finish
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setCurrentIndex(i => i + 1)}
              className="scholr-accent-sf hover:scholr-accent-sf gap-1.5"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}