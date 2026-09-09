import { useEffect, useState } from 'react';
import { canAccessSuperAdmin, SUPER_ADMIN_ALLOWED_ROLES } from '@/components/admin/super-admin/superAdminConfig';
import { getCurrentUser, isAuthenticated } from '@/data/session';

export function useSuperAdminAccess(navigate, allowedRoles = SUPER_ADMIN_ALLOWED_ROLES) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const rolesKey = allowedRoles.join('|');

  useEffect(() => {
    let cancelled = false;

    const checkAccess = async () => {
      const authed = await isAuthenticated();
      if (!authed) {
        navigate('/');
        if (!cancelled) setIsChecking(false);
        return;
      }

      const user = await getCurrentUser();
      if (!canAccessSuperAdmin(user, allowedRoles)) {
        navigate('/');
        if (!cancelled) setIsChecking(false);
        return;
      }

      if (!cancelled) {
        setCurrentUser(user);
        setIsChecking(false);
      }
    };

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [navigate, rolesKey]);

  return { currentUser, isChecking };
}