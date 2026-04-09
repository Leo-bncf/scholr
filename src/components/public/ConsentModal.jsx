import React from 'react';
import { Button } from '@/components/ui/button';

export default function ConsentModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  const handleAccept = () => {
    localStorage.setItem('scholr_consent_accepted', 'true');
    onClose();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] bg-white p-6 rounded-2xl shadow-xl border border-slate-200 z-[100]">
      <h3 className="text-lg font-bold mb-2 text-slate-900">Cookie Consent</h3>
      <p className="text-sm text-slate-600 mb-4">We use cookies to improve your experience on our platform.</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Decline</Button>
        <Button onClick={handleAccept}>Accept</Button>
      </div>
    </div>
  );
}