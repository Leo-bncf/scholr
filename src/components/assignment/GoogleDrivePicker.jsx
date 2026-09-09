import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FolderOpen, AlertCircle, CheckCircle } from 'lucide-react';
import * as fns from '@/data/functions';

export default function GoogleDrivePicker({ open, onClose, onFilesSelected }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pickerReady, setPickerReady] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  React.useEffect(() => {
    if (!open) {
      setPickerReady(false);
      setSelectedFiles([]);
      setError(null);
      return;
    }

    // Load Google Picker library
    if (!window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('picker', () => {
          setPickerReady(true);
        });
      };
      script.onerror = () => {
        setError('Failed to load Google Picker');
      };
      document.head.appendChild(script);
    } else if (window.gapi?.picker) {
      setPickerReady(true);
    }
  }, [open]);

  const handleOpenPicker = async () => {
    try {
      // Get access token
      const response = await fns.invoke('getGooglePickerToken');
      const accessToken = response.token;

      if (!accessToken) {
        setError('Could not authenticate with Google. Please try again.');
        return;
      }

      const picker = new window.google.picker.PickerBuilder()
        .addView(window.google.picker.ViewId.DOCS)
        .setOAuthToken(accessToken)
        .setCallback(handlePickerCallback)
        .build();

      picker.setVisible(true);
    } catch (err) {
      setError(`Failed to open picker: ${err.message}`);
      console.error('Picker error:', err);
    }
  };

  const handlePickerCallback = (data) => {
    if (data.action === window.google.picker.Action.PICKED) {
      const fileIds = data.docs.map(doc => doc.id);
      setSelectedFiles(fileIds);
      handleConfirmSelection(fileIds);
    }
  };

  const handleConfirmSelection = async (fileIds) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fns.invoke('googleDrivePicker', {
        fileIds,
      });

      if (response.documents) {
        onFilesSelected(response.documents);
        setSelectedFiles([]);
        onClose();
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(`Failed to attach files: ${err.message}`);
      console.error('Error attaching files:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            Link from Google Drive
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {selectedFiles.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
              </p>
            </div>
          )}

          <p className="text-sm text-slate-600">
            Click the button below to open Google Drive and select files to attach to your submission.
          </p>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOpenPicker}
              disabled={loading || !pickerReady}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Processing...' : 'Open Google Drive'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}