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

import __Layout from './Layout.jsx';
import { lazyPage, registerPages } from '@/lib/lazyPage';
import SchoolAdminRedirect from './pages/SchoolAdminRedirect';

/* Every page is loaded on demand.
 *
 * These were 58 static imports, so one chunk carried the whole product:
 * 3,355 kB minified. Someone landing on the marketing site downloaded and
 * parsed the super-admin console, the gradebook and every dashboard before
 * the page could paint.
 *
 * Layout is deliberately NOT lazy — it wraps every route, so deferring it
 * would only put a suspense boundary around everything and gain nothing. */
const AcceptInvitation = lazyPage('AcceptInvitation', () => import('./pages/AcceptInvitation'));
const AppHome = lazyPage('AppHome', () => import('./pages/AppHome'));
const AssignmentDetail = lazyPage('AssignmentDetail', () => import('./pages/AssignmentDetail'));
const ClassGradebook = lazyPage('ClassGradebook', () => import('./pages/ClassGradebook'));
const ClassWorkspace = lazyPage('ClassWorkspace', () => import('./pages/ClassWorkspace'));
const Contact = lazyPage('Contact', () => import('./pages/Contact'));
const CoordinatorDashboard = lazyPage('CoordinatorDashboard', () => import('./pages/CoordinatorDashboard'));
const CoordinatorIBCore = lazyPage('CoordinatorIBCore', () => import('./pages/CoordinatorIBCore'));
const CoordinatorPredictedGrades = lazyPage('CoordinatorPredictedGrades', () => import('./pages/CoordinatorPredictedGrades'));
const BookDemo = lazyPage('BookDemo', () => import('./pages/BookDemo'));
const DemoShowcase = lazyPage('DemoShowcase', () => import('./pages/DemoShowcase'));
const Features = lazyPage('Features', () => import('./pages/Features'));
const FirstLogin = lazyPage('FirstLogin', () => import('./pages/FirstLogin'));
const Login = lazyPage('Login', () => import('./pages/Login'));
const Landing = lazyPage('Landing', () => import('./pages/Landing'));
const Messages = lazyPage('Messages', () => import('./pages/Messages'));
const NoSchool = lazyPage('NoSchool', () => import('./pages/NoSchool'));
const ParentDashboard = lazyPage('ParentDashboard', () => import('./pages/ParentDashboard'));
const PasswordReset = lazyPage('PasswordReset', () => import('./pages/PasswordReset'));
const Pricing = lazyPage('Pricing', () => import('./pages/Pricing'));
const About = lazyPage('About', () => import('./pages/About'));
const FAQ = lazyPage('FAQ', () => import('./pages/FAQ'));
const Schedual = lazyPage('Schedual', () => import('./pages/Schedual'));
const SuperAdminHealth = lazyPage('SuperAdminHealth', () => import('./pages/SuperAdminHealth'));
const IbCurriculum = lazyPage('IbCurriculum', () => import('./pages/curriculum/IbCurriculum'));
const IgcseCurriculum = lazyPage('IgcseCurriculum', () => import('./pages/curriculum/IgcseCurriculum'));
const ALevelCurriculum = lazyPage('ALevelCurriculum', () => import('./pages/curriculum/ALevelCurriculum'));
const UsCurriculum = lazyPage('UsCurriculum', () => import('./pages/curriculum/UsCurriculum'));
const SchoolAdminAttendance = lazyPage('SchoolAdminAttendance', () => import('./pages/SchoolAdminAttendance'));
const SchoolAdminBilling = lazyPage('SchoolAdminBilling', () => import('./pages/SchoolAdminBilling'));
const SchoolAdminClasses = lazyPage('SchoolAdminClasses', () => import('./pages/SchoolAdminClasses'));
const SchoolAdminDashboard = lazyPage('SchoolAdminDashboard', () => import('./pages/SchoolAdminDashboard'));
const SchoolAdminReports = lazyPage('SchoolAdminReports', () => import('./pages/SchoolAdminReports'));
const SchoolAdminRules = lazyPage('SchoolAdminRules', () => import('./pages/SchoolAdminRules'));
const SchoolAdminSettings = lazyPage('SchoolAdminSettings', () => import('./pages/SchoolAdminSettings'));
const SchoolAdminTimetable = lazyPage('SchoolAdminTimetable', () => import('./pages/SchoolAdminTimetable'));
const SchoolAdminUsers = lazyPage('SchoolAdminUsers', () => import('./pages/SchoolAdminUsers'));
const SchoolOnboarding = lazyPage('SchoolOnboarding', () => import('./pages/SchoolOnboarding'));
const Security = lazyPage('Security', () => import('./pages/Security'));
const StudentBehavior = lazyPage('StudentBehavior', () => import('./pages/StudentBehavior'));
const StudentCAS = lazyPage('StudentCAS', () => import('./pages/StudentCAS'));
const StudentDashboard = lazyPage('StudentDashboard', () => import('./pages/StudentDashboard'));
const StudentEE = lazyPage('StudentEE', () => import('./pages/StudentEE'));
const StudentTOK = lazyPage('StudentTOK', () => import('./pages/StudentTOK'));
const SubmissionReview = lazyPage('SubmissionReview', () => import('./pages/SubmissionReview'));
const SuperAdminAuditLogs = lazyPage('SuperAdminAuditLogs', () => import('./pages/SuperAdminAuditLogs'));
const SuperAdminBilling = lazyPage('SuperAdminBilling', () => import('./pages/SuperAdminBilling'));
const SuperAdminDashboard = lazyPage('SuperAdminDashboard', () => import('./pages/SuperAdminDashboard'));
const SuperAdminSchoolDetail = lazyPage('SuperAdminSchoolDetail', () => import('./pages/SuperAdminSchoolDetail'));
const SuperAdminSchools = lazyPage('SuperAdminSchools', () => import('./pages/SuperAdminSchools'));
const SuperAdminUsers = lazyPage('SuperAdminUsers', () => import('./pages/SuperAdminUsers'));
const TeacherClasses = lazyPage('TeacherClasses', () => import('./pages/TeacherClasses'));
const TeacherDashboard = lazyPage('TeacherDashboard', () => import('./pages/TeacherDashboard'));


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
    "SchoolAdminEnrollments": SchoolAdminRedirect,
    "SchoolAdminReports": SchoolAdminReports,
    "SchoolAdminRules": SchoolAdminRules,
    "SchoolAdminSettings": SchoolAdminSettings,
    "SchoolAdminSubjects": SchoolAdminRedirect,
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
    "SuperAdminSchoolDetail": SuperAdminSchoolDetail,
    "SuperAdminSchools": SuperAdminSchools,
    "SuperAdminUsers": SuperAdminUsers,
    "TeacherClasses": TeacherClasses,
    "TeacherDashboard": TeacherDashboard,
}

/* Hand the registry to lazyPage so the sidebar can warm a route by name. */
registerPages(PAGES);

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};