import React, { useState } from 'react';
import * as tables from '@/data/tables';
import { Button } from '@/components/ui/button';
import { Download, Upload, FileJson, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

const EXPORTABLE_ENTITIES = [
  { key: 'School', label: 'Schools', description: 'All school profiles and settings' },
  { key: 'SchoolMembership', label: 'Memberships', description: 'User-school role assignments' },
  { key: 'AcademicYear', label: 'Academic Years', description: 'Academic year configurations' },
  { key: 'Term', label: 'Terms', description: 'Term and semester definitions' },
  { key: 'Subject', label: 'Subjects', description: 'Subject catalogue per school' },
  { key: 'Class', label: 'Classes', description: 'Class and section records' },
  { key: 'AuditLog', label: 'Audit Logs', description: 'Platform audit trail' },
];

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataExportImport() {
  const [exporting, setExporting] = useState({});
  const [exportAll, setExportAll] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleExport = async (entityKey) => {
    setExporting(prev => ({ ...prev, [entityKey]: true }));
    const records = await tables.select(entityKey, {}, { order: 'created_at', ascending: false, limit: 5000 });
    const filename = `export_${entityKey.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`;
    downloadJson({ entity: entityKey, exported_at: new Date().toISOString(), count: records.length, records }, filename);
    setExporting(prev => ({ ...prev, [entityKey]: false }));
  };

  const handleExportAll = async () => {
    setExportAll(true);
    const result = {};
    for (const e of EXPORTABLE_ENTITIES) {
      result[e.key] = await tables.select(e.key, {}, { order: 'created_at', ascending: false, limit: 5000 });
    }
    downloadJson({ exported_at: new Date().toISOString(), data: result }, `platform_full_export_${new Date().toISOString().slice(0, 10)}.json`);
    setExportAll(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(null);
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.entity || !Array.isArray(parsed.records)) {
          setImportError('Invalid format. File must be a single-entity export with { entity, records }.');
          setImportPreview(null);
          return;
        }
        setImportPreview(parsed);
      } catch {
        setImportError('Could not parse file. Ensure it is a valid JSON export.');
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importPreview) return;
    const { entity, records } = importPreview;
    if (!tables.isKnown(entity)) {
      setImportError(`Unknown entity type: ${entity}`);
      return;
    }
    setImporting(true);
    setImportError(null);
    setImportSuccess(null);
    await tables.insertMany(entity, records.map(({ id, created_at, updated_at, ...rest }) => rest));
    setImportSuccess(`Successfully imported ${records.length} ${entity} records.`);
    setImportFile(null);
    setImportPreview(null);
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Export */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Export Data</p>
            <p className="text-xs text-slate-500 mt-0.5">Download entity records as JSON for backups or migrations</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            disabled={exportAll}
            className="gap-2 text-xs"
          >
            {exportAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export All
          </Button>
        </div>
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-md overflow-hidden">
          {EXPORTABLE_ENTITIES.map(e => (
            <div key={e.key} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <FileJson className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{e.label}</p>
                  <p className="text-xs text-slate-400">{e.description}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExport(e.key)}
                disabled={!!exporting[e.key]}
                className="gap-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                {exporting[e.key] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                Export
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Import */}
      <div>
        <p className="text-sm font-semibold text-slate-800 mb-1">Import Data</p>
        <p className="text-xs text-slate-500 mb-3">Upload a single-entity JSON export file to bulk-create records</p>

        {importError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md mb-3 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {importError}
          </div>
        )}
        {importSuccess && (
          <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-md mb-3 text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {importSuccess}
          </div>
        )}

        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-md p-6 cursor-pointer hover:border-slate-300 bg-slate-50 hover:bg-white transition-colors">
          <Upload className="w-6 h-6 text-slate-400 mb-2" />
          <span className="text-sm text-slate-500">{importFile ? importFile.name : 'Click to select a JSON export file'}</span>
          <input type="file" accept=".json" className="hidden" onChange={handleFileChange} />
        </label>

        {importPreview && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
            <p className="font-semibold">Ready to import: <span className="font-black">{importPreview.entity}</span></p>
            <p className="text-xs mt-0.5">{importPreview.records.length} records will be created (IDs stripped for fresh insert)</p>
          </div>
        )}

        {importPreview && (
          <Button
            onClick={handleImport}
            disabled={importing}
            className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs"
            size="sm"
          >
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            Confirm Import ({importPreview.records.length} records)
          </Button>
        )}
      </div>
    </div>
  );
}