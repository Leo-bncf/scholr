import React from 'react';
import { Loader2 } from 'lucide-react';

export default function SuperAdminLoadingState() {
  return (
    <div className="min-h-screen scholr-sunk flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin scholr-ink" />
    </div>
  );
}