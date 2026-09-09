import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Loader2, ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OnboardingProgress from '@/components/school/OnboardingProgress';
import SetupChecklist from '@/components/school/SetupChecklist';
import SchoolProfileStep from '@/components/school/SchoolProfileStep';
import AcademicYearStep from '@/components/school/AcademicYearStep';
import TermsStep from '@/components/school/TermsStep';
import SubjectsStep from '@/components/school/SubjectsStep';
import * as membershipsData from '@/data/memberships';
import * as schoolsData from '@/data/schools';
import { getCurrentUser, isAuthenticated } from '@/data/session';

/**
 * School onboarding wizard
 * Guided setup experience for new schools
 */
export default function SchoolOnboarding() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const steps = [
    {
      id: 'profile',
      label: 'School Profile',
      component: SchoolProfileStep
    },
    {
      id: 'academic_year',
      label: 'Academic Years',
      component: AcademicYearStep
    },
    {
      id: 'terms',
      label: 'Terms',
      component: TermsStep
    },
    {
      id: 'subjects',
      label: 'Subjects',
      component: SubjectsStep
    }
  ];

  // Initialize
  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        const authed = await isAuthenticated();
        if (!authed) {
          navigate('/');
          return;
        }

        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Get user's school
        const memberships = await membershipsData.where({
          user_id: currentUser.id,
          role: 'school_admin'
        });

        if (!memberships || memberships.length === 0) {
          navigate('/dashboard');
          return;
        }

        const schoolId = memberships[0].school_id;
        const schools = await schoolsData.where({ id: schoolId });

        if (schools.length > 0) {
          setSchool(schools[0]);
          // Set initial completed steps based on school state
          const completed = new Set();
          if (schools[0].name) completed.add(0); // profile done
          setCompletedSteps(completed);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing onboarding:', error);
        setLoading(false);
      }
    };

    initializeOnboarding();
  }, [navigate]);

  const handleStepComplete = (stepIndex) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepIndex);
    setCompletedSteps(newCompleted);

    // Move to next step
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    } else {
      // Onboarding complete
      navigate(createPageUrl('SchoolAdminDashboard'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Home className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Set Up Your School</h1>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('SchoolAdminDashboard'))}
            className="text-slate-600"
          >
            Exit Setup
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Progress */}
          <div className="lg:col-span-1">
            <OnboardingProgress
              currentStep={steps[currentStep].id}
              totalSteps={steps.length}
              completedSteps={completedSteps.size}
              steps={steps.map((step, idx) => ({
                id: step.id,
                label: step.label,
                completed: completedSteps.has(idx)
              }))}
            />

            {/* Quick Checklist */}
            <div className="mt-8">
              <SetupChecklist
                schoolId={school?.id}
                onNavigate={(taskId) => {
                  const stepIndex = steps.findIndex(s => s.id === taskId);
                  if (stepIndex >= 0) setCurrentStep(stepIndex);
                }}
              />
            </div>
          </div>

          {/* Main Step Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-indigo-600 font-semibold">
                  <span>Step {currentStep + 1}</span>
                  <span>of</span>
                  <span>{steps.length}</span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 mt-2">
                  {steps[currentStep].label}
                </h2>
              </div>

              {school && (
                <CurrentStepComponent
                  schoolId={school.id}
                  onComplete={() => handleStepComplete(currentStep)}
                />
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Back
              </Button>

              <div className="text-sm text-slate-600">
                {completedSteps.size} of {steps.length} steps completed
              </div>

              {currentStep < steps.length - 1 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="gap-2"
                >
                  Skip for Now
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}