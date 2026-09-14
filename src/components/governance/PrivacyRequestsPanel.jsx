import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Shield, Plus, Clock, CheckCircle2, AlertTriangle, XCircle, Loader2, Save, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { format, addDays } from 'date-fns';
import * as privacyRequestsData from '@/data/privacyRequests';

const REQUEST_TYPES = {
  data_export: { label: 'Data Export', color: 'bg-sky-100 text-sky-700' },
  account_deletion: { label: 'Account Deletion', color: 'bg-red-100 text-red-700' },
  anonymization: { label: 'Anonymization', color: 'scholr-accent-sf scholr-accent' },
  data_correction: { label: 'Data Correction', color: 'bg-amber-100 text-amber-700' },
  access_request: { label: 'Access Request', color: 'bg-emerald-100 text-emerald-700' },
};

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'bg-amber-100 text-amber-700',    icon: Clock },
  acknowledged:{ label: 'Acknowledged',color: 'bg-blue-100 text-blue-700',      icon: Info },
  in_progress: { label: 'In Progress', color: 'scholr-accent-sf scholr-accent',  icon: Loader2 },
  completed:   { label: 'Completed',   color: 'bg-emerald-100 text-emerald-700',icon: CheckCircle2 },
  rejected:    { label: 'Rejected',    color: 'bg-red-100 text-red-700',        icon: XCircle },
  withdrawn:   { label: 'Withdrawn',   color: 'scholr-sunk scholr-muted',    icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function RequestCard({ req, onUpdate, schoolId, user }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(req.resolution_notes || '');
  const [updating, setUpdating] = useState(false);
  const isOverdue = req.due_date && new Date(req.due_date) < new Date() && !['completed', 'rejected', 'withdrawn'].includes(req.status);
  const type = REQUEST_TYPES[req.request_type] || { label: req.request_type, color: 'scholr-sunk scholr-muted' };

  const save = async (status) => {
    setUpdating(true);
    await onUpdate(req.id, {
      status,
      resolution_notes: notes,
      assigned_to: user?.id,
      assigned_to_name: user?.full_name,
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      ...(status === 'acknowledged' ? { acknowledged_at: new Date().toISOString() } : {}),
    });
    setUpdating(false);
  };

  return (
    <div className={`bg-white rounded-xl border ${isOverdue ? 'border-red-300' : 'scholr-rule'} overflow-hidden`}>
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:scholr-sunk"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${type.color}`}>{type.label}</span>
            <StatusBadge status={req.status} />
            {isOverdue && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Overdue</span>}
            {req.priority === 'urgent' && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Urgent</span>}
          </div>
          <p className="font-semibold scholr-ink text-sm">{req.requester_name || req.requester_email}</p>
          <p className="text-xs scholr-faint mt-0.5">
            {req.requester_email} · {req.requester_role}
            {req.due_date && ` · Due: ${format(new Date(req.due_date), 'dd MMM yyyy')}`}
          </p>
          {req.description && <p className="text-xs scholr-muted mt-1 line-clamp-1">{req.description}</p>}
        </div>
        <div className="scholr-faint shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t scholr-rule-soft p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="scholr-faint font-medium">Subject:</span> <span className="scholr-body">{req.subject_name || req.subject_user_id || '—'}</span></div>
            <div><span className="scholr-faint font-medium">Received:</span> <span className="scholr-body">{req.created_at ? format(new Date(req.created_at), 'dd MMM yyyy') : '—'}</span></div>
            <div><span className="scholr-faint font-medium">Assigned to:</span> <span className="scholr-body">{req.assigned_to_name || 'Unassigned'}</span></div>
            <div><span className="scholr-faint font-medium">Identity verified:</span> <span className="scholr-body">{req.identity_verified ? 'Yes' : 'No'}</span></div>
          </div>
          {req.description && (
            <div>
              <p className="text-xs font-semibold scholr-muted mb-1">Request Description</p>
              <p className="text-sm scholr-body scholr-sunk rounded-lg p-3">{req.description}</p>
            </div>
          )}
          <div>
            <Label className="text-xs font-semibold scholr-muted mb-1 block">Resolution Notes</Label>
            <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes about how this was handled…" className="text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {req.status === 'pending' && (
              <Button size="sm" variant="outline" onClick={() => save('acknowledged')} disabled={updating} className="text-blue-700 border-blue-200 hover:bg-blue-50">Acknowledge</Button>
            )}
            {['pending', 'acknowledged'].includes(req.status) && (
              <Button size="sm" variant="outline" onClick={() => save('in_progress')} disabled={updating} className="scholr-accent scholr-accent-rule hover:scholr-accent-sf">Mark In Progress</Button>
            )}
            {!['completed', 'rejected', 'withdrawn'].includes(req.status) && (
              <>
                <Button size="sm" onClick={() => save('completed')} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700 gap-1">
                  {updating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Mark Completed
                </Button>
                <Button size="sm" variant="outline" onClick={() => save('rejected')} disabled={updating} className="text-red-600 border-red-200 hover:bg-red-50">Reject</Button>
              </>
            )}
            {['completed', 'rejected'].includes(req.status) && notes !== req.resolution_notes && (
              <Button size="sm" variant="outline" onClick={() => save(req.status)} disabled={updating} className="gap-1">
                <Save className="w-3.5 h-3.5" /> Save Notes
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PrivacyRequestsPanel({ policy, onChange, onSave, saving, schoolId, user }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [newReq, setNewReq] = useState({
    request_type: 'data_export', requester_name: '', requester_email: '',
    requester_role: 'parent', subject_name: '', description: '', priority: 'normal',
  });

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['privacy-requests', schoolId],
    queryFn: () => privacyRequestsData.where({ school_id: schoolId }, { order: 'created_at', ascending: false, limit: 200 }),
    enabled: !!schoolId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => privacyRequestsData.create({
      ...data,
      school_id: schoolId,
      due_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['privacy-requests', schoolId] });
      setShowForm(false);
      setNewReq({ request_type: 'data_export', requester_name: '', requester_email: '', requester_role: 'parent', subject_name: '', description: '', priority: 'normal' });
    },
  });

  const updateRequest = async (id, data) => {
    await privacyRequestsData.update(id, data);
    queryClient.invalidateQueries({ queryKey: ['privacy-requests', schoolId] });
  };

  const filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter);
  const pending = requests.filter(r => r.status === 'pending').length;
  const overdue = requests.filter(r => r.due_date && new Date(r.due_date) < new Date() && !['completed', 'rejected', 'withdrawn'].includes(r.status)).length;
  const privacyConfig = policy?.privacy || {};

  return (
    <div className="space-y-5">
      {/* Config section */}
      <div className="bg-white rounded-xl border scholr-rule p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold scholr-ink text-sm">Privacy Request Handling</p>
            <p className="text-xs scholr-muted mt-0.5">Enable this module to manage GDPR and privacy compliance requests at school level</p>
          </div>
          <Switch
            checked={!!privacyConfig.privacy_requests_enabled}
            onCheckedChange={v => onChange({ privacy: { ...privacyConfig, privacy_requests_enabled: v } })}
          />
        </div>
        {privacyConfig.privacy_requests_enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t scholr-rule-soft">
            <div>
              <Label className="text-xs font-semibold scholr-muted mb-1 block">Data Protection Officer Email</Label>
              <Input
                type="email"
                className="h-8 text-sm"
                placeholder="dpo@school.edu"
                value={privacyConfig.dpo_email || ''}
                onChange={e => onChange({ privacy: { ...privacyConfig, dpo_email: e.target.value } })}
              />
            </div>
            <div>
              <Label className="text-xs font-semibold scholr-muted mb-1 block">Regulatory Framework</Label>
              <Select value={privacyConfig.gdpr_jurisdiction || 'none'} onValueChange={v => onChange({ privacy: { ...privacyConfig, gdpr_jurisdiction: v } })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None specified</SelectItem>
                  <SelectItem value="gdpr_eu">GDPR (EU)</SelectItem>
                  <SelectItem value="gdpr_uk">UK GDPR</SelectItem>
                  <SelectItem value="ferpa_us">FERPA (US)</SelectItem>
                  <SelectItem value="pipeda_ca">PIPEDA (Canada)</SelectItem>
                  <SelectItem value="pdpa_th">PDPA (Thailand)</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between col-span-1 md:col-span-2">
              <div>
                <p className="text-sm font-medium scholr-body">Require identity verification before processing deletions</p>
                <p className="text-xs scholr-faint">Admin must confirm identity is verified before marking deletion requests complete</p>
              </div>
              <Switch
                checked={!!privacyConfig.require_identity_verification}
                onCheckedChange={v => onChange({ privacy: { ...privacyConfig, require_identity_verification: v } })}
              />
            </div>
          </div>
        )}
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving} size="sm" className="scholr-accent-sf hover:scholr-accent-sf gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Privacy Settings
          </Button>
        </div>
      </div>

      {privacyConfig.privacy_requests_enabled && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: requests.length, color: 'scholr-body' },
              { label: 'Pending', value: pending, color: pending > 0 ? 'text-amber-600' : 'scholr-body' },
              { label: 'Overdue', value: overdue, color: overdue > 0 ? 'text-red-600' : 'scholr-body' },
              { label: 'Completed', value: requests.filter(r => r.status === 'completed').length, color: 'text-emerald-600' },
              { label: 'Rejected', value: requests.filter(r => r.status === 'rejected').length, color: 'scholr-muted' },
            ].map(({ label, value, color }) => (
              <div key={label} className="app-group p-3 text-center">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs scholr-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Actions bar */}
          <div className="flex items-center justify-between gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setShowForm(true)} className="scholr-accent-sf hover:scholr-accent-sf gap-1">
              <Plus className="w-3.5 h-3.5" /> Log New Request
            </Button>
          </div>

          {/* Request list */}
          {isLoading ? (
            <div className="text-center py-12 scholr-faint text-sm">Loading requests…</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl border scholr-rule p-12 text-center">
              <Shield className="w-8 h-8 scholr-faint mx-auto mb-3" />
              <p className="text-sm scholr-muted">No privacy requests {statusFilter !== 'all' ? `with status "${STATUS_CONFIG[statusFilter]?.label}"` : 'logged yet'}.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(req => (
                <RequestCard key={req.id} req={req} onUpdate={updateRequest} schoolId={schoolId} user={user} />
              ))}
            </div>
          )}
        </>
      )}

      {/* New Request Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Privacy Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1 block">Request Type *</Label>
                <Select value={newReq.request_type} onValueChange={v => setNewReq(r => ({ ...r, request_type: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(REQUEST_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1 block">Priority</Label>
                <Select value={newReq.priority} onValueChange={v => setNewReq(r => ({ ...r, priority: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1 block">Requester Name</Label>
                <Input className="h-8 text-sm" value={newReq.requester_name} onChange={e => setNewReq(r => ({ ...r, requester_name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1 block">Requester Email *</Label>
                <Input type="email" className="h-8 text-sm" value={newReq.requester_email} onChange={e => setNewReq(r => ({ ...r, requester_email: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold mb-1 block">Requester Role *</Label>
                <Select value={newReq.requester_role} onValueChange={v => setNewReq(r => ({ ...r, requester_role: v }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="parent">Parent / Guardian</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold mb-1 block">Subject (data subject name)</Label>
                <Input className="h-8 text-sm" value={newReq.subject_name} onChange={e => setNewReq(r => ({ ...r, subject_name: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold mb-1 block">Description</Label>
              <Textarea rows={3} className="text-sm" value={newReq.description} onChange={e => setNewReq(r => ({ ...r, description: e.target.value }))} placeholder="Describe the request in detail…" />
            </div>
            <p className="text-xs scholr-faint">A 30-day due date will be set automatically from today's date.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createMutation.mutate(newReq)} disabled={createMutation.isPending || !newReq.requester_email} className="scholr-accent-sf hover:scholr-accent-sf">
                {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                Log Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}