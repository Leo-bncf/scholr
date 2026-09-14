import React, { useEffect, useState } from 'react';
import { UserProvider, useUser } from '@/components/auth/UserContext';
import { PlanProvider } from '@/components/plan/PlanProvider';
import NotificationBell from '@/components/notifications/NotificationBell';
import BellBoundary from '@/components/notifications/BellBoundary';

// React Router v6 matches paths case-INSENSITIVELY by default, so 'Demo' and
// 'demo' are the same route. The interactive sandbox owns /demo (and its
// children), which meant the lead-capture form registered as 'Demo' could never
// win — every "Book a demo" button landed on the sandbox role-picker instead.
// The form is 'BookDemo' now; the two names can no longer collide.
const publicPages = [
  'Landing', 'Features', 'Pricing', 'Security', 'Contact', 'BookDemo',
  'About', 'FAQ', 'Schedual',
  'ib-school-management-software', 'igcse-school-management-software',
  'a-level-school-management-software', 'us-school-management-software',
  'AcceptInvitation', 'FirstLogin', 'PasswordReset', 'Login',
];
// Pages with no sidebar of their own, which therefore need the floating
// notification bell from NotificationWrapper below.
//
// Messages is deliberately NOT in this list: it renders its own AppSidebar,
// which already carries a bell. Having both mounted was what crashed the page.
const fullScreenPages = ['ClassWorkspace', 'AssignmentDetail', 'SubmissionReview', 'ClassGradebook', 'SchoolOnboarding'];
const adminPages = ['SuperAdminProduction'];

function NotificationWrapper({ children }) {
  const { user, schoolId } = useUser();
  
  return (
    <>
      {user && schoolId && (
        <div className="fixed top-4 right-4 z-50">
          <BellBoundary><NotificationBell userId={user.id} schoolId={schoolId} /></BellBoundary>
        </div>
      )}
      {children}
    </>
  );
}

export default function Layout({ children, currentPageName }) {
  const isPublic = publicPages.includes(currentPageName);
  const isFullScreen = fullScreenPages.includes(currentPageName);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <UserProvider>
      <PlanProvider>
        {isFullScreen ? (
          <NotificationWrapper>{children}</NotificationWrapper>
        ) : (
          children
        )}
      </PlanProvider>
    </UserProvider>
  );
}