import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import * as schoolsData from '@/data/schools';

export default function MaintenanceModePanel({ schools }) {
  const [platformMaintenance, setPlatformMaintenance] = useState(false);
  const [schoolMaintenance, setSchoolMaintenance] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleSchoolMaintenance = (schoolId) => {
    setSchoolMaintenance((prev) => ({ ...prev, [schoolId]: !prev[schoolId] }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Persist maintenance flags to school records
    const promises = schools
      .filter((school) => schoolMaintenance[school.id] !== undefined)
      .map((school) =>
        schoolsData.update(school.id, {
          status: schoolMaintenance[school.id] ? 'suspended' : 'active',
        })
      );
    await Promise.all(promises);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-5">
      {saved && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800 text-sm">Maintenance settings applied.</AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Platform-Wide Maintenance Mode</p>
          <p className="text-xs text-amber-700 mt-1">Enabling this will display a maintenance notice to all users across all schools. It does not suspend any accounts.</p>
          <div className="flex items-center gap-3 mt-3">
            <Switch
              checked={platformMaintenance}
              onCheckedChange={setPlatformMaintenance}
            />
            <span className="text-sm font-medium text-amber-800">
              {platformMaintenance ? 'Maintenance mode ON' : 'Maintenance mode OFF'}
            </span>
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900 mb-1">School-Level Maintenance</p>
        <p className="text-xs text-slate-500 mb-3">Toggle individual schools into suspended state. This will prevent logins for users of that school.</p>
        <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {schools.length === 0 ? (
            <p className="text-sm text-slate-500 p-4">No schools found.</p>
          ) : (
            schools.map((school) => (
              <div key={school.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{school.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{school.status}</p>
                </div>
                <Switch
                  checked={
                    schoolMaintenance[school.id] !== undefined
                      ? schoolMaintenance[school.id]
                      : school.status === 'suspended'
                  }
                  onCheckedChange={() => toggleSchoolMaintenance(school.id)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        variant="outline"
        className="gap-2 border-amber-300 text-amber-800 hover:bg-amber-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
        Apply Maintenance Settings
      </Button>
    </div>
  );
}