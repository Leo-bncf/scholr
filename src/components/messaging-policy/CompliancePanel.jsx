import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Clock, X, Plus, Info } from 'lucide-react';

export default function CompliancePanel({ form, onChange }) {
  const comp = form.compliance || {};
  const [newKeyword, setNewKeyword] = useState('');

  const set = (key, val) => onChange({ compliance: { ...comp, [key]: val } });

  const addKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw) return;
    const current = comp.safeguarding_keywords || [];
    if (!current.includes(kw)) set('safeguarding_keywords', [...current, kw]);
    setNewKeyword('');
  };

  const removeKeyword = (kw) => {
    set('safeguarding_keywords', (comp.safeguarding_keywords || []).filter(k => k !== kw));
  };

  return (
    <div className="space-y-5">
      <div className="scholr-accent-sf border scholr-accent-rule rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 scholr-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold scholr-accent">Communication Compliance</p>
          <p className="text-xs scholr-accent mt-0.5">
            These controls retain operational metadata and audit events for governance and safeguarding purposes.
            <span className="font-semibold"> Message content is never stored or exposed</span> — only event metadata (sender role, recipient role, timestamp, school ID) is logged.
          </p>
        </div>
      </div>

      {/* Metadata Retention */}
      <div className="app-group space-y-4" style={{ padding: '1rem 1.1rem' }}>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-5 h-5 scholr-muted" />
          <h4 className="font-bold scholr-ink text-sm">Metadata Retention</h4>
        </div>
        <div>
          <label className="text-xs font-semibold scholr-muted block mb-1.5">Retain message metadata for</label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={30}
              max={3650}
              value={comp.retain_message_metadata_days ?? 365}
              onChange={e => set('retain_message_metadata_days', Number(e.target.value))}
              className="w-28 h-9"
            />
            <span className="text-xs scholr-muted">days (message event logs, not content)</span>
          </div>
          <p className="text-xs scholr-faint mt-1.5">Minimum recommended: 90 days. GDPR-typical: 1–2 years. Content is never retained beyond the platform's standard message storage.</p>
        </div>
      </div>

      {/* Audit event logging */}
      <div className="app-group space-y-4" style={{ padding: '1rem 1.1rem' }}>
        <div className="flex items-center gap-2 mb-1">
          <Info className="w-5 h-5" />
          <h4 className="font-bold scholr-ink text-sm">Audit Event Logging</h4>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Switch checked={comp.log_broadcast_events ?? true} onCheckedChange={v => set('log_broadcast_events', v)} />
            <div>
              <p className="text-sm font-semibold scholr-ink">Log broadcast / announcement events</p>
              <p className="text-xs scholr-muted mt-0.5">Records who sent a school-wide or class announcement, to which roles, and when. Strongly recommended for governance.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Switch checked={comp.log_message_events ?? false} onCheckedChange={v => set('log_message_events', v)} />
            <div>
              <p className="text-sm font-semibold scholr-ink">Log direct message events (metadata only)</p>
              <p className="text-xs scholr-muted mt-0.5">Records sender role, recipient role, and timestamp for every direct message. <span className="font-semibold scholr-body">No message content is captured.</span></p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Switch checked={comp.flag_student_to_student ?? false} onCheckedChange={v => set('flag_student_to_student', v)} />
            <div>
              <p className="text-sm font-semibold scholr-ink">Flag student-to-student messages for pastoral review</p>
              <p className="text-xs scholr-muted mt-0.5">When student-to-student messaging is enabled, this flag surfaces metadata events in the pastoral oversight dashboard so staff can monitor for safeguarding concerns.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Safeguarding keywords */}
      <div className="app-group space-y-4" style={{ padding: '1rem 1.1rem' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <h4 className="font-bold scholr-ink text-sm">Safeguarding Keyword Flags</h4>
              <p className="text-xs scholr-muted mt-0.5">
                Optional: define keywords that, when detected in message subject lines or announcement titles, create a pastoral audit event. Content scanning is not performed.
              </p>
            </div>
          </div>
          <Switch checked={comp.safeguarding_keywords_enabled ?? false} onCheckedChange={v => set('safeguarding_keywords_enabled', v)} />
        </div>

        {comp.safeguarding_keywords_enabled && (
          <div className="space-y-3 pt-2 border-t scholr-rule-soft">
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                placeholder="Add a keyword…"
                className="h-9 text-sm"
              />
              <button
                onClick={addKeyword}
                disabled={!newKeyword.trim()}
                className="px-3 py-1.5 pub-btn pub-btn-primary rounded-lg text-sm font-medium hover:scholr-accent-sf disabled:opacity-40 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(comp.safeguarding_keywords || []).map(kw => (
                <Badge key={kw} variant="outline" className="pr-1 flex items-center gap-1">
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {(comp.safeguarding_keywords || []).length === 0 && (
                <p className="text-xs scholr-faint italic">No keywords defined yet.</p>
              )}
            </div>
            <p className="text-xs scholr-faint">Subject-line keyword detection only. Matching triggers a pastoral audit log entry — no content is read or stored.</p>
          </div>
        )}
      </div>

      {/* Compliance contact */}
      <div className="app-group" style={{ padding: '1rem 1.1rem' }}>
        <label className="text-xs font-semibold scholr-muted block mb-1.5">Compliance / Safeguarding contact email</label>
        <Input
          type="email"
          value={comp.compliance_contact_email || ''}
          onChange={e => set('compliance_contact_email', e.target.value)}
          placeholder="dpo@school.edu"
          className="max-w-sm h-9"
        />
        <p className="text-xs scholr-faint mt-1.5">This address is shown in governance audit summaries. Not used for automatic notifications in the current version.</p>
      </div>
    </div>
  );
}