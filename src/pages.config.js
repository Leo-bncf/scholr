/**
 * pages.config.js - Page routing configuration
 *
 * NO LONGER AUTO-GENERATED: base44's Vite plugin used to regenerate this, and
 * that plugin is gone. Add new pages here by hand.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AcceptInvitation from './pages/AcceptInvitation';
import AppHome from './pages/AppHome';
import AssignmentDetail from './pages/AssignmentDetail';
import ClassGradebook from './pages/ClassGradebook';
import ClassWorkspace from './pages/ClassWorkspace';
import Contact from './pages/Contact';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import CoordinatorIBCore from './pages/CoordinatorIBCore';
import CoordinatorPredictedGrades from './pages/CoordinatorPredictedGrades';
import Demo from './pages/Demo';
import DemoShowcase from './pages/DemoShowcase';
import Features from './pages/Features';
import FirstLogin from './pages/FirstLogin';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Messages from './pages/Messages';
import NoSchool from './pages/NoSchool';
import ParentDashboard from './pages/ParentDashboard';
import PasswordReset from './pages/PasswordReset';

import SchoolAdminAttendance from './pages/SchoolAdminAttendance';
import SchoolAdminBilling from './pages/SchoolAdminBilling';
import SchoolAdminClasses from './pages/SchoolAdminClasses';
import SchoolAdminDashboard from './pages/SchoolAdminDashboard';
import SchoolAdminEnrollments from './pages/SchoolAdminEnrollments';
import SchoolAdminReports from './pages/SchoolAdminReports';
import SchoolAdminSettings from './pages/SchoolAdminSettings';
import SchoolAdminSubjects from './pages/SchoolAdminSubjects';
import SchoolAdminTimetable from './pages/SchoolAdminTimetable';
import SchoolAdminUsers from './pages/SchoolAdminUsers';
import SchoolOnboarding from './pages/SchoolOnboarding';
import Security from './pages/Security';
import StudentBehavior from './pages/StudentBehavior';
import StudentCAS from './pages/StudentCAS';
import StudentDashboard from './pages/StudentDashboard';
import StudentEE from './pages/StudentEE';
import StudentTOK from './pages/StudentTOK';
import SubmissionReview from './pages/SubmissionReview';
import SuperAdminAuditLogs from './pages/SuperAdminAuditLogs';
import SuperAdminBilling from './pages/SuperAdminBilling';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminPlanManagement from './pages/SuperAdminPlanManagement';
import SuperAdminPlans from './pages/SuperAdminPlans';
import SuperAdminProduction from './pages/SuperAdminProduction';
import SuperAdminProductionLaunch from './pages/SuperAdminProductionLaunch';
import SuperAdminSchoolDetail from './pages/SuperAdminSchoolDetail';
import SuperAdminSchools from './pages/SuperAdminSchools';
import SuperAdminUsers from './pages/SuperAdminUsers';
import TeacherClasses from './pages/TeacherClasses';
import TeacherDashboard from './pages/TeacherDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcceptInvitation": AcceptInvitation,
    "AppHome": AppHome,
    "AssignmentDetail": AssignmentDetail,
    "ClassGradebook": ClassGradebook,
    "ClassWorkspace": ClassWorkspace,
    "Contact": Contact,
    "CoordinatorDashboard": CoordinatorDashboard,
    "CoordinatorIBCore": CoordinatorIBCore,
    "CoordinatorPredictedGrades": CoordinatorPredictedGrades,
    "Demo": Demo,
    "DemoShowcase": DemoShowcase,
    "Features": Features,
    "FirstLogin": FirstLogin,
    "Landing": Landing,
    "Login": Login,
    "Messages": Messages,
    "NoSchool": NoSchool,
    "ParentDashboard": ParentDashboard,
    "PasswordReset": PasswordReset,

    "SchoolAdminAttendance": SchoolAdminAttendance,
    "SchoolAdminBilling": SchoolAdminBilling,
    "SchoolAdminClasses": SchoolAdminClasses,
    "SchoolAdminDashboard": SchoolAdminDashboard,
    "SchoolAdminEnrollments": SchoolAdminEnrollments,
    "SchoolAdminReports": SchoolAdminReports,
    "SchoolAdminSettings": SchoolAdminSettings,
    "SchoolAdminSubjects": SchoolAdminSubjects,
    "SchoolAdminTimetable": SchoolAdminTimetable,
    "SchoolAdminUsers": SchoolAdminUsers,
    "SchoolOnboarding": SchoolOnboarding,
    "Security": Security,
    "StudentBehavior": StudentBehavior,
    "StudentCAS": StudentCAS,
    "StudentDashboard": StudentDashboard,
    "StudentEE": StudentEE,
    "StudentTOK": StudentTOK,
    "SubmissionReview": SubmissionReview,
    "SuperAdminAuditLogs": SuperAdminAuditLogs,
    "SuperAdminBilling": SuperAdminBilling,
    "SuperAdminDashboard": SuperAdminDashboard,
    "SuperAdminPlanManagement": SuperAdminPlanManagement,
    "SuperAdminPlans": SuperAdminPlans,
    "SuperAdminProduction": SuperAdminProduction,
    "SuperAdminProductionLaunch": SuperAdminProductionLaunch,
    "SuperAdminSchoolDetail": SuperAdminSchoolDetail,
    "SuperAdminSchools": SuperAdminSchools,
    "SuperAdminUsers": SuperAdminUsers,
    "TeacherClasses": TeacherClasses,
    "TeacherDashboard": TeacherDashboard,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};