import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Users, CheckCircle2, AlertCircle, Loader2, FileText, Download } from 'lucide-react';

/**
 * Bulk invite via CSV paste or upload.
 * Format: first_name,last_name,email[,grade_level_or_department]
 * One user per row. All rows get the selected role.
 */
export default function BulkInviteDialog({ open, onClose, schoolId, schoolName }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState('student');
  const [csvText, setCsvText] = useState('');
  const [parsed, setParsed] = useState([]);
  const [results, setResults] = useState(null);

  const parseCsv = (text) => {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const rows = lines
      .filter(l => !l.toLowerCase().startsWith('first_name')) // skip header
      .map((line, idx) => {
        const parts = line.split(',').map(p => p.trim());
        const [first_name = '', last_name = '', email = '', extra = ''] = parts;
        const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        return { rowNum: idx + 1, first_name, last_name, email, extra, valid };
      });
    return rows;
  };

  const handlePreview = () => {
    setParsed(parseCsv(csvText));
    setResults(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setCsvText(text);
      setParsed(parseCsv(text));
    };
    reader.readAsText(file);
  };

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const valid = parsed.filter(r => r.valid);
      const outcomes = [];
      for (const row of valid) {
        try {
          await base44.functions.invoke('sendInvitation', {
            schoolId,
            schoolName,
            email: row.email,
            role,
            firstName: row.first_name,
            lastName: row.last_name,
            gradeLevel: role === 'student' ? row.extra : undefined,
            department: role === 'teacher' ? row.extra : undefined,
          });
          outcomes.push({ ...row, ok: true });
        } catch (err) {
          outcomes.push({ ...row, ok: false, error: err?.message || 'Failed' });
        }
      }
      return outcomes;
    },
    onSuccess: (outcomes) => {
      setResults(outcomes);
      queryClient.invalidateQueries({ queryKey: ['user-invitations'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-status', schoolId] });
    },
  });

  const downloadTemplate = () => {
    const template = 'first_name,last_name,email,grade_level_or_department\nAda,Lovelace,ada@example.com,DP1\nAlan,Turing,alan@example.com,DP2';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invite_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsed.filter(r => r.valid).length;
  const invalidCount = parsed.length - validCount;
  const successCount = results?.filter(r => r.ok).length ?? 0;
  const failCount = results ? results.length - successCount : 0;

  const reset = () => {
    setCsvText('');
    setParsed([]);
    setResults(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" /> Bulk invite users
          </DialogTitle>
        </DialogHeader>

        {!results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold">Role for all users *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="teacher">Teachers</SelectItem>
                    <SelectItem value="parent">Parents</SelectItem>
                    <SelectItem value="ib_coordinator">IB Coordinators</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={downloadTemplate} className="gap-1.5 flex-1">
                  <Download className="w-3.5 h-3.5" /> Template
                </Button>
                <label className="flex-1">
                  <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
                  <div className="border border-slate-200 rounded-md px-3 py-2 text-sm text-center cursor-pointer hover:bg-slate-50 flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Upload CSV
                  </div>
                </label>
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Or paste CSV rows</Label>
              <Textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="first_name,last_name,email,grade_level_or_department&#10;Ada,Lovelace,ada@example.com,DP1&#10;Alan,Turing,alan@example.com,DP2"
                rows={8}
                className="mt-1.5 font-mono text-xs"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                One user per row. Columns: <code>first_name, last_name, email</code> and optionally
                {role === 'student' ? ' grade level' : role === 'teacher' ? ' department' : ' ignored for this role'}.
              </p>
            </div>

            {csvText && (
              <Button variant="outline" onClick={handlePreview} className="w-full gap-1.5">
                <FileText className="w-4 h-4" /> Preview {csvText.split('\n').filter(Boolean).length} row(s)
              </Button>
            )}

            {parsed.length > 0 && (
              <div className="border border-slate-200 rounded-lg">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    {validCount} valid · {invalidCount > 0 && <span className="text-red-600">{invalidCount} invalid</span>}
                  </span>
                  <span className="text-slate-500">Role: <span className="font-medium capitalize">{role.replace('_', ' ')}</span></span>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {parsed.map((row) => (
                    <div key={row.rowNum} className="px-3 py-2 flex items-center gap-2 text-sm">
                      {row.valid
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        : <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                      }
                      <span className="text-slate-700 flex-1 truncate">
                        {row.first_name} {row.last_name} <span className="text-slate-400">·</span> {row.email || <em className="text-red-500">missing email</em>}
                        {row.extra && <span className="text-slate-400 text-xs ml-2">{row.extra}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
              <Button
                disabled={validCount === 0 || inviteMutation.isPending}
                onClick={() => inviteMutation.mutate()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-1.5"
              >
                {inviteMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending {validCount}...</> : <>Send {validCount} invitation{validCount !== 1 && 's'}</>}
              </Button>
            </div>
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <Alert className={failCount === 0 ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}>
              <AlertDescription className={failCount === 0 ? 'text-emerald-900' : 'text-amber-900'}>
                <strong>{successCount}</strong> invitation{successCount !== 1 && 's'} sent successfully
                {failCount > 0 && <>, <strong>{failCount}</strong> failed</>}.
              </AlertDescription>
            </Alert>
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {results.map((r, i) => (
                <div key={i} className="px-3 py-2 flex items-center gap-2 text-sm">
                  {r.ok
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    : <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  }
                  <span className="flex-1 truncate text-slate-700">{r.email}</span>
                  {!r.ok && <span className="text-xs text-red-600">{r.error}</span>}
                </div>
              ))}
            </div>
            <Button onClick={() => { reset(); onClose(); }} className="w-full bg-indigo-600 hover:bg-indigo-700">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}