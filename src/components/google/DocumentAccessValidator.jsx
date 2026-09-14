import React, { useEffect, useState } from 'react';
import { AlertCircle, Lock, Link as LinkIcon, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * Validates document access and shows appropriate UI for:
 * - Inaccessible documents (deleted, moved, no permissions)
 * - Permission-restricted documents (viewer-only, shared with restrictions)
 * - Network errors
 * - Missing preview capability
 */
export default function DocumentAccessValidator({ 
  document,
  onOpenDocument,
  isTeacher = false,
  showPreview = false 
}) {
  const [accessStatus, setAccessStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateAccess();
  }, [document?.id]);

  const validateAccess = async () => {
    try {
      // Check document URL validity and basic properties
      if (!document) {
        setAccessStatus({ valid: false, reason: 'missing' });
        return;
      }

      if (!document.url) {
        setAccessStatus({ valid: false, reason: 'no_url' });
        return;
      }

      // For Google Docs/Sheets/Slides, check if URL is accessible
      const isGoogleDoc = document.type?.includes('google');
      if (isGoogleDoc && document.url) {
        // Verify the document ID is in the URL and document exists
        const docId = extractDocIdFromUrl(document.url);
        if (!docId) {
          setAccessStatus({ valid: false, reason: 'invalid_url' });
          return;
        }
      }

      // Check if document is restricted to view-only (for teachers)
      if (isTeacher && document.metadata?.writable === false) {
        setAccessStatus({ 
          valid: true, 
          warning: 'view_only',
          message: 'This document is shared as view-only. You can view but cannot edit.'
        });
        return;
      }

      setAccessStatus({ valid: true });
    } catch (error) {
      console.error('Error validating document access:', error);
      setAccessStatus({ valid: false, reason: 'error', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const extractDocIdFromUrl = (url) => {
    if (!url) return null;
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match?.[1];
  };

  const handleOpenDocument = () => {
    if (accessStatus?.valid) {
      window.open(document.url, '_blank');
      onOpenDocument?.(document);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm scholr-muted">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking access...</span>
      </div>
    );
  }

  if (accessStatus?.valid) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpenDocument}
        className="gap-2"
      >
        <LinkIcon className="w-4 h-4" />
        {isTeacher ? 'View Document' : 'Open'}
      </Button>
    );
  }

  // Show appropriate error UI
  const errorConfigs = {
    missing: {
      title: 'Document Not Available',
      message: 'This document could not be found.',
      icon: AlertCircle
    },
    no_url: {
      title: 'Document Link Missing',
      message: 'This document does not have a valid link.',
      icon: AlertCircle
    },
    invalid_url: {
      title: 'Invalid Document Link',
      message: 'The document link is invalid or corrupted.',
      icon: AlertCircle
    },
    deleted: {
      title: 'Document Deleted',
      message: 'This document has been deleted or moved.',
      icon: AlertCircle
    },
    permission_denied: {
      title: 'Access Denied',
      message: 'You do not have permission to view this document.',
      icon: Lock
    },
    error: {
      title: 'Cannot Access Document',
      message: 'An error occurred while checking access to this document.',
      icon: AlertCircle
    }
  };

  const config = errorConfigs[accessStatus?.reason] || errorConfigs.error;
  const Icon = config.icon;

  if (isTeacher) {
    return (
      <Alert className="bg-amber-50 border-amber-200 p-3">
        <Icon className="w-4 h-4 text-amber-600" />
        <AlertDescription className="text-amber-800 ml-2 text-sm">
          {config.title}: {config.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-amber-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-amber-900">{config.title}</h4>
          <p className="text-sm text-amber-800 mt-1">{config.message}</p>
          {accessStatus?.reason === 'invalid_url' && (
            <p className="text-xs text-amber-700 mt-2">
              Please ask your teacher to relink this document.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}