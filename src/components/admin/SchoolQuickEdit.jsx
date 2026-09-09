import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Check, X } from 'lucide-react';
import * as schoolsData from '@/data/schools';

export default function SchoolQuickEdit({ school, onUpdated, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: school?.name || '',
    email: school?.email || '',
    phone: school?.phone || '',
    address: school?.address || '',
    city: school?.city || '',
    country: school?.country || '',
    plan: school?.plan || 'starter',
    timezone: school?.timezone || 'UTC',
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setHasChanges(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.name || !formData.email) {
        setError('School name and email are required');
        setLoading(false);
        return;
      }

      await schoolsData.update(school.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        plan: formData.plan,
        timezone: formData.timezone || 'UTC',
      });

      setSuccess('School updated successfully!');
      setHasChanges(false);
      setTimeout(() => {
        setSuccess('');
        if (onUpdated) {
          onUpdated();
        }
      }, 1500);
    } catch (err) {
      console.error('Error updating school:', err);
      setError(err.message || 'Failed to update school');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800 ml-3 text-sm">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800 ml-3 text-sm">
            {success}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold mb-1 block">School Name</Label>
          <Input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div>
          <Label className="text-sm font-semibold mb-1 block">Email</Label>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            disabled={loading}
            required
          />
        </div>

        <div>
          <Label className="text-sm font-semibold mb-1 block">Phone</Label>
          <Input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div>
          <Label className="text-sm font-semibold mb-1 block">City</Label>
          <Input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div>
          <Label className="text-sm font-semibold mb-1 block">Country</Label>
          <Input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div>
          <Label className="text-sm font-semibold mb-1 block">Address</Label>
          <Input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div>
          <Label className="text-sm font-semibold mb-1 block">Plan</Label>
          <select
            name="plan"
            value={formData.plan}
            onChange={handleChange}
            disabled={loading}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div>
          <Label className="text-sm font-semibold mb-1 block">Timezone</Label>
          <Input
            type="text"
            name="timezone"
            value={formData.timezone}
            onChange={handleChange}
            disabled={loading}
            placeholder="UTC"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading || !hasChanges}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}