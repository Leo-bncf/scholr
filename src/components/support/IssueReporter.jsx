import React, { useState } from 'react';
import Notice from '@/components/app/Notice';
import { humanise } from '@/lib/labels';
import { useQuery } from '@tanstack/react-query';
import * as storage from '@/data/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import * as admin from '@/data/admin';
import * as supportTicketsData from '@/data/supportTickets';
import * as email from '@/data/email';
import {
  Bug, MessageSquare, CheckCircle2, Loader2, Upload,
  Info, AlertTriangle, Zap, ChevronDown, ChevronUp
} from 'lucide-react';

const ISSUE_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'bg-red-100 text-red-600', description: 'Something is broken or behaving unexpectedly' },
  { value: 'question', label: 'Question / Help', icon: MessageSquare, color: 'bg-blue-100 text-blue-600', description: 'I need help understanding how something works' },
  { value: 'feature', label: 'Feature Request', icon: Zap, color: 'bg-amber-100 text-amber-600', description: 'I have a suggestion or improvement idea' },
  { value: 'urgent', label: 'Urgent Issue', icon: AlertTriangle, color: 'bg-rose-100 text-rose-600', description: 'Something is blocking critical school operations' },
];

const PRIORITY_MAP = {
  bug: 'medium',
  question: 'low',
  feature: 'low',
  urgent: 'high',
};

export default function IssueReporter({ schoolId, user, school }) {
  const [type, setType] = useState('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [includeContext, setIncludeContext] = useState(true);
  const [showContext, setShowContext] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const { data: recentAuditLogs = [] } = useQuery({
    queryKey: ['recent-audit-logs', schoolId],
    queryFn: () => admin.whereAuditLogs({ school_id: schoolId }),
    enabled: !!schoolId && includeContext,
    select: data => data.slice(-5),
  });

  const contextInfo = {
    school_name: school?.name || '—',
    school_id: schoolId || '—',
    user_email: user?.email || '—',
    user_role: user?.role || '—',
    current_url: window.location.href,
    platform: navigator.userAgent,
    timestamp: new Date().toISOString(),
    recent_actions: recentAuditLogs.map(l => `${l.action} (${l.level})`).join(', ') || 'none',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      let screenshotUrl = null;
      if (screenshotFile) {
        const uploaded = await storage.upload(screenshotFile, { schoolId: schoolId, prefix: 'support' });
      const file_url = uploaded.url;
        screenshotUrl = file_url;
      }

      await supportTicketsData.create({
        school: school?.name || schoolId,
        subject: `[${type.toUpperCase()}] ${subject}`,
        priority: PRIORITY_MAP[type] || 'medium',
        status: 'open',
        assignee: 'Unassigned',
      });

      // Send email to support with full context
      const contextBlock = includeContext
        ? `\n\n--- Context ---\n${Object.entries(contextInfo).map(([k, v]) => `${k}: ${v}`).join('\n')}${screenshotUrl ? `\nScreenshot: ${screenshotUrl}` : ''}`
        : '';

      await email.send({
        to: 'support@ibmanager.io',
        subject: `Support: [${type.toUpperCase()}] ${subject} — ${school?.name}`,
        body: `${description}${contextBlock}`,
      });

      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit. Please try again or email support directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-xl border border-emerald-200 p-10 text-center">
        <div className="w-14 h-14 scholr-sunk rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold scholr-ink mb-2">Request submitted</h3>
        <p className="text-sm scholr-muted mb-5 max-w-sm mx-auto">
          Your support request has been logged. Our team typically responds within 1–2 business days. Urgent issues are prioritised.
        </p>
        <Button variant="outline" size="sm" onClick={() => { setSubmitted(false); setSubject(''); setDescription(''); setType('bug'); setScreenshotFile(null); }}>
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Issue type selector */}
      <div>
        <p className="text-xs font-semibold scholr-muted uppercase tracking-wide mb-3">What kind of request is this?</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {ISSUE_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                  type === t.value ? 'scholr-accent-rule scholr-accent-sf' : 'scholr-rule bg-white hover:scholr-rule'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-bold ${type === t.value ? 'scholr-accent' : 'scholr-ink'}`}>{t.label}</p>
                  <p className="text-xs scholr-faint mt-0.5">{t.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border scholr-rule p-6 space-y-4">
        <div>
          <Label className="text-xs font-semibold scholr-muted">Subject *</Label>
          <Input
            className="mt-1"
            placeholder="Brief description of the issue"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
          />
        </div>

        <div>
          <Label className="text-xs font-semibold scholr-muted">Description *</Label>
          <Textarea
            className="mt-1 h-32"
            placeholder={type === 'bug'
              ? 'Describe what happened, what you expected, and the steps to reproduce...'
              : type === 'urgent'
              ? 'Describe the issue and how it is blocking your school operations...'
              : 'Describe your question or suggestion in detail...'}
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <Label className="text-xs font-semibold scholr-muted">Screenshot (optional)</Label>
          <div className="mt-1 flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-2 border border-dashed scholr-rule rounded-lg cursor-pointer hover:scholr-sunk transition-colors text-sm scholr-muted">
              <Upload className="w-4 h-4" />
              {screenshotFile ? screenshotFile.name : 'Upload screenshot'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => setScreenshotFile(e.target.files[0])}
              />
            </label>
            {screenshotFile && (
              <button type="button" onClick={() => setScreenshotFile(null)} className="text-xs hover:underline" style={{ color: 'var(--crit)' }}>Remove</button>
            )}
          </div>
        </div>

        {/* Context panel */}
        <div className="rounded-lg border scholr-rule overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 scholr-sunk">
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5 scholr-faint" />
              <span className="text-xs font-semibold scholr-muted">Include diagnostic context</span>
              <Badge className={`${includeContext ? 'scholr-sunk scholr-muted' : 'scholr-sunk scholr-muted'} border-0 text-xs`}>
                {includeContext ? 'Included' : 'Off'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIncludeContext(v => !v)}
                className={`w-10 h-5 rounded-full transition-colors relative ${includeContext ? 'bg-indigo-500' : 'scholr-sunk'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-colors ${includeContext ? 'left-5' : 'left-0.5'}`} />
              </button>
              <button type="button" onClick={() => setShowContext(v => !v)} className="scholr-faint">
                {showContext ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {showContext && (
            <div className="px-4 pb-3 scholr-sunk border-t scholr-rule-soft">
              <p className="text-xs scholr-faint mb-2">This information helps us diagnose issues faster without back-and-forth:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(contextInfo).map(([k, v]) => (
                  <div key={k} className="flex gap-1.5 text-xs">
                    <span className="scholr-faint shrink-0">{humanise(k)}:</span>
                    <span className="scholr-muted truncate">{String(v).slice(0, 60)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <Notice tone="crit">
            {error}
          </Notice>
        )}

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs scholr-faint">
            Priority: <span className={`font-semibold ${PRIORITY_MAP[type] === 'high' ? 'text-red-600' : 'scholr-muted'}`}>{PRIORITY_MAP[type]}</span>
          </p>
          <Button
            type="submit"
            disabled={submitting || !subject.trim() || !description.trim()}
            className="scholr-accent-sf hover:scholr-accent-sf gap-1.5"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </div>
  );
}