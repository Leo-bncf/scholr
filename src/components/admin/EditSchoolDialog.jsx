import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import * as schoolsData from '@/data/schools';

export default function EditSchoolDialog({ open, onOpenChange, school, onSchoolUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    timezone: 'UTC',
  });

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || '',
        email: school.email || '',
        phone: school.phone || '',
        address: school.address || '',
        city: school.city || '',
        country: school.country || '',
        timezone: school.timezone || 'UTC',
      });
    }
  }, [school, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        timezone: formData.timezone || 'UTC',
      });

      onOpenChange(false);
      if (onSchoolUpdated) {
        onSchoolUpdated();
      }
    } catch (err) {
      console.error('Error updating school:', err);
      setError(err.message || 'Failed to update school');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit School Details</DialogTitle>
          <DialogDescription>
            Update school information and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800 ml-3 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label className="text-sm font-semibold mb-1 block">School Name *</Label>
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
            <Label className="text-sm font-semibold mb-1 block">Email *</Label>
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
            <Label className="text-sm font-semibold mb-1 block">Address</Label>
            <Input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}