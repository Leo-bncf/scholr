import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import * as membershipsData from '@/data/memberships';
import { getCurrentUser, isAuthenticated, redirectToLogin, updateMyProfile } from '@/data/session';

export default function AppHome() {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    resolveAndRedirect();
  }, []);

  const resolveAndRedirect = async () => {
    const isAuthed = await isAuthenticated();
    if (!isAuthed) {
      redirectToLogin('/');
      return;
    }

    const user = await getCurrentUser();

    // Super admin goes directly to platform dashboard
    if (user.role === 'super_admin' || user.role === 'admin') {
      navigate('/SuperAdminDashboard');
      return;
    }

    // Resolve school membership
    const memberships = await membershipsData.where({ user_id: user.id, status: 'active' });
    
    if (memberships.length === 0) {
      navigate('/NoSchool');
      return;
    }

    const membership = memberships[0];

    // Save active school
    if (!user.active_school_id || user.active_school_id !== membership.school_id) {
      await updateMyProfile({ active_school_id: membership.school_id });
    }

    // Route based on role
    const role = membership.role;
    const routes = {
      school_admin: 'SchoolAdminDashboard',
      ib_coordinator: 'CoordinatorDashboard',
      teacher: 'TeacherDashboard',
      student: 'StudentDashboard',
      parent: 'ParentDashboard',
    };

    const target = routes[role] || 'StudentDashboard';
    navigate(`/${target}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Loading your workspace...</p>
      </div>
    </div>
  );
}