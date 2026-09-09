import React, { useEffect, useState } from 'react';
import * as email from '@/data/email';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, Copy, Loader2, Mail, UserPlus } from 'lucide-react';
import * as membershipsData from '@/data/memberships';
import * as userInvitationsData from '@/data/userInvitations';
import { getCurrentUser } from '@/data/session';

const EMPTY_FORM = {
  email: '',
  first_name: '',
  last_name: '',
  custom_message: '',
};

export default function AddSchoolAdminDialog({ open, onOpenChange, school }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setLoading(false);
    setError('');
    setSuccess('');
    setInviteUrl('');
  }, [open, school?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const normalizedEmail = form.email.trim().toLowerCase();
    const existingAdmins = await membershipsData.where({
      school_id: school.id,
      role: 'school_admin',
      status: 'active',
    });

    if (existingAdmins.some((member) => member.user_email?.toLowerCase() === normalizedEmail)) {
      setError('This user is already a school admin for this school.');
      setLoading(false);
      return;
    }

    const existingInvites = await userInvitationsData.where({
      school_id: school.id,
      email: normalizedEmail,
      role: 'school_admin',
      status: 'pending',
    });

    if (existingInvites.length > 0) {
      setError('A pending school admin invitation already exists for this email.');
      setLoading(false);
      return;
    }

    const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const currentUser = await getCurrentUser();

    await userInvitationsData.create({
      school_id: school.id,
      email: normalizedEmail,
      role: 'school_admin',
      invited_by: currentUser.id,
      invited_by_name: currentUser.full_name || currentUser.email,
      status: 'pending',
      invitation_token: invitationToken,
      expires_at: expiresAt.toISOString(),
      metadata: {
        first_name: form.first_name,
        last_name: form.last_name,
        custom_message: form.custom_message,
        school_name: school.name,
      },
    });

    const inviteUrl = `${window.location.origin}?page=AcceptInvitation&token=${invitationToken}`;

    let emailSent = true;
    try {
      await email.send({
        to: normalizedEmail,
        fromName: school.name,
        subject: `You're invited to join ${school.name} as a School Admin`,
        body: `
          <h2>You're invited to join ${school.name}</h2>
          <p>You've been invited to join <strong>${school.name}</strong> as an additional <strong>School Admin</strong>.</p>
          ${form.custom_message ? `<p><em>"${form.custom_message}"</em></p>` : ''}
          <p>Click below to accept your invitation:</p>
          <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Accept Invitation</a></p>
          <p>Or copy this link: ${inviteUrl}</p>
          <p style="color:#666;font-size:14px;">This invitation expires in 7 days.</p>
        `,
      });
    } catch (sendError) {
      console.error('Error sending school admin invitation email:', sendError);
      emailSent = false;
    }

    setInviteUrl(inviteUrl);
    setSuccess(
      emailSent
        ? 'School admin invitation sent successfully.'
        : 'Invitation created successfully. Email could not be sent here, so copy the invite link below.'
    );
    setLoading(false);

    if (emailSent) {
      setTimeout(() => {
        onOpenChange(false);
      }, 900);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add School Admin
          </DialogTitle>
          <DialogDescription>
            Invite an additional school admin for this school.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800 ml-3 text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800 ml-3 text-sm">
                <div className="space-y-3">
                  <p>{success}</p>
                  {inviteUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(inviteUrl)}
                      className="bg-white"
                    >
                      <Copy className="w-3.5 h-3.5 mr-2" />
                      Copy Invite Link
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold">First Name</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="Jane"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">Last Name</Label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Smith"
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold">Email Address</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@school.com"
              required
              className="mt-1.5"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold">Message (Optional)</Label>
            <Textarea
              value={form.custom_message}
              onChange={(e) => setForm({ ...form, custom_message: e.target.value })}
              placeholder="Add a short welcome note..."
              rows={3}
              className="mt-1.5"
            />
          </div>

          <Alert className="border-indigo-200 bg-indigo-50">
            <Mail className="w-4 h-4 text-indigo-700" />
            <AlertDescription className="text-sm text-indigo-900">
              This will send a school admin invitation for <strong>{school?.name}</strong>.
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-3 pt-2">
            <Button type="button" onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.email.trim()} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}