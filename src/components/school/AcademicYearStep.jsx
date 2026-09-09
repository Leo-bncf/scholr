import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, Plus, AlertCircle, Trash2 } from 'lucide-react';
import * as academics from '@/data/academics';

/**
 * Academic year setup step
 * Allows creation and management of academic years
 */
export default function AcademicYearStep({ schoolId, onComplete }) {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [newYear, setNewYear] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const loadYears = async () => {
      try {
        const academicYears = await academics.whereAcademicYears({
          school_id: schoolId
        });
        setYears(academicYears);
      } catch (err) {
        console.error('Error loading academic years:', err);
        setError('Failed to load academic years');
      } finally {
        setLoading(false);
      }
    };

    loadYears();
  }, [schoolId]);

  const handleAddYear = async () => {
    if (!newYear.name || !newYear.start_date || !newYear.end_date) {
      setError('Please fill in all fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const created = await academics.createAcademicYear({
        school_id: schoolId,
        name: newYear.name,
        start_date: newYear.start_date,
        end_date: newYear.end_date
      });

      setYears([...years, created]);
      setNewYear({ name: '', start_date: '', end_date: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Error creating academic year:', err);
      setError(err.message || 'Failed to create academic year');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteYear = async (id) => {
    if (!window.confirm('Are you sure you want to delete this academic year?')) return;

    try {
      await academics.removeAcademicYear(id);
      setYears(years.filter(y => y.id !== id));
    } catch (err) {
      console.error('Error deleting year:', err);
      setError('Failed to delete academic year');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-slate-600">Loading academic years...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const canContinue = years.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Years</CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Set up academic years for your school. You'll create terms within each year.
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
              Academic year created successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Existing Years */}
        {years.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Your Academic Years</p>
            {years.map((year) => (
              <div
                key={year.id}
                className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-sm text-slate-900">{year.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {new Date(year.start_date).toLocaleDateString()} — {new Date(year.end_date).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteYear(year.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Year */}
        <div className="border-t pt-6">
          <p className="text-sm font-semibold text-slate-700 mb-3">Add an Academic Year</p>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold mb-1 block">Academic Year Name</Label>
              <Input
                placeholder="e.g. 2024-2025"
                value={newYear.name}
                onChange={(e) => setNewYear({ ...newYear, name: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-1 block">Start Date</Label>
                <Input
                  type="date"
                  value={newYear.start_date}
                  onChange={(e) => setNewYear({ ...newYear, start_date: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1 block">End Date</Label>
                <Input
                  type="date"
                  value={newYear.end_date}
                  onChange={(e) => setNewYear({ ...newYear, end_date: e.target.value })}
                  disabled={saving}
                />
              </div>
            </div>

            <Button
              onClick={handleAddYear}
              disabled={saving}
              variant="outline"
              className="w-full"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <Plus className="w-4 h-4 mr-2" />
              Add Academic Year
            </Button>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={onComplete}
            disabled={!canContinue}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Continue to Terms
          </Button>
          {!canContinue && (
            <p className="text-xs text-slate-600 mt-2">Add at least one academic year to continue</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}