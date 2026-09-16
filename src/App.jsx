import { Toaster } from "@/components/ui/toaster"
import { lazyPage } from '@/lib/lazyPage';
import SchoolAdminRedirect from './pages/SchoolAdminRedirect';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { Suspense } from 'react';

/* Routes declared here, rather than through pages.config, are lazy for the
 * same reason the rest are — and one of them mattered more than the others:
 * SuperAdminAnalytics imports recharts, so a static import put the whole
 * 421 kB charting library in the entry graph. Every visitor to the
 * marketing site downloaded it. */
const SchoolAdminRules = lazyPage('SchoolAdminRules', () => import('./pages/SchoolAdminRules'));
const SuperAdminAnalytics = lazyPage('SuperAdminAnalytics', () => import('./pages/SuperAdminAnalytics'));
const SuperAdminSupport = lazyPage('SuperAdminSupport', () => import('./pages/SuperAdminSupport'));
const SuperAdminTimetables = lazyPage('SuperAdminTimetables', () => import('./pages/SuperAdminTimetables'));
const PrivacyPolicy = lazyPage('PrivacyPolicy', () => import('./pages/PrivacyPolicy'));
const TermsOfService = lazyPage('TermsOfService', () => import('./pages/TermsOfService'));
const SecurityAndCompliance = lazyPage('SecurityAndCompliance', () => import('./pages/SecurityAndCompliance'));
const SuperAdminSchoolDetail = lazyPage('SuperAdminSchoolDetail', () => import('./pages/SuperAdminSchoolDetail'));
const SuperAdminSettings = lazyPage('SuperAdminSettings', () => import('./pages/SuperAdminSettings'));
const SchoolAdminAcademicSetup = lazyPage('SchoolAdminAcademicSetup', () => import('./pages/SchoolAdminAcademicSetup'));
const PersonalSettings = lazyPage('PersonalSettings', () => import('./pages/PersonalSettings'));
const TeacherWorkspace = lazyPage('TeacherWorkspace', () => import('./pages/TeacherWorkspace'));
const ParentInsightsDashboard = lazyPage('ParentInsightsDashboard', () => import('./pages/ParentInsightsDashboard'));
const UnifiedCalendar = lazyPage('UnifiedCalendar', () => import('./pages/UnifiedCalendar'));
const CurriculumMapping = lazyPage('CurriculumMapping', () => import('./pages/CurriculumMapping'));
const StudentAcademicDashboard = lazyPage('StudentAcademicDashboard', () => import('./pages/StudentAcademicDashboard'));
const StudentTimetable = lazyPage('StudentTimetable', () => import('./pages/StudentTimetable'));
const StudentAttendance = lazyPage('StudentAttendance', () => import('./pages/StudentAttendance'));
const StudentCommunication = lazyPage('StudentCommunication', () => import('./pages/StudentCommunication'));
const StudentIBCore = lazyPage('StudentIBCore', () => import('./pages/StudentIBCore'));
const SchoolAdminOnboarding = lazyPage('SchoolAdminOnboarding', () => import('./pages/SchoolAdminOnboarding'));
const DemoHub = lazyPage(() => import('./pages/demo/DemoHub'));
const DemoStudent = lazyPage(() => import('./pages/demo/DemoStudent'));
const DemoStudentAssignment = lazyPage(() => import('./pages/demo/DemoStudentAssignment'));
const DemoTeacher = lazyPage(() => import('./pages/demo/DemoTeacher'));
const DemoTeacherClass = lazyPage(() => import('./pages/demo/DemoTeacherClass'));
const DemoTeacherReview = lazyPage(() => import('./pages/demo/DemoTeacherReview'));
const DemoParent = lazyPage(() => import('./pages/demo/DemoParent'));
const DemoParentAssignment = lazyPage(() => import('./pages/demo/DemoParentAssignment'));
const DemoLeader = lazyPage(() => import('./pages/demo/DemoLeader'));
const SchoolAdminSupport = lazyPage('SchoolAdminSupport', () => import('./pages/SchoolAdminSupport'));
const SchoolAdminBehavior = lazyPage('SchoolAdminBehavior', () => import('./pages/SchoolAdminBehavior'));
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ImpersonationProvider } from '@/components/auth/ImpersonationContext';
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
        path="/SchoolAdminRules"
        element={
          <LayoutWrapper currentPageName="SchoolAdminRules">
            <SchoolAdminRules />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SchoolAdminGradebookGovernance"
        element={
          <LayoutWrapper currentPageName="SchoolAdminGradebookGovernance">
            <SchoolAdminRedirect />
          </LayoutWrapper>
        }
      />
      <Route
        path="/SchoolAdminMessagingPolicy"
        element={
          <LayoutWrapper currentPageName="SchoolAdminMessagingPolicy">
            <SchoolAdminRedirect />
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
            <SchoolAdminRedirect />
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
            <SchoolAdminRedirect />
          </LayoutWrapper>
        }
      />
      <Route
        path="/ReportingEngine"
        element={
          <LayoutWrapper currentPageName="ReportingEngine">
            <SchoolAdminRedirect />
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
            {/* v7_startTransition wraps router state updates in
                React.startTransition. When the next route's chunk has not
                arrived yet, React keeps the page you are on rendered instead
                of falling back to <Suspense> — so a slow network makes a
                navigation feel late, rather than blanking the whole app.

                Preloading on hover (see lazyPage) handles the fast case and
                removes the wait entirely on a warm connection; this handles
                the case where the fetch is still in flight when you click.
                Measured on production before this: 5 of 12 navigations blanked
                despite the preload, because a 16-68 kB chunk does not arrive
                inside the ~200 ms between hover and click over real latency. */}
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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