import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, Plus, AlertCircle, Trash2 } from 'lucide-react';
import * as academics from '@/data/academics';

/**
 * Terms setup step
 * Creates terms within the selected academic year
 */
export default function TermsStep({ schoolId, onComplete }) {
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [newTerm, setNewTerm] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });

  // Load academic years
  useEffect(() => {
    const loadYears = async () => {
      try {
        const years = await academics.whereAcademicYears({
          school_id: schoolId
        });
        setAcademicYears(years);
        if (years.length > 0) {
          setSelectedYear(years[0].id);
        }
      } catch (err) {
        console.error('Error loading years:', err);
        setError('Failed to load academic years');
      } finally {
        setLoading(false);
      }
    };

    loadYears();
  }, [schoolId]);

  // Load terms for selected year
  useEffect(() => {
    const loadTerms = async () => {
      if (!selectedYear) return;

      try {
        const termList = await academics.whereTerms({
          school_id: schoolId,
          academic_year_id: selectedYear
        });
        setTerms(termList);
      } catch (err) {
        console.error('Error loading terms:', err);
      }
    };

    loadTerms();
  }, [selectedYear, schoolId]);

  const handleAddTerm = async () => {
    if (!newTerm.name || !newTerm.start_date || !newTerm.end_date) {
      setError('Please fill in all fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const created = await academics.createTerm({
        school_id: schoolId,
        academic_year_id: selectedYear,
        name: newTerm.name,
        start_date: newTerm.start_date,
        end_date: newTerm.end_date
      });

      setTerms([...terms, created]);
      setNewTerm({ name: '', start_date: '', end_date: '' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Error creating term:', err);
      setError(err.message || 'Failed to create term');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTerm = async (id) => {
    if (!window.confirm('Delete this term?')) return;

    try {
      await academics.removeTerm(id);
      setTerms(terms.filter(t => t.id !== id));
    } catch (err) {
      console.error('Error deleting term:', err);
      setError('Failed to delete term');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-slate-600">Loading terms...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedYearName = academicYears.find(y => y.id === selectedYear)?.name || '';
  const hasTerms = terms.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Terms & Semesters</CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Create terms within your academic year. E.g., Term 1, Term 2, Semester 1, etc.
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
              Term created successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Year Selector */}
        <div>
          <Label className="text-sm font-semibold mb-1 block">Select Academic Year</Label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
          >
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>
                {year.name}
              </option>
            ))}
          </select>
        </div>

        {/* Existing Terms */}
        {hasTerms && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Terms in {selectedYearName}</p>
            {terms.map((term) => (
              <div
                key={term.id}
                className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-sm text-slate-900">{term.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {new Date(term.start_date).toLocaleDateString()} — {new Date(term.end_date).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleDeleteTerm(term.id)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Term */}
        <div className={hasTerms ? 'border-t pt-6' : ''}>
          <p className="text-sm font-semibold text-slate-700 mb-3">Add a Term</p>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold mb-1 block">Term Name</Label>
              <Input
                placeholder="e.g. Term 1, Fall Semester, Q1"
                value={newTerm.name}
                onChange={(e) => setNewTerm({ ...newTerm, name: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-1 block">Start Date</Label>
                <Input
                  type="date"
                  value={newTerm.start_date}
                  onChange={(e) => setNewTerm({ ...newTerm, start_date: e.target.value })}
                  disabled={saving}
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1 block">End Date</Label>
                <Input
                  type="date"
                  value={newTerm.end_date}
                  onChange={(e) => setNewTerm({ ...newTerm, end_date: e.target.value })}
                  disabled={saving}
                />
              </div>
            </div>

            <Button
              onClick={handleAddTerm}
              disabled={saving}
              variant="outline"
              className="w-full"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <Plus className="w-4 h-4 mr-2" />
              Add Term
            </Button>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={onComplete}
            disabled={!hasTerms}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Continue to Subjects
          </Button>
          {!hasTerms && (
            <p className="text-xs text-slate-600 mt-2">Create at least one term to continue</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}