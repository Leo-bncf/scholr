import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertCircle, RefreshCw, Database } from 'lucide-react';

export default function TimetableImportDialog({ open, onClose, schoolId }) {
  const [importData, setImportData] = useState('');
  const [syncType, setSyncType] = useState('full_import');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    // Placeholder for actual import logic
    setImporting(true);
    setTimeout(() => {
      alert('Import functionality will be connected to your external timetable system API endpoint.');
      setImporting(false);
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Timetable Data</DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            Import schedule entries, periods, and rooms from external system
          </p>
        </DialogHeader>

        <Alert className="border-blue-200 bg-blue-50">
          <AlertCircle className="w-4 h-4 text-blue-700" />
          <AlertDescription className="text-sm text-blue-900">
            <strong>Integration Ready:</strong> This dialog is prepared for connection to your external timetable system. 
            Once configured, it will automatically sync schedules, periods, and room assignments.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold mb-2 block">Sync Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSyncType('full_import')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  syncType === 'full_import' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Database className="w-5 h-5 text-indigo-600 mb-2" />
                <p className="text-sm font-semibold text-slate-900">Full Import</p>
                <p className="text-xs text-slate-500 mt-1">Replace all timetable data</p>
              </button>
              <button
                onClick={() => setSyncType('incremental_update')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  syncType === 'incremental_update' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <RefreshCw className="w-5 h-5 text-emerald-600 mb-2" />
                <p className="text-sm font-semibold text-slate-900">Incremental Update</p>
                <p className="text-xs text-slate-500 mt-1">Update changed records only</p>
              </button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Preview Data (JSON)</Label>
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='{"schedule_entries": [...], "periods": [...], "rooms": [...]}'
              rows={10}
              className="font-mono text-xs"
            />
            <p className="text-xs text-slate-500 mt-2">
              Paste JSON data from external system or leave empty for direct API sync
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-2">What will be synced:</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Badge variant="outline" className="bg-white">Schedule Entries</Badge>
                <span>Class schedules, times, room assignments</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Badge variant="outline" className="bg-white">Periods</Badge>
                <span>Time blocks and period definitions</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Badge variant="outline" className="bg-white">Rooms</Badge>
                <span>Room allocations and facility data</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={importing}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
          >
            {importing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Start Import
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}