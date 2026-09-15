import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as email from '@/data/email';
import { Button } from '@/components/ui/button';
import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail, XCircle, UserPlus, RefreshCw, Copy,
  Loader2, Send, MoreHorizontal, AlertCircle
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format, formatDistanceToNow } from 'date-fns';
import { ROLE_CONFIG } from './userConstants';
import * as userInvitationsData from '@/data/userInvitations';
import * as fns from '@/data/functions';

function InviteDialog({ open, onClose, schoolId, schoolName }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    email: '', role: 'teacher', first_name: '', last_name: '',
    grade_level: '', department: '', custom_message: '',
  });

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      // Route through backend function so school admins (whose platform role is just "user")
      // can create invitations via service-role with proper SchoolMembership authorization.
      const res = await fns.invoke('sendInvitation', {
        schoolId,
        schoolName,
        email: data.email,
        role: data.role,
        firstName: data.first_name,
        lastName: data.last_name,
        gradeLevel: data.grade_level,
        department: data.department,
        customMessage: data.custom_message,
      });
      if (res?.error) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-invitations', schoolId] });
      setForm({ email: '', role: 'teacher', first_name: '', last_name: '', grade_level: '', department: '', custom_message: '' });
      onClose();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPlus className="w-4 h-4" /> Invite User to {schoolName}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={e => { e.preventDefault(); inviteMutation.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">First Name</Label>
              <Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="Jane" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Last Name</Label>
              <Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="Smith" className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-semibold">Email Address *</Label>
            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@school.com" required className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-semibold">Role *</Label>
            <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {form.role === 'student' && (
            <div>
              <Label className="text-xs font-semibold">Grade Level</Label>
              <Input value={form.grade_level} onChange={e => setForm({ ...form, grade_level: e.target.value })} placeholder="DP1, DP2, MYP3…" className="mt-1" />
            </div>
          )}
          {(form.role === 'teacher' || form.role === 'ib_coordinator') && (
            <div>
              <Label className="text-xs font-semibold">Department</Label>
              <Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Sciences, Humanities…" className="mt-1" />
            </div>
          )}
          <div>
            <Label className="text-xs font-semibold">Personal Message (Optional)</Label>
            <Textarea value={form.custom_message} onChange={e => setForm({ ...form, custom_message: e.target.value })} placeholder="A personal welcome…" rows={2} className="mt-1" />
          </div>
          <Alert className="scholr-accent-rule scholr-accent-sf">
            <Mail className="w-4 h-4 scholr-accent" />
            <AlertDescription className="text-xs scholr-accent">
              An email with an accept link will be sent to <strong>{form.email || 'the user'}</strong>. The link expires in 7 days.
            </AlertDescription>
          </Alert>
          {inviteMutation.isError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-xs text-red-700">Failed to send invitation. Please try again.</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={inviteMutation.isPending || !form.email} className="flex-1 pub-btn pub-btn-primary">
              {inviteMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Sending…</> : <><Send className="w-3.5 h-3.5 mr-2" />Send Invitation</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* Accepted is the finished state and needs no colour — a list where every
   settled row glows green hides the two that still need chasing. Expired is
   the one that costs someone a login. */
function getInviteStatus(inv) {
  if (inv.status === 'accepted') return { label: 'Accepted', tone: 'mute' };
  if (inv.status === 'cancelled') return { label: 'Cancelled', tone: 'mute' };
  if (inv.status === 'expired' || new Date(inv.expires_at) < new Date()) return { label: 'Expired', tone: 'crit' };
  return { label: 'Pending', tone: 'warn' };
}

export default function InvitationsTab({ schoolId, schoolName }) {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['user-invitations', schoolId],
    queryFn: () => userInvitationsData.where({ school_id: schoolId }, { order: 'created_at', ascending: false, limit: 100 }),
    enabled: !!schoolId,
  });

  const resendMutation = useMutation({
    mutationFn: async (inv) => {
      const inviteUrl = `${window.location.origin}/AcceptInvitation?token=${inv.invitation_token}`;
      await email.send({
        to: inv.email,
        fromName: schoolName,
        subject: `Reminder: Your invitation to ${schoolName}`,
        body: `<p>You still have a pending invitation to join <strong>${schoolName}</strong>.</p><p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Accept Invitation</a></p>`,
      });
    },
    onSuccess: () => showToast('Invitation resent!'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => userInvitationsData.update(id, { status: 'cancelled' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-invitations', schoolId] }),
  });

  const copyLink = (token) => {
    const url = `${window.location.origin}/AcceptInvitation?token=${token}`;
    navigator.clipboard.writeText(url).then(() => showToast('Link copied to clipboard!'));
  };

  const pending = invitations.filter(i => i.status === 'pending' && new Date(i.expires_at) > new Date());

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 text-sm px-4 py-2.5 rounded-lg shadow-lg"
             style={{ background: 'var(--ink)', color: 'var(--surface)' }}>
          {toast}
        </div>
      )}

      {/* An invitation is a link. The email is a convenience on top of it, and
          on a school whose SMTP is not set up it is the only part that fails —
          so the link is named first, and copying it is the action that always
          works. */}
      <p style={{ margin: 0, fontSize: '.86rem', color: 'var(--muted)' }}>
        Each invitation is a private link. Send it by email from here, or copy it and pass it on yourself.
      </p>

      <Group
        title="Invitations"
        action={
          <span className="scholr-label">
            {pending.length > 0 ? `${pending.length} awaiting reply` : `${invitations.length} sent`}
          </span>
        }
      >
        {isLoading ? (
          <div className="p-10 text-center"><Loader2 className="w-5 h-5 animate-spin scholr-faint mx-auto" /></div>
        ) : invitations.length === 0 ? (
          <GroupEmpty>
            No invitations yet. Invite a member to give them a sign-in link.
          </GroupEmpty>
        ) : (
          invitations.map(inv => {
            const st = getInviteStatus(inv);
            const canAct = inv.status === 'pending' && new Date(inv.expires_at) > new Date();
            const rc = ROLE_CONFIG[inv.role];
            const detail = [
              rc?.label,
              `invited ${formatDistanceToNow(new Date(inv.created_at), { addSuffix: true })}`,
              inv.invited_by_name && `by ${inv.invited_by_name}`,
              inv.status === 'accepted' && inv.accepted_at && `accepted ${format(new Date(inv.accepted_at), 'd MMM yyyy')}`,
            ].filter(Boolean).join(' · ');

            return (
              <Row key={inv.id} label={inv.email} detail={detail}>
                <StatusChip tone={st.tone}>{st.label}</StatusChip>
                {canAct && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0" aria-label={`Actions for ${inv.email}`}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem className="text-xs gap-2" onClick={() => copyLink(inv.invitation_token)}>
                        <Copy className="w-3.5 h-3.5" /> Copy invitation link
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs gap-2"
                        onClick={() => resendMutation.mutate(inv)}
                        disabled={resendMutation.isPending}
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Send the email again
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-xs gap-2"
                        style={{ color: 'var(--crit)' }}
                        onClick={() => cancelMutation.mutate(inv.id)}
                        disabled={cancelMutation.isPending}
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel invitation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </Row>
            );
          })
        )}
      </Group>

      <div>
        <Button onClick={() => setInviteOpen(true)} className="pub-btn pub-btn-primary h-9 text-xs gap-2">
          <UserPlus className="w-3.5 h-3.5" /> Invite a member
        </Button>
      </div>

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        schoolId={schoolId}
        schoolName={schoolName}
      />
    </div>
  );
}