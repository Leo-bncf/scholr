import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import * as schoolsData from '@/data/schools';

/**
 * School profile setup step
 * Captures basic school information
 */
export default function SchoolProfileStep({ schoolId, onComplete }) {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  useEffect(() => {
    const loadSchool = async () => {
      try {
        const schools = await schoolsData.where({ id: schoolId });
        if (schools.length > 0) {
          const s = schools[0];
          setSchool(s);
          setName(s.name || '');
          setEmail(s.email || '');
          setPhone(s.phone || '');
          setAddress(s.address || '');
          setCity(s.city || '');
          setCountry(s.country || '');
          setTimezone(s.timezone || 'UTC');
        }
      } catch (err) {
        console.error('Error loading school:', err);
        setError('Failed to load school information');
      } finally {
        setLoading(false);
      }
    };

    loadSchool();
  }, [schoolId]);

  const handleSave = async () => {
    if (!name) {
      setError('School name is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      await schoolsData.update(schoolId, {
        name,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        country: country || undefined,
        timezone
      });

      setSuccess(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500);
    } catch (err) {
      console.error('Error saving school:', err);
      setError(err.message || 'Failed to save school information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-slate-600">Loading school information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Profile</CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Add your school's basic information. This helps identify your school across the platform.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-800 ml-3 text-sm">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-emerald-50 border-emerald-200">
            <Check className="w-4 h-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800 ml-3 text-sm">
              School profile saved successfully!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-semibold mb-1 block">School Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. International School of Excellence"
              disabled={saving}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1 block">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@school.edu"
              disabled={saving}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1 block">Phone</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              disabled={saving}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1 block">City</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Geneva"
              disabled={saving}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1 block">Country</Label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Switzerland"
              disabled={saving}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1 block">Timezone</Label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={saving}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
            >
              <option value="UTC">UTC</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="Europe/Berlin">Europe/Berlin</option>
              <option value="Asia/Shanghai">Asia/Shanghai</option>
              <option value="Asia/Bangkok">Asia/Bangkok</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
            </select>
          </div>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-1 block">Address</Label>
          <Input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="School street address"
            disabled={saving}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {saving ? 'Saving...' : 'Save & Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}