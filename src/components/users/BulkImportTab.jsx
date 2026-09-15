import { Group, Row, GroupEmpty } from '@/components/app/AppShell';
import DataTable from '@/components/app/DataTable';
import StatCard from '@/components/app/StatCard';
import StatusChip from '@/components/app/StatusChip';
import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Upload, Download, FileText,
  Loader2, Users, RefreshCw
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
      <div className="space-y-4">
        {/* Three tinted boxes, one of them red while reading zero, told a
            clean import that something had gone wrong. The figures carry the
            tone now, and only when the number is not zero. */}
        <Group title="Import finished">
          <div className="scholr-grid app-cols-3">
            <StatCard label="Imported" value={result.created} tone={result.created > 0 ? 'good' : undefined} hint="new members" />
            <StatCard label="Skipped" value={result.skipped} hint="already in this school" />
            <StatCard label="Failed" value={result.errors.length} tone={result.errors.length > 0 ? 'crit' : undefined} hint="not imported" />
          </div>
        </Group>

        {result.errors.length > 0 && (
          <Group title="What failed">
            {result.errors.map((e, i) => (
              <Row key={i} label={e.email} detail={e.error} />
            ))}
          </Group>
        )}

        <Button variant="outline" className="gap-2" onClick={() => { setStep('upload'); setPreview(null); setResult(null); if (fileRef.current) fileRef.current.value = ''; }}>
          <RefreshCw className="w-4 h-4" /> Import another file
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

        <Group>
          <div className="scholr-grid app-cols-3">
            <StatCard label="Ready" value={validRows.length} hint="will be imported" />
            <StatCard label="With errors" value={invalidRows.length} tone={invalidRows.length > 0 ? 'crit' : undefined} hint="will be skipped" />
            <StatCard label="In the file" value={preview.validated.length} hint="rows read" />
          </div>
        </Group>

        {invalidRows.length > 0 && (
          <Group title="Rows that will be skipped">
            {invalidRows.slice(0, 5).map((r, i) => (
              <Row key={i} label={`Line ${r._line}`} detail={r._errors.join('; ')} />
            ))}
            {invalidRows.length > 5 && (
              <GroupEmpty>…and {invalidRows.length - 5} more.</GroupEmpty>
            )}
          </Group>
        )}

        <Group title="What is in the file">
          <div style={{ maxHeight: '22rem', overflowY: 'auto' }}>
            <DataTable
              columns={[
                { key: '_line', header: 'Line', num: true },
                { key: 'email', header: 'Email' },
                { key: 'name', header: 'Name', render: (r) => r.name || '—' },
                { key: 'role', header: 'Role', render: (r) => ROLE_CONFIG[r.role]?.label || r.role || '—' },
                { key: 'detail', header: 'Detail', render: (r) => r.grade_level || r.department || '—' },
                {
                  key: 'valid',
                  header: '',
                  render: (r) => (r._valid
                    ? null
                    : <StatusChip tone="crit">{r._errors.join('; ')}</StatusChip>),
                },
              ]}
              rows={preview.validated}
              rowKey={(r) => r._line}
              empty="This file had no rows."
            />
          </div>
        </Group>

        <p style={{ margin: 0, fontSize: '.82rem', color: 'var(--muted)' }}>
          Only valid rows are imported. Anyone already in this school is skipped, and imported
          members stay <strong>pending</strong> until they accept an invitation.
        </p>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => { setStep('upload'); setPreview(null); }}>
            Cancel
          </Button>
          <Button
            className="flex-1 pub-btn pub-btn-primary gap-2"
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
      <p style={{ margin: 0, fontSize: '.88rem', color: 'var(--muted)' }}>
        Upload a CSV of people and Scholr will check every row before anything is written.
        Nothing is imported until you have seen the preview.
      </p>

      <Group title="Start from the template">
        <Row
          label="Download the CSV template"
          detail="Columns: email, name, role, grade_level, department"
        >
          <Button variant="outline" size="sm" className="gap-2 flex-shrink-0" onClick={downloadTemplate}>
            <Download className="w-4 h-4" /> Template
          </Button>
        </Row>
      </Group>

      {/* File upload zone */}
      {/* A div with onClick was not reachable by keyboard and announced
          nothing to a screen reader. A button is both, for free. */}
      <button
        type="button"
        className="border-2 border-dashed scholr-rule rounded-xl p-10 text-center w-full scholr-focus"
        style={{ cursor: 'pointer', background: 'transparent' }}
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="w-8 h-8 scholr-faint mx-auto mb-3" />
        <span className="block text-sm font-medium scholr-body mb-1">Choose a CSV file</span>
        <span className="block text-xs scholr-faint">Up to 1,000 rows</span>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </button>

      {/* What gets validated */}
      <Group title="What gets checked">
        {[
          ['Email', 'Must be a real address format.'],
          ['Role', `One of: ${VALID_ROLES.map(r => ROLE_CONFIG[r].label).join(', ')}.`],
          ['Already a member', 'Skipped, never duplicated.'],
          ['A row with an error', 'Skipped on its own — the valid rows still go in.'],
          ['After importing', 'Members stay pending until they accept an invitation.'],
        ].map(([label, detail]) => (
          <Row key={label} label={label} detail={detail} />
        ))}
      </Group>
    </div>
  );
}