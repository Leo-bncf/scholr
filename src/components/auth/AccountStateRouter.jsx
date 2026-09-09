import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import AccountStateAlert from './AccountStateAlert';
import * as accountStatesData from '@/data/accountStates';
import { getCurrentUser, isAuthenticated } from '@/data/session';

/**
 * Router component that handles account state and routing
 * Directs users based on their account status, onboarding progress, etc.
 */
export default function AccountStateRouter({ children, redirectOnIssue = true }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [accountState, setAccountState] = useState(null);
  const [user, setUser] = useState(null);
  const [accountIssue, setAccountIssue] = useState(null);

  useEffect(() => {
    const checkAccountState = async () => {
      try {
        const authed = await isAuthenticated();
        if (!authed) {
          setIsLoading(false);
          return;
        }

        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Fetch account state
        const states = await accountStatesData.where({
          user_id: currentUser.id
        });

        if (states.length > 0) {
          const state = states[0];
          setAccountState(state);

          // Check for issues
          if (state.locked_until && new Date(state.locked_until) > new Date()) {
            setAccountIssue({
              type: 'account_locked',
              message: 'Your account is temporarily locked due to multiple failed login attempts. Please try again later or reset your password.'
            });
            if (redirectOnIssue) {
              navigate('/password-reset');
            }
            return;
          }

          if (state.account_status === 'suspended') {
            setAccountIssue({
              type: 'suspended',
              message: `Your account has been suspended${state.suspended_reason ? ': ' + state.suspended_reason : ''}. Please contact your school administrator.`,
              contact: true
            });
            return;
          }

          if (state.account_status === 'pending_activation') {
            setAccountIssue({
              type: 'pending_activation',
              message: 'Your account is pending activation. Please check your email for next steps.'
            });
            if (redirectOnIssue) {
              navigate('/accept-invitation');
            }
            return;
          }

          if (state.account_status === 'invited') {
            if (redirectOnIssue) {
              navigate('/accept-invitation');
            }
            return;
          }

          if (!state.password_set_at && state.account_status !== 'active') {
            if (redirectOnIssue) {
              navigate('/first-login?step=set_password');
            }
            return;
          }

          if (!state.profile_completed && currentUser.role !== 'admin') {
            // Optional: Can prompt profile completion but allow access
            // setAccountIssue({
            //   type: 'incomplete_profile',
            //   message: 'Please complete your profile to get started.'
            // });
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking account state:', error);
        setIsLoading(false);
      }
    };

    checkAccountState();
  }, [navigate, redirectOnIssue]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (accountIssue) {
    return <AccountStateAlert issue={accountIssue} />;
  }

  return <>{children}</>;
}