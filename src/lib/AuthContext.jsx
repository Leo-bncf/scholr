import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getCurrentUser,
  getSession,
  onAuthChange,
  redirectToLogin,
  signOut,
} from '@/data/session';

/**
 * Session state for route guards.
 *
 * This is the low-level "is anyone signed in" provider. For the signed-in
 * user's school, role and permissions, use `useUser()` from
 * components/auth/UserContext — that one resolves membership too.
 *
 * base44's version also fetched "app public settings" to decide whether the app
 * required auth at all. Supabase has no equivalent and Scholr's answer is
 * static (public marketing pages, everything else behind a session), so that
 * concept is gone. `isLoadingPublicSettings` remains, always false, because
 * App.jsx still reads it.
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const session = await getSession();
      if (!session) {
        setUser(null);
        setIsAuthenticated(false);
        return;
      }
      const current = await getCurrentUser();
      setUser(current);
      setIsAuthenticated(!!current);
    } catch (error) {
      console.error('Auth check failed', error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({ type: 'auth_failed', message: error.message });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
    // Token refresh failures and sign-outs in other tabs both surface here;
    // without this the UI would keep rendering a session that no longer exists.
    return onAuthChange(() => checkUserAuth());
  }, [checkUserAuth]);

  const logout = useCallback(async (shouldRedirect = true) => {
    await signOut();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.href = '/';
  }, []);

  const navigateToLogin = useCallback(() => {
    redirectToLogin(window.location.pathname);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authChecked,
        authError,
        // Retained for App.jsx; there is no remote app config to wait on.
        isLoadingPublicSettings: false,
        appPublicSettings: null,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState: checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
};

export default AuthProvider;
