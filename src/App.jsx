import { Toaster } from "@/components/ui/toaster"
import { lazyPage } from '@/lib/lazyPage';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { Suspense } from 'react';

/* Routes declared here, rather than through pages.config, are lazy for the
 * same reason the rest are — and one of them mattered more than the others:
 * SuperAdminAnalytics imports recharts, so a static import put the whole
 * 421 kB charting library in the entry graph. Every visitor to the
 * marketing site downloaded it. */
const SuperAdminAnalytics = lazyPage(() => import('./pages/SuperAdminAnalytics'));
const SuperAdminSupport = lazyPage(() => import('./pages/SuperAdminSupport'));
const SuperAdminTimetables = lazyPage(() => import('./pages/SuperAdminTimetables'));
const PrivacyPolicy = lazyPage(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazyPage(() => import('./pages/TermsOfService'));
const SecurityAndCompliance = lazyPage(() => import('./pages/SecurityAndCompliance'));
const SuperAdminSchoolDetail = lazyPage(() => import('./pages/SuperAdminSchoolDetail'));
const SuperAdminSettings = lazyPage(() => import('./pages/SuperAdminSettings'));
const SchoolAdminAcademicSetup = lazyPage(() => import('./pages/SchoolAdminAcademicSetup'));
const PersonalSettings = lazyPage(() => import('./pages/PersonalSettings'));
const TeacherWorkspace = lazyPage(() => import('./pages/TeacherWorkspace'));
const ParentInsightsDashboard = lazyPage(() => import('./pages/ParentInsightsDashboard'));
const UnifiedCalendar = lazyPage(() => import('./pages/UnifiedCalendar'));
const SchoolAnalytics = lazyPage(() => import('./pages/SchoolAnalytics'));
const ReportingEngine = lazyPage(() => import('./pages/ReportingEngine'));
const CurriculumMapping = lazyPage(() => import('./pages/CurriculumMapping'));
const StudentAcademicDashboard = lazyPage(() => import('./pages/StudentAcademicDashboard'));
const StudentTimetable = lazyPage(() => import('./pages/StudentTimetable'));
const StudentAttendance = lazyPage(() => import('./pages/StudentAttendance'));
const StudentCommunication = lazyPage(() => import('./pages/StudentCommunication'));
const StudentIBCore = lazyPage(() => import('./pages/StudentIBCore'));
const SchoolAdminOnboarding = lazyPage(() => import('./pages/SchoolAdminOnboarding'));
const DemoHub = lazyPage(() => import('./pages/demo/DemoHub'));
const DemoStudent = lazyPage(() => import('./pages/demo/DemoStudent'));
const DemoStudentAssignment = lazyPage(() => import('./pages/demo/DemoStudentAssignment'));
const DemoTeacher = lazyPage(() => import('./pages/demo/DemoTeacher'));
const DemoTeacherClass = lazyPage(() => import('./pages/demo/DemoTeacherClass'));
const DemoTeacherReview = lazyPage(() => import('./pages/demo/DemoTeacherReview'));
const DemoParent = lazyPage(() => import('./pages/demo/DemoParent'));
const DemoParentAssignment = lazyPage(() => import('./pages/demo/DemoParentAssignment'));
const DemoLeader = lazyPage(() => import('./pages/demo/DemoLeader'));
const SchoolAdminSupport = lazyPage(() => import('./pages/SchoolAdminSupport'));
const SchoolAdminGradebookGovernance = lazyPage(() => import('./pages/SchoolAdminGradebookGovernance'));
const SchoolAdminBehavior = lazyPage(() => import('./pages/SchoolAdminBehavior'));
const SchoolAdminMessagingPolicy = lazyPage(() => import('./pages/SchoolAdminMessagingPolicy'));
const SchoolAdminGovernance = lazyPage(() => import('./pages/SchoolAdminGovernance'));
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ImpersonationProvider, useImpersonation } from '@/components/auth/ImpersonationContext';
import { UserProvider } from '@/components/auth/UserContext';
import ImpersonationBanner from '@/components/auth/ImpersonationBanner';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

/**
 * Shown while a route's chunk is in flight.
 *
 * Every page is lazy, so a boundary is mandatory — React throws without one.
 * It is deliberately the same spinner the auth check already renders, so a
 * navigation waiting on a chunk looks like one waiting on data instead of
 * flashing a second, different loading state.
 */
function RouteFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
  );
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {/* The interactive sandbox. These come before the pagesConfig loop, and
          because React Router matches case-insensitively they also claim /Demo,
          /DEMO and so on. The lead-capture form is therefore registered as
          'BookDemo' — naming it 'Demo' made it permanently unreachable. */}
      <Route path="/demo" element={<DemoHub />} />
      <Route path="/demo/student" element={<DemoStudent />} />
      <Route path="/demo/student/assignment/:assignmentId" element={<DemoStudentAssignment />} />
      <Route path="/demo/teacher" element={<DemoTeacher />} />
      <Route path="/demo/teacher/class/:classId" element={<DemoTeacherClass />} />
      <Route path="/demo/teacher/review/:submissionId" element={<DemoTeacherReview />} />
      <Route path="/demo/parent" element={<DemoParent />} />
      <Route path="/demo/parent/assignment/:assignmentId" element={<DemoParentAssignment />} />
      <Route path="/demo/leader" element={<DemoLeader />} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route
        path="/SuperAdminAnalytics"
        element={
          <LayoutWrapper currentPageName="SuperAdminAnalytics">
            <SuperAdminAnalytics />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SuperAdminSettings"
        element={
          <LayoutWrapper currentPageName="SuperAdminSettings">
            <SuperAdminSettings />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SuperAdminSchoolDetail/:schoolId"
        element={
          <LayoutWrapper currentPageName="SuperAdminSchoolDetail">
            <SuperAdminSchoolDetail />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SuperAdminSupport"
        element={
          <LayoutWrapper currentPageName="SuperAdminSupport">
            <SuperAdminSupport />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SuperAdminTimetables"
        element={
          <LayoutWrapper currentPageName="SuperAdminTimetables">
            <SuperAdminTimetables />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SchoolAdminGradebookGovernance"
        element={
          <LayoutWrapper currentPageName="SchoolAdminGradebookGovernance">
            <SchoolAdminGradebookGovernance />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SchoolAdminMessagingPolicy"
        element={
          <LayoutWrapper currentPageName="SchoolAdminMessagingPolicy">
            <SchoolAdminMessagingPolicy />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SchoolAdminBehavior"
        element={
          <LayoutWrapper currentPageName="SchoolAdminBehavior">
            <SchoolAdminBehavior />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SchoolAdminGovernance"
        element={
          <LayoutWrapper currentPageName="SchoolAdminGovernance">
            <SchoolAdminGovernance />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SchoolAdminSupport"
        element={
          <LayoutWrapper currentPageName="SchoolAdminSupport">
            <SchoolAdminSupport />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SchoolAdminOnboarding"
        element={
          <LayoutWrapper currentPageName="SchoolAdminOnboarding">
            <SchoolAdminOnboarding />
          </LayoutWrapper>
        }
      />
      <Route
        path="/StudentCommunication"
        element={
          <LayoutWrapper currentPageName="StudentCommunication">
            <StudentCommunication />
          </LayoutWrapper>
        }
      />
      <Route
        path="/StudentAttendance"
        element={
          <LayoutWrapper currentPageName="StudentAttendance">
            <StudentAttendance />
          </LayoutWrapper>
        }
      />
      <Route
        path="/StudentTimetable"
        element={
          <LayoutWrapper currentPageName="StudentTimetable">
            <StudentTimetable />
          </LayoutWrapper>
        }
      />
      <Route
        path="/StudentIBCore"
        element={
          <LayoutWrapper currentPageName="StudentIBCore">
            <StudentIBCore />
          </LayoutWrapper>
        }
      />
      <Route
        path="/StudentAcademicDashboard"
        element={
          <LayoutWrapper currentPageName="StudentAcademicDashboard">
            <StudentAcademicDashboard />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SchoolAnalytics"
        element={
          <LayoutWrapper currentPageName="SchoolAnalytics">
            <SchoolAnalytics />
          </LayoutWrapper>
        }
      />
      <Route
        path="/ReportingEngine"
        element={
          <LayoutWrapper currentPageName="ReportingEngine">
            <ReportingEngine />
          </LayoutWrapper>
        }
      />
      <Route
        path="/PrivacyPolicy"
        element={
          <LayoutWrapper currentPageName="PrivacyPolicy">
            <PrivacyPolicy />
          </LayoutWrapper>
        }
      />
      <Route
        path="/TermsOfService"
        element={
          <LayoutWrapper currentPageName="TermsOfService">
            <TermsOfService />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SecurityAndCompliance"
        element={
          <LayoutWrapper currentPageName="SecurityAndCompliance">
            <SecurityAndCompliance />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SchoolAdminAcademicSetup"
        element={
          <LayoutWrapper currentPageName="SchoolAdminAcademicSetup">
            <SchoolAdminAcademicSetup />
          </LayoutWrapper>
        }
      />
      <Route
        path="/PersonalSettings"
        element={
          <LayoutWrapper currentPageName="PersonalSettings">
            <PersonalSettings />
          </LayoutWrapper>
        }
      />
      <Route
        path="/TeacherWorkspace"
        element={
          <LayoutWrapper currentPageName="TeacherWorkspace">
            <TeacherWorkspace />
          </LayoutWrapper>
        }
      />
      <Route
        path="/ParentInsightsDashboard"
        element={
          <LayoutWrapper currentPageName="ParentInsightsDashboard">
            <ParentInsightsDashboard />
          </LayoutWrapper>
        }
      />
      <Route
        path="/UnifiedCalendar"
        element={
          <LayoutWrapper currentPageName="UnifiedCalendar">
            <UnifiedCalendar />
          </LayoutWrapper>
        }
      />
      <Route
        path="/CurriculumMapping"
        element={
          <LayoutWrapper currentPageName="CurriculumMapping">
            <CurriculumMapping />
          </LayoutWrapper>
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ImpersonationProvider>
          {/* UserProvider lives HERE, above the router, and not inside Layout.
              Layout is rendered per route by LayoutWrapper, so a provider
              inside it unmounts and remounts on every navigation — and its
              mount effect is loadUser(), which is four serial round trips:
              auth.getUser (~127ms), the profiles row (~106ms), the active
              membership, then the school. Every page change paid all four and
              showed a blank shell while it waited.

              Mounted once here, the session is loaded once and stays. */}
          <UserProvider>
            <Router>
              <ImpersonationBanner />
              <AuthenticatedApp />
            </Router>
          </UserProvider>
          <Toaster />
        </ImpersonationProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App