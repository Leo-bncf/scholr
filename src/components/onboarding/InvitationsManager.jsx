import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, CheckCircle, XCircle, UserPlus, RefreshCw, Copy, Users } from 'lucide-react';
import { format } from 'date-fns';
import InviteUserDialog from './InviteUserDialog';
import BulkInviteDialog from './BulkInviteDialog';

export default function InvitationsManager({ schoolId, schoolName }) {
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['user-invitations', schoolId],
    queryFn: () => base44.entities.UserInvitation.filter({ school_id: schoolId }, '-created_date', 50),
    enabled: !!schoolId,
  });

  const resendMutation = useMutation({
    mutationFn: async (invitation) => {
      const inviteUrl = `${window.location.origin}/AcceptInvitation?token=${invitation.invitation_token}`;
      
      await base44.integrations.Core.SendEmail({
        to: invitation.email,
        from_name: schoolName,
        subject: `Reminder: You're invited to join ${schoolName} on AtlasIB`,
        body: `
          <h2>Reminder: Join ${schoolName}!</h2>
          <p>You were invited to join ${schoolName} on AtlasIB as a <strong>${invitation.role.replace('_', ' ')}</strong>.</p>
          <p>Click the link below to accept your invitation:</p>
          <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Accept Invitation</a></p>
          <p>Or copy this link: ${inviteUrl}</p>
        `,
      });
    },
    onSuccess: () => {
      alert('Invitation resent successfully!');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invitationId) => 
      base44.entities.UserInvitation.update(invitationId, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
    },
  });

  const copyInviteLink = (token) => {
    const inviteUrl = `${window.location.origin}/AcceptInvitation?token=${token}`;
    navigator.clipboard.writeText(inviteUrl);
    alert('Invitation link copied to clipboard!');
  };

  const getStatusConfig = (invitation) => {
    if (invitation.status === 'accepted') {
      return { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle };
    }
    if (invitation.status === 'cancelled') {
      return { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: XCircle };
    }
    if (invitation.status === 'expired' || new Date(invitation.expires_at) < new Date()) {
      return { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle };
    }
    return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
  };

  const pendingInvitations = invitations.filter(i => 
    i.status === 'pending' && new Date(i.expires_at) > new Date()
  );

  if (isLoading) {
    return <div className="text-center py-8 text-slate-400">Loading invitations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">User Invitations</h3>
          <p className="text-sm text-slate-500 mt-1">
            {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setBulkDialogOpen(true)}
          >
            <Users className="w-4 h-4 mr-2" />
            Bulk invite
          </Button>
          <Button
            onClick={() => setInviteDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite User
          </Button>
        </div>
      </div>

      {invitations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">No invitations sent yet</p>
          <Button 
            onClick={() => setInviteDialogOpen(true)}
            variant="outline"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Send First Invitation
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {invitations.map((invitation) => {
            const statusConfig = getStatusConfig(invitation);
            const StatusIcon = statusConfig.icon;
            const isExpired = new Date(invitation.expires_at) < new Date() && invitation.status === 'pending';

            return (
              <div key={invitation.id} className="p-5 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-900">{invitation.email}</span>
                      <Badge className={`${statusConfig.color} border-0 capitalize text-xs`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {isExpired ? 'Expired' : invitation.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                      <span className="capitalize">Role: {invitation.role.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>Invited {format(new Date(invitation.created_date), 'MMM d, yyyy')}</span>
                      {invitation.invited_by_name && (
                        <>
                          <span>•</span>
                          <span>by {invitation.invited_by_name}</span>
                        </>
                      )}
                    </div>

                    {invitation.status === 'accepted' && invitation.accepted_at && (
                      <p className="text-xs text-emerald-600">
                        Accepted on {format(new Date(invitation.accepted_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>

                  {invitation.status === 'pending' && !isExpired && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteLink(invitation.invitation_token)}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" />
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resendMutation.mutate(invitation)}
                        disabled={resendMutation.isPending}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        Resend
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => cancelMutation.mutate(invitation.id)}
                        disabled={cancelMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <InviteUserDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        schoolId={schoolId}
        schoolName={schoolName}
      />

      <BulkInviteDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        schoolId={schoolId}
        schoolName={schoolName}
      />
    </div>
  );
}