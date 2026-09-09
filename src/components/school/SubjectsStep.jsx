import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, Plus, AlertCircle, Trash2 } from 'lucide-react';
import * as academics from '@/data/academics';

/**
 * Subjects setup step
 * Allows school to define subjects they teach
 */
export default function SubjectsStep({ schoolId, onComplete }) {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    category: 'general'
  });

  const commonSubjects = [
    { name: 'English Language and Literature', code: 'ENG', category: 'ib' },
    { name: 'Mathematics', code: 'MATH', category: 'ib' },
    { name: 'Physics', code: 'PHYS', category: 'ib' },
    { name: 'Chemistry', code: 'CHEM', category: 'ib' },
    { name: 'Biology', code: 'BIO', category: 'ib' },
    { name: 'History', code: 'HIST', category: 'ib' },
    { name: 'Geography', code: 'GEO', category: 'ib' },
    { name: 'Economics', code: 'ECON', category: 'ib' },
    { name: 'Psychology', code: 'PSYCH', category: 'ib' },
    { name: 'Spanish', code: 'SPA', category: 'language' },
    { name: 'French', code: 'FR', category: 'language' },
    { name: 'German', code: 'DE', category: 'language' },
    { name: 'Physical Education', code: 'PE', category: 'general' },
    { name: 'Art', code: 'ART', category: 'general' }
  ];

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const subjectList = await academics.whereSubjects({
          school_id: schoolId
        });
        setSubjects(subjectList);
      } catch (err) {
        console.error('Error loading subjects:', err);
        setError('Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [schoolId]);

  const handleAddSubject = async () => {
    if (!newSubject.name) {
      setError('Subject name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const created = await academics.createSubject({
        school_id: schoolId,
        name: newSubject.name,
        code: newSubject.code || undefined,
        category: newSubject.category
      });

      setSubjects([...subjects, created]);
      setNewSubject({ name: '', code: '', category: 'general' });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Error creating subject:', err);
      setError(err.message || 'Failed to create subject');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuickSubject = async (subject) => {
    setSaving(true);
    try {
      const created = await academics.createSubject({
        school_id: schoolId,
        name: subject.name,
        code: subject.code,
        category: subject.category
      });
      setSubjects([...subjects, created]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error('Error adding subject:', err);
      setError(err.message || 'Failed to add subject');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject?')) return;

    try {
      await academics.removeSubject(id);
      setSubjects(subjects.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting subject:', err);
      setError('Failed to delete subject');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-slate-600">Loading subjects...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasSubjects = subjects.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subjects</CardTitle>
        <p className="text-sm text-slate-600 mt-1">
          Define the subjects your school teaches. You can add custom subjects or choose from common ones.
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
              Subject added successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Existing Subjects */}
        {hasSubjects && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700">Your Subjects ({subjects.length})</p>
            <div className="flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg"
                >
                  <span className="text-sm font-semibold text-indigo-900">
                    {subject.name}
                  </span>
                  {subject.code && (
                    <span className="text-xs text-indigo-700 opacity-70">{subject.code}</span>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteSubject(subject.id)}
                    className="w-5 h-5 text-red-600 hover:bg-red-50 ml-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Add Common Subjects */}
        <div className={hasSubjects ? 'border-t pt-6' : ''}>
          <p className="text-sm font-semibold text-slate-700 mb-3">Add Common Subjects</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {commonSubjects.map((subject) => {
              const exists = subjects.some(s => s.name === subject.name);
              return (
                <Button
                  key={subject.code}
                  onClick={() => handleAddQuickSubject(subject)}
                  disabled={exists || saving}
                  variant={exists ? 'secondary' : 'outline'}
                  className="text-sm h-auto py-2"
                >
                  {exists ? '✓' : <Plus className="w-3 h-3 mr-1" />}
                  {subject.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Custom Subject */}
        <div className="border-t pt-6">
          <p className="text-sm font-semibold text-slate-700 mb-3">Add Custom Subject</p>
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-semibold mb-1 block">Subject Name</Label>
              <Input
                placeholder="e.g. Computer Science, Philosophy"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-semibold mb-1 block">Code (Optional)</Label>
                <Input
                  placeholder="e.g. CS, PHIL"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div>
                <Label className="text-sm font-semibold mb-1 block">Category</Label>
                <select
                  value={newSubject.category}
                  onChange={(e) => setNewSubject({ ...newSubject, category: e.target.value })}
                  disabled={saving}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm"
                >
                  <option value="general">General</option>
                  <option value="ib">IB</option>
                  <option value="language">Language</option>
                  <option value="stem">STEM</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleAddSubject}
              disabled={saving}
              variant="outline"
              className="w-full"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Subject
            </Button>
          </div>
        </div>

        {/* Continue Button */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={onComplete}
            disabled={!hasSubjects}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Continue to Classes
          </Button>
          {!hasSubjects && (
            <p className="text-xs text-slate-600 mt-2">Add at least one subject to continue</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}