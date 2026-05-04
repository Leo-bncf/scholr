import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import SuperAdminAnalytics from './pages/SuperAdminAnalytics';
import SuperAdminAutomation from './pages/SuperAdminAutomation';
import SuperAdminSupport from './pages/SuperAdminSupport';
import SuperAdminTimetables from './pages/SuperAdminTimetables';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import SecurityAndCompliance from './pages/SecurityAndCompliance';
import SuperAdminSchoolDetail from './pages/SuperAdminSchoolDetail';
import SuperAdminSettings from './pages/SuperAdminSettings';
import SchoolAdminAcademicSetup from './pages/SchoolAdminAcademicSetup';
import PersonalSettings from './pages/PersonalSettings';
import TeacherWorkspace from './pages/TeacherWorkspace';
import ParentInsightsDashboard from './pages/ParentInsightsDashboard';
import SchoolAnalytics from './pages/SchoolAnalytics';
import StudentAcademicDashboard from './pages/StudentAcademicDashboard';
import StudentTimetable from './pages/StudentTimetable';
import StudentAttendance from './pages/StudentAttendance';
import StudentCommunication from './pages/StudentCommunication';
import StudentIBCore from './pages/StudentIBCore';
import SchoolAdminOnboarding from './pages/SchoolAdminOnboarding';
import DemoHub from './pages/demo/DemoHub';
import DemoStudent from './pages/demo/DemoStudent';
import DemoStudentAssignment from './pages/demo/DemoStudentAssignment';
import DemoTeacher from './pages/demo/DemoTeacher';
import DemoTeacherClass from './pages/demo/DemoTeacherClass';
import DemoTeacherReview from './pages/demo/DemoTeacherReview';
import DemoParent from './pages/demo/DemoParent';
import DemoParentAssignment from './pages/demo/DemoParentAssignment';
import DemoLeader from './pages/demo/DemoLeader';
import SchoolAdminSupport from './pages/SchoolAdminSupport';
import SchoolAdminGradebookGovernance from './pages/SchoolAdminGradebookGovernance';
import SchoolAdminBehavior from './pages/SchoolAdminBehavior';
import SchoolAdminMessagingPolicy from './pages/SchoolAdminMessagingPolicy';
import SchoolAdminGovernance from './pages/SchoolAdminGovernance';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { RLSProvider } from '@/components/security/RLSProvider';
import { ImpersonationProvider, useImpersonation } from '@/components/auth/ImpersonationContext';
import ImpersonationBanner from '@/components/auth/ImpersonationBanner';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

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
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {/* Demo sandbox routes — must come before the pagesConfig loop so /demo wins over legacy /Demo */}
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
        path="/SuperAdminAutomation"
        element={
          <LayoutWrapper currentPageName="SuperAdminAutomation">
            <SuperAdminAutomation />
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
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ImpersonationProvider>
          <RLSProvider>
            <Router>
              <ImpersonationBanner />
              <AuthenticatedApp />
            </Router>
          </RLSProvider>
          <Toaster />
        </ImpersonationProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App