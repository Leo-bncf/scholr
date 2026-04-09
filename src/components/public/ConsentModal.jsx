import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function ConsentModal({ isOpen, onClose }) {
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleAccept = () => {
    if (privacyAccepted && termsAccepted) {
      localStorage.setItem('scholr_consent_accepted', 'true');
      onClose();
    }
  };

  if (!isOpen) return null;

  const canAccept = privacyAccepted && termsAccepted;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="flex items-start gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Welcome to Scholr</h2>
            <p className="text-sm text-slate-500 mt-1">Please review and accept our policies</p>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={privacyAccepted}
              onCheckedChange={setPrivacyAccepted}
              className="mt-1"
            />
            <span className="text-sm text-slate-700">
              I have read and accept the{' '}
              <a
                href={createPageUrl('PrivacyPolicy')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                Privacy Policy
              </a>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={termsAccepted}
              onCheckedChange={setTermsAccepted}
              className="mt-1"
            />
            <span className="text-sm text-slate-700">
              I have read and accept the{' '}
              <a
                href={createPageUrl('TermsOfService')}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                Terms of Service
              </a>
            </span>
          </label>
        </div>

        <Button
          onClick={handleAccept}
          disabled={!canAccept}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Accept and Continue
        </Button>

        <p className="text-xs text-slate-500 text-center mt-4">
          You must accept both policies to continue using Scholr.
        </p>
      </div>
    </div>
  );
}