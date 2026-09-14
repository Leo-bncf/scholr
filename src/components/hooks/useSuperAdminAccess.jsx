import { useEffect } from 'react';
import { canAccessSuperAdmin, SUPER_ADMIN_ALLOWED_ROLES } from '@/components/admin/super-admin/superAdminConfig';
import { useUser } from '@/components/auth/UserContext';

/**
 * Gate a page on super-admin access, and hand it the current user.
 *
 * This used to fetch the user itself, on every mount:
 *
 *     const authed = await isAuthenticated();   // local, cheap
 *     const user   = await getCurrentUser();    // auth.getUser + profiles row
 *
 * getCurrentUser is two serial network calls — supabase.auth.getUser() goes to
 * GoTrue to validate the token (unlike getSession, which reads local storage),
 * then the profiles row is a second trip. Measured against production that is
 * ~127ms + ~106ms, and none of it was cached: eleven console pages each paid
 * it again on every navigation, behind a full-page spinner, for a user the
 * app had already loaded at boot.
 *
 * UserProvider now sits above the router and holds exactly this, so the gate
 * is a read from context and costs nothing.
 *
 * The redirect stays an effect rather than a render-time navigate() — routing
 * during render is a React warning and, worse, it fires before `loading`
 * resolves, so a legitimate super admin gets bounced to the landing page on a
 * slow connection.
 */
export function useSuperAdminAccess(navigate, allowedRoles = SUPER_ADMIN_ALLOWED_ROLES) {
  const { user, loading, isAuthenticated } = useUser() || {};
  const allowed = !loading && isAuthenticated && canAccessSuperAdmin(user, allowedRoles);
  const rolesKey = allowedRoles.join('|');

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !canAccessSuperAdmin(user, allowedRoles)) {
      navigate('/');
    }
    // allowedRoles is a fresh array on every render; rolesKey is its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isAuthenticated, user, rolesKey, navigate]);

  return {
    currentUser: allowed ? user : null,
    isChecking: loading,
  };
}
