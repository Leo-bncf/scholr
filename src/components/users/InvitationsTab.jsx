import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail, Clock, CheckCircle, XCircle, UserPlus, RefreshCw, Copy,
  Loader2, Send, MoreHorizontal, AlertCircle
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format, formatDistanceToNow } from 'date-fns';
import { ROLE_CONFIG } from './userConstants';

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
      const res = await base44.functions.invoke('sendInvitation', {
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
      if (res?.data?.error) throw new Error(res.data.error);
      return res?.data;
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
          <Alert className="border-indigo-200 bg-indigo-50">
            <Mail className="w-4 h-4 text-indigo-700" />
            <AlertDescription className="text-xs text-indigo-900">
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
            <Button type="submit" disabled={inviteMutation.isPending || !form.email} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
              {inviteMutation.isPending ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />Sending…</> : <><Send className="w-3.5 h-3.5 mr-2" />Send Invitation</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function getInviteStatus(inv) {
  if (inv.status === 'accepted') return { label: 'Accepted', color: 'bg-emerald-50 text-emerald-700', Icon: CheckCircle };
  if (inv.status === 'cancelled') return { label: 'Cancelled', color: 'bg-slate-100 text-slate-500', Icon: XCircle };
  if (inv.status === 'expired' || new Date(inv.expires_at) < new Date()) return { label: 'Expired', color: 'bg-red-50 text-red-600', Icon: XCircle };
  return { label: 'Pending', color: 'bg-amber-50 text-amber-700', Icon: Clock };
}

export default function InvitationsTab({ schoolId, schoolName }) {
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['user-invitations', schoolId],
    queryFn: () => base44.entities.UserInvitation.filter({ school_id: schoolId }, '-created_date', 100),
    enabled: !!schoolId,
  });

  const resendMutation = useMutation({
    mutationFn: async (inv) => {
      const inviteUrl = `${window.location.origin}/AcceptInvitation?token=${inv.invitation_token}`;
      await base44.integrations.Core.SendEmail({
        to: inv.email,
        from_name: schoolName,
        subject: `Reminder: Your invitation to ${schoolName}`,
        body: `<p>You still have a pending invitation to join <strong>${schoolName}</strong>.</p><p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Accept Invitation</a></p>`,
      });
    },
    onSuccess: () => showToast('Invitation resent!'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => base44.entities.UserInvitation.update(id, { status: 'cancelled' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-invitations', schoolId] }),
  });

  const copyLink = (token) => {
    const url = `${window.location.origin}/AcceptInvitation?token=${token}`;
    navigator.clipboard.writeText(url).then(() => showToast('Link copied to clipboard!'));
  };

  const pending = invitations.filter(i => i.status === 'pending' && new Date(i.expires_at) > new Date());

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg animate-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {invitations.length} total invitation{invitations.length !== 1 ? 's' : ''}
            {pending.length > 0 && (
              <span className="ml-2 text-amber-600 text-xs font-normal">· {pending.length} awaiting response</span>
            )}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs gap-2">
          <UserPlus className="w-3.5 h-3.5" /> Invite User
        </Button>
      </div>

      {isLoading ? (
        <div className="p-16 text-center"><Loader2 className="w-6 h-6 animate-spin text-slate-300 mx-auto" /></div>
      ) : invitations.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <Mail className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm mb-4">No invitations sent yet</p>
          <Button variant="outline" onClick={() => setInviteOpen(true)} className="text-xs gap-2">
            <UserPlus className="w-3.5 h-3.5" /> Send First Invitation
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {invitations.map(inv => {
            const st = getInviteStatus(inv);
            const StatusIcon = st.Icon;
            const canAct = inv.status === 'pending' && new Date(inv.expires_at) > new Date();
            const rc = ROLE_CONFIG[inv.role];

            return (
              <div key={inv.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-slate-900 truncate">{inv.email}</span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {st.label}
                        </span>
                        {rc && (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border ${rc.color}`}>{rc.label}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Invited {formatDistanceToNow(new Date(inv.created_date), { addSuffix: true })}
                        {inv.invited_by_name && ` · by ${inv.invited_by_name}`}
                        {inv.status === 'accepted' && inv.accepted_at && (
                          ` · Accepted ${format(new Date(inv.accepted_at), 'MMM d, yyyy')}`
                        )}
                      </p>
                    </div>
                  </div>

                  {canAct && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="text-xs gap-2" onClick={() => copyLink(inv.invitation_token)}>
                          <Copy className="w-3.5 h-3.5" /> Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs gap-2"
                          onClick={() => resendMutation.mutate(inv)}
                          disabled={resendMutation.isPending}
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Resend Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs gap-2 text-red-600 focus:text-red-700"
                          onClick={() => cancelMutation.mutate(inv.id)}
                          disabled={cancelMutation.isPending}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel Invite
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        schoolId={schoolId}
        schoolName={schoolName}
      />
    </div>
  );
}