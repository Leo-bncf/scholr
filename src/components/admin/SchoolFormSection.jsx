import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import * as schoolsData from '@/data/schools';

export default function SchoolFormSection({ onSchoolCreated }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    plan: 'starter',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      plan: 'starter',
    });
    setError('');
    setSuccess('');
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

      const newSchool = await schoolsData.create({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        plan: formData.plan,
        status: 'onboarding',
        billing_status: 'trial',
        trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      setSuccess('School created successfully!');
      resetForm();
      setTimeout(() => {
        setSuccess('');
        setIsExpanded(false);
        if (onSchoolCreated) {
          onSchoolCreated(newSchool);
        }
      }, 1500);
    } catch (err) {
      console.error('Error creating school:', err);
      setError(err.message || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`mb-6 border-indigo-200 ${isExpanded ? 'bg-indigo-50' : ''}`}>
      <CardHeader 
        className="cursor-pointer hover:bg-indigo-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            Create New School
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-600" />
            )}
          </CardTitle>
          {isExpanded && (
            <span className="text-xs text-slate-600">Fill in the details below</span>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 border-t border-indigo-200">
          <form onSubmit={handleSubmit} className="space-y-4 pt-6">
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
                <Label className="text-sm font-semibold mb-2 block">School Name *</Label>
                <Input
                  type="text"
                  name="name"
                  placeholder="e.g., International High School"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Email *</Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="admin@school.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Phone</Label>
                <Input
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">City</Label>
                <Input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Country</Label>
                <Input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Address</Label>
                <Input
                  type="text"
                  name="address"
                  placeholder="School address"
                  value={formData.address}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-2 block">Plan</Label>
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
            </div>

            <div className="flex gap-3 pt-4 border-t border-indigo-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsExpanded(false);
                }}
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
                {loading ? 'Creating...' : 'Create School'}
              </Button>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}