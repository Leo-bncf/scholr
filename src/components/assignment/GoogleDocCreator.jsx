import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Presentation, Table, AlertCircle } from 'lucide-react';
import { useUser } from '@/components/auth/UserContext';
import * as fns from '@/data/functions';

const TYPE_LABELS = {
  google_doc: { label: 'Google Doc', icon: FileText },
  google_slides: { label: 'Google Slides', icon: Presentation },
  google_sheet: { label: 'Google Sheet', icon: Table },
};

export default function GoogleDocCreator({ type, open, onClose, onDocumentCreated, defaultTitle = '' }) {
  const { schoolId } = useUser();
  const [title, setTitle] = useState(defaultTitle);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!type || !open) return null;

  const typeInfo = TYPE_LABELS[type];
  if (!typeInfo) return null;

  const handleCreateDocument = async () => {
    if (!title.trim()) {
      setError('Please enter a document title');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fns.invoke('googleDocsCreate', {
        title: title.trim(),
        type,
        assignmentId: new URLSearchParams(window.location.search).get('assignment_id'),
        schoolId,
      });

      if (response.document) {
        onDocumentCreated(response.document);
        setTitle('');
        onClose();
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(`Failed to create document: ${err.message}`);
      console.error('Error creating document:', err);
    } finally {
      setLoading(false);
    }
  };

  const Icon = typeInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-indigo-600" />
            Create {typeInfo.label}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="doc-title" className="text-sm font-medium">
              Document Title
            </Label>
            <Input
              id="doc-title"
              placeholder={`My ${typeInfo.label} Submission`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              className="mt-1.5"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !loading && title.trim()) {
                  handleCreateDocument();
                }
              }}
            />
            <p className="text-xs text-slate-500 mt-1">
              The document will be created in your Google Drive and linked to your submission.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateDocument}
              disabled={loading || !title.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Creating...' : 'Create Document'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}