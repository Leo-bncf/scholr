import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle, Mail } from 'lucide-react';
import {
  DEFAULT_BILLING_STATUS,
  DEFAULT_SCHOOL_PLAN,
  DEFAULT_SCHOOL_STATUS,
  SCHOOL_PLAN_OPTIONS,
  SCHOOL_TRIAL_DURATION_DAYS,
} from '@/components/admin/super-admin/superAdminConfig';

export default function CreateSchoolDialog({ open, onOpenChange, onSchoolCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    plan: DEFAULT_SCHOOL_PLAN,
  });
  const [sendInvite, setSendInvite] = useState(true);
  const [inviteWarning, setInviteWarning] = useState('');

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
    setInviteWarning('');
    setLoading(true);

    try {
      if (!formData.name || !formData.email) {
        setError('School name and email are required');
        setLoading(false);
        return;
      }

      // Create school
      const newSchool = await base44.entities.School.create({
        name: formData.name,
        email: formData.email,
        billing_email: formData.email,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        plan: formData.plan,
        status: DEFAULT_SCHOOL_STATUS,
        billing_status: DEFAULT_BILLING_STATUS,
        trial_end_date: new Date(Date.now() + SCHOOL_TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Send school admin invitation email so they can set up their account
      let warning = '';
      if (sendInvite) {
        try {
          await base44.functions.invoke('sendInvitation', {
            schoolId: newSchool.id,
            schoolName: newSchool.name,
            email: formData.email,
            role: 'school_admin',
          });
        } catch (inviteErr) {
          console.error('Error sending school admin invitation:', inviteErr);
          warning = `School created, but the invitation email could not be sent: ${inviteErr?.message || 'Unknown error'}. You can resend it from the school's detail page.`;
        }
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        plan: DEFAULT_SCHOOL_PLAN,
      });
      setSendInvite(true);

      if (warning) {
        setInviteWarning(warning);
      } else {
        onOpenChange(false);
      }
      if (onSchoolCreated) {
        onSchoolCreated(newSchool);
      }
    } catch (err) {
      console.error('Error creating school:', err);
      setError(err.message || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New School</DialogTitle>
          <DialogDescription>
            Add a new school to the platform
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

          {inviteWarning && (
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-800 ml-3 text-sm">
                {inviteWarning}
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label className="text-sm font-semibold mb-1 block">School Name *</Label>
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
            <Label className="text-sm font-semibold mb-1 block">School Admin Email *</Label>
            <Input
              type="email"
              name="email"
              placeholder="admin@school.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              This person will receive an invitation to set up their school admin account.
            </p>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1 block">Phone</Label>
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
            <Label className="text-sm font-semibold mb-1 block">City</Label>
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
            <Label className="text-sm font-semibold mb-1 block">Country</Label>
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
            <Label className="text-sm font-semibold mb-1 block">Plan</Label>
            <select
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SCHOOL_PLAN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-start gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
            <Checkbox
              id="send-invite"
              checked={sendInvite}
              onCheckedChange={(v) => setSendInvite(!!v)}
              disabled={loading}
              className="mt-0.5"
            />
            <label htmlFor="send-invite" className="text-sm text-slate-700 cursor-pointer flex-1">
              <span className="font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600" /> Send setup invitation email
              </span>
              <span className="text-xs text-slate-500 block mt-0.5">
                The school admin will get an email with a link to create their account.
              </span>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1"
            >
              {inviteWarning ? 'Close' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {loading ? 'Creating...' : sendInvite ? 'Create & Send Invite' : 'Create School'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}