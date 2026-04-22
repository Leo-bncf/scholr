import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, ShieldCheck, AlertTriangle, Clock, CheckCircle2, Eye, User } from 'lucide-react';
import { format } from 'date-fns';
import { useUser } from '@/components/auth/UserContext';
import { logAudit, AuditActions, AuditLevels } from '@/components/utils/auditLogger';

const SEV_META = {
  high:     { bg: 'bg-red-50',   text: 'text-red-700',   border: 'border-red-200' },
  critical: { bg: 'bg-rose-50',  text: 'text-rose-700',  border: 'border-rose-200' },
};

export default function PastoralOversight({ schoolId }) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [reviewing, setReviewing] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [activeTab, setActiveTab] = useState('needs_review');

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['behavior-pastoral', schoolId],
    queryFn: () => base44.entities.BehaviorRecord.filter({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const markReviewedMutation = useMutation({
    mutationFn: ({ id, note }) => base44.entities.BehaviorRecord.update(id, {
      pastoral_reviewed: true,
      pastoral_reviewed_by: user?.full_name || user?.email || 'Staff',
      pastoral_reviewed_at: new Date().toISOString(),
    }),
    onSuccess: async (_, { id }) => {
      await logAudit({ action: 'pastoral_review_completed', entityType: 'BehaviorRecord', entityId: id, details: `Pastoral review marked complete by ${user?.full_name || user?.email}`, level: AuditLevels.INFO, schoolId });
      queryClient.invalidateQueries({ queryKey: ['behavior-pastoral', schoolId] });
      setReviewing(null);
      setReviewNote('');
    },
  });

  const closeFollowUpMutation = useMutation({
    mutationFn: ({ id, note }) => base44.entities.BehaviorRecord.update(id, {
      follow_up_completed: true,
      follow_up_note: note,
    }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['behavior-pastoral', schoolId] });
      setReviewing(null);
      setFollowUpNote('');
    },
  });

  const needsReview = records.filter(r => !r.pastoral_reviewed && (r.severity === 'high' || r.severity === 'critical'));
  const pendingFollowUp = records.filter(r => r.follow_up_required && !r.follow_up_completed);
  const recentReviewed = records.filter(r => r.pastoral_reviewed).sort((a, b) => (b.pastoral_reviewed_at || '').localeCompare(a.pastoral_reviewed_at || '')).slice(0, 20);

  const TABS = [
    { id: 'needs_review', label: 'Needs Pastoral Review', count: needsReview.length, urgent: true },
    { id: 'follow_up', label: 'Pending Follow-up', count: pendingFollowUp.length, urgent: pendingFollowUp.length > 0 },
    { id: 'reviewed', label: 'Recently Reviewed', count: recentReviewed.length },
  ];

  const currentList = activeTab === 'needs_review' ? needsReview : activeTab === 'follow_up' ? pendingFollowUp : recentReviewed;

  return (
    <div className="space-y-5">
      {/* Header alert */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-emerald-900">Pastoral Oversight — Authorized Staff View</p>
          <p className="text-xs text-emerald-700 mt-0.5">This view includes all records including staff-only and safeguarding entries. Visible only to school admins and IB coordinators.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${t.urgent && t.count > 0 ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
      ) : currentList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
          <p className="text-slate-600 font-medium">Nothing pending in this category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map(record => {
            const sm = record.severity ? SEV_META[record.severity] : null;
            return (
              <div key={record.id} className={`bg-white rounded-xl border p-5 ${record.staff_only ? 'border-rose-200' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-bold text-slate-900">{record.student_name}</span>
                      <span className="text-xs text-slate-400">{record.date}</span>
                      {sm && <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sm.bg} ${sm.text} ${sm.border}`}>{record.severity}</span>}
                      {record.staff_only && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium">Staff only</span>}
                      {record.follow_up_required && !record.follow_up_completed && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1"><Clock className="w-3 h-3" /> Follow-up pending</span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-800">{record.title}</p>
                    {record.description && <p className="text-sm text-slate-600 mt-1">{record.description}</p>}
                    {record.action_taken && (
                      <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-500 mb-0.5">Action Taken</p>
                        <p className="text-sm text-slate-600">{record.action_taken}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-2">Recorded by {record.recorded_by_name} · {record.category?.replace(/_/g,' ')}</p>
                    {record.pastoral_reviewed && (
                      <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Reviewed by {record.pastoral_reviewed_by} on {record.pastoral_reviewed_at ? format(new Date(record.pastoral_reviewed_at), 'dd MMM yyyy') : ''}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {activeTab === 'needs_review' && !record.pastoral_reviewed && (
                      <Button size="sm" onClick={() => { setReviewing({ record, mode: 'review' }); setReviewNote(''); }} className="bg-violet-600 hover:bg-violet-700 text-xs">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Mark Reviewed
                      </Button>
                    )}
                    {activeTab === 'follow_up' && record.follow_up_required && !record.follow_up_completed && (
                      <Button size="sm" onClick={() => { setReviewing({ record, mode: 'followup' }); setFollowUpNote(''); }} className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Close Follow-up
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review / Follow-up Dialog */}
      <Dialog open={!!reviewing} onOpenChange={() => setReviewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{reviewing?.mode === 'review' ? 'Mark Pastoral Review Complete' : 'Close Follow-up'}</DialogTitle>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-slate-900">{reviewing.record.student_name}</p>
                <p className="text-slate-600 mt-0.5">{reviewing.record.title}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">
                  {reviewing.mode === 'review' ? 'Review note (optional)' : 'Follow-up completion note'}
                </label>
                <Textarea
                  value={reviewing.mode === 'review' ? reviewNote : followUpNote}
                  onChange={e => reviewing.mode === 'review' ? setReviewNote(e.target.value) : setFollowUpNote(e.target.value)}
                  placeholder={reviewing.mode === 'review' ? 'Summarise the pastoral review outcome…' : 'Describe the follow-up actions completed…'}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (reviewing.mode === 'review') {
                  markReviewedMutation.mutate({ id: reviewing.record.id, note: reviewNote });
                } else {
                  closeFollowUpMutation.mutate({ id: reviewing.record.id, note: followUpNote });
                }
              }}
              disabled={markReviewedMutation.isPending || closeFollowUpMutation.isPending}
              className={reviewing?.mode === 'review' ? 'bg-violet-600 hover:bg-violet-700' : 'bg-emerald-600 hover:bg-emerald-700'}
            >
              {(markReviewedMutation.isPending || closeFollowUpMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {reviewing?.mode === 'review' ? 'Confirm Review' : 'Close Follow-up'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}