import { Group, Row, GroupEmpty, Segmented } from '@/components/app/AppShell';
import StatusChip from '@/components/app/StatusChip';
import Notice from '@/components/app/Notice';
import { humanise } from '@/lib/labels';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useUser } from '@/components/auth/UserContext';
import { logAudit, AuditLevels } from '@/components/utils/auditLogger';
import * as behaviorRecordsData from '@/data/behaviorRecords';

/* Both of these are serious; red and rose were two names for the same signal
   and the eye could not tell them apart anyway. The word carries the step. */
const SEV_TONE = { high: 'crit', critical: 'crit' };

export default function PastoralOversight({ schoolId }) {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [reviewing, setReviewing] = useState(null);
  const [reviewNote, setReviewNote] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');
  const [activeTab, setActiveTab] = useState('needs_review');

  /* The queues are joined in one filtered query (open work is small), and the
     'recently reviewed' tray is its own limited fetch — no reason to pull the
     entire log to show the last twenty reviews. */
  const { data: queueRecords = [], isLoading } = useQuery({
    queryKey: ['behavior-pastoral-queue', schoolId],
    queryFn: () => behaviorRecordsData.listPastoralQueue(schoolId),
    enabled: !!schoolId,
  });

  const { data: recentReviewed = [] } = useQuery({
    queryKey: ['behavior-pastoral-recent', schoolId],
    queryFn: () => behaviorRecordsData.listRecentlyReviewed(schoolId, { limit: 20 }),
    enabled: !!schoolId,
  });

  const markReviewedMutation = useMutation({
    mutationFn: ({ id, note }) => behaviorRecordsData.update(id, {
      pastoral_reviewed: true,
      pastoral_reviewed_by: user?.full_name || user?.email || 'Staff',
      pastoral_reviewed_at: new Date().toISOString(),
    }),
    onSuccess: async (_, { id }) => {
      await logAudit({ action: 'pastoral_review_completed', entityType: 'BehaviorRecord', entityId: id, details: `Pastoral review marked complete by ${user?.full_name || user?.email}`, level: AuditLevels.INFO, schoolId });
      queryClient.invalidateQueries({ queryKey: ['behavior-pastoral-queue', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['behavior-pastoral-recent', schoolId] });
      setReviewing(null);
      setReviewNote('');
    },
  });

  const closeFollowUpMutation = useMutation({
    mutationFn: ({ id, note }) => behaviorRecordsData.update(id, {
      follow_up_completed: true,
      follow_up_note: note,
    }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['behavior-pastoral-queue', schoolId] });
      queryClient.invalidateQueries({ queryKey: ['behavior-pastoral-recent', schoolId] });
      setReviewing(null);
      setFollowUpNote('');
    },
  });

  const needsReview = queueRecords.filter(r => !r.pastoral_reviewed && (r.severity === 'high' || r.severity === 'critical'));
  const pendingFollowUp = queueRecords.filter(r => r.follow_up_required && !r.follow_up_completed);

  const TABS = [
    { id: 'needs_review', label: 'Needs Pastoral Review', count: needsReview.length, urgent: true },
    { id: 'follow_up', label: 'Pending Follow-up', count: pendingFollowUp.length, urgent: pendingFollowUp.length > 0 },
    { id: 'reviewed', label: 'Recently Reviewed', count: recentReviewed.length },
  ];

  const currentList = activeTab === 'needs_review' ? needsReview : activeTab === 'follow_up' ? pendingFollowUp : recentReviewed;

  return (
    <div className="space-y-4">
      <Notice title="This view holds everything, including safeguarding">
        Staff-only and safeguarding records appear here. Only school admins and IB coordinators can open
        this page, and what you do on it is written to the audit trail.
      </Notice>

      <Segmented
        label="Pastoral queues"
        value={activeTab}
        onChange={setActiveTab}
        options={TABS.map(t => ({ value: t.id, label: t.count > 0 ? `${t.label} ${t.count}` : t.label }))}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin scholr-accent" /></div>
      ) : currentList.length === 0 ? (
        <Group>
          <GroupEmpty>
            {activeTab === 'needs_review'
              ? 'Nothing is waiting for a pastoral review.'
              : activeTab === 'follow_up'
                ? 'Every follow-up has been closed.'
                : 'Nothing has been reviewed yet.'}
          </GroupEmpty>
        </Group>
      ) : (
        currentList.map(record => (
          <Group
            key={record.id}
            title={`${record.student_name} — ${record.date}`}
            action={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                {record.severity && SEV_TONE[record.severity] && (
                  <StatusChip tone={SEV_TONE[record.severity]}>{record.severity}</StatusChip>
                )}
                {record.staff_only && <StatusChip tone="crit">Staff only</StatusChip>}
                {record.follow_up_required && !record.follow_up_completed && (
                  <StatusChip tone="warn">Follow-up open</StatusChip>
                )}
              </span>
            }
          >
            <Row label={record.title} detail={record.description || undefined} />
            {record.action_taken && <Row label="Action taken" detail={record.action_taken} />}
            <Row
              label="Recorded by"
              detail={[record.recorded_by_name, record.category && humanise(record.category)].filter(Boolean).join(' · ')}
            />
            {record.pastoral_reviewed && (
              <Row
                label="Reviewed"
                detail={`${record.pastoral_reviewed_by}${record.pastoral_reviewed_at ? ` on ${format(new Date(record.pastoral_reviewed_at), 'd MMM yyyy')}` : ''}`}
              />
            )}
            {activeTab === 'needs_review' && !record.pastoral_reviewed && (
              <Row label="Pastoral review" detail="Confirm you have seen this and note the outcome.">
                <Button
                  size="sm"
                  onClick={() => { setReviewing({ record, mode: 'review' }); setReviewNote(''); }}
                  className="pub-btn pub-btn-primary text-xs"
                >
                  Mark reviewed
                </Button>
              </Row>
            )}
            {activeTab === 'follow_up' && record.follow_up_required && !record.follow_up_completed && (
              <Row label="Follow-up" detail="Close it once the action has actually happened.">
                <Button
                  size="sm"
                  onClick={() => { setReviewing({ record, mode: 'followup' }); setFollowUpNote(''); }}
                  className="pub-btn pub-btn-primary text-xs"
                >
                  Close follow-up
                </Button>
              </Row>
            )}
          </Group>
        ))
      )}

      {/* Review / Follow-up Dialog */}
      <Dialog open={!!reviewing} onOpenChange={() => setReviewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{reviewing?.mode === 'review' ? 'Mark pastoral review complete' : 'Close follow-up'}</DialogTitle>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-4">
              <div className="scholr-sunk rounded-lg p-3 text-sm">
                <p className="font-semibold scholr-ink">{reviewing.record.student_name}</p>
                <p className="scholr-muted mt-0.5">{reviewing.record.title}</p>
              </div>
              <div>
                <label className="text-sm font-semibold scholr-body block mb-1.5">
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
              className="pub-btn pub-btn-primary"
            >
              {(markReviewedMutation.isPending || closeFollowUpMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {reviewing?.mode === 'review' ? 'Confirm review' : 'Close follow-up'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}