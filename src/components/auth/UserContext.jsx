import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getCurrentUser, onAuthChange } from '@/data/session';
import * as memberships from '@/data/memberships';
import * as schools from '@/data/schools';
import * as fns from '@/data/functions';
import { hasPermission, hasAllPermissions } from '@/components/auth/PermissionsModule';
import { useImpersonation } from '@/components/auth/ImpersonationContext';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { impersonation } = useImpersonation() || {};

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getCurrentUser();

      if (!me) {
        setUser(null);
        setMembership(null);
        setSchool(null);
        setIsAuthenticated(false);
        return;
      }

      setUser(me);
      setIsAuthenticated(true);

      // Super admins aren't scoped to a school; everyone else acts under a
      // membership, which is also what every RLS policy resolves through.
      if (me.role === 'super_admin') {
        setMembership(null);
        setSchool(null);
        return;
      }

      let active = await memberships.resolveActive(me.id, me.active_school_id);

      // Signed in but attached to no school. This is the Google case: OAuth
      // carries no invitation token, so an invited teacher arrives with a
      // working login and nothing to see. Claim any pending invitation for
      // their (Google-verified) email, once.
      if (!active) {
        try {
          await fns.invoke('acceptInvitation', {});
          active = await memberships.resolveActive(me.id, me.active_school_id);
        } catch (err) {
          // 404 "no pending invitation" is the ordinary case for someone who
          // genuinely has no school — not worth surfacing.
          if (err?.status !== 404) console.warn('Could not claim an invitation', err);
        }
      }

      setMembership(active);
      setSchool(active ? await schools.get(active.school_id) : null);
    } catch (err) {
      // A failure here means the app can't establish who the user is, which is
      // worth surfacing — the old code swallowed it as "Not authenticated" and
      // rendered a logged-out shell over what was really a backend error.
      console.error('UserProvider: failed to load the current user', err);
      setUser(null);
      setMembership(null);
      setSchool(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
    // Sign-in and sign-out can happen outside React (OAuth redirect, token
    // refresh failure, another tab). Without this the UI keeps showing a stale
    // session until a manual reload.
    return onAuthChange(() => loadUser());
  }, [loadUser]);

  const getRole = () => {
    if (impersonation) return impersonation.membershipRole;
    if (user?.role === 'super_admin') return 'super_admin';
    return membership?.role || user?.role || 'user';
  };

  const getSchoolId = () => {
    if (impersonation) return impersonation.school?.id || null;
    return membership?.school_id || null;
  };

  const getSchool = () => {
    if (impersonation) return impersonation.school || null;
    return school;
  };

  const getEffectiveUserId = () => {
    if (impersonation?.demoUserId) return impersonation.demoUserId;
    return user?.id;
  };

  const checkPermission = (resource, action) => {
    const userData = { ...user, role: getRole() };
    return hasPermission(userData, resource, action);
  };

  const checkAllPermissions = (checks) => {
    const userData = { ...user, role: getRole() };
    return hasAllPermissions(userData, checks);
  };

  const effectiveSchool = getSchool();

  return (
    <UserContext.Provider value={{
      user,
      membership,
      school: effectiveSchool,
      effectiveUserId: getEffectiveUserId(),
      loading,
      isAuthenticated,
      role: getRole(),
      schoolId: getSchoolId(),
      curriculum: impersonation?.curriculumOverride || effectiveSchool?.curriculum || 'ib_dp',
      isImpersonating: !!impersonation,
      reload: loadUser,
      checkPermission,
      checkAllPermissions,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}

export default UserProvider;
