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

import { lazy } from 'react';
import __Layout from './Layout.jsx';

/* Every page is loaded on demand.
 *
 * These were 58 static imports, so one chunk carried the whole product:
 * 3,355 kB minified. Someone landing on the marketing site downloaded and
 * parsed the super-admin console, the gradebook and every dashboard before
 * the page could paint.
 *
 * Layout is deliberately NOT lazy — it wraps every route, so deferring it
 * would only put a suspense boundary around everything and gain nothing. */
const AcceptInvitation = lazy(() => import('./pages/AcceptInvitation'));
const AppHome = lazy(() => import('./pages/AppHome'));
const AssignmentDetail = lazy(() => import('./pages/AssignmentDetail'));
const ClassGradebook = lazy(() => import('./pages/ClassGradebook'));
const ClassWorkspace = lazy(() => import('./pages/ClassWorkspace'));
const Contact = lazy(() => import('./pages/Contact'));
const CoordinatorDashboard = lazy(() => import('./pages/CoordinatorDashboard'));
const CoordinatorIBCore = lazy(() => import('./pages/CoordinatorIBCore'));
const CoordinatorPredictedGrades = lazy(() => import('./pages/CoordinatorPredictedGrades'));
const BookDemo = lazy(() => import('./pages/BookDemo'));
const DemoShowcase = lazy(() => import('./pages/DemoShowcase'));
const Features = lazy(() => import('./pages/Features'));
const FirstLogin = lazy(() => import('./pages/FirstLogin'));
const Login = lazy(() => import('./pages/Login'));
const Landing = lazy(() => import('./pages/Landing'));
const Messages = lazy(() => import('./pages/Messages'));
const NoSchool = lazy(() => import('./pages/NoSchool'));
const ParentDashboard = lazy(() => import('./pages/ParentDashboard'));
const PasswordReset = lazy(() => import('./pages/PasswordReset'));
const Pricing = lazy(() => import('./pages/Pricing'));
const About = lazy(() => import('./pages/About'));
const FAQ = lazy(() => import('./pages/FAQ'));
const Schedual = lazy(() => import('./pages/Schedual'));
const SuperAdminHealth = lazy(() => import('./pages/SuperAdminHealth'));
const IbCurriculum = lazy(() => import('./pages/curriculum/IbCurriculum'));
const IgcseCurriculum = lazy(() => import('./pages/curriculum/IgcseCurriculum'));
const ALevelCurriculum = lazy(() => import('./pages/curriculum/ALevelCurriculum'));
const UsCurriculum = lazy(() => import('./pages/curriculum/UsCurriculum'));
const SchoolAdminAttendance = lazy(() => import('./pages/SchoolAdminAttendance'));
const SchoolAdminBilling = lazy(() => import('./pages/SchoolAdminBilling'));
const SchoolAdminClasses = lazy(() => import('./pages/SchoolAdminClasses'));
const SchoolAdminDashboard = lazy(() => import('./pages/SchoolAdminDashboard'));
const SchoolAdminEnrollments = lazy(() => import('./pages/SchoolAdminEnrollments'));
const SchoolAdminReports = lazy(() => import('./pages/SchoolAdminReports'));
const SchoolAdminSettings = lazy(() => import('./pages/SchoolAdminSettings'));
const SchoolAdminSubjects = lazy(() => import('./pages/SchoolAdminSubjects'));
const SchoolAdminTimetable = lazy(() => import('./pages/SchoolAdminTimetable'));
const SchoolAdminUsers = lazy(() => import('./pages/SchoolAdminUsers'));
const SchoolOnboarding = lazy(() => import('./pages/SchoolOnboarding'));
const Security = lazy(() => import('./pages/Security'));
const StudentBehavior = lazy(() => import('./pages/StudentBehavior'));
const StudentCAS = lazy(() => import('./pages/StudentCAS'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentEE = lazy(() => import('./pages/StudentEE'));
const StudentTOK = lazy(() => import('./pages/StudentTOK'));
const SubmissionReview = lazy(() => import('./pages/SubmissionReview'));
const SuperAdminAuditLogs = lazy(() => import('./pages/SuperAdminAuditLogs'));
const SuperAdminBilling = lazy(() => import('./pages/SuperAdminBilling'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const SuperAdminPlanManagement = lazy(() => import('./pages/SuperAdminPlanManagement'));
const SuperAdminPlans = lazy(() => import('./pages/SuperAdminPlans'));
const SuperAdminProduction = lazy(() => import('./pages/SuperAdminProduction'));
const SuperAdminProductionLaunch = lazy(() => import('./pages/SuperAdminProductionLaunch'));
const SuperAdminSchoolDetail = lazy(() => import('./pages/SuperAdminSchoolDetail'));
const SuperAdminSchools = lazy(() => import('./pages/SuperAdminSchools'));
const SuperAdminUsers = lazy(() => import('./pages/SuperAdminUsers'));
const TeacherClasses = lazy(() => import('./pages/TeacherClasses'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));


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
    "BookDemo": BookDemo,
    "DemoShowcase": DemoShowcase,
    "Features": Features,
    "FirstLogin": FirstLogin,
    "Landing": Landing,
    "Login": Login,
    "Messages": Messages,
    "NoSchool": NoSchool,
    "ParentDashboard": ParentDashboard,
    "PasswordReset": PasswordReset,
    "Pricing": Pricing,
    "About": About,
    "FAQ": FAQ,
    "Schedual": Schedual,
    "SuperAdminHealth": SuperAdminHealth,
    // Slug-shaped routes: these are the pages a head of department searches for
    // by name, so the URL says what the page is about rather than which React
    // component renders it.
    "ib-school-management-software": IbCurriculum,
    "igcse-school-management-software": IgcseCurriculum,
    "a-level-school-management-software": ALevelCurriculum,
    "us-school-management-software": UsCurriculum,

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