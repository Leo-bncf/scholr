import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/components/auth/UserContext';
import { useSchoolOperationsData } from '@/components/hooks/useSchoolOperationsData';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import {
  Activity, ShieldCheck, Zap, Sparkles,
} from 'lucide-react';
import AppSidebar from '@/components/app/AppSidebar';
import { SCHOOL_ADMIN_SIDEBAR_LINKS } from '@/components/app/schoolAdminSidebarLinks';
import { useCurriculum } from '@/hooks/useCurriculum';
import LoadingStateBase from '@/components/common/LoadingStateBase';
import SchoolHealthOverview from '@/components/dashboard/SchoolHealthOverview';
import OperationalAlerts from '@/components/dashboard/OperationalAlerts';
import QuickActionsHub from '@/components/dashboard/QuickActionsHub';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import { format } from 'date-fns';



const statusMeta = {
  active:     { label: 'Active',     classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  onboarding: { label: 'Onboarding', classes: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-500' },
  suspended:  { label: 'Suspended',  classes: 'bg-red-50 text-red-700 border-red-200',              dot: 'bg-red-500' },
};

function SectionHeader({ icon: Icon, title, subtitle, accent = 'slate' }) {
  const accents = {
    slate:  'bg-slate-100 text-slate-500',
    indigo: 'bg-indigo-100 text-indigo-600',
    rose:   'bg-rose-100 text-rose-600',
    amber:  'bg-amber-100 text-amber-600',
  };
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-8 h-8 ${accents[accent]} rounded-md flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function SchoolAdminDashboard() {
  const navigate = useNavigate();
  const { user, schoolId, loading: userLoading } = useUser();
  const { shortLabel } = useCurriculum();
  const { data, isLoading, isError } = useSchoolOperationsData(schoolId);

  useEffect(() => {
    if (!userLoading && !user) {
      base44.auth.redirectToLogin(createPageUrl('AppHome'));
    }
  }, [user, userLoading]);

  if (userLoading || !user) {
    return <LoadingStateBase />;
  }

  if (isLoading) {
    return <LoadingStateBase />;
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-slate-700 font-semibold">Failed to load dashboard data.</p>
          <p className="text-sm text-slate-400">Check your connection and refresh the page.</p>
        </div>
      </div>
    );
  }

  const school = data?.school;
  const today = format(new Date(), 'EEEE, d MMMM yyyy');
  const statusKey = school?.status || 'onboarding';
  const sm = statusMeta[statusKey] || statusMeta.onboarding;

  const alertCount =
    (data.classesWithoutTeachers.length > 0 ? 1 : 0) +
    (data.studentsWithoutClasses.length > 0 ? 1 : 0) +
    ((data.failedSyncs?.length ?? 0) > 0 ? 1 : 0) +
    (['past_due', 'unpaid', 'incomplete'].includes(school?.billing_status) ? 1 : 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar
        links={SCHOOL_ADMIN_SIDEBAR_LINKS}
        role="school_admin"
        schoolName={school?.name}
        userName={user?.full_name}
        userId={user?.id}
        schoolId={schoolId}
      />

      <main className="md:ml-64 min-h-screen flex flex-col">

        {/* Top header bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">School Operations</h1>
                {alertCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
                    {alertCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{school?.name} · <span className="text-blue-500 font-semibold">{shortLabel}</span> · {today}</p>
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider border rounded-md flex-shrink-0 ${sm.classes}`}>
              <span className={`w-2 h-2 rounded-full ${sm.dot}`} />
              {sm.label}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-8">

          {/* Setup Checklist — only visible until complete */}
          {data.setupDone < data.setupTotal && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-md flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Getting Started</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{data?.setupDone} of {data?.setupTotal} setup steps complete</p>
                </div>
              </div>
              <OnboardingChecklist
                schoolId={schoolId}
                showWizard={() => navigate('/SchoolAdminOnboarding')}
              />
            </section>
          )}

          {/* Quick Actions */}
          <section>
            <SectionHeader
              icon={Zap}
              title="Quick Actions"
              subtitle="One-click entry to the most common admin tasks"
              accent="indigo"
            />
            <QuickActionsHub />
          </section>

          {/* Operational Alerts */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${alertCount > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Operational Alerts</h2>
                {alertCount > 0 && (
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    {alertCount} issue{alertCount > 1 ? 's' : ''} require action
                  </span>
                )}
              </div>
            </div>
            <OperationalAlerts data={data} />
          </section>

          {/* School Health Overview */}
          <section>
            <SectionHeader
              icon={Activity}
              title="School Health Overview"
              subtitle="Key metrics, activity signals, and reporting windows — scoped to your school"
              accent="slate"
            />
            <SchoolHealthOverview data={data} />
          </section>

        </div>
      </main>
    </div>
  );
}