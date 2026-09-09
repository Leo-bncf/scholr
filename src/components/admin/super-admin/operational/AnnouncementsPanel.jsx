import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

export default function AnnouncementsPanel({ schools }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [targetMode, setTargetMode] = useState('all'); // 'all' | 'specific'
  const [selectedSchoolIds, setSelectedSchoolIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const toggleSchool = (id) => {
    setSelectedSchoolIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and message body are required.');
      return;
    }

    setError('');
    setSending(true);

    const targetSchools =
      targetMode === 'all'
        ? schools
        : schools.filter((s) => selectedSchoolIds.includes(s.id));

    // Get school admin emails from their billing_email field or send to all
    const emails = targetSchools
      .map((s) => s.billing_email || s.email)
      .filter(Boolean);

    await Promise.all(
      emails.map((email) =>
        email.send({
          to: email,
          subject,
          body,
        })
      )
    );

    setSending(false);
    setSent(true);
    setSubject('');
    setBody('');
    setSelectedSchoolIds([]);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="space-y-5">
      {sent && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800 ml-3 text-sm">Announcement sent successfully.</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label className="text-sm font-medium text-slate-900">Audience</Label>
        <div className="mt-2 flex gap-3">
          <button
            onClick={() => setTargetMode('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${targetMode === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            All Schools
          </button>
          <button
            onClick={() => setTargetMode('specific')}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${targetMode === 'specific' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          >
            Specific Schools
          </button>
        </div>
      </div>

      {targetMode === 'specific' && (
        <div className="border border-slate-200 rounded-lg max-h-44 overflow-y-auto divide-y divide-slate-100">
          {schools.length === 0 ? (
            <p className="text-sm text-slate-500 p-4">No schools found.</p>
          ) : (
            schools.map((school) => (
              <label key={school.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSchoolIds.includes(school.id)}
                  onChange={() => toggleSchool(school.id)}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-800">{school.name}</span>
              </label>
            ))
          )}
        </div>
      )}

      <div>
        <Label className="text-sm font-medium text-slate-900">Subject</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Scheduled maintenance on 18 March"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label className="text-sm font-medium text-slate-900">Message</Label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          placeholder="Write your announcement here..."
          className="mt-1.5 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
        />
      </div>

      <Button
        onClick={handleSend}
        disabled={sending}
        className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send Announcement
      </Button>
    </div>
  );
}