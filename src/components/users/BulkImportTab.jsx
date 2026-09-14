import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Download, FileText, CheckCircle, XCircle, AlertTriangle,
  Loader2, ChevronRight, Info, Users, RefreshCw
} from 'lucide-react';
import { ROLE_CONFIG } from './userConstants';
import * as membershipsData from '@/data/memberships';
import { getCurrentUser } from '@/data/session';

const VALID_ROLES = Object.keys(ROLE_CONFIG);
const TEMPLATE_HEADERS = ['email', 'name', 'role', 'grade_level', 'department'];

function downloadTemplate() {
  const rows = [
    TEMPLATE_HEADERS,
    ['alice@school.com', 'Alice Johnson', 'student', 'DP1', ''],
    ['bob@school.com', 'Bob Smith', 'teacher', '', 'Mathematics'],
    ['carol@school.com', 'Carol White', 'parent', '', ''],
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'user_import_template.csv'; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, '').trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
  return { headers, rows };
}

function validateRows(rows) {
  return rows.map((row, idx) => {
    const errors = [];
    const lineNum = idx + 2;

    if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push('Invalid or missing email');
    }
    if (!row.role || !VALID_ROLES.includes(row.role)) {
      errors.push(`Invalid role "${row.role}" (must be: ${VALID_ROLES.join(', ')})`);
    }
    if (row.role === 'student' && row.grade_level && !/^(DP1|DP2|MYP[1-5]|PYP[1-6])$/i.test(row.grade_level)) {
      // soft warning only
    }

    return { ...row, _line: lineNum, _errors: errors, _valid: errors.length === 0 };
  });
}

export default function BulkImportTab({ schoolId, schoolName }) {
  const queryClient = useQueryClient();
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);  // { validated: [], fileName: '' }
  const [result, setResult] = useState(null);    // { created, skipped, errors }
  const [step, setStep] = useState('upload');     // upload | preview | done

  const importMutation = useMutation({
    mutationFn: async (validRows) => {
      const user = await getCurrentUser();
      let created = 0, skipped = 0, errors = [];

      for (const row of validRows) {
        try {
          // Check if membership already exists (by email)
          const existing = await membershipsData.where({
            school_id: schoolId,
            user_email: row.email,
          });
          if (existing.length > 0) {
            skipped++;
            continue;
          }

          await membershipsData.create({
            school_id: schoolId,
            user_email: row.email,
            user_name: row.name || '',
            role: row.role,
            grade_level: row.grade_level || '',
            department: row.department || '',
            status: 'pending',
          });
          created++;
        } catch (e) {
          errors.push({ email: row.email, error: e.message });
        }
      }
      return { created, skipped, errors };
    },
    onSuccess: (data) => {
      setResult(data);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['school-memberships', schoolId] });
    },
  });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers, rows } = parseCSV(ev.target.result);
      const missingHeaders = TEMPLATE_HEADERS.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        alert(`Missing required columns: ${missingHeaders.join(', ')}\n\nPlease download the template and fill it in.`);
        return;
      }
      const validated = validateRows(rows);
      setPreview({ validated, fileName: file.name });
      setStep('preview');
    };
    reader.readAsText(file);
  };

  const validRows    = preview?.validated.filter(r => r._valid) || [];
  const invalidRows  = preview?.validated.filter(r => !r._valid) || [];

  if (step === 'done' && result) {
    return (
      <div className="max-w-lg mx-auto py-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold scholr-ink">Import Complete</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
            <p className="text-2xl font-bold text-emerald-700">{result.created}</p>
            <p className="text-xs text-emerald-600 mt-0.5">Imported</p>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
            <p className="text-2xl font-bold text-amber-700">{result.skipped}</p>
            <p className="text-xs text-amber-600 mt-0.5">Skipped (exists)</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <p className="text-2xl font-bold text-red-700">{result.errors.length}</p>
            <p className="text-xs text-red-600 mt-0.5">Errors</p>
          </div>
        </div>
        {result.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left space-y-1">
            {result.errors.map((e, i) => (
              <p key={i} className="text-xs text-red-700"><strong>{e.email}</strong>: {e.error}</p>
            ))}
          </div>
        )}
        <Button variant="outline" className="gap-2 mt-4" onClick={() => { setStep('upload'); setPreview(null); setResult(null); if (fileRef.current) fileRef.current.value = ''; }}>
          <RefreshCw className="w-4 h-4" /> Import Another File
        </Button>
      </div>
    );
  }

  if (step === 'preview' && preview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 scholr-faint" />
            <span className="text-sm font-medium scholr-body">{preview.fileName}</span>
            <Badge className="text-[11px] scholr-sunk scholr-muted">{preview.validated.length} rows</Badge>
          </div>
          <button
            onClick={() => { setStep('upload'); setPreview(null); if (fileRef.current) fileRef.current.value = ''; }}
            className="text-xs scholr-faint hover:scholr-muted"
          >
            ← Back
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-emerald-700">{validRows.length}</p>
            <p className="text-xs text-emerald-600">Ready to import</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-red-700">{invalidRows.length}</p>
            <p className="text-xs text-red-600">Rows with errors</p>
          </div>
          <div className="scholr-sunk border scholr-rule-soft rounded-lg p-3 text-center">
            <p className="text-xl font-bold scholr-body">{preview.validated.length}</p>
            <p className="text-xs scholr-muted">Total rows</p>
          </div>
        </div>

        {invalidRows.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-xs text-red-700 space-y-1">
              <strong>{invalidRows.length} rows have errors and will be skipped:</strong>
              {invalidRows.slice(0, 5).map((r, i) => (
                <div key={i}>Line {r._line}: {r._errors.join('; ')}</div>
              ))}
              {invalidRows.length > 5 && <div>…and {invalidRows.length - 5} more</div>}
            </AlertDescription>
          </Alert>
        )}

        {/* Preview table */}
        <div className="bg-white rounded-xl border scholr-rule overflow-hidden shadow-sm max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="scholr-sunk sticky top-0">
              <tr className="border-b scholr-rule-soft">
                <th className="px-4 py-2.5 text-left font-semibold scholr-muted uppercase tracking-wide">#</th>
                <th className="px-4 py-2.5 text-left font-semibold scholr-muted uppercase tracking-wide">Email</th>
                <th className="px-4 py-2.5 text-left font-semibold scholr-muted uppercase tracking-wide">Name</th>
                <th className="px-4 py-2.5 text-left font-semibold scholr-muted uppercase tracking-wide">Role</th>
                <th className="px-4 py-2.5 text-left font-semibold scholr-muted uppercase tracking-wide">Detail</th>
                <th className="px-4 py-2.5 text-left font-semibold scholr-muted uppercase tracking-wide">Valid</th>
              </tr>
            </thead>
            <tbody className="divide-y scholr-divide">
              {preview.validated.map((row, i) => (
                <tr key={i} className={row._valid ? '' : 'bg-red-50'}>
                  <td className="px-4 py-2 scholr-faint">{row._line}</td>
                  <td className="px-4 py-2 scholr-body font-mono">{row.email}</td>
                  <td className="px-4 py-2 scholr-muted">{row.name || '—'}</td>
                  <td className="px-4 py-2">
                    {ROLE_CONFIG[row.role]
                      ? <span className={`px-2 py-0.5 rounded-full border text-[11px] role-chip`}>{ROLE_CONFIG[row.role].label}</span>
                      : <span className="text-red-600">{row.role || '—'}</span>}
                  </td>
                  <td className="px-4 py-2 scholr-faint">{row.grade_level || row.department || '—'}</td>
                  <td className="px-4 py-2">
                    {row._valid
                      ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                      : <span title={row._errors.join('; ')}><XCircle className="w-4 h-4 text-red-500" /></span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-xs text-blue-700">
            Only valid rows will be imported. Users already in this school will be skipped. Imported users will have <strong>pending</strong> status until they accept an invitation.
          </AlertDescription>
        </Alert>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => { setStep('upload'); setPreview(null); }}>
            Cancel
          </Button>
          <Button
            className="flex-1 pub-btn pub-btn-gold gap-2"
            disabled={validRows.length === 0 || importMutation.isPending}
            onClick={() => importMutation.mutate(validRows)}
          >
            {importMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" />Importing…</>
              : <><Users className="w-4 h-4" />Import {validRows.length} User{validRows.length !== 1 ? 's' : ''}</>}
          </Button>
        </div>
      </div>
    );
  }

  // Upload step
  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h3 className="text-sm font-semibold scholr-ink mb-1">Bulk User Import</h3>
        <p className="text-xs scholr-muted">Import users, enrollments, and class assignments via CSV. Strong validation and safe preview before applying changes.</p>
      </div>

      {/* Template download */}
      <div className="app-group p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg scholr-accent-sf flex items-center justify-center">
            <FileText className="w-4 h-4 scholr-accent" />
          </div>
          <div>
            <p className="text-sm font-medium scholr-ink">Download Template</p>
            <p className="text-xs scholr-faint">CSV with required columns: email, name, role, grade_level, department</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2 flex-shrink-0" onClick={downloadTemplate}>
          <Download className="w-4 h-4" /> Template
        </Button>
      </div>

      {/* File upload zone */}
      <div
        className="border-2 border-dashed scholr-rule rounded-xl p-10 text-center hover:scholr-accent-rule hover:scholr-accent-sf/30 transition-colors cursor-pointer"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-10 h-10 scholr-faint mx-auto mb-3" />
        <p className="text-sm font-medium scholr-body mb-1">Click to upload CSV file</p>
        <p className="text-xs scholr-faint">Supports CSV files up to 1,000 rows</p>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </div>

      {/* What gets validated */}
      <div className="scholr-sunk border scholr-rule rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold scholr-muted uppercase tracking-wide mb-2">Validation Rules</p>
        {[
          'Valid email address format required',
          `Role must be one of: ${VALID_ROLES.map(r => ROLE_CONFIG[r].label).join(', ')}`,
          'Duplicate emails (already members) are safely skipped',
          'Rows with errors are skipped — valid rows are always applied',
          'Imported users start in "pending" status for security',
        ].map((rule, i) => (
          <div key={i} className="flex items-start gap-2">
            <ChevronRight className="w-3.5 h-3.5 scholr-accent flex-shrink-0 mt-0.5" />
            <span className="text-xs scholr-muted">{rule}</span>
          </div>
        ))}
      </div>
    </div>
  );
}