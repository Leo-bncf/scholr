import React, { useEffect, useState } from 'react';
import { UserProvider, useUser } from '@/components/auth/UserContext';
import { PlanProvider } from '@/components/plan/PlanProvider';
import NotificationBell from '@/components/notifications/NotificationBell';

const publicPages = ['Landing', 'Features', 'Pricing', 'Security', 'Contact', 'Demo', 'AcceptInvitation', 'FirstLogin', 'PasswordReset'];
const fullScreenPages = ['ClassWorkspace', 'AssignmentDetail', 'SubmissionReview', 'ClassGradebook', 'Messages', 'SchoolOnboarding'];
const adminPages = ['SuperAdminProduction'];

function NotificationWrapper({ children }) {
  const { user, schoolId } = useUser();
  
  return (
    <>
      {user && schoolId && (
        <div className="fixed top-4 right-4 z-50">
          <NotificationBell userId={user.id} schoolId={schoolId} />
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