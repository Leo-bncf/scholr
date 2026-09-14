import React from 'react';
import { useUser } from './UserContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

export default function RoleGuard({ allowedRoles, children }) {
  const { user, role, loading, isAuthenticated } = useUser();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center scholr-sunk">
        <Loader2 className="w-8 h-8 animate-spin scholr-accent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center scholr-sunk">
        <div className="text-center max-w-md px-6">
          <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold scholr-ink mb-2">Authentication Required</h1>
          <p className="scholr-muted">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center scholr-sunk">
        <div className="text-center max-w-md px-6">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold scholr-ink mb-2">Access Denied</h1>
          <p className="scholr-muted mb-1">You don't have permission to view this page.</p>
          <p className="text-xs scholr-faint">Your role: <span className="font-mono">{role}</span></p>
        </div>
      </div>
    );
  }

  return children;
}