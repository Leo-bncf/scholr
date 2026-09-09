import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Plus, X, HardDrive, Clock, AlertTriangle } from 'lucide-react';
import * as submissionsData from '@/data/submissions';
import * as assignmentsData from '@/data/assignments';

const COMMON_EXTENSIONS = ['.pdf', '.docx', '.doc', '.pptx', '.xlsx', '.txt', '.jpg', '.jpeg', '.png', '.mp4', '.zip'];

const PLAN_STORAGE_LIMITS = {
  starter: 5 * 1024,      // 5 GB in MB
  professional: 50 * 1024,
  enterprise: 500 * 1024,
};

function StorageMonitor({ schoolId, plan }) {
  const { data: submissions = [] } = useQuery({
    queryKey: ['storage-monitor-submissions', schoolId],
    queryFn: () => submissionsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['storage-monitor-assignments', schoolId],
    queryFn: () => assignmentsData.where({ school_id: schoolId }),
    enabled: !!schoolId,
  });

  // Estimate storage from document size_bytes fields
  const submissionBytes = submissions.reduce((sum, s) => {
    return sum + (s.documents || []).reduce((ds, d) => ds + (d.size_bytes || 0), 0);
  }, 0);

  const submissionMB = submissionBytes / (1024 * 1024);
  const totalFilesCount = submissions.reduce((sum, s) => sum + (s.documents || []).length, 0);
  const limitMB = PLAN_STORAGE_LIMITS[plan] || PLAN_STORAGE_LIMITS.starter;
  const usedPct = Math.min((submissionMB / limitMB) * 100, 100);
  const isHigh = usedPct > 80;
  const isCritical = usedPct > 95;

  const formatSize = (mb) => {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <HardDrive className="w-4 h-4 text-slate-500" />
        <h4 className="text-sm font-semibold text-slate-900">Storage Usage Monitor</h4>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{totalFilesCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total Files</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{submissions.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Submissions</p>
        </div>
        <div className={`rounded-lg p-3 text-center ${isCritical ? 'bg-red-50' : isHigh ? 'bg-amber-50' : 'bg-slate-50'}`}>
          <p className={`text-lg font-bold ${isCritical ? 'text-red-700' : isHigh ? 'text-amber-700' : 'text-slate-900'}`}>
            {formatSize(submissionMB)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Used</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">{formatSize(submissionMB)} of {formatSize(limitMB)} used ({usedPct.toFixed(1)}%)</span>
          {isCritical && (
            <span className="text-xs text-red-600 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Critical
            </span>
          )}
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isCritical ? 'bg-red-500' : isHigh ? 'bg-amber-500' : 'bg-indigo-500'}`}
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Plan: <span className="font-medium capitalize">{plan || 'starter'}</span> · Limit: {formatSize(limitMB)}
        </p>
      </div>

      {submissionMB === 0 && (
        <p className="text-xs text-slate-400 italic">No tracked file storage yet. Storage usage is estimated from submission document sizes.</p>
      )}
    </div>
  );
}

export default function FileSecurityPanel({ form, onChange, schoolId, plan }) {
  const [extInput, setExtInput] = useState('');

  const addExtension = () => {
    let ext = extInput.trim().toLowerCase();
    if (!ext) return;
    if (!ext.startsWith('.')) ext = '.' + ext;
    const current = form.allowed_file_extensions || [];
    if (!current.includes(ext)) {
      onChange({ allowed_file_extensions: [...current, ext] });
    }
    setExtInput('');
  };

  const removeExtension = (ext) => {
    onChange({ allowed_file_extensions: (form.allowed_file_extensions || []).filter(e => e !== ext) });
  };

  const addCommon = (ext) => {
    const current = form.allowed_file_extensions || [];
    if (!current.includes(ext)) onChange({ allowed_file_extensions: [...current, ext] });
  };

  return (
    <div className="space-y-6">
      {/* File type restrictions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Allowed File Types</h3>
        <p className="text-xs text-slate-500 mb-3">Leave empty to allow all file types. Add extensions to restrict uploads.</p>

        <div className="flex gap-2 mb-3">
          <Input
            value={extInput}
            onChange={e => setExtInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addExtension())}
            placeholder=".pdf, .docx, .png…"
            className="h-9 text-sm max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={addExtension} className="h-9 gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </Button>
        </div>

        {(form.allowed_file_extensions || []).length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(form.allowed_file_extensions || []).map(ext => (
              <Badge key={ext} variant="outline" className="text-xs font-mono flex items-center gap-1 pr-1">
                {ext}
                <button onClick={() => removeExtension(ext)} className="ml-1 hover:text-red-600 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-3 italic">All file types permitted.</p>
        )}

        <div>
          <p className="text-[11px] text-slate-400 mb-1.5">Quick add common types:</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_EXTENSIONS.map(ext => {
              const added = (form.allowed_file_extensions || []).includes(ext);
              return (
                <button
                  key={ext}
                  onClick={() => added ? removeExtension(ext) : addCommon(ext)}
                  className={`text-[11px] font-mono px-2 py-1 rounded border transition-all ${added ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  {ext}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Size & count limits */}
      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Upload Limits</h3>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div>
            <Label className="text-xs font-semibold text-slate-600">Max file size (MB)</Label>
            <Input
              type="number" min="1" max="2000"
              value={form.max_file_size_mb || 50}
              onChange={e => onChange({ max_file_size_mb: parseFloat(e.target.value) || 50 })}
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">Max files per submission</Label>
            <Input
              type="number" min="1" max="100"
              value={form.max_files_per_submission || 10}
              onChange={e => onChange({ max_files_per_submission: parseInt(e.target.value) || 10 })}
              className="mt-1 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Retention */}
      <div className="border-t border-slate-100 pt-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" /> Retention Rules
        </h3>
        <p className="text-xs text-slate-500 mb-3">How long to keep files after the academic period ends. This is informational — automatic deletion is handled by your platform plan.</p>
        <div className="grid grid-cols-2 gap-4 max-w-sm">
          <div>
            <Label className="text-xs font-semibold text-slate-600">Submission files (days)</Label>
            <Input
              type="number" min="30"
              value={form.retention_days_submissions || 1825}
              onChange={e => onChange({ retention_days_submissions: parseInt(e.target.value) || 1825 })}
              className="mt-1 h-9 text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">{Math.round((form.retention_days_submissions || 1825) / 365)} years</p>
          </div>
          <div>
            <Label className="text-xs font-semibold text-slate-600">Assignment attachments (days)</Label>
            <Input
              type="number" min="30"
              value={form.retention_days_attachments || 1825}
              onChange={e => onChange({ retention_days_attachments: parseInt(e.target.value) || 1825 })}
              className="mt-1 h-9 text-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">{Math.round((form.retention_days_attachments || 1825) / 365)} years</p>
          </div>
        </div>
      </div>

      {/* Storage monitor */}
      <div className="border-t border-slate-100 pt-5">
        <StorageMonitor schoolId={schoolId} plan={plan} />
      </div>
    </div>
  );
}