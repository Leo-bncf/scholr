import React from 'react';
import { Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function RLSViolationAlert({ violation }) {
  if (!violation) return null;

  return (
    <Alert className="border-red-200 bg-red-50 text-red-900">
      <Shield className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-900">Security Violation</AlertTitle>
      <AlertDescription className="text-red-800">
        An unauthorized access attempt has been detected and logged. If this was intentional, please contact your administrator.
      </AlertDescription>
    </Alert>
  );
}