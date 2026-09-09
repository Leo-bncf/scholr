import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Building2, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as userInvitationsData from '@/data/userInvitations';
import { getCurrentUser, signOut } from '@/data/session';

export default function NoSchool() {
  const [checkingInvitations, setCheckingInvitations] = useState(true);
  const [pendingInvitations, setPendingInvitations] = useState([]);

  useEffect(() => {
    checkForInvitations();
  }, []);

  const checkForInvitations = async () => {
    try {
      const user = await getCurrentUser();
      const invitations = await userInvitationsData.where({
        email: user.email,
        status: 'pending'
      });
      
      // Filter out expired invitations
      const validInvitations = invitations.filter(inv => 
        new Date(inv.expires_at) > new Date()
      );
      
      setPendingInvitations(validInvitations);
    } catch (error) {
      console.error('Error checking invitations:', error);
    } finally {
      setCheckingInvitations(false);
    }
  };

  if (checkingInvitations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Checking for invitations...</p>
        </div>
      </div>
    );
  }

  if (pendingInvitations.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 px-4">
        <div className="text-center max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">You Have Pending Invitations!</h1>
          <p className="text-slate-500 mb-6">
            You've been invited to join {pendingInvitations.length} school{pendingInvitations.length > 1 ? 's' : ''} on AtlasIB.
          </p>
          <div className="space-y-3 mb-6">
            {pendingInvitations.map(inv => (
              <a 
                key={inv.id} 
                href={createPageUrl('AcceptInvitation') + `?token=${inv.invitation_token}`}
                className="block p-4 border-2 border-indigo-200 rounded-xl hover:bg-indigo-50 transition-all"
              >
                <p className="font-semibold text-slate-900 mb-1">School Invitation</p>
                <p className="text-sm text-slate-600">Role: {inv.role.replace('_', ' ')}</p>
              </a>
            ))}
          </div>
          <Link to={createPageUrl('Landing')}>
            <Button variant="outline">Return to Homepage</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">No School Assigned</h1>
        <p className="text-slate-500 mb-6">
          Your account is not linked to any school yet. Please contact your school administrator to get invited.
        </p>
        <div className="space-y-3">
          <Link to={createPageUrl('Landing')}>
            <Button variant="outline" className="w-full">Return to Homepage</Button>
          </Link>
          <Button 
            onClick={() => signOut()}
            variant="ghost"
            className="w-full text-slate-500"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}