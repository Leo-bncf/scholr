import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
import {
  BILLING_STATUS_OPTIONS,
  DEFAULT_BILLING_STATUS,
  DEFAULT_SCHOOL_PLAN,
  SCHOOL_PLAN_OPTIONS,
} from '@/components/admin/super-admin/superAdminConfig';

export default function ManageBillingDialog({ open, onOpenChange, school, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [billingData, setBillingData] = useState({
    plan: DEFAULT_SCHOOL_PLAN,
    billing_status: DEFAULT_BILLING_STATUS,
  });

  useEffect(() => {
    if (school) {
      setBillingData({
        plan: school.plan || DEFAULT_SCHOOL_PLAN,
        billing_status: school.billing_status || DEFAULT_BILLING_STATUS,
      });
    }
  }, [school, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBillingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await schoolsData.update(school.id, {
        plan: billingData.plan,
        billing_status: billingData.billing_status,
      });

      onOpenChange(false);
      if (onUpdated) {
        onUpdated();
      }
    } catch (err) {
      console.error('Error updating billing:', err);
      setError(err.message || 'Failed to update billing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Billing</DialogTitle>
          <DialogDescription>
            Update school plan and billing status
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
            <Label className="text-sm font-semibold mb-2 block">Plan</Label>
            <select
              name="plan"
              value={billingData.plan}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {SCHOOL_PLAN_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Billing Status</Label>
            <select
              name="billing_status"
              value={billingData.billing_status}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {BILLING_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Current:</strong> {school?.plan} plan, {school?.billing_status} status
            </p>
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
              {loading ? 'Updating...' : 'Update Billing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}