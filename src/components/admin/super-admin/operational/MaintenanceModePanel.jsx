import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldAlert } from 'lucide-react';
import * as schoolsData from '@/data/schools';

export default function MaintenanceModePanel({ schools }) {
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

      <div>
        <p className="text-sm font-semibold scholr-ink mb-1">School-Level Maintenance</p>
        <p className="text-xs scholr-muted mb-3">Toggle individual schools into suspended state. This will prevent logins for users of that school. There is no platform-wide maintenance flag on this server, so this panel only controls per-school state.</p>
        <div className="border scholr-rule rounded-lg divide-y scholr-divide max-h-64 overflow-y-auto">
          {schools.length === 0 ? (
            <p className="text-sm scholr-muted p-4">No schools found.</p>
          ) : (
            schools.map((school) => (
              <div key={school.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium scholr-ink">{school.name}</p>
                  <p className="text-xs scholr-muted capitalize">{school.status}</p>
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